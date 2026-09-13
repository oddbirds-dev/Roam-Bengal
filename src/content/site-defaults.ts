/**
 * Default site copy, shipped in code.
 *
 * This is the same "defaults in code, stored JSON merges on top" pattern the PRD
 * specifies for policy and info pages, extended to all site chrome. The matching rows
 * were seeded into `site_settings` (migration 06), and once a row exists it wins — but a
 * missing key, a missing field, or a database that has not loaded yet degrades to these
 * instead of rendering an empty page.
 *
 * Source: reference design/*.html.
 */

import type { CustomFontEntry } from "@/lib/custom-fonts";

export interface NavLink {
  label: string;
  to: string;
}

export const siteDefaults = {
  custom_fonts: {
    // The original single font, kept because content already refers to it as `font-custom`.
    // `fonts` is the list everything new goes in — see lib/custom-fonts.ts.
    font_url: "",
    font_family: "",
    fonts: [] as CustomFontEntry[],
  },

  tour_editor: {
    // Sections switched off by default in the tour editor for newly created tours.
    // Existing tours keep whatever they were last saved with. See lib/tour-sections.ts.
    hidden_sections: [] as string[],
  },

  integrations: {
    gtm_container_id: "",
    adsense_client_id: "",
    google_site_verification: "",
  },

  header: {
    logo_url: "",
    logo_url_light: "",
    logo_alt: "Roam Bengal",
    wordmark_1: "Roam",
    wordmark_2: "Bengal",
    tagline: "EXPLORE THE HEART OF BANGLADESH",
    cta_label: "Plan Your Trip",
    cta_link: "/contact",
    nav: [
      { label: "Home", to: "/" },
      { label: "Tours", to: "/tours" },
      { label: "Blog", to: "/blog" },
      { label: "Reviews", to: "/reviews" },
      { label: "Contact", to: "/contact" },
    ] as NavLink[],
  },

  footer: {
    // The footer sits on a dark green gradient, so the shipped default is the light
    // wordmark rather than `header.logo_url`'s dark one. Upload a replacement in
    // Admin → Footer → Logo.
    logo_url: "",
    intro:
      "Small-group tours across Bangladesh, planned by the boatmen, tea-garden guides, and hill-trekkers who call these routes home since 2014.",
    columns: [
      {
        title: "Explore",
        links: [
          { label: "Tours", to: "/tours" },
          { label: "Blog", to: "/blog" },
          { label: "Reviews", to: "/reviews" },
        ] as NavLink[],
      },
      {
        title: "Company",
        links: [
          { label: "About Us", to: "/about" },
          { label: "Guides", to: "/guides" },
          { label: "Careers", to: "/careers" },
        ] as NavLink[],
      },
      {
        title: "Contact",
        links: [
          { label: "hello@roambengal.com", to: "mailto:hello@roambengal.com" },
          { label: "WhatsApp: +880 1XXX-XXXXXX", to: "https://wa.me/8801XXXXXXXXX" },
          { label: "Dhaka, Bangladesh", to: "/contact" },
        ] as NavLink[],
      },
    ],
    copyright: "© 2026 Roam Bengal. All rights reserved.",
    site_label: "roambengal.com",
  },

  whatsapp: {
    number: "+880 1XXX-XXXXXX",
    link: "https://wa.me/8801XXXXXXXXX",
    float_label: "Chat on WhatsApp",
    strip_heading: "Prefer To Chat Directly?",
    strip_body:
      "Message us on WhatsApp for the fastest response — great for quick questions before you book.",
    strip_cta: "💬 Chat on WhatsApp",
  },

  hero: {
    background_url: "",
    background_alt:
      "Fishermen casting a net from a traditional boat on a Bangladesh river at sunset",
    script: "Explore",
    headline: "The Soul of Bangladesh",
    subtext:
      "From the world's largest mangrove forest to endless tea gardens and rich cultural heritage.",
    primary_label: "Explore Tours",
    primary_link: "/tours",
    secondary_label: "▷ Watch Video",
    secondary_link: "",
  },

  homepage: {
    features: [
      { icon: "box", title: "Handpicked Tours", text: "Curated authentic experiences" },
      { icon: "user", title: "Local Experts", text: "Travel with passionate guides" },
      {
        icon: "shield",
        title: "Safe & Trusted",
        text: "Vetted guides and transport for international guests",
      },
      {
        icon: "card",
        title: "Visa Assistance",
        text: "We guide you through Bangladesh entry requirements",
      },
      {
        icon: "headset",
        title: "24/7 Support",
        text: "English-speaking support, wherever you are",
      },
      {
        icon: "route",
        title: "Airport Pickup",
        text: "Meet-and-greet from Dhaka or Cox's Bazar airport",
      },
      { icon: "calendar", title: "Festival Tours", text: "Experience Bangladesh's vibrant celebrations" },
      { icon: "route", title: "Schedule Tours", text: "Flexible itineraries built around your dates" },
    ],
    popular_kicker: "Popular Tours",
    popular_heading: "Handpicked Experiences for You",
    popular_bg_image: "",
    multiday_kicker: "Multi-Day Tours",
    multiday_heading: "Journeys Across Bangladesh",
    holiday_kicker: "Holiday Tours",
    holiday_heading: "Unforgettable Holiday Experiences",
    faith_heading_1: "Why Travellers Trust",
    faith_heading_2: "Roam Bengal With Confidence",
    faith_image_1: "",
    faith_image_2: "",
    faith_list: [
      { icon: "compass", text: "English-speaking, friendly local guide" },
      { icon: "globe", text: "Deep insight into Bangladesh's landmarks and history" },
      { icon: "chat", text: "Genuinely engaged, attentive travel companionship" },
      { icon: "shield", text: "Every logistical detail handled for a hassle-free trip" },
      { icon: "sparkles", text: "A relaxed pace, shaped around comfortable conversation" },
      {
        icon: "coin",
        text: "Private tour boat and a stop at the Bagerhat Mosque's terracotta shrines",
      },
      { icon: "lock", text: "A private guide for your Sundarbans mangrove tour" },
    ],
    faith_callouts: [
      {
        lead: "Roam Bengal vs. Local Operators —",
        text: "every tour is private and fully flexible by default. We design each itinerary to stay budget-friendly without cutting corners on quality, and our prices cover up to two guests at no extra cost.",
      },
      {
        lead: "Booking Platforms vs. Roam Bengal —",
        text: "sites like TripAdvisor, Viator, Booking.com, GetYourGuide, and Klook add commissions of up to 30% on top of the local rate. Booking directly with us skips that markup entirely.",
      },
    ],
    journal_kicker: "From The Journal",
    journal_heading: "Stories & Travel Notes",
    reviews_eyebrow: "Loved by Travellers Worldwide",
    reviews_heading_1: "Don't Take Our Word For It.",
    reviews_heading_2: "Customers Say It Best",
    reviews_subtext: "Trusted by thousands of explorers and adventure seekers.",
    reviews_photo_left: "",
    reviews_photo_right: "",
    reviews_cta_label: "View All Testimonials",
    reviews_cta_link: "/reviews",
    why_heading_1: "Why Choose",
    why_heading_2: "Panorama Bangladesh",
    why_intro:
      "From our handpicked destinations to our expert guides and personalized service, discover why travellers choose us for their dream Bangladesh vacation.",
    why_image: "",
    why_items: [
      {
        icon: "globe",
        title: "Handpicked Destinations",
        text: "Our strict screening process means you're only seeing the best quality routes across Bangladesh.",
      },
      {
        icon: "coin",
        title: "Best Price Guaranteed",
        text: "Our best price guarantee means you can be sure you're booking at the fairest local rate.",
      },
      {
        icon: "shield",
        title: "Sustainable by Design",
        text: "A share of every booking goes back into the villages and forests you pass through.",
      },
    ],
    cta_heading_1: "Ready To Explore? Let's Chat",
    cta_heading_2: "Your Dream Trip",
    cta_paragraphs: [
      "Turn Your Travel Ideas into Reality — with Roam Bengal as your local travel companion, your next adventure is just a message away. Let your wanderlust soar as we craft unforgettable experiences tailored just for you.",
      "Bangladesh's dedicated private tour provider — with us, every moment is worth your time, every journey is worth your money.",
    ],
    cta_label: "Plan Your Vacation",
    cta_link: "/contact",
    // Empty means the section keeps its drawn Dhaka skyline. Upload a photo to replace it.
    cta_image: "",
    cta_image_alt: "A Roam Bengal trip in Bangladesh",
  },

  gallery: {
    heading_1: "Best Tourist's Shared",
    heading_2: "Beautiful Photos",
    blurb:
      "If you're looking for one of the best holiday experiences of your life, we're excited to make it happen — filled with fun, authenticity, and ease.",
    bold: "Private Tours. Fair Prices. Real Experiences.",
    cta_label: "View Full Gallery",
    cta_link: "/gallery",
    photos: [
      { tag: "Sundarbans River", image_url: "" },
      { tag: "Mangrove Cruise", image_url: "" },
      { tag: "Bagerhat Mosque", image_url: "" },
      { tag: "Barisal Boats", image_url: "" },
    ],
  },

  reviews: {
    score: "4.9",
    score_out_of: "5",
    count_label: "Based on 340+ verified reviews",
    heading_1: "Don't Take Our Word For It.",
    heading_2: "Travellers Say It Best.",
    subtext:
      "Real trips, real families, real feedback — collected across every platform we're reviewed on.",
    platforms: [
      { name: "Tripadvisor", score: "5.0", colour: "#34E0A1", icon: "◎" },
      { name: "Google", score: "4.9", colour: "#F2B705", icon: "★" },
      { name: "Trustpilot", score: "4.8", colour: "#00B67A", icon: "★" },
      { name: "Facebook", score: "5.0", colour: "#1877F2", icon: "f" },
    ],
    cta_heading: "Been On A Trip With Us?",
    cta_body:
      "We'd love to hear how it went — your review helps the next traveller plan with confidence.",
    cta_label: "Leave A Review →",
    cta_link: "/contact",
    banner_image: "",
  },

  tours_page: {
    banner_title: "Signature Private Tours of Bangladesh",
    banner_image: "",
    intro_heading_1: "Explore Bangladesh",
    intro_heading_2: "Beyond The Obvious",
    intro_paragraphs: [
      "Every journey with Roam Bengal is privately crafted, ethically grounded, and thoughtfully paced.",
      "From ancient capitals and river deltas to forested wetlands and living craft traditions, our tours are designed for travellers who value depth over speed, access over crowds, and stories over checklists.",
    ],
    intro_bold:
      "No strangers. No shopping detours. Just Bangladesh — appropriately experienced.",
  },

  /**
   * The pricing block on every tour page. The rates themselves live per-tour in
   * `tours.price_tiers`; everything here is the wording around them, which is policy copy
   * and has to read identically on every tour.
   */
  tour_pricing: {
    eyebrow: "Price Details",
    heading: "Choose Your Perfect Experience",
    subhead: "Flexible options for every kind of traveller",
    per_person_label: "USD / person",
    promises_heading: "Make It Yours — A Custom Itinerary For The Perfect Adventure",
    promises: [
      {
        icon: "shield",
        title: "Fair Pricing Promise",
        items: [
          "**Transparent inclusions:** all entry fees, rickshaw and boat rides are completely covered.",
          "**No hidden charges:** absolutely no forced “factory” visits or shopping commissions — ever.",
        ],
      },
      {
        icon: "calendar",
        title: "Free Rescheduling & Cancellation",
        items: [
          "**Easy rescheduling:** change your tour date with zero penalties up to 72 hours before departure.",
          "**Fair cancellation:** a 100% refund if you cancel 30+ days in advance. See our [cancellation policy](/policies/cancellation).",
        ],
      },
      {
        icon: "headset",
        title: "Fixed Departures Or B2B Tours?",
        items: [
          "Looking for scheduled group trips or custom corporate packages? Get in touch today and we will design your perfect itinerary.",
        ],
      },
    ],
    cta_heading: "Ready To Start Your Adventure?",
    cta_label: "Book This Tour Now",
    cta_footnote: "Free cancellation · No payment required today",
    /** The ticked reassurances in the sticky "Tour Cost" box in the tour page sidebar. */
    sidebar_promises: [
      "100% Exclusive Private Tours",
      "Fully Flexible & Customisable",
      "Transparent Pricing Promise",
      "Expert, Knowledgeable Guides",
      "No Shopping Detours, Ever",
      "Direct Booking Savings",
    ],
  },

  blog_page: {
    volume_label: "The Roam Bengal Journal — Vol. 04",
    // *…* renders as the reference masthead's italic orange phrase.
    heading: "Notes From The *Rivers, Hills* & Tea Gardens",
    subtext:
      "Field notes, guides, and honest advice from the boatmen and guides who call these routes home.",
    featured_eyebrow: "Featured Story",
    latest_heading: "Latest Stories",
    newsletter_heading: "Get New Stories In Your Inbox",
    newsletter_body:
      "No spam — just field notes and travel advice from Bangladesh, a few times a month.",
    newsletter_cta: "Subscribe",
    banner_image: "",
  },

  contact: {
    hero_eyebrow: "Get In Touch",
    banner_title: "Let's Plan Your Bangladesh Trip",
    hero_intro:
      "Questions about a tour, a custom itinerary, or just not sure where to start? Send us a message — a real guide replies within 24 hours, not a chatbot.",
    form_heading: "Send Us A Message",
    form_intro:
      "Tell us a bit about the trip you're picturing — dates, group size, must-sees — and we'll come back with a plan.",
    form_cta: "Send Message →",
    office_hours_label: "Office Hours",
    office_hours: "Sat – Thu, 9am – 7pm (BST)",
    email: "hello@roambengal.com",
    phone: "+880 1XXX-XXXXXX",
    address: "Gulshan, Dhaka, Bangladesh",
    registered_address: "Gulshan, Dhaka, Bangladesh",
    art_note: "Every message gets a real reply — usually the same day.",
    map_label: "Roam Bengal Office, Gulshan, Dhaka",
    map_embed: "",
    banner_image: "",
  },

  about: {
    eyebrow: "About Roam Bengal",
    heading_1: "Explore Bangladesh,",
    heading_2: "Told Honestly",
    intro_paragraphs: [
      "Roam Bengal is a small, dedicated team of local guides and planners passionate about crafting private journeys through Bangladesh's rivers, hills, and tea gardens.",
      "With deep roots in the regions we guide and a commitment to fair, transparent travel, every trip with us is built to be genuine — never staged, never rushed.",
    ],
    cta_label: "Find Your Journey →",
    cta_link: "/tours",
    hero_image: "",
    intro_strip:
      "A new journey begins with finding a destination that truly suits you. As international travel to Bangladesh grows each year, so does the need for operators who put safety, honesty, and local knowledge first. Roam Bengal was founded to close that gap — built by the boatmen, tea-garden guides, and hill-trekkers who call these routes home.",
    founder_eyebrow: "Meet the founder",
    founder_heading: "Travel is better when it feels",
    founder_heading_accent: "personal.",
    founder_paragraphs: [
      "Bangladesh is more than a destination to me. It is a collection of familiar roads, river crossings, tea gardens, and welcoming people that I want every curious traveller to experience with care.",
      "I started Roam Bengal to make that experience feel straightforward and human. Every journey is shaped around the people travelling, with enough room for unplanned conversations, local food, and the moments that never appear in a guidebook.",
      "Whether you are visiting for the first time or returning to see a different side of the country, my promise is simple: thoughtful planning, honest advice, and a warm welcome from start to finish.",
    ],
    founder_image: "",
    founder_name: "Arafat Rasul",
    founder_role: "Founder & local travel guide",
    stats: [
      { value: "40+", label: "Tours & Itineraries" },
      { value: "25+", label: "Outdoor Activities" },
      { value: "6", label: "Regions Covered" },
      { value: "6.5K+", label: "Happy Travellers" },
    ],
    mvv_kicker: "Your Ultimate Guide",
    mvv_heading: "To Explore Bangladesh",
    mvv_intro:
      "As more travellers discover Bangladesh each year, we stay focused on three things that never change.",
    pillars: [
      {
        icon: "🧭",
        title: "Mission",
        text: "Deliver honest, locally-led travel experiences to anyone curious about Bangladesh, from any corner of the world.",
      },
      {
        icon: "🌅",
        title: "Vision",
        text: "To become the trusted bridge between international travellers and the real, everyday Bangladesh.",
      },
      {
        icon: "🤝",
        title: "Values",
        text: "Fair pay for local guides, transparent pricing, and zero shopping-commission detours — always.",
      },
    ],
    why_kicker: "Why Choose Us",
    why_heading: "Why Travel With Roam Bengal",
    why_items: [
      {
        title: "Handpicked Destinations",
        text: "Only the best quality routes across Bangladesh, screened by people who travel them.",
      },
      {
        title: "Transparent Pricing",
        text: "What you are quoted is what you pay. Permits and entry fees included upfront.",
      },
      {
        title: "24/7 Customer Support",
        text: "English-speaking support for the whole time you are in the country.",
      },
      {
        title: "Expert Local Advice",
        text: "Guides local to the specific route, not generalists flown in for the week.",
      },
      {
        title: "Personalised Itineraries",
        text: "Every trip is private and reshaped around your pace and interests.",
      },
      {
        title: "Seamless Planning",
        text: "Visas, transfers, permits, and stays arranged before you land.",
      },
    ],
  },
} as const;

export type SiteDefaults = typeof siteDefaults;
