"use client";

import Link from "@/i18n/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CheckCircle2, AlertCircle } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { resetPassword } from "@/app/actions/account-recovery";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useLocale } from "@/i18n/navigation";
import { fill } from "@/i18n/format";

interface FormData {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordForm({ token }: { token: string }) {
  const t = useDictionary();
  const locale = useLocale();
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
      locale,
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
          {t.auth.passwordChanged}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brown">{done}</p>
        <Link href="/login" className="btn-primary mt-6 inline-flex">
          {t.auth.signIn}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-card">
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-extrabold text-brown-dark">
          {t.auth.resetTitle}
        </h1>
        <p className="mt-2 text-sm text-brown">
          {t.auth.resetLead}
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
              {t.auth.requestNewLink}
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <PasswordInput
          label={t.auth.newPassword}
          autoComplete="new-password"
          hint={fill(t.auth.passwordHint, { min: PASSWORD_MIN_LENGTH })}
          error={errors.password?.message}
          {...register("password", {
            required: t.auth.newPasswordRequired,
            minLength: {
              value: PASSWORD_MIN_LENGTH,
              message: fill(t.auth.passwordTooShort, { min: PASSWORD_MIN_LENGTH }),
            },
            validate: (v) =>
              (/[A-Za-zА-Яа-яЁё]/.test(v) && /\d/.test(v)) ||
              t.auth.passwordNeedsLetterAndDigit,
          })}
        />

        <PasswordInput
          label={t.auth.passwordRepeat}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword", {
            required: t.auth.passwordRepeatRequired,
            validate: (v) => v === watch("password") || t.auth.passwordMismatch,
          })}
        />

        <Button type="submit" isLoading={isSubmitting} fullWidth>
          {isSubmitting ? t.auth.saving : t.auth.savePassword}
        </Button>
      </form>
    </div>
  );
}
