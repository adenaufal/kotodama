# Credential and privacy threat model

## Protected data

Kotodama protects provider API keys and the legacy Claude cookie field in its credential vault.
Provider credentials are encrypted with AES-GCM using a 256-bit key derived from a user-chosen
master passphrase with PBKDF2-SHA-256 (600,000 iterations) and a random per-vault salt. Each write
uses a fresh 96-bit AES-GCM IV. The salt, IV, ciphertext, and provider-presence flags are stored in
`chrome.storage.local`; the passphrase is not stored there or in any other persistent storage.

The derived key is held only in memory and in `chrome.storage.session` so the Manifest V3 service
worker can continue to use credentials when Chrome suspends and restarts it. Session storage is
restricted to trusted extension contexts and is cleared when the browser session ends or the
extension is reloaded, updated, or disabled. Locking the vault clears this session key. The service
worker decrypts credentials only when a provider call needs them. Settings and content-script
messages receive provider-presence flags, never key values.

## What this protects against

After a user has migrated to the passphrase vault, a copy of the browser profile or the extension's
local storage does not contain enough information by itself to decrypt the credentials. A strong,
unique passphrase makes offline guessing harder.

## What this does not protect against

- A weak or reused passphrase can be guessed offline by someone who has the vault ciphertext.
- While unlocked, malware, a compromised browser or extension, DevTools, or another trusted
  extension context can access credentials or use them to make provider requests.
- Kotodama must send prompts, selected tweet context, and any included images to the chosen provider
  to perform its features. Provider retention and use follow that provider's terms and settings.
- Brand voices, analyzed profiles, and optional generated-reply history are stored in IndexedDB and
  are not encrypted by the credential vault.
- The API key is available to the provider and to the browser's active network/debugging tools when
  used. Gemini sends it in the `x-goog-api-key` request header rather than the URL.

## Existing installations and migration

Versions before the passphrase vault derived a key from a constant included in the extension bundle
and a salt stored in the browser profile. That format does not protect credentials from someone who
can read both the profile and the extension bundle. Existing users are asked to create a master
passphrase in Settings. Migration decrypts every saved provider key and the legacy Claude cookie,
verifies a replacement vault, writes it, and only then removes the old ciphertext and salt. If any
legacy value cannot be decrypted or the new vault cannot be committed, the old data is left in
place. It remains exposed to the old format's weakness until migration succeeds.

Kotodama never logs the master passphrase, API keys, provider response bodies, prompts, tweet text,
or generated reply content. Generic diagnostics redact arbitrary strings, objects, and error details.

## Recovery

Kotodama does not keep a recovery copy of the master passphrase. If it is forgotten, the new vault
cannot be decrypted. Use **Forgot your passphrase? Reset the vault** in Settings, then create a new
passphrase and enter replacement provider keys. If an interrupted migration left a legacy copy,
reset keeps that copy so it can still be migrated. Keep provider recovery options and account access
outside Kotodama.
