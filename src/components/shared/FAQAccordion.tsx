"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FAQItem } from "@/data/mock";
import { cn } from "@/lib/utils";

interface FAQAccordionProps {
  items: FAQItem[];
}

export default function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "rounded-2xl border transition-all duration-200",
            openIndex === i
              ? "border-brand-100 bg-brand-50"
              : "border-cream-200 bg-white"
          )}
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-start justify-between gap-4 p-5 text-left"
          >
            <span className="font-display font-semibold text-brown-dark leading-snug">
              {item.question}
            </span>
            <ChevronDown
              className={cn(
                "mt-0.5 h-5 w-5 shrink-0 text-brand-500 transition-transform duration-300",
                openIndex === i && "rotate-180"
              )}
            />
          </button>
          {openIndex === i && (
            <div className="px-5 pb-5">
              <p className="text-sm text-brown leading-relaxed">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
