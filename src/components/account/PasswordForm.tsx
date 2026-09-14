"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { changePassword } from "@/app/actions/account";
import { PASSWORD_MIN_LENGTH } from "@/lib/validation";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { fill } from "@/i18n/format";

export default function PasswordForm() {
  const t = useDictionary();
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
        label={t.account.currentPassword}
        autoComplete="current-password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />
      <PasswordInput
        label={t.account.newPassword}
        autoComplete="new-password"
        hint={fill(t.account.passwordHint, { min: PASSWORD_MIN_LENGTH })}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <PasswordInput
        label={t.account.repeatNewPassword}
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
          {t.account.passwordUpdated}
        </p>
      )}

      <Button
        type="submit"
        isLoading={state === "saving"}
        className="mt-1 self-start rounded-full px-8 py-3.5"
      >
        {state === "saving" ? t.account.saving : t.account.changePassword}
      </Button>
    </form>
  );
}
