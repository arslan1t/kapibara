"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  Users,
  Star,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/admin/books", label: "Книги", icon: BookOpen },
  { href: "/admin/orders", label: "Заказы", icon: ShoppingBag },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/reviews", label: "Отзывы", icon: Star },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full flex-col bg-brown-600 text-cream-200 w-60 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-brown-500">
        <BookOpen className="h-6 w-6 text-accent" />
        <div>
          <p className="font-display font-bold text-white text-sm">Капибара</p>
          <p className="text-[10px] text-cream-400">Панель управления</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-0.5">
          {links.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive(href, exact)
                  ? "bg-accent text-white"
                  : "text-cream-300 hover:bg-brown-500 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="border-t border-brown-500 p-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-cream-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          На сайт
        </Link>
      </div>
    </aside>
  );
}
