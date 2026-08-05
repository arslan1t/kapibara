import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-200 via-cream-50 to-brand-50">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Link
          href="/"
          className="group mb-8 inline-block"
          aria-label="Капибара — на главную"
        >
          {/* The mark already contains the wordmark, so it stands alone here. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/capybara-logo.svg"
            alt="Капибара"
            draggable={false}
            width={494}
            height={611}
            className="h-20 w-auto select-none object-contain transition-transform duration-300 group-hover:scale-[1.04]"
          />
        </Link>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
