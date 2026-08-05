"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingBag, ShieldCheck, LogOut, LayoutDashboard } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Обзор", icon: User, exact: true },
  { href: "/account/profile", label: "Профиль", icon: User },
  { href: "/account/orders", label: "Мои заказы", icon: ShoppingBag },
  { href: "/account/security", label: "Безопасность", icon: ShieldCheck },
];

export default function AccountSidebar({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    // Scrolls horizontally on small screens rather than stacking into a tall
    // column that would push the actual content off the first viewport.
    //
    // `min-w-0` is load-bearing: as a grid item this element defaults to
    // min-width:auto, so the no-wrap links below would widen the whole grid
    // track and give the page a horizontal scrollbar on mobile.
    <nav
      aria-label="Разделы личного кабинета"
      className="min-w-0 lg:sticky lg:top-28"
    >
      <ul className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide lg:flex-col lg:overflow-visible lg:pb-0">
        {links.map(({ href, label, icon: Icon, exact }) => (
          <li key={href} className="shrink-0 lg:shrink">
            <Link
              href={href}
              aria-current={isActive(href, exact) ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-[15px] font-semibold transition-colors duration-300",
                isActive(href, exact)
                  ? "bg-brand-500 text-white"
                  : "text-brown hover:bg-cream-200 hover:text-brown-dark"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
              {label}
            </Link>
          </li>
        ))}

        {isAdmin && (
          <li className="shrink-0 lg:shrink">
            <Link
              href="/admin"
              className="flex items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-[15px] font-semibold text-brand-600 transition-colors duration-300 hover:bg-brand-50"
            >
              <LayoutDashboard className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
              Панель управления
            </Link>
          </li>
        )}

        <li className="shrink-0 lg:mt-2 lg:shrink lg:border-t lg:border-cream-300 lg:pt-2">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-brown transition-colors duration-300 hover:bg-cream-200"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
              Выйти
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
