export interface ProductImage {
  id: number;
  url: string;
  alt?: string;
  position: number;
}

export interface ProductVariant {
  id: number;
  sku: string;
  priceTiyin: number;
  isActive: boolean;
  position: number;
  attributeValues?: {
    value: string;
    attribute: { name: string; type: string };
  }[];
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description?: string;
  status: string;
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

export interface CartItemData {
  id: number;
  variantId: number;
  quantity: number;
  createdAt: string;
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
