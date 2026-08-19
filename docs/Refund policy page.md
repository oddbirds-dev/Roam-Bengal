import PageHero from "@/components/PageHero";

import Footer from "@/components/Footer";

import WhatsAppFloat from "@/components/WhatsAppFloat";

export const metadata = {

title: "Refund Policy — Roam Bengal",

description:

"Roam Bengal's refund, cancellation, and rescheduling policy for private Bangladesh tours.",

};

const tiers = [

{

window: "30+ days before departure",

outcome: "Full refund",

detail: "100% of your payment returned, no questions asked.",

color: "#22B57A",

},

{

window: "15–29 days before departure",

outcome: "75% refund",

detail:

"A partial cancellation fee applies to cover guide and accommodation holds already made on your behalf.",

color: "#F2B705",

},

{

window: "7–14 days before departure",

outcome: "50% refund",

detail:

"At this point most local bookings (boats, homestays, permits) can no longer be released.",

color: "#F0791E",

},

{

window: "0–6 days before departure",

outcome: "No refund",

detail:

"We'll still try to help you reschedule where possible, but the tour cost is non-refundable this close to departure.",

color: "#C4390E",

},

];

const faqs = [

{

q: "Can I reschedule instead of cancelling?",

a: "Yes — free rescheduling is available up to 72 hours before your departure date, subject to guide and accommodation availability for the new dates.",

},

{

q: "What if Roam Bengal has to cancel the tour?",

a: "If we cancel due to safety concerns, severe weather, or an inability to deliver the itinerary as booked, you'll receive a full refund or the option to rebook for a later date, whichever you prefer.",

},

{

q: "Are deposits refundable?",

a: "Deposits follow the same tiered schedule above, calculated from the date your booking is confirmed to your original departure date.",

},

{

q: "How long does a refund take to process?",

a: "Approved refunds are issued to your original payment method within 7–10 business days.",

},

{

q: "Does this apply to add-ons and custom itineraries?",

a: "Yes, the same tiers apply to optional add-ons (like the extras listed on individual tour pages) and fully custom itineraries booked directly with us.",

},

];

export default function RefundPolicyPage() {

return (

<>

<PageHero

title="Refund & Cancellation Policy"

activeLabel="Refund Policy"

imageSrc="/images/refund-policy-banner.jpg"

imageAlt="Calm river in Bangladesh at dawn"

/>

<section className="px-10 py-16">

<div className="max-w-[900px] mx-auto">

<p className="text-base text-muted leading-relaxed mb-4">

We know travel plans change. Our refund policy is built around

one goal: being as fair to you as the local bookings we make on

your behalf will allow. Below is exactly what to expect if you

need to cancel.

</p>

<p className="text-base text-muted leading-relaxed">

Every quote and confirmation email also states these terms in

plain language before you pay a deposit — nothing here should be

a surprise.

</p>

</div>

</section>

<section className="px-10 pb-16">

<div className="max-w-[900px] mx-auto">

<h2 className="font-display text-2xl text-green mb-6">

Cancellation Tiers

</h2>

<div className="flex flex-col gap-4">

{tiers.map((tier) => (

<div

key={tier.window}

className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 bg-cream border border-rule rounded-2xl p-6"

>

<div

className="flex-none w-3 h-3 rounded-full md:mt-0 mt-1"

style={{ background: tier.color }}

/>

<div className="md:w-[220px] flex-none">

<div className="text-sm font-semibold text-ink">

{tier.window}

</div>

</div>

<div className="md:w-[140px] flex-none">

<div

className="font-display font-bold text-lg"

style={{ color: tier.color }}

>

{tier.outcome}

</div>

</div>

<p className="text-sm text-muted leading-relaxed">

{tier.detail}

</p>

</div>

))}

</div>

</div>

</section>

<section className="px-10 pb-16 bg-mint py-14">

<div className="max-w-[900px] mx-auto">

<h2 className="font-display text-2xl text-green mb-6">

Free Rescheduling

</h2>

<ul className="flex flex-col gap-3">

<li className="relative pl-6 text-sm text-ink leading-relaxed">

<span className="absolute left-0 top-0 text-green font-bold">

✓

</span>

Move your dates for free up to 72 hours before departure.

</li>

<li className="relative pl-6 text-sm text-ink leading-relaxed">

<span className="absolute left-0 top-0 text-green font-bold">

✓

</span>

Rescheduling doesn&rsquo;t restart your cancellation-tier

clock — it stays tied to your original departure date.

</li>

<li className="relative pl-6 text-sm text-ink leading-relaxed">

<span className="absolute left-0 top-0 text-green font-bold">

✓

</span>

One free reschedule per booking; a second change may carry a

small admin fee depending on the tour.

</li>

</ul>

</div>

</section>

<section className="px-10 py-16">

<div className="max-w-[900px] mx-auto">

<h2 className="font-display text-2xl text-green mb-6">

Frequently Asked Questions

</h2>

<div className="flex flex-col">

{faqs.map((item) => (

<div key={item.q} className="border-b border-rule py-5">

<h3 className="text-sm font-semibold text-ink mb-2">

{item.q}

</h3>

<p className="text-sm text-muted leading-relaxed">{item.a}</p>

</div>

))}

</div>

</div>

</section>

<section className="px-10 pb-20">

<div className="max-w-[900px] mx-auto bg-green-dark text-white rounded-2xl p-10 text-center">

<h2 className="font-display text-xl mb-3">

Need to cancel or change a booking?

</h2>

<p className="text-sm opacity-80 mb-6 max-w-[480px] mx-auto">

Message us directly and we&rsquo;ll confirm your refund amount or

help you find new dates — usually within a few hours.

</p>

<a href="#" className="btn btn-orange">

Contact Us on WhatsApp

</a>

</div>

</section>

<Footer />

<WhatsAppFloat />

</>

);

}