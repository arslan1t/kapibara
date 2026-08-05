"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MailCheck, AlertCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { requestPasswordReset } from "@/app/actions/account-recovery";

interface FormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    setFormError(null);

    const result = await requestPasswordReset({ email: data.email });

    if (!result.ok) {
      if (result.field === "email") {
        setError("email", { message: result.error });
      } else {
        setFormError(result.error);
      }
      return;
    }

    setSent(result.notice);
  }

  // Deliberately the same screen whether or not the address is registered.
  if (sent) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center">
          <MailCheck className="h-12 w-12 text-sage-500" aria-hidden="true" />
        </div>
        <h1 className="font-display text-xl font-bold text-brown-dark">
          Проверьте почту
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brown">
          Если этот адрес зарегистрирован, мы отправили на него ссылку для смены
          пароля. {sent}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-brown">
          Ссылка действует один час и сработает только один раз.
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Вернуться ко входу
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-card">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-extrabold text-brown-dark">
          Восстановление пароля
        </h1>
        <p className="mt-2 text-sm text-brown">
          Введите адрес, на который зарегистрирован аккаунт — мы пришлём ссылку
          для смены пароля.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input
          label="Электронная почта"
          type="email"
          autoComplete="email"
          placeholder="ivan@example.com"
          error={errors.email?.message}
          {...register("email", {
            required: "Введите адрес электронной почты",
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
              message: "Введите корректный адрес электронной почты",
            },
          })}
        />

        <Button type="submit" isLoading={isSubmitting} fullWidth>
          {isSubmitting ? "Отправляем…" : "Отправить ссылку"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-brown">
        Вспомнили пароль?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Войти
        </Link>
      </p>
    </div>
  );
}
