import type { Metadata } from "next";
import FAQAccordion from "@/components/shared/FAQAccordion";
import { mockFAQ } from "@/data/mock";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Частые вопросы",
  description:
    "Ответы на частые вопросы о персонализации, изготовлении, доставке и оплате книг Капибара.",
};

export default function FAQPage() {
  return (
    <div className="py-12 md:py-16">
      <div className="page-container max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="section-title">Частые вопросы</h1>
          <p className="section-subtitle">
            Ответы на самые популярные вопросы о наших книгах
          </p>
        </div>

        <FAQAccordion items={mockFAQ} />

        <div className="mt-12 rounded-3xl bg-brand-50 border border-brand-100 p-8 text-center">
          <p className="font-display text-lg font-bold text-brown-dark">
            Не нашли ответ?
          </p>
          <p className="mt-2 text-sm text-brown">
            Напишите нам — ответим в течение нескольких часов
          </p>
          <Link href="/contact" className="btn-primary mt-4 inline-flex">
            Написать нам
          </Link>
        </div>
      </div>
    </div>
  );
}
