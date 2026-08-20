/**
 * Policy page copy, shipped in code and overridable per page via the
 * `site_settings` key `policy_<slug>`.
 *
 * Lifted verbatim from reference design/{payment-system,cancellation-policy,
 * refund-policy,privacy-policy,terms-and-conditions}.html.
 *
 * These are legal-ish pages: treat edits as content changes that need a human review,
 * not as copy tweaks.
 */

export interface PolicyBlock {
  heading: string;
  paragraphs?: string[];
  items?: string[];
}

export interface PolicyPage {
  eyebrow: string;
  title: string;
  subhead: string;
  blocks: PolicyBlock[];
  contact_heading: string;
  contact_body: string;
}

export const POLICY_SLUGS = [
  "payment",
  "cancellation",
  "refund",
  "privacy",
  "terms",
] as const;

export type PolicySlug = (typeof POLICY_SLUGS)[number];

export const policyDefaults: Record<PolicySlug, PolicyPage> = {
  payment: {
    eyebrow: "Booking & Payments",
    title: "Clear Payments, Fair Pricing",
    subhead:
      "No hidden charges, no surprise fees — just transparent, traveller-first payments.",
    blocks: [
      {
        heading: "🔒 Secure and Transparent Payments",
        paragraphs: [
          "At Roam Bengal, we believe trust begins with clarity. Our payment policy is built to be simple, secure, and completely transparent, so you always know exactly what you're paying for and why.",
          "From private tours to fully custom itineraries, every payment reflects fair local pricing and zero hidden costs — so you can focus on the trip, not the fine print.",
          "We keep the payment process straightforward. Every booking confirmation includes a written breakdown of what's included and what it costs, so there's never any guesswork about what you're paying for.",
        ],
      },
      {
        heading: "💰 Deposit and Balance",
        items: [
          "**25% deposit** — confirms your private tour and locks in your dates.",
          "**75% balance** — due no later than 14 days before your tour start date.",
          "**Last-minute bookings** — for bookings made less than 14 days before departure, the full amount is due at confirmation.",
        ],
      },
      {
        heading: "💳 Accepted Payment Methods",
        paragraphs: ["We accept the following secure payment methods:"],
        items: [
          "**International cards** — Visa, Mastercard, and Amex, processed securely via Stripe.",
          "**Wise and Western Union** — international money transfer for guests who prefer it over a card.",
          "**International bank transfer** — available on request for select bookings.",
          "**USD, EUR, or GBP** — every invoice is issued in USD by default; equivalent EUR or GBP pricing is available on request.",
        ],
      },
      {
        heading: "💱 Currency and Conversion",
        items: [
          "All prices are quoted in US Dollars (USD).",
          "If you pay in a different currency, conversion is based on the official exchange rate on the day of payment.",
          "Any transfer fees or bank charges from your side are the traveller's responsibility.",
        ],
      },
      {
        heading: "📝 Payment Confirmation",
        paragraphs: ["Once we receive your payment, you will receive:"],
        items: [
          "An official payment receipt sent to your email.",
          "A final confirmation with your complete booking details.",
          "A confirmation worth keeping as proof of your reservation.",
        ],
      },
      {
        heading: "🔒 Secure Transactions",
        paragraphs: [
          "All payments are processed through encrypted, verified platforms to keep your information safe. Roam Bengal does not store or share your payment details.",
        ],
      },
      {
        heading: "↩️ Refunds & Cancellations",
        paragraphs: [
          "If you need to cancel or reschedule, refunds are processed back to your original payment method within 7–10 business days, subject to our Cancellation and Refund policies.",
        ],
      },
    ],
    contact_heading: "❓ Questions About Payment?",
    contact_body:
      "If you have questions about deposits, balances, or payment methods, please get in touch with us.",
  },

  cancellation: {
    eyebrow: "Plans Change, We Understand",
    title: "Cancellation Policy",
    subhead:
      "Life happens — our cancellation terms are built to be fair, clear, and traveller-friendly.",
    blocks: [
      {
        heading: "📅 Cancellation Timeline & Refunds",
        paragraphs: ["The amount refunded depends on how far in advance you cancel:"],
        items: [
          "30+ days before departure: Full refund, minus a 5% processing fee",
          "15–29 days before departure: 50% of the total tour cost refunded",
          "7–14 days before departure: 25% of the total tour cost refunded",
          "Less than 7 days before departure: Non-refundable",
        ],
      },
      {
        heading: "🔁 Rescheduling Your Tour",
        paragraphs: ["Prefer a new date instead of a refund? We're happy to help."],
        items: [
          "Free rescheduling if requested 15 or more days before departure",
          "A small rescheduling fee may apply within 15 days, depending on supplier terms",
          "Rescheduled tours are subject to availability at the new date",
        ],
      },
      {
        heading: "🙋 If You Don't Show Up",
        paragraphs: [
          "If you don't arrive at the meeting point or fail to join the tour without prior notice, the booking is treated as a no-show and is non-refundable.",
        ],
      },
      {
        heading: "⛈️ Cancellations by Roam Bengal",
        paragraphs: [
          "On rare occasions, we may need to cancel a tour due to severe weather, safety concerns, insufficient group size, or events beyond our control (force majeure). In these cases, you can choose between:",
        ],
        items: [
          "A full refund of all payments made, or",
          "Free rescheduling to an alternative date",
        ],
      },
      {
        heading: "💳 How Refunds Are Processed",
        paragraphs: [
          "Approved refunds are returned to your original payment method — bKash, Nagad, Rocket, card, or bank transfer — within 7–10 business days. Any bank or transfer charges deducted by third parties are not covered by Roam Bengal.",
        ],
      },
      {
        heading: "👨‍👩‍👧 Group & Custom Tours",
        paragraphs: [
          "Private and custom-itinerary tours may follow different cancellation terms, communicated in writing at the time of booking, since these often involve non-refundable third-party reservations (permits, boats, or homestays).",
        ],
      },
    ],
    contact_heading: "❓ Need to Cancel or Reschedule?",
    contact_body:
      "Reach out as early as possible — the sooner we know, the more options we can offer you.",
  },

  refund: {
    eyebrow: "Fair & Transparent",
    title: "Refund & Cancellation Policy",
    subhead:
      "We know travel plans change. Our refund policy is built around one goal: being as fair to you as the local bookings we make on your behalf will allow. Below is exactly what to expect if you need to cancel.",
    blocks: [
      {
        heading: "📅 Cancellation Tiers",
        paragraphs: [
          "Every quote and confirmation email also states these terms in plain language before you pay a deposit — nothing here should be a surprise.",
        ],
        items: [
          "**30+ days before departure — full refund.** 100% of your payment returned, no questions asked.",
          "**15–29 days before departure — 75% refund.** A partial cancellation fee applies to cover guide and accommodation holds already made on your behalf.",
          "**7–14 days before departure — 50% refund.** At this point most local bookings (boats, homestays, permits) can no longer be released.",
          "**0–6 days before departure — no refund.** We'll still try to help you reschedule where possible, but the tour cost is non-refundable this close to departure.",
        ],
      },
      {
        heading: "🔁 Free Rescheduling",
        items: [
          "Move your dates for free up to 72 hours before departure.",
          "Rescheduling doesn't restart your cancellation-tier clock — it stays tied to your original departure date.",
          "One free reschedule per booking; a second change may carry a small admin fee depending on the tour.",
        ],
      },
      {
        heading: "❓ Frequently Asked Questions",
        items: [
          "**Can I reschedule instead of cancelling?** Yes — free rescheduling is available up to 72 hours before your departure date, subject to guide and accommodation availability for the new dates.",
          "**What if Roam Bengal has to cancel the tour?** If we cancel due to safety concerns, severe weather, or an inability to deliver the itinerary as booked, you'll receive a full refund or the option to rebook for a later date, whichever you prefer.",
          "**Are deposits refundable?** Deposits follow the same tiered schedule above, calculated from the date your booking is confirmed to your original departure date.",
          "**How long does a refund take to process?** Approved refunds are issued to your original payment method within 7–10 business days.",
          "**Does this apply to add-ons and custom itineraries?** Yes, the same tiers apply to optional add-ons (like the extras listed on individual tour pages) and fully custom itineraries booked directly with us.",
        ],
      },
      {
        heading: "🚫 Non-Refundable Items",
        paragraphs: ["The following are generally non-refundable once booked:"],
        items: [
          "Government permits, park entry fees, and visa-related costs already paid on your behalf",
          "Bookings made under non-refundable promotional rates",
          "No-show bookings — if you do not arrive at the meeting point without prior notice",
        ],
      },
      {
        heading: "⚠️ Service-Related Refunds",
        paragraphs: [
          "If a tour didn't match what was promised — due to an issue on our end, such as a missed itinerary item or a service failure — please contact us within 7 days of your tour. We review each case individually and may offer a partial refund, credit toward a future tour, or another resolution, depending on the circumstances.",
        ],
      },
    ],
    contact_heading: "❓ Need to Cancel or Change a Booking?",
    contact_body:
      "Message us directly and we'll confirm your refund amount or help you find new dates — usually within a few hours.",
  },

  privacy: {
    eyebrow: "Your Data, Your Trust",
    title: "Privacy Policy",
    subhead:
      "Your information stays yours — collected only to plan a better journey for you.",
    blocks: [
      {
        heading: "📋 Information We Collect",
        paragraphs: ["To plan and confirm your tour, we may collect:"],
        items: [
          "Your name, email address, phone number, and WhatsApp contact",
          "Passport or NID details, only when required for permits or accommodation",
          "Payment information, processed securely through our payment partners",
          "Basic technical data such as browser type and pages visited, to improve our website",
        ],
      },
      {
        heading: "🎯 How We Use Your Information",
        items: [
          "To confirm bookings and send itinerary or payment updates",
          "To arrange guides, transport, and accommodation on your behalf",
          "To respond to your enquiries and provide customer support",
          "To occasionally share offers or travel tips, only if you've opted in",
        ],
      },
      {
        heading: "🤝 Sharing Your Information",
        paragraphs: [
          "We never sell your personal information. We only share what's necessary with trusted local partners — such as guides, hotels, or transport providers — so they can deliver the tour you booked. We may also disclose information if required by law.",
        ],
      },
      {
        heading: "🍪 Cookies & Website Data",
        paragraphs: [
          "Our website uses cookies to remember your preferences and understand how visitors use our site. You can disable cookies in your browser settings at any time, though some features may not work as smoothly.",
        ],
      },
      {
        heading: "🔐 How We Protect Your Data",
        paragraphs: [
          "Your data is stored securely, and payment details are handled through encrypted, PCI-DSS compliant gateways. We do not store your full card number or bKash PIN on our systems.",
        ],
      },
      {
        heading: "👤 Your Rights",
        items: [
          "You can ask us what personal data we hold about you, at any time.",
          "You can request corrections to inaccurate information.",
          "You can ask us to delete your data, unless we're required to keep it for legal or accounting reasons.",
          "You can unsubscribe from marketing messages using the link in any email, or simply by telling us.",
        ],
      },
      {
        heading: "🌍 Third-Party Links",
        paragraphs: [
          "Our website may link to external sites (such as Google Maps or social media). We aren't responsible for the privacy practices of those third-party sites, so we encourage you to review their policies separately.",
        ],
      },
      {
        heading: "🔄 Changes to This Policy",
        paragraphs: [
          "We may update this Privacy Policy occasionally to reflect changes in our practices or legal requirements. Any updates will be posted on this page.",
        ],
      },
    ],
    contact_heading: "❓ Questions About Your Privacy?",
    contact_body:
      "If you have any questions about how we collect or use your information, please get in touch with us.",
  },

  terms: {
    eyebrow: "Please Read Before Booking",
    title: "Terms and Conditions",
    subhead:
      "Booking with us means agreeing to a few simple terms — no fine print surprises.",
    blocks: [
      {
        heading: "📖 About These Terms",
        paragraphs: [
          '"Roam Bengal," "we," "us," or "our" refers to Roam Bengal and its tour operations across Bangladesh. "You" or "traveller" refers to anyone booking or joining a tour with us. These terms apply to all bookings made through our website, WhatsApp, email, or in person.',
        ],
      },
      {
        heading: "✅ Booking & Confirmation",
        items: [
          "A booking is only confirmed once we receive the required deposit or full payment.",
          "You are responsible for providing accurate traveller details (names, passport/NID info) at the time of booking.",
          "Tour prices are subject to change until a booking is confirmed with payment.",
        ],
      },
      {
        heading: "🧳 Traveller Responsibilities",
        items: [
          "You are responsible for holding valid travel documents, visas, and any required permits.",
          "Please disclose any medical conditions, allergies, or mobility needs before the tour, so we can plan accordingly.",
          "Travellers are expected to follow the guide's safety instructions and respect local customs and communities throughout the tour.",
          "We strongly recommend arranging your own travel insurance for medical emergencies, trip delays, or loss of belongings.",
        ],
      },
      {
        heading: "🗺️ Itinerary Changes",
        paragraphs: [
          "Itineraries are planned carefully, but weather, safety conditions, local events, or logistical issues may require changes. Roam Bengal reserves the right to modify routes, accommodation, or schedules, while aiming to keep the overall experience and value equivalent.",
        ],
      },
      {
        heading: "⚠️ Liability",
        paragraphs: [
          "Roam Bengal works with trusted local guides, drivers, and partners, but travel inherently carries some risk. To the extent permitted by law, Roam Bengal is not liable for injury, loss, delay, or damage caused by circumstances beyond our reasonable control, including weather, natural events, third-party service failures, or a traveller's own actions.",
        ],
      },
      {
        heading: "💳 Payments, Cancellations & Refunds",
        paragraphs: [
          "All bookings are subject to our Payment System, Cancellation Policy, and Refund Policy, which form part of these Terms and Conditions.",
        ],
      },
      {
        heading: "📸 Photos & Content",
        paragraphs: [
          "With your permission, we may use photos or videos taken during tours for marketing purposes, including our website and social media. Let us know at any time if you'd prefer not to be featured.",
        ],
      },
      {
        heading: "🔐 Privacy",
        paragraphs: ["Your personal information is handled according to our Privacy Policy."],
      },
      {
        heading: "🔄 Changes to These Terms",
        paragraphs: [
          "We may update these Terms and Conditions from time to time to reflect changes in our services or legal requirements. The version in effect at the time of your booking will apply to that booking.",
        ],
      },
    ],
    contact_heading: "❓ Questions About These Terms?",
    contact_body: "We're happy to clarify anything before you book.",
  },
};

