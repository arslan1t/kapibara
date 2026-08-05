"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertCircle } from "lucide-react";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { loginWithPassword } from "@/app/actions/auth";
import { AUTH_ERRORS, isEmailValid } from "@/lib/validation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Only same-site paths. A crafted /login?callbackUrl=https://evil.example
  // would otherwise send a freshly authenticated visitor to a phishing clone,
  // which is exactly the moment they are most likely to trust it.
  //
  // Must begin with a single "/" that is not followed by another slash or a
  // backslash: browsers read both "//host" and "/\host" as protocol-relative
  // and will happily leave the site.
  const requested = params.get("callbackUrl") ?? "";
  const callbackUrl = /^\/(?![/\\])/.test(requested) ? requested : "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = !email.trim()
    ? "Введите электронную почту"
    : !isEmailValid(email)
      ? AUTH_ERRORS.emailInvalid
      : undefined;
  const passwordError = !password ? "Введите пароль" : undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    if (emailError || passwordError) return;

    setLoading(true);
    const result = await loginWithPassword({ email, password });

    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="rounded-4xl bg-white p-6 shadow-card sm:p-8">
      <div className="mb-7 text-center">
        <h1 className="font-display text-2xl font-extrabold text-brown-dark">
          Вход
        </h1>
        <p className="mt-1.5 text-[15px] text-brown">
          Рады видеть вас снова
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Электронная почта"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="example@mail.ru"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={submitted ? emailError : undefined}
        />

        <PasswordInput
          label="Пароль"
          autoComplete="current-password"
          placeholder="Введите пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={submitted ? passwordError : undefined}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-brand-500 underline-offset-4 hover:underline"
          >
            Забыли пароль?
          </Link>
        </div>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-2xl bg-red-50 px-3.5 py-3 text-[13px] font-medium leading-relaxed text-red-600"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            {error}
          </p>
        )}

        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          className="mt-1 rounded-full py-4"
        >
          {loading ? "Входим…" : "Войти"}
        </Button>
      </form>

      <p className="mt-6 text-center text-[15px] text-brown">
        Нет аккаунта?{" "}
        <Link
          href="/register"
          className="font-bold text-brand-500 underline-offset-4 hover:underline"
        >
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-4xl bg-white p-8 shadow-card">
          <div className="h-6 w-32 animate-pulse rounded-full bg-cream-200" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
