/**
 * Generate SKU from product slug + variant attributes.
 * Format: {slug}-{size}-{color}-{material}
 */
export function buildSku(params: {
  slug: string;
  size?: string;
  color?: string;
  material?: string;
}): string {
  const parts = [params.slug];

  if (params.size) {
    parts.push(params.size.toLowerCase().replace(/\s+/g, '-'));
  }
  if (params.color) {
    parts.push(params.color.toLowerCase().replace(/\s+/g, '-'));
  }
  if (params.material) {
    parts.push(params.material.toLowerCase().replace(/\s+/g, '-'));
  }

  return parts.join('-').substring(0, 50);
}

/**
 * Calculate variant combinations count from attribute arrays.
 */
export function countVariantCombinations(
  sizes: string[],
  colors: string[],
  materials: string[],
): number {
  return (
    (sizes.length || 1) * (colors.length || 1) * (materials.length || 1)
  );
}
