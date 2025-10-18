import { promises as fs } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import { tmpdir } from 'os';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

async function pathExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

function normalizeVersion(value) {
  if (!value) {
    return value;
  }

  return value
    .replace(/^refs\/tags\//, '')
    .replace(/^v(?=\d)/, '')
    .trim();
}

async function readPackageVersion() {
  try {
    const packageJsonPath = join(root, 'package.json');
    const raw = await fs.readFile(packageJsonPath, 'utf8');
    const pkg = JSON.parse(raw);
    return normalizeVersion(pkg.version);
  } catch {
    return undefined;
  }
}

async function resolveVersion() {
  const candidates = [
    process.env.EXTENSION_VERSION,
    process.env.RELEASE_VERSION,
    process.env.GITHUB_REF_NAME,
    process.env.npm_package_version,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeVersion(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return readPackageVersion();
}

function decodeKeyString(rawKey) {
  const cleaned = rawKey.trim();
  if (!cleaned) {
    return null;
  }

  // Replace escaped newline sequences so secrets can be stored on one line.
  const normalized = cleaned.includes('\n') ? cleaned : cleaned.replace(/\\n/g, '\n');
  return normalized.endsWith('\n') ? normalized : `${normalized}\n`;
}

async function prepareKeyFile() {
  const keyPathEnv = process.env.CHROME_EXTENSION_PRIVATE_KEY_PATH;
  if (keyPathEnv) {
    const resolved = resolve(root, keyPathEnv);
    if (!(await pathExists(resolved))) {
      throw new Error(`Chrome extension private key file not found at ${resolved}`);
    }

    return { path: resolved, cleanup: false };
  }

  const inlineKey = process.env.CHROME_EXTENSION_PRIVATE_KEY;
  const base64Key = process.env.CHROME_EXTENSION_PRIVATE_KEY_BASE64;
  let keyContents = null;

  if (inlineKey) {
    keyContents = decodeKeyString(inlineKey);
  } else if (base64Key) {
    const buffer = Buffer.from(base64Key.trim(), 'base64');
    keyContents = decodeKeyString(buffer.toString('utf8'));
  }

  if (!keyContents) {
    return null;
  }

  const tempPath = join(tmpdir(), `kotodama-extension-${randomUUID()}.pem`);
  await fs.writeFile(tempPath, keyContents, { mode: 0o600 });
  return { path: tempPath, cleanup: true };
}

async function runCrx3({ distDir, keyPath, artifactsDir, baseName }) {
  const isWindows = process.platform === 'win32';
  const binaryName = isWindows ? 'crx3.cmd' : 'crx3';
  const crxBinary = join(root, 'node_modules', '.bin', binaryName);

  if (!(await pathExists(crxBinary))) {
    throw new Error(`CRX3 CLI not found at ${crxBinary}. Run "npm install" before generating artifacts.`);
  }

  const crxPath = join(artifactsDir, `${baseName}.crx`);
  const args = ['--crxPath', crxPath, '--keyPath', keyPath, distDir];

  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(crxBinary, args, { stdio: 'inherit' });
    child.on('error', rejectPromise);
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`crx3 exited with code ${code}`));
      }
    });
  });

  return crxPath;
}

async function main() {
  const distDir = resolve(root, process.env.EXTENSION_SOURCE_DIR ?? 'dist');
  if (!(await pathExists(distDir))) {
    console.log(`Distribution directory not found at ${distDir}; skipping CRX generation.`);
    return;
  }

  const manifestPath = join(distDir, 'manifest.json');
  if (!(await pathExists(manifestPath))) {
    console.log(`No manifest.json found in ${distDir}; skipping CRX generation.`);
    return;
  }

  const keyInfo = await prepareKeyFile();
  if (!keyInfo) {
    console.log('No Chrome extension private key provided; skipping CRX generation.');
    return;
  }

  const artifactsDir = resolve(root, process.env.EXTENSION_ARTIFACTS_DIR ?? 'release-artifacts');
  await fs.mkdir(artifactsDir, { recursive: true });

  const version = (await resolveVersion()) ?? 'local';
  const defaultBaseName = `kotodama-${version}`;
  const rawBaseName = process.env.EXTENSION_CRX_BASENAME ?? defaultBaseName;
  const sanitizedBaseName = rawBaseName.replace(/[^a-zA-Z0-9._-]/g, '_');

  try {
    const crxPath = await runCrx3({
      distDir,
      keyPath: keyInfo.path,
      artifactsDir,
      baseName: sanitizedBaseName,
    });

    console.log(`CRX created at: ${crxPath}`);

    const outputFile = process.env.GITHUB_OUTPUT;
    if (outputFile) {
      const outputLine = `crx_path=${crxPath}`;
      await fs.appendFile(outputFile, `${outputLine}\n`);
    }
  } finally {
    if (keyInfo.cleanup) {
      await fs.rm(keyInfo.path, { force: true });
    }
  }
}

main().catch((error) => {
  console.error(`Failed to create CRX: ${error.message}`);
  process.exitCode = 1;
});
