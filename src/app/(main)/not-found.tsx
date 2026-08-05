import type { Metadata } from "next";
import NotFoundContent from "@/components/shared/NotFoundContent";

export const metadata: Metadata = {
  title: "Страница не найдена",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundContent />;
}
