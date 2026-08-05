"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { User, ChevronDown, Package, LogOut, LayoutDashboard } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  user: { name: string; role: string } | null;
}

/** Header account control: sign-in links when signed out, a menu when signed in. */
export default function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="hidden h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold text-brown-dark transition-colors duration-300 hover:bg-cream-200 sm:flex"
        >
          <User className="h-[19px] w-[19px]" strokeWidth={1.9} />
          Войти
        </Link>
        <Link
          href="/register"
          className="hidden rounded-full bg-brand-500 px-6 py-3 text-[15px] font-bold text-white shadow-[0_8px_22px_rgba(188,81,41,0.28)] transition-all duration-300 hover:bg-brand-600 sm:inline-flex"
        >
          Создать аккаунт
        </Link>
      </div>
    );
  }

  const firstName = user.name.split(" ")[0] || "Профиль";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className={cn(
          "flex h-11 items-center gap-2 rounded-full px-3 text-[15px] font-semibold text-brown-dark transition-colors duration-300 hover:bg-cream-200 sm:px-4",
          open && "bg-cream-200"
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <User className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{firstName}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-56 overflow-hidden rounded-3xl border border-cream-200 bg-white py-2 shadow-elevated">
          {user.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-5 py-3 text-[15px] font-semibold text-brand-600 transition-colors hover:bg-brand-50"
            >
              <LayoutDashboard className="h-4 w-4" strokeWidth={1.9} />
              Панель управления
            </Link>
          )}
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-5 py-3 text-[15px] text-brown-dark transition-colors hover:bg-cream-100"
          >
            <User className="h-4 w-4" strokeWidth={1.9} />
            Личный кабинет
          </Link>
          <Link
            href="/account/orders"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-5 py-3 text-[15px] text-brown-dark transition-colors hover:bg-cream-100"
          >
            <Package className="h-4 w-4" strokeWidth={1.9} />
            Мои заказы
          </Link>
          <form action={logout} className="border-t border-cream-200">
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-5 py-3 text-left text-[15px] text-brown transition-colors hover:bg-cream-100"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.9} />
              Выйти
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
