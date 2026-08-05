"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { logout } from "@/app/actions/auth";
import UserMenu from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/catalog", label: "Каталог" },
  { href: "/how-it-works", label: "Как это работает" },
  { href: "/reviews", label: "Отзывы" },
  { href: "/about", label: "О нас" },
  { href: "/delivery", label: "Доставка" },
];

interface HeaderProps {
  user: { name: string; role: string } | null;
}

export default function Header({ user }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-cream-200/80 bg-parchment/90 backdrop-blur-md">
      <div className="page-container">
        <div className="flex h-20 items-center justify-between gap-4">
          {/* ── Logo: the mark alone carries the brand ── */}
          <Link
            href="/"
            className="shrink-0 transition-transform duration-300 hover:scale-[1.04]"
            aria-label="Капибара — на главную"
          >
            {/* Intrinsic size matches the SVG viewBox (494×611) so the browser
                reserves the correct aspect ratio and never squeezes the mark. */}
            <Image
              src="/capybara-logo.svg"
              alt="Капибара"
              width={494}
              height={611}
              priority
              className="h-12 w-auto object-contain sm:h-14"
            />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Основная навигация">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-4 py-2 text-[15px] font-semibold transition-colors duration-300",
                  isActive(link.href)
                    ? "text-brand-500"
                    : "text-brown hover:text-brown-dark"
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute inset-x-4 -bottom-0.5 h-0.5 rounded-full bg-brand-300" />
                )}
              </Link>
            ))}
          </nav>

          {/* ── Actions ── */}
          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-brown-dark transition-colors duration-300 hover:bg-cream-200"
              aria-label={itemCount > 0 ? `Корзина, товаров: ${itemCount}` : "Корзина"}
            >
              <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.9} />
              {itemCount > 0 && (
                <span className="absolute right-1 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold leading-none text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>

            <UserMenu user={user} />


            <button
              className="flex h-11 w-11 items-center justify-center rounded-full text-brown-dark transition-colors duration-300 hover:bg-cream-200 lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-6 w-6" strokeWidth={1.9} />
              ) : (
                <Menu className="h-6 w-6" strokeWidth={1.9} />
              )}
            </button>
          </div>
        </div>
      </div>
      </header>

      {/* Rendered outside <header> on purpose: the header's backdrop-blur makes
          it a containing block, which would trap this fixed panel inside it. */}
      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 top-20 z-40 overflow-y-auto bg-parchment lg:hidden">
          <nav className="page-container flex flex-col gap-1 py-6" aria-label="Мобильная навигация">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-2xl px-4 py-4 text-lg font-bold transition-colors",
                  isActive(link.href)
                    ? "bg-brand-50 text-brand-500"
                    : "text-brown-dark hover:bg-cream-200"
                )}
              >
                {link.label}
              </Link>
            ))}

            <hr className="my-4 border-cream-300" />

            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-bold text-brand-600 hover:bg-brand-50"
                  >
                    Панель управления
                  </Link>
                )}
                <Link
                  href="/account"
                  className="flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-semibold text-brown-dark hover:bg-cream-200"
                >
                  <User className="h-5 w-5" strokeWidth={1.9} />
                  Личный кабинет
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-semibold text-brown-dark hover:bg-cream-200"
                >
                  Мои заказы
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full rounded-2xl px-4 py-4 text-left text-lg font-semibold text-brown hover:bg-cream-200"
                  >
                    Выйти
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-semibold text-brown-dark hover:bg-cream-200"
                >
                  <User className="h-5 w-5" strokeWidth={1.9} />
                  Войти
                </Link>
                <Link href="/register" className="btn-primary mt-3 w-full py-4 text-base">
                  Создать аккаунт
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
