import type { Metadata } from "next";
import PasswordForm from "@/components/account/PasswordForm";

export const metadata: Metadata = {
  title: "Безопасность",
  robots: { index: false, follow: false },
};

export default function SecurityPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-brown-dark sm:text-3xl">
        Безопасность
      </h1>
      <p className="mt-2 text-[15px] text-brown">
        Смена пароля для входа в личный кабинет.
      </p>

      <div className="mt-8 max-w-lg rounded-4xl bg-white p-5 shadow-soft sm:p-7">
        <PasswordForm />
      </div>
    </div>
  );
}
