"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { updateProfile } from "@/app/actions/account";

export default function ProfileForm({
  initialName,
  initialPhone,
  email,
}: {
  initialName: string;
  initialPhone: string;
  email: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("saving");

    const result = await updateProfile({ fullName, phone });
    if (!result.ok) {
      setState("idle");
      setError(result.error);
      return;
    }

    setState("saved");
    router.refresh();
    setTimeout(() => setState("idle"), 4000);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Имя"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />

      <Input
        label="Электронная почта"
        value={email}
        readOnly
        disabled
        hint="Адрес используется для входа и изменить его пока нельзя"
        className="cursor-not-allowed bg-cream-100"
      />

      <Input
        label="Телефон"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="+7 900 000-00-00"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
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
          Изменения сохранены
        </p>
      )}

      <Button
        type="submit"
        isLoading={state === "saving"}
        className="mt-1 self-start rounded-full px-8 py-3.5"
      >
        {state === "saving" ? "Сохраняем…" : "Сохранить"}
      </Button>
    </form>
  );
}
