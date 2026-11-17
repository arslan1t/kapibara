"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { Lock, Truck, CreditCard } from "lucide-react";
import Input from "@/components/ui/Input";
import CheckoutSummary from "@/components/checkout/CheckoutSummary";
import { useCartStore } from "@/store/cart";
import { createOrder } from "@/app/actions/orders";
import { AlertCircle } from "lucide-react";
import type { DeliveryAddress } from "@/types";
import type { PaymentProvider } from "@/lib/constants";
import { useDictionary } from "@/i18n/DictionaryProvider";
import { useLocale } from "@/i18n/navigation";
import { LOCALE_CONFIG, REGION_CONFIG } from "@/i18n/config";

type FormData = DeliveryAddress;

export default function CheckoutForm({
  providers,
}: {
  /**
   * The online providers this market can actually charge with. Empty means
   * payment on agreement, which always works.
   */
  providers: PaymentProvider[];
}) {
  const onlinePaymentEnabled = providers.length > 0;
  const [provider, setProvider] = useState<PaymentProvider>(
    providers[0] ?? "manual"
  );
  const t = useDictionary();
  const locale = useLocale();
  const { region } = LOCALE_CONFIG[locale];
  const { phone: phoneRules, deliveryMethods } = REGION_CONFIG[region];
  // Six digits in Russia, six in Uzbekistan too, but the ranges differ enough
  // that a Moscow example in a Tashkent form just looks like a mistake.
  const postalExample = region === "UZ" ? "100000" : "101000";

  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const hydrated = useCartStore((s) => s._hydrated);
  const clearCart = useCartStore((s) => s.clearCart);
  const [isLoading, setIsLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  // Set the moment an order is accepted, so emptying the cart afterwards does
  // not trigger the "cart is empty" redirect and cancel the success page.
  const [submittedOrder, setSubmittedOrder] = useState(false);

  // Generated once per mounted checkout, so a double-click, a retry after a
  // dropped connection, or a re-post on refresh all carry the same key and the
  // server returns the original order instead of creating a second one.
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `k-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  useEffect(() => {
    // Wait for the cart to hydrate before deciding it is empty, otherwise a
    // direct visit or refresh always bounces back to /cart.
    if (hydrated && items.length === 0 && !submittedOrder) router.push("/cart");
  }, [hydrated, items.length, router, submittedOrder]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cream-300 border-t-brand-400" />
      </div>
    );
  }

  if (items.length === 0 && !submittedOrder) return null;

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setOrderError(null);

    // Only identifiers and personalization are sent. Prices are looked up
    // server-side, so nothing the browser claims about cost is trusted.
    const result = await createOrder({
      idempotencyKey: idempotencyKey.current,
      customerName: data.fullName,
      customerEmail: data.email,
      customerPhone: data.phone,
      locale,
      paymentProvider: provider,
      // Courier everywhere it is offered; the region config is the authority
      // on what that list is, and the server refuses anything outside it.
      deliveryMethod: deliveryMethods[0] ?? "courier",
      deliveryAddress: [
        data.postalCode,
        data.city,
        data.street,
        data.apartment && `${t.checkout.apartment} ${data.apartment}`,
      ]
        .filter(Boolean)
        .join(", "),
      items: items.map((item) => ({
        productSlug: item.book.slug,
        quantity: item.quantity,
        personalization: {
          childName: item.personalization?.childName ?? "",
          childGender: item.book.childGender,
          childAge: item.personalization?.childAge ?? null,
          dedication: item.personalization?.dedication ?? null,
          photoKey: item.personalization?.photoKey ?? null,
          generationJobId: item.personalization?.generationJobId ?? null,
        },
      })),
    });

    if (!result.ok) {
      setIsLoading(false);
      setOrderError(result.error);
      return;
    }

    setSubmittedOrder(true);
    clearCart();

    // With an online provider configured the customer finishes paying on the
    // provider's own page, then returns to the confirmation screen.
    if (result.paymentUrl) {
      window.location.assign(result.paymentUrl);
      return;
    }

    router.push(`/order-success?order=${result.orderId}`);
  }

  return (
    <div className="py-10 md:py-14">
      <div className="page-container">
        <h1 className="font-display text-3xl font-extrabold text-brown-dark sm:text-4xl">
          {t.checkout.heading}
        </h1>
        <p className="mt-3 text-[15px] text-brown">
          {t.checkout.lead}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-10">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Delivery */}
              <section className="rounded-4xl bg-white p-6 shadow-card sm:p-7">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-brown-dark">
                  <Truck className="h-5 w-5 text-brand-500" strokeWidth={1.9} />
                  {t.checkout.addressHeading}
                </h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Input
                    label={t.checkout.fullName}
                    placeholder={t.checkout.fullNamePlaceholder}
                    autoComplete="name"
                    error={errors.fullName?.message}
                    {...register("fullName", { required: t.checkout.required })}
                  />
                  <Input
                    label={t.checkout.phone}
                    type="tel"
                    placeholder={phoneRules.example}
                    autoComplete="tel"
                    error={errors.phone?.message}
                    {...register("phone", { required: t.checkout.required })}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label={t.checkout.email}
                      type="email"
                      inputMode="email"
                      placeholder="example@mail.com"
                      autoComplete="email"
                      hint={t.checkout.emailHint}
                      error={errors.email?.message}
                      {...register("email", {
                        required: t.checkout.required,
                        pattern: {
                          value: /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/,
                          message: t.checkout.emailInvalid,
                        },
                      })}
                    />
                  </div>
                  <Input
                    label={t.checkout.city}
                    placeholder={t.checkout.cityPlaceholder}
                    autoComplete="address-level2"
                    error={errors.city?.message}
                    {...register("city", { required: t.checkout.required })}
                  />
                  <Input
                    label={t.checkout.postalCode}
                    inputMode="numeric"
                    placeholder={postalExample}
                    autoComplete="postal-code"
                    error={errors.postalCode?.message}
                    {...register("postalCode", { required: t.checkout.required })}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label={t.checkout.street}
                      placeholder={t.checkout.streetPlaceholder}
                      autoComplete="street-address"
                      error={errors.street?.message}
                      {...register("street", { required: t.checkout.required })}
                    />
                  </div>
                  <Input
                    label={t.checkout.apartment}
                    placeholder="25"
                    {...register("apartment")}
                  />
                  <input
                    type="hidden"
                    value={region}
                    {...register("country")}
                  />
                </div>
                <p className="mt-5 text-sm text-brown-300">
{t.checkout.deliveryNote}
                </p>
              </section>

              {/* Payment */}
              <section className="rounded-4xl bg-white p-6 shadow-card sm:p-7">
                <h2 className="flex items-center gap-2.5 font-display text-lg font-extrabold text-brown-dark">
                  <CreditCard className="h-5 w-5 text-brand-500" strokeWidth={1.9} />
                  {t.checkout.paymentHeading}
                </h2>
                {providers.length > 1 ? (
                  // Uzbekistan has two providers people genuinely choose
                  // between: a customer with the Click app and no Payme
                  // account is not served by being sent to Payme.
                  <fieldset className="mt-6 flex flex-col gap-3">
                    <legend className="sr-only">
                      {t.payment.chooseHeading}
                    </legend>
                    {providers.map((option) => (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-start gap-3 rounded-3xl border-2 p-5 transition-colors ${
                          provider === option
                            ? "border-brand-300 bg-brand-50"
                            : "border-cream-200 bg-white hover:border-cream-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentProvider"
                          value={option}
                          checked={provider === option}
                          onChange={() => setProvider(option)}
                          className="mt-1 h-4 w-4 accent-brand-500"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-brown-dark">
                            {t.payment[option]}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-brown">
                            {t.payment[`${option}Note` as keyof typeof t.payment]}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  // One method, so this states what will happen rather than
                  // offering a choice that isn't one.
                  <div className="mt-6 rounded-3xl border-2 border-brand-300 bg-brand-50 p-5">
                    <p className="font-semibold text-brown-dark">
                      {onlinePaymentEnabled
                        ? t.payment[provider]
                        : t.checkout.paymentManualTitle}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-brown">
                      {onlinePaymentEnabled
                        ? t.checkout.paymentOnlineBody
                        : t.checkout.paymentManualBody}
                    </p>
                  </div>
                )}

                <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-cream-100 px-4 py-3.5 text-sm leading-relaxed text-brown">
                  <Lock
                    className="mt-0.5 h-4 w-4 shrink-0 text-sage-500"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {onlinePaymentEnabled
                    ? t.checkout.paymentOnlineNote
                    : t.checkout.paymentManualNote}
                </p>
              </section>
            </div>

            <div className="lg:sticky lg:top-28 lg:self-start">
              {orderError && (
                <p
                  role="alert"
                  className="mb-4 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-[13px] font-medium leading-relaxed text-red-600"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
                  {orderError}
                </p>
              )}
              <CheckoutSummary
                items={items}
                onSubmit={handleSubmit(onSubmit)}
                isLoading={isLoading}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
