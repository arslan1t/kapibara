"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import ConsentCheckbox from "@/components/ui/ConsentCheckbox";
import Button from "@/components/ui/Button";
import { registerAccount, loginWithPassword } from "@/app/actions/auth";
import {
  AUTH_ERRORS,
  checkPassword,
  isEmailValid,
  isFullNameValid,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validation";
import { CONSENT_TYPES, type ConsentType } from "@/lib/constants";

/** A link inside consent text — underlined so it reads as tappable on mobile. */
function DocLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-brand-500 underline underline-offset-2 hover:text-brand-600"
    >
      {children}
    </Link>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [consents, setConsents] = useState<Record<ConsentType, boolean>>({
    personal_data: false,
    user_agreement: false,
  });

  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  const allConsentsGiven = CONSENT_TYPES.every((t) => consents[t]);

  const strength = checkPassword(password);
  const errors = {
    fullName: !isFullNameValid(fullName) ? AUTH_ERRORS.nameRequired : undefined,
    email: !isEmailValid(email) ? AUTH_ERRORS.emailInvalid : undefined,
    password: !password
      ? AUTH_ERRORS.passwordShort
      : strength.ok
        ? undefined
        : strength.message,
    confirm:
      confirm !== password ? AUTH_ERRORS.passwordMismatch : undefined,
  };
  const hasFieldErrors = Object.values(errors).some(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError(null);
    setFieldError({});

    if (hasFieldErrors || !allConsentsGiven) return;

    setStatus("loading");
    const result = await registerAccount({
      fullName,
      email,
      password,
      confirmPassword: confirm,
      consents,
    });

    if (!result.ok) {
      setStatus("idle");
      if (result.field) setFieldError({ [result.field]: result.error });
      else setFormError(result.error);
      return;
    }

    // Sign the new customer straight in — they just proved the credentials.
    await loginWithPassword({ email, password });
    setStatus("success");
    router.refresh();
  }

  if (status === "success") {
    return (
      <div className="rounded-4xl bg-white p-8 text-center shadow-card">
        <Image
          src="/images/mascots/mascot-2.png"
          alt=""
          aria-hidden="true"
          width={420}
          height={420}
          className="mx-auto h-36 w-auto object-contain"
        />
        <span className="mx-auto mt-2 flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-sage-500">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.9} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold text-brown-dark">
          Аккаунт создан
        </h1>
        <p className="mt-2.5 text-[15px] leading-relaxed text-brown">
          Добро пожаловать в Капибару! Теперь вы можете оформлять заказы и
          следить за ними в личном кабинете.
        </p>
        <Link href="/account" className="btn-primary mt-7 w-full">
          Перейти в личный кабинет
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-4xl bg-white p-6 shadow-card sm:p-8">
      <div className="mb-7 text-center">
        <h1 className="font-display text-2xl font-extrabold text-brown-dark">
          Создать аккаунт
        </h1>
        <p className="mt-1.5 text-[15px] text-brown">
          Чтобы сохранять книги и следить за заказами
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Имя"
          autoComplete="name"
          placeholder="Как к вам обращаться"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={submitted ? (fieldError.fullName ?? errors.fullName) : undefined}
        />

        <Input
          label="Электронная почта"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="example@mail.ru"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={submitted ? (fieldError.email ?? errors.email) : undefined}
        />

        <PasswordInput
          label="Пароль"
          autoComplete="new-password"
          placeholder={`Минимум ${PASSWORD_MIN_LENGTH} символов`}
          hint="Не менее 8 символов, минимум одна буква и одна цифра"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={submitted ? (fieldError.password ?? errors.password) : undefined}
        />

        <PasswordInput
          label="Повторите пароль"
          autoComplete="new-password"
          placeholder="Введите пароль ещё раз"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={
            submitted ? (fieldError.confirmPassword ?? errors.confirm) : undefined
          }
        />

        {/* ── Required consents — all start unchecked ── */}
        <fieldset className="mt-2 flex flex-col gap-3.5">
          <legend className="sr-only">Обязательные согласия</legend>

          <ConsentCheckbox
            id="consent-personal-data"
            checked={consents.personal_data}
            invalid={submitted && !consents.personal_data}
            onChange={(v) => setConsents((c) => ({ ...c, personal_data: v }))}
          >
            Я даю согласие на обработку моих персональных данных в соответствии
            с{" "}
            <DocLink href="/personal-data-policy">
              Политикой в отношении обработки персональных данных
            </DocLink>
          </ConsentCheckbox>


          <ConsentCheckbox
            id="consent-user-agreement"
            checked={consents.user_agreement}
            invalid={submitted && !consents.user_agreement}
            onChange={(v) => setConsents((c) => ({ ...c, user_agreement: v }))}
          >
            Я прочитал и принимаю условия{" "}
            <DocLink href="/terms">Пользовательского соглашения</DocLink> и{" "}
            <DocLink href="/personal-data-policy">
              обработки персональных данных
            </DocLink>
          </ConsentCheckbox>

          {submitted && !allConsentsGiven && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-2xl bg-red-50 px-3.5 py-3 text-[13px] font-medium leading-relaxed text-red-600"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
              {AUTH_ERRORS.consentsRequired}
            </p>
          )}
        </fieldset>

        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-2xl bg-red-50 px-3.5 py-3 text-[13px] font-medium leading-relaxed text-red-600"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            {formError}
          </p>
        )}

        <Button
          type="submit"
          isLoading={status === "loading"}
          fullWidth
          className="mt-2 rounded-full py-4"
        >
          {status === "loading" ? "Создаём аккаунт…" : "Создать аккаунт"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[15px] text-brown">
        Уже есть аккаунт?{" "}
        <Link
          href="/login"
          className="font-bold text-brand-500 underline-offset-4 hover:underline"
        >
          Войти
        </Link>
      </p>
    </div>
  );
}
