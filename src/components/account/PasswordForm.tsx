"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { changePassword } from "@/app/actions/account";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("saving");

    const result = await changePassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!result.ok) {
      setState("idle");
      setError(result.error);
      return;
    }

    setState("saved");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setState("idle"), 5000);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <PasswordInput
        label="Текущий пароль"
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <PasswordInput
        label="Новый пароль"
        autoComplete="new-password"
        hint={`Не менее ${PASSWORD_MIN_LENGTH} символов, минимум одна буква и одна цифра`}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <PasswordInput
        label="Повторите новый пароль"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-2xl bg-red-50 px-3.5 py-3 text-[13px] font-medium leading-relaxed text-red-600"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          {error}
        </p>
      )}

      {state === "saved" && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-2xl bg-sage-50 px-3.5 py-3 text-[13px] font-medium leading-relaxed text-sage-500"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          Пароль обновлён
        </p>
      )}

      <Button
        type="submit"
        isLoading={state === "saving"}
        className="mt-1 self-start rounded-full px-8 py-3.5"
      >
        {state === "saving" ? "Сохраняем…" : "Изменить пароль"}
      </Button>
    </form>
  );
}
