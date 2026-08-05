"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

export default function CartHydration() {
  useEffect(() => {
    useCartStore.getState().hydrate();
  }, []);
  return null;
}
