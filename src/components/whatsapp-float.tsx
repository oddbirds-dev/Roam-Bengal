import { WhatsAppIcon } from "@/components/art/logo-mark";
import { useSiteSettings } from "@/hooks/use-site-settings";

/** Fixed bottom-right pill, present on every page in the reference designs. */
export function WhatsAppFloat() {
  const { whatsapp } = useSiteSettings();

  return (
    <a
      href={whatsapp.link}
      target="_blank"
      rel="noreferrer noopener"
      className="fixed right-5 bottom-5 z-40 inline-flex items-center gap-2 rounded-[30px] bg-[#25D366] px-5 py-3 text-[0.84rem] font-semibold text-white shadow-lg transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="h-5 w-5" />
      <span className="hidden sm:inline">{whatsapp.float_label}</span>
      <span className="sr-only sm:hidden">{whatsapp.float_label}</span>
    </a>
  );
}
