"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  BookOpen,
  Users,
  MessageSquare,
  ExternalLink,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Сводка", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Заказы", icon: ShoppingBag },
  { href: "/admin/products", label: "Товары", icon: BookOpen },
  { href: "/admin/reviews", label: "Отзывы", icon: MessageSquare },
  { href: "/admin/customers", label: "Клиенты", icon: Users },
];

export default function AdminNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/capybara-logo.svg"
            alt="Капибара"
            width={493}
            height={462}
            className="h-9 w-auto object-contain"
          />
          <span className="hidden text-sm font-bold uppercase tracking-wider2 text-brown-400 sm:inline">
            Панель
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Разделы панели">
          {links.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href, exact) ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors",
                isActive(href, exact)
                  ? "bg-brand-500 text-white"
                  : "text-brown hover:bg-cream-200 hover:text-brown-dark"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.9} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-brown transition-colors hover:bg-cream-200 sm:flex"
          >
            <ExternalLink className="h-4 w-4" strokeWidth={1.9} />
            Сайт
          </Link>
          <span className="hidden max-w-[10rem] truncate text-sm text-brown-400 lg:inline">
            {userName}
          </span>
          <form action={logout} className="hidden sm:block">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-brown transition-colors hover:bg-cream-200"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.9} />
              Выйти
            </button>
          </form>

          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brown-dark transition-colors hover:bg-cream-200 md:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-cream-300 px-4 py-3 md:hidden"
          aria-label="Разделы панели"
        >
          <ul className="flex flex-col gap-1">
            {links.map(({ href, label, icon: Icon, exact }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-colors",
                    isActive(href, exact)
                      ? "bg-brand-500 text-white"
                      : "text-brown-dark hover:bg-cream-200"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  {label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-cream-300 pt-1">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-brown hover:bg-cream-200"
                >
                  <LogOut className="h-[18px] w-[18px]" strokeWidth={1.9} />
                  Выйти
                </button>
              </form>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
