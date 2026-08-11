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

export function getProductInitials(product: Product): string {
  const words = product.title.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return product.title.slice(0, 2).toUpperCase();
}

export function getPlaceholderColors(product: Product): { bg: string; text: string } {
  const palettes = [
    { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400' },
    { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-500 dark:text-indigo-400' },
    { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-500 dark:text-sky-400' },
    { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-500 dark:text-violet-400' },
    { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-500 dark:text-emerald-400' },
  ];
  return palettes[product.id % palettes.length];
}

// Keep backward-compatible names but they now return neutral values
export function getProductEmoji(product: Product): string {
  return getProductInitials(product);
}

export function getPlaceholderGradient(product: Product): string {
  return getPlaceholderColors(product).bg;
}
