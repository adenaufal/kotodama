/**
 * Input sanitization utilities for preventing prompt injection and XSS attacks
 */

/**
 * Maximum lengths for different input types
 */
export const INPUT_LIMITS = {
  prompt: 2000,
  tweetContent: 280,
  brandVoiceName: 100,
  brandVoiceDescription: 1000,
  brandVoiceGuidelines: 2000,
  exampleTweet: 280,
  username: 15, // Twitter username limit
} as const;

/**
 * Sanitizes user prompt input to prevent prompt injection attacks.
 * Removes or escapes potentially dangerous patterns.
 */
export function sanitizePrompt(input: string, maxLength: number = INPUT_LIMITS.prompt): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input
    // Trim whitespace
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters (except newline and tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize unicode to prevent homograph attacks
    .normalize('NFKC');

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitizes tweet content before insertion into Twitter's DOM.
 * Strips HTML tags and scripts to prevent XSS.
 */
export function sanitizeTweetContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  return content
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script content that might have evaded tag removal
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Decode HTML entities to prevent double encoding issues
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    // Trim and limit length
    .trim()
    .slice(0, INPUT_LIMITS.tweetContent);
}

/**
 * Sanitizes tweet context extracted from Twitter's DOM.
 * Prevents malicious tweet content from affecting prompt construction.
 */
export function sanitizeTweetContext(context: {
  text: string;
  username: string;
}): { text: string; username: string } {
  return {
    text: sanitizePrompt(context.text, INPUT_LIMITS.tweetContent),
    username: sanitizeUsername(context.username),
  };
}

/**
 * Sanitizes a Twitter username.
 */
export function sanitizeUsername(username: string): string {
  if (!username || typeof username !== 'string') {
    return '';
  }

  return username
    // Remove @ symbol if present
    .replace(/^@/, '')
    // Only allow alphanumeric and underscore (valid Twitter username chars)
    .replace(/[^a-zA-Z0-9_]/g, '')
    // Limit length
    .slice(0, INPUT_LIMITS.username);
}

/**
 * Sanitizes brand voice name.
 */
export function sanitizeBrandVoiceName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  return name
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '')
    .slice(0, INPUT_LIMITS.brandVoiceName);
}

/**
 * Validates that a string doesn't contain common prompt injection patterns.
 * Returns true if the input appears safe.
 */
export function isPromptSafe(input: string): boolean {
  if (!input) return true;

  const dangerousPatterns = [
    // System prompt override attempts
    /ignore\s+(previous|all|above)\s+(instructions?|prompts?)/i,
    /forget\s+(everything|all|previous)/i,
    /new\s+instructions?:/i,
    /system\s*:\s*/i,
    /\[system\]/i,
    // Jailbreak attempts
    /pretend\s+you\s+are/i,
    /act\s+as\s+if/i,
    /you\s+are\s+now/i,
    // Output manipulation
    /output\s+only/i,
    /respond\s+with\s+only/i,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Escapes special characters for safe inclusion in prompts.
 * Used when including user-provided context in AI prompts.
 */
export function escapeForPrompt(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    // Escape quotes
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    // Escape newlines
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    // Escape backticks (prevent template literal injection)
    .replace(/`/g, '\\`');
}
