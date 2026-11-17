"use client";

import Link from "@/i18n/navigation";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingBag, User, Menu, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { fill } from "@/i18n/format";
import RegionSwitcher from "@/components/layout/RegionSwitcher";
import { logout } from "@/app/actions/auth";
import UserMenu from "@/components/layout/UserMenu";
import { cn } from "@/lib/utils";
import { isMarketLanguage } from "@/i18n/market";

/** Order is the reading order of the site, not alphabetical. */
const NAV = [
  { href: "/catalog", key: "catalog" },
  { href: "/how-it-works", key: "howItWorks" },
  { href: "/reviews", key: "reviews" },
  { href: "/about", key: "about" },
  { href: "/delivery", key: "delivery" },
] as const;

interface HeaderProps {
  user: { name: string; role: string } | null;
}

export default function Header({ user }: HeaderProps) {
  const t = useDictionary();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const navLinks = NAV.map((item) => ({ ...item, label: t.nav[item.key] }));
  const items = useCartStore((s) => s.items);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  // Compared against the path with its language segment removed, so
  // /uz/catalog lights up the same link /ru/catalog does.
  const [, first = "", ...rest] = pathname.split("/");
  const path = isMarketLanguage(first)
    ? `/${rest.join("/")}`.replace(/\/+$/, "") || "/"
    : pathname;
  const isActive = (href: string) =>
    path === href || path.startsWith(href + "/");

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
            aria-label={t.header.logoAria}
          >
            {/* Intrinsic size matches the viewBox (493×462) so the browser
                reserves the correct aspect ratio and never squeezes the mark.

                The supplied SVG carried a wordmark set in Caveat Brush, a font
                it did not embed — browsers substituted a default face, which
                overflowed the viewBox and clipped mid-word. The lettering was
                removed rather than shipped broken; the mark alone carries the
                brand, as it did before. */}
            <Image
              src="/capybara-logo.svg"
              alt={t.common.brand}
              width={493}
              height={462}
              priority
              className="h-12 w-auto object-contain sm:h-14"
            />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label={t.header.mainNavAria}>
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
            {/* Before the cart: the country decides what a price in the cart
                even means, so it belongs upstream of it. */}
            <RegionSwitcher className="hidden sm:block" />

            <Link
              href="/cart"
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-brown-dark transition-colors duration-300 hover:bg-cream-200"
              aria-label={
                itemCount > 0
                  ? fill(t.header.cartWithCount, { count: itemCount })
                  : t.header.cart
              }
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
              aria-label={mobileOpen ? t.header.closeMenu : t.header.openMenu}
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
          <nav className="page-container flex flex-col gap-1 py-6" aria-label={t.header.mobileNavAria}>
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

            <div className="px-1 py-2 sm:hidden">
              <RegionSwitcher />
            </div>

            <hr className="my-4 border-cream-300" />

            {user ? (
              <>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-bold text-brand-600 hover:bg-brand-50"
                  >
                    {t.header.adminPanel}
                  </Link>
                )}
                <Link
                  href="/account"
                  className="flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-semibold text-brown-dark hover:bg-cream-200"
                >
                  <User className="h-5 w-5" strokeWidth={1.9} />
                  {t.header.account}
                </Link>
                <Link
                  href="/account/orders"
                  className="flex items-center gap-3 rounded-2xl px-4 py-4 text-lg font-semibold text-brown-dark hover:bg-cream-200"
                >
                  {t.header.myOrders}
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="w-full rounded-2xl px-4 py-4 text-left text-lg font-semibold text-brown hover:bg-cream-200"
                  >
                    {t.header.signOut}
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
                  {t.header.signIn}
                </Link>
                <Link href="/register" className="btn-primary mt-3 w-full py-4 text-base">
                  {t.header.createAccount}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
