import { ChevronDown } from "lucide-react";
import { FormatText } from "@/components/ui/format-text";

export interface FaqAccordionItem {
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqAccordionItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group overflow-hidden rounded-2xl border border-rule bg-paper shadow-[0_8px_24px_rgba(30,95,59,0.06)] transition-[border-color,box-shadow] open:border-green/40 open:shadow-[0_12px_30px_rgba(30,95,59,0.1)]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-4 font-display text-[1rem] font-bold text-green-dark marker:hidden [&::-webkit-details-marker]:hidden sm:px-6 sm:py-5">
            <span>{item.question}</span>
            <ChevronDown
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-green transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-rule/70 px-5 pb-5 pt-4 text-[0.9rem] leading-7 text-ink/85 sm:px-6">
            <FormatText>{item.answer}</FormatText>
          </div>
        </details>
      ))}
    </div>
  );
}