/**
 * Standalone info pages the footer links to. No reference design exists for any of
 * them (PRD §16) — they reuse the policy layout and are overridable via
 * `site_settings.info_<slug>`.
 */
export const INFO_SLUGS = [
  "visa-information",
  "embassy-directory",
  "travel-faqs",
  "responsible-travel",
  "guides",
  "careers",
] as const;

export type InfoSlug = (typeof INFO_SLUGS)[number];

export const infoDefaults: Record<InfoSlug, PolicyPage> = {
  "visa-information": {
    eyebrow: "Before You Fly",
    title: "Bangladesh Visa Information",
    subhead: "We guide you through Bangladesh entry requirements as part of planning.",
    blocks: [
      {
        heading: "🛂 What we help with",
        paragraphs: [
          "Visa assistance is included in planning every trip. We tell you which route applies to your nationality, what supporting documents you need, and what to expect on arrival.",
        ],
      },
      {
        heading: "📄 What we cannot do",
        paragraphs: [
          "We are a tour operator, not an immigration adviser. Requirements change, and the decision always rests with the Bangladeshi mission or immigration officer. Confirm current rules with your nearest Bangladesh High Commission before booking flights.",
        ],
      },
    ],
    contact_heading: "❓ Not sure which visa route applies?",
    contact_body: "Tell us your nationality and travel dates and we will talk you through it.",
  },
  "embassy-directory": {
    eyebrow: "Useful Contacts",
    title: "Embassy Directory",
    subhead: "Who to contact if you need consular help while you are in Bangladesh.",
    blocks: [
      {
        heading: "🏛️ Directory",
        paragraphs: [
          "This page is being compiled. In the meantime, message us and we will find the current contact details for your country's mission in Dhaka.",
        ],
      },
    ],
    contact_heading: "❓ Need a contact urgently?",
    contact_body: "Message us on WhatsApp — we can usually find the right number quickly.",
  },
  "travel-faqs": {
    eyebrow: "Good To Know",
    title: "Travel FAQs",
    subhead: "The questions we get asked most, answered plainly.",
    blocks: [],
    contact_heading: "❓ Still have a question?",
    contact_body: "Ask us anything — we would rather answer it before you book than after.",
  },
  "responsible-travel": {
    eyebrow: "How We Operate",
    title: "Responsible Travel",
    subhead: "Where your booking fee actually goes, and the rules we hold ourselves to.",
    blocks: [
      {
        heading: "🤝 Community First",
        paragraphs: [
          "Fair pay for guides, boat crews, and the villages we visit along the way. A share of every booking goes back into the communities and forests you pass through.",
        ],
      },
      {
        heading: "🐦 Wildlife Comes First",
        paragraphs: [
          "No baiting, no chasing, no flash photography near animals. We would rather you saw less and disturbed nothing.",
        ],
      },
      {
        heading: "🗑️ Leave No Trace",
        paragraphs: [
          "We pack out everything we bring in and minimise waste on every trip.",
        ],
      },
      {
        heading: "🌱 Carbon-Aware",
        paragraphs: [
          "Fuel-efficient boats wherever possible, with local tree-planting offsets.",
        ],
      },
    ],
    contact_heading: "❓ Want the detail?",
    contact_body: "Ask us how a specific trip is costed — we will show you the breakdown.",
  },
  guides: {
    eyebrow: "The People",
    title: "Our Guides",
    subhead: "Local to the route you are travelling, not generalists flown in for the week.",
    blocks: [
      {
        heading: "🧭 Who takes you out",
        paragraphs: [
          "Guide profiles are being written. Every guide we work with grew up on or near the route they lead, speaks English, and is paid a fair day rate rather than relying on commissions.",
        ],
      },
    ],
    contact_heading: "❓ Want to know who would guide your trip?",
    contact_body: "Ask us — we are happy to introduce you before you book.",
  },
  careers: {
    eyebrow: "Join Us",
    title: "Careers",
    subhead: "We hire guides, planners, and drivers across Bangladesh.",
    blocks: [
      {
        heading: "💼 Open roles",
        paragraphs: [
          "No formal openings are listed right now, but we always want to hear from guides with deep local knowledge of a specific region.",
        ],
      },
    ],
    contact_heading: "❓ Think you would be a fit?",
    contact_body: "Send us a note about where you are from and what you know best.",
  },
};
