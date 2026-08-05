"use client";

import { useState } from "react";
import { Mail, Phone, MessageCircle, MapPin, CheckCircle2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="py-12 md:py-16">
      <div className="page-container">
        <div className="mb-10 text-center max-w-xl mx-auto">
          <h1 className="section-title">Свяжитесь с нами</h1>
          <p className="section-subtitle">
            Мы рады помочь! Ответим на любой вопрос в течение нескольких часов.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 max-w-4xl mx-auto">
          {/* Contacts */}
          <div className="flex flex-col gap-5">
            {[
              {
                icon: Phone,
                title: "Телефон",
                value: "+7 (800) 000-00-00",
                sub: "Пн–Вс, 9:00–21:00 (МСК)",
                color: "bg-brand-100 text-brand-500",
              },
              {
                icon: Mail,
                title: "Email",
                value: "hello@kapibara.ru",
                sub: "Ответим в течение 2 часов",
                color: "bg-sage-100 text-sage-500",
              },
              {
                icon: MessageCircle,
                title: "Telegram",
                value: "@kapibara_books",
                sub: "Быстрый ответ в мессенджере",
                color: "bg-blue-100 text-blue-500",
              },
              {
                icon: MapPin,
                title: "Адрес",
                value: "Москва, Россия",
                sub: "Только онлайн-заказы",
                color: "bg-cream-200 text-brown",
              },
            ].map(({ icon: Icon, title, value, sub, color }) => (
              <div key={title} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-soft">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-brown-400 font-medium">{title}</p>
                  <p className="font-semibold text-brown-dark">{value}</p>
                  <p className="text-xs text-brown-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="rounded-3xl bg-white p-6 shadow-card">
            {sent ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-sage-500" />
                <h3 className="font-display text-lg font-bold text-brown-dark">
                  Сообщение отправлено!
                </h3>
                <p className="text-sm text-brown">
                  Мы свяжемся с вами в ближайшее время.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h2 className="font-display text-lg font-bold text-brown-dark">
                  Написать нам
                </h2>
                <Input label="Ваше имя" placeholder="Иван" required />
                <Input label="Email" type="email" placeholder="ivan@example.com" required />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brown-dark">
                    Сообщение *
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Ваш вопрос или сообщение…"
                    className="input-base resize-none"
                  />
                </div>
                <Button type="submit" fullWidth>
                  Отправить сообщение
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
