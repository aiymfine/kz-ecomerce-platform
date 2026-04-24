/**
 * Generate a URL-safe slug from a string.
 * Supports Kazakh characters (а-я, ә, ғ, қ, ң, ө, ұ, һ, і).
 */
export function slugify(text: string): string {
  const kazakhMap: Record<string, string> = {
    ә: 'a',
    ғ: 'g',
    қ: 'k',
    ң: 'n',
    ө: 'o',
    ұ: 'u',
    һ: 'h',
    і: 'i',
    Ә: 'A',
    Ғ: 'G',
    Қ: 'K',
    Ң: 'N',
    Ө: 'O',
    Ұ: 'U',
    Һ: 'H',
    І: 'I',
  };

  return text
    .split('')
    .map((char) => kazakhMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending a suffix if needed.
 */
export function uniqueSlug(base: string, existingSlugs: string[]): string {
  let slug = slugify(base);
  if (!existingSlugs.includes(slug)) return slug;

  let counter = 2;
  while (existingSlugs.includes(`${slug}-${counter}`)) {
    counter++;
  }
  return `${slug}-${counter}`;
}
