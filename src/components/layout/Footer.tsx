import Link from "next/link";
import { OPERATOR } from "@/lib/legal";
import CookieSettingsLink from "@/components/legal/CookieSettingsLink";
import Image from "next/image";
import { Instagram, Send } from "lucide-react";
import { getPublishedProducts } from "@/lib/products";

const staticLinks = {
  info: {
    title: "Информация",
    links: [
      { href: "/how-it-works", label: "Как это работает" },
      { href: "/reviews", label: "Отзывы" },
      { href: "/delivery", label: "Доставка и оплата" },
      { href: "/faq", label: "Частые вопросы" },
      { href: "/about", label: "О нас" },
      { href: "/contact", label: "Контакты" },
    ],
  },
  account: {
    title: "Кабинет",
    links: [
      { href: "/account", label: "Личный кабинет" },
      { href: "/account/orders", label: "Мои заказы" },
      { href: "/login", label: "Войти" },
      { href: "/register", label: "Регистрация" },
    ],
  },
};

export default async function Footer() {
  // Linking to books that an administrator has actually published, so an
  // archived story never leaves a dead link in the footer.
  const catalogue = await getPublishedProducts();

  const footerLinks = {
    books: {
      title: "Книги",
      links: [
        { href: "/catalog", label: "Каталог" },
        ...catalogue.map((b) => ({ href: `/books/${b.slug}`, label: b.shortTitle })),
      ],
    },
    ...staticLinks,
  };

  return (
    <footer className="relative overflow-hidden bg-brown-dark text-cream-200">
      {/* Soft warm glow, echoing the golden light in the book artwork. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-brand-500/12 blur-3xl"
      />

      <div className="page-container relative py-16 md:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block" aria-label="Капибара — на главную">
              <Image
                src="/capybara-logo.png"
                alt="Капибара"
                width={483}
                height={600}
                className="h-20 w-auto object-contain brightness-110"
              />
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-300/85">
              Печатаем персональные книги, где главным героем становится ваш
              ребёнок.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-cream-200 transition-colors duration-300 hover:bg-brand-500 hover:text-white"
                aria-label="Instagram"
              >
                <Instagram className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </a>
              <a
                href="https://t.me"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-cream-200 transition-colors duration-300 hover:bg-brand-500 hover:text-white"
                aria-label="Telegram"
              >
                <Send className="h-[18px] w-[18px]" strokeWidth={1.9} />
              </a>
            </div>
          </div>

          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.14em] text-cream-400/90">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-cream-300/85 transition-colors duration-300 hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Seller identity. ЗОЗПП ст. 9 requires the name, address and state
            registration number to be available to the buyer, and a compliance
            check looks for them on every page — hence the footer. */}
        <div className="mt-14 border-t border-white/10 pt-8 text-sm leading-relaxed text-cream-400/80">
          <p>
            {OPERATOR.fullName}
            {/* 436-ФЗ: public content needs an age category. The books are for
                preschool and early-school children and contain nothing that
                restricts a younger audience, so 0+ is the honest mark. */}
            <span className="ml-2 rounded-md bg-white/10 px-1.5 py-0.5 text-xs font-semibold text-cream-200">
              0+
            </span>
          </p>
          <p className="mt-1">
            ИНН {OPERATOR.inn} · ОГРНИП {OPERATOR.ogrnip}
          </p>
          <p className="mt-1">{OPERATOR.address}</p>
          <p className="mt-1">
            <a
              href={`mailto:${OPERATOR.email}`}
              className="transition-colors hover:text-white"
            >
              {OPERATOR.email}
            </a>
            {" · "}
            <a
              href={`tel:${OPERATOR.phoneHref}`}
              className="transition-colors hover:text-white"
            >
              {OPERATOR.phone}
            </a>
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-cream-400/80">
            © {new Date().getFullYear()} {OPERATOR.brand}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-cream-400/80">
            <Link href="/privacy" className="transition-colors hover:text-white">
              Персональные данные
            </Link>
            <Link href="/terms" className="transition-colors hover:text-white">
              Пользовательское соглашение
            </Link>
            <Link href="/offer" className="transition-colors hover:text-white">
              Публичная оферта
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-white">
              Файлы cookie
            </Link>
            <CookieSettingsLink className="transition-colors hover:text-white" />
          </div>
        </div>
      </div>
    </footer>
  );
}
