/**
 * Simple HTML sanitizer.
 * Strips dangerous tags and attributes while allowing safe markup.
 */

const ALLOWED_TAGS = new Set([
  'p',
  'div',
  'span',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'a',
  'img',
  'ul',
  'ol',
  'li',
  'br',
  'hr',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'blockquote',
  'pre',
  'code',
]);

const DANGEROUS_TAGS =
  /<\/?(script|iframe|object|embed|form|input|textarea|select|button|style|link|meta|base)[^>]*>/gi;
const EVENT_HANDLERS = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

export function sanitizeHtml(html: string): string {
  if (!html) return '';

  let result = html;

  // Strip dangerous tags entirely (opening and closing)
  result = result.replace(DANGEROUS_TAGS, '');

  // Strip event handlers (onclick=, onload=, onerror=, etc.)
  result = result.replace(EVENT_HANDLERS, '');

  // Strip javascript: URLs in href/src
  result = result.replace(/(href|src)\s*=\s*(?:"[^"]*"|'[^']*')/gi, (match, attr, value) => {
    const stripped = value.replace(/^["']|["']$/g, '');
    if (/^\s*javascript:/i.test(stripped)) {
      return `${attr}=""`;
    }
    return match;
  });

  // Strip any remaining tags not in the allowed list
  result = result.replace(/<\/?(\w+)(?:\s[^>]*)?>/g, (match, tagName) => {
    if (ALLOWED_TAGS.has(tagName.toLowerCase())) {
      return match;
    }
    return '';
  });

  // Clean up any leftover empty closing tags from removed elements
  result = result.replace(/<\/\s*>/g, '');

  return result;
}
