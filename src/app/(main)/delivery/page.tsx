import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Printer, CreditCard, ShieldCheck } from "lucide-react";
import Reveal from "@/components/shared/Reveal";
import { BOOK_PAGE_COUNT } from "@/data/books";

export const metadata: Metadata = {
  title: "Доставка и оплата",
  description:
    "Как мы печатаем и доставляем персональные книги Капибара, какие есть способы оплаты и что делать при браке.",
};

const blocks = [
  {
    icon: Printer,
    title: "Печать",
    text: `Каждая книга печатается отдельно под ваш заказ: ${BOOK_PAGE_COUNT} иллюстрированных страниц, твёрдая обложка, квадратный формат. Мы сообщим срок изготовления при подтверждении заказа.`,
  },
  {
    icon: Truck,
    title: "Доставка",
    text: "Отправляем по всей России. Стоимость и срок доставки рассчитываются при оформлении заказа — они зависят от вашего города и выбранной службы.",
  },
  {
    icon: CreditCard,
    title: "Оплата",
    text: "Банковской картой (Visa, Mastercard, МИР) или через СБП. Способ оплаты подтверждается вместе с заказом.",
  },
  {
    icon: ShieldCheck,
    title: "Если что-то не так",
    text: "Если книга придёт повреждённой или с браком печати — напишите нам с фотографиями, и мы бесплатно перепечатаем экземпляр.",
  },
];

export default function DeliveryPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="page-container">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Доставка</span>
          <h1 className="section-title mt-5">Доставка и оплата</h1>
          <p className="section-subtitle">
            Мы печатаем книги под заказ и отправляем их по всей России.
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
          {blocks.map(({ icon: Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 90}>
              <div className="flex h-full flex-col gap-4 rounded-4xl bg-white p-7 shadow-soft">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-100 text-brand-500">
                  <Icon className="h-6 w-6" strokeWidth={1.8} />
                </span>
                <h2 className="font-display text-lg font-extrabold text-brown-dark">
                  {title}
                </h2>
                <p className="text-[15px] leading-relaxed text-brown">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200} className="mx-auto mt-14 max-w-3xl text-center">
          <p className="text-[15px] leading-relaxed text-brown">
            Остались вопросы о доставке?{" "}
            <Link href="/contact" className="font-bold text-brand-500 hover:underline">
              Напишите нам
            </Link>{" "}
            — ответим и поможем.
          </p>
        </Reveal>
      </div>
    </div>
  );
}
