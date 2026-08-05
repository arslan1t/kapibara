import { create } from "zustand";
import type { CartItem, Book, PersonalizationData } from "@/types";

interface CartStore {
  items: CartItem[];
  _hydrated: boolean;
  addItem: (book: Book, personalization?: PersonalizationData) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  hydrate: () => void;
}

const STORAGE_KEY = "kapibara-cart";

function isStorageAvailable(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined" &&
      typeof window.localStorage.getItem === "function"
    );
  } catch {
    return false;
  }
}

function loadFromStorage(): CartItem[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(items: CartItem[]) {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  _hydrated: false,

  hydrate: () => {
    if (get()._hydrated) return;
    set({ items: loadFromStorage(), _hydrated: true });
  },

  addItem: (book, personalization) => {
    const items = get().items;
    const existing = items.find(
      (i) =>
        i.bookId === book.id &&
        i.personalization?.childName === personalization?.childName
    );
    let updated: CartItem[];
    if (existing) {
      updated = items.map((i) =>
        i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    } else {
      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random()}`,
        bookId: book.id,
        book,
        personalization,
        quantity: 1,
        price: book.price,
      };
      updated = [...items, newItem];
    }
    set({ items: updated });
    saveToStorage(updated);
  },

  removeItem: (id) => {
    const updated = get().items.filter((i) => i.id !== id);
    set({ items: updated });
    saveToStorage(updated);
  },

  updateQuantity: (id, quantity) => {
    let updated: CartItem[];
    if (quantity <= 0) {
      updated = get().items.filter((i) => i.id !== id);
    } else {
      updated = get().items.map((i) =>
        i.id === id ? { ...i, quantity } : i
      );
    }
    set({ items: updated });
    saveToStorage(updated);
  },

  clearCart: () => {
    set({ items: [] });
    saveToStorage([]);
  },
}));
