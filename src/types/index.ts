// ─── Books ────────────────────────────────────────────────────────────────────

/**
 * Every book Капибара sells. One format only (square hardcover), one price.
 * `src/data/books.ts` is the single source of truth for this data.
 */
export interface Book {
  id: string;
  slug: string;
  title: string;
  /** Compact title for cards, cart rows and breadcrumbs. */
  shortTitle: string;
  /** Which child the printed artwork depicts — drives copy and imagery. */
  childGender: "boy" | "girl";
  description: string;
  shortDescription: string;
  /** Square (1:1) cover artwork. */
  image: string;
  ageRange: string;
  ageMin: number;
  ageMax: number;
  pageCount: number;
  price: number;
  currency: "RUB";
  status: "available" | "in-development";
  available: boolean;
  personalizationEnabled: boolean;
  category: BookCategory;
  format: BookFormat;
}

export type BookCategory = "adventure";

/** Only one physical product format exists. */
export type BookFormat = "hardcover-square";

// ─── Personalization ──────────────────────────────────────────────────────────

export interface PersonalizationData {
  bookId: string;
  childName: string;
  childAge?: number;
  /** Local object URL used only for the on-screen preview. */
  photoUrl?: string;
  /**
   * Opaque key for the photo in private storage. This — not `photoUrl` — is
   * what gets persisted with the order.
   */
  photoKey?: string;
  /**
   * The generation job whose cover the customer approved.
   *
   * Carried through the cart so the order can be attached to it. Without this
   * the shop receives an order and a photograph but no way to find the cover
   * the customer actually saw and agreed to — and the book is made from that
   * cover, not from the photograph.
   */
  generationJobId?: string;
  dedication?: string;
}

export interface GeneratedProject {
  id: string;
  userId: string;
  bookId: string;
  book: Book;
  personalization: PersonalizationData;
  previewImages: string[];
  status: "pending" | "processing" | "ready" | "ordered";
  createdAt: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  projectId?: string;
  bookId: string;
  book: Book;
  personalization?: PersonalizationData;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryCost: number;
  total: number;
  deliveryAddress: DeliveryAddress;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "printing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  bookId: string;
  book: Book;
  personalization?: PersonalizationData;
  quantity: number;
  price: number;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  /** Where the order confirmation is sent. */
  email: string;
  city: string;
  street: string;
  apartment?: string;
  postalCode: string;
  country: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: "user" | "admin";
  createdAt: string;
  orderCount: number;
  totalSpent: number;
}

export interface ChildProfile {
  id: string;
  userId: string;
  name: string;
  birthDate: string;
  gender: "boy" | "girl";
  photoUrl?: string;
  age: number;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

/**
 * Superseded by the Prisma `Review` model and the `PublicReview` shape in
 * src/lib/reviews.ts. Kept out of the codebase so nothing can construct a
 * review that did not come from a delivered order.
 */

// ─── API Responses ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface BookFilters {
  category?: BookCategory;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalBooks: number;
  ordersToday: number;
  revenueToday: number;
  newUsersToday: number;
  pendingOrders: number;
}
