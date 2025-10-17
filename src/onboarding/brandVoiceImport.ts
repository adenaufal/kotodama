export interface ParsedBrandVoiceMarkdown {
  name?: string;
  description?: string;
  exampleTweets: string[];
}

const HEADING_REGEX = /^#{1,6}\s+(.+)$/;
const LABEL_REGEX = /^(name|description|examples?|example tweets?)\s*:/i;

function normalizeLine(line: string): string {
  return line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

function pushExampleTweet(examples: string[], content: string) {
  const value = content.trim();
  if (!value) {
    return;
  }
  if (examples.length === 0) {
    examples.push(value);
    return;
  }

  const lastIndex = examples.length - 1;
  const lastValue = examples[lastIndex];

  if (lastValue.endsWith('\\')) {
    examples[lastIndex] = `${lastValue.slice(0, -1)} ${value}`.trim();
  } else {
    examples.push(value);
  }
}

export function parseBrandVoiceMarkdown(markdown: string): ParsedBrandVoiceMarkdown {
  let name: string | undefined;
  const descriptionLines: string[] = [];
  const exampleTweets: string[] = [];
  let currentSection: 'name' | 'description' | 'examples' | null = null;

  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');

  for (const rawLine of lines) {
    const trimmed = normalizeLine(rawLine);
    if (!trimmed && currentSection !== 'description') {
      continue;
    }

    const headingMatch = trimmed.match(HEADING_REGEX);
    if (headingMatch) {
      const heading = headingMatch[1].toLowerCase();
      if (heading.startsWith('name')) {
        currentSection = 'name';
        continue;
      }
      if (heading.startsWith('description')) {
        currentSection = 'description';
        continue;
      }
      if (heading.startsWith('example')) {
        currentSection = 'examples';
        continue;
      }
      currentSection = null;
      continue;
    }

    const labelMatch = trimmed.match(LABEL_REGEX);
    if (labelMatch) {
      const label = labelMatch[1].toLowerCase();
      const value = trimmed.replace(LABEL_REGEX, '').trim();
      if (label.startsWith('name') && value) {
        name = value;
        currentSection = null;
        continue;
      }
      if (label.startsWith('description')) {
        if (value) {
          descriptionLines.push(value);
        }
        currentSection = 'description';
        continue;
      }
      if (label.startsWith('example')) {
        if (value) {
          pushExampleTweet(exampleTweets, value);
        }
        currentSection = 'examples';
        continue;
      }
    }

    if (currentSection === 'name') {
      if (trimmed) {
        name = trimmed;
        currentSection = null;
      }
      continue;
    }

    if (currentSection === 'description') {
      descriptionLines.push(rawLine.trimEnd());
      continue;
    }

    if (currentSection === 'examples') {
      if (/^[-*+]\s+/.test(trimmed)) {
        pushExampleTweet(exampleTweets, trimmed.replace(/^[-*+]\s+/, ''));
        continue;
      }
      if (/^\d+\.\s+/.test(trimmed)) {
        pushExampleTweet(exampleTweets, trimmed.replace(/^\d+\.\s+/, ''));
        continue;
      }
      if (exampleTweets.length > 0) {
        const lastIndex = exampleTweets.length - 1;
        exampleTweets[lastIndex] = `${exampleTweets[lastIndex]} ${trimmed}`.trim();
        continue;
      }
    }
  }

  if (!name) {
    const h1Match = markdown.match(/^#\s+(.+)$/m);
    if (h1Match) {
      name = normalizeLine(h1Match[1]);
    }
  }

  return {
    name,
    description: descriptionLines.join('\n').trim() || undefined,
    exampleTweets: exampleTweets.map((tweet) => tweet.replace(/\s+/g, ' ').trim()).filter(Boolean),
  };
}
