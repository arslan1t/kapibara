"use client";

import Link from "@/i18n/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { MailCheck, AlertCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { requestPasswordReset } from "@/app/actions/account-recovery";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useLocale } from "@/i18n/navigation";

interface FormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const t = useDictionary();
  const locale = useLocale();
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

    const result = await requestPasswordReset({ email: data.email, locale });

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
          {t.auth.forgotSentTitle}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brown">
{t.auth.forgotSentLead} {sent}
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-brown">
          {t.auth.forgotSentNote}
        </p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          {t.auth.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-card">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-extrabold text-brown-dark">
          {t.auth.forgotTitle}
        </h1>
        <p className="mt-2 text-sm text-brown">
{t.auth.forgotLead}
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
          label={t.auth.email}
          type="email"
          autoComplete="email"
          placeholder="ivan@example.com"
          error={errors.email?.message}
          {...register("email", {
            required: t.auth.emailRequired,
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
              message: t.auth.emailInvalid,
            },
          })}
        />

        <Button type="submit" isLoading={isSubmitting} fullWidth>
          {isSubmitting ? t.auth.sending : t.auth.sendLink}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-brown">
        {t.auth.rememberedPassword}{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          {t.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
