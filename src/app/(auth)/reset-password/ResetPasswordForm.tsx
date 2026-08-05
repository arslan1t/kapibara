"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, AlertCircle } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { resetPassword } from "@/app/actions/account-recovery";

interface FormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  async function onSubmit(data: FormData) {
    setFormError(null);

    const result = await resetPassword({
      token,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });

    if (!result.ok) {
      if (result.field === "password" || result.field === "confirmPassword") {
        setError(result.field, { message: result.error });
      } else {
        // Token problems land here — the link may have expired while the form
        // was open, so the message points back to requesting a new one.
        setFormError(result.error);
      }
      return;
    }

    setDone(result.notice);
  }

  if (done) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-card">
        <div className="mb-4 flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-sage-500" aria-hidden="true" />
        </div>
        <h1 className="font-display text-xl font-bold text-brown-dark">
          Пароль изменён
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brown">{done}</p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          Войти
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-card">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-extrabold text-brown-dark">
          Новый пароль
        </h1>
        <p className="mt-2 text-sm text-brown">
          Придумайте пароль, который вы ещё нигде не использовали.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <p>{formError}</p>
            <Link
              href="/forgot-password"
              className="mt-1 inline-block font-semibold underline"
            >
              Запросить новую ссылку
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <PasswordInput
          label="Новый пароль"
          autoComplete="new-password"
          hint="Не менее 8 символов, минимум одна буква и одна цифра"
          error={errors.password?.message}
          {...register("password", {
            required: "Введите новый пароль",
            minLength: { value: 8, message: "Пароль должен содержать не менее 8 символов" },
            validate: (v) =>
              (/[A-Za-zА-Яа-яЁё]/.test(v) && /\d/.test(v)) ||
              "Пароль должен содержать хотя бы одну букву и одну цифру",
          })}
        />

        <PasswordInput
          label="Повторите пароль"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: "Повторите пароль",
            validate: (v) => v === watch("password") || "Пароли не совпадают",
          })}
        />

        <Button type="submit" isLoading={isSubmitting} fullWidth>
          {isSubmitting ? "Сохраняем…" : "Сохранить пароль"}
        </Button>
      </form>
    </div>
  );
}
