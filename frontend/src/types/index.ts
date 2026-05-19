export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  position: number;
}

export interface VariantAttributeValue {
  value: string;
  attribute: { name: string; type: string };
}

export interface ProductVariant {
  id: number;
  sku: string;
  priceTiyin: number;
  isActive: boolean;
  position: number;
  attributeValues?: VariantAttributeValue[];
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description?: string;
  status: string;
  weightGrams?: number;
  createdAt: string;
  images?: ProductImage[];
  variants?: ProductVariant[];
  categories?: { category: Category }[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  path: string;
  depth: number;
  sortOrder: number;
  children?: Category[];
}

export interface CartItemVariant {
  id: number;
  sku: string;
  priceTiyin: number;
  product?: {
    title: string;
  };
}

export interface CartItemData {
  id: number;
  variantId: number;
  quantity: number;
  createdAt: string;
  variant?: CartItemVariant | null;
}

export interface Cart {
  id: number;
  customerId: number;
  status: string;
  items: CartItemData[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  email: string;
  firstName: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: string;
  subtotalTiyin: number;
  totalTiyin: number;
  shippingMethod?: string;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: number;
  variantId: number;
  productTitle: string;
  variantSku: string;
  quantity: number;
  unitPriceTiyin: number;
  totalPriceTiyin: number;
}

export function formatPrice(tiyin: number): string {
  return new Intl.NumberFormat('kk-KZ').format(tiyin / 100) + ' ₸';
}

export function isDigitalProduct(product: Product): boolean {
  return (product.weightGrams ?? 0) === 0 && !!(product.categories?.some(c => c.category?.slug === 'digital'));
}

export function getProductEmoji(product: Product): string {
  const title = product.title.toLowerCase();
  const emojiMap: Record<string, string> = {
    samsung: '📱', galaxy: '📱', телефон: '📱', iphone: '📱',
    airpod: '🎧', наушник: '🎧',
    чехол: '🛡️',
    nike: '👟', кроссовк: '👟',
    рюкзак: '🎒',
    windows: '🪟', microsoft: '📘', office: '📘',
    kaspersky: '🛡️', антивирус: '🛡️',
    steam: '🎮', gift: '🎁', карта: '🎁',
    adobe: '🎨', photoshop: '🎨',
    лицензия: '🔑', подписк: '📋',
  };

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (title.includes(key)) return emoji;
  }

  // Digital products default
  if (isDigitalProduct(product)) return '💾';
  return '📦';
}

export function getPlaceholderGradient(product: Product): string {
  if (isDigitalProduct(product)) {
    const gradients = [
      'from-violet-500 to-purple-600',
      'from-cyan-500 to-blue-600',
      'from-fuchsia-500 to-pink-600',
      'from-teal-500 to-emerald-600',
      'from-indigo-500 to-blue-600',
    ];
    return gradients[product.id % gradients.length];
  }

  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-pink-500',
  ];
  return gradients[product.id % gradients.length];
}
