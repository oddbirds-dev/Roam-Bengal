import PageHero from "@/components/PageHero";

import Footer from "@/components/Footer";

import WhatsAppFloat from "@/components/WhatsAppFloat";

export const metadata = {

title: "Payment Policy — Roam Bengal",

description:

"How payments, deposits, and currency work when you book a private Bangladesh tour with Roam Bengal — clear pricing, no hidden fees.",

};

const methods = [

{

title: "International Cards",

detail: "Visa, Mastercard, and Amex, processed securely via Stripe.",

icon: "💳",

},

{

title: "Wise & Western Union",

detail: "International money transfer for guests who prefer it over a card.",

icon: "🌐",

},

{

title: "International Bank Transfer",

detail: "Available on request for select bookings.",

icon: "🏦",

},

{

title: "USD, EUR, or GBP",

detail: "Every invoice is issued in USD by default — equivalent EUR or GBP pricing is available on request.",

icon: "💱",

},

];

const deposit = [

{

title: "25% Deposit",

detail: "Confirms your private tour and locks in your dates.",

},

{

title: "75% Balance",

detail: "Due no later than 14 days before your tour start date.",

},

{

title: "Last-minute bookings",

detail: "For bookings made less than 14 days before departure, the full amount is due at confirmation.",

},

];

const confirmationSteps = [

"An official payment receipt sent to your email",

"A final confirmation with your complete booking details",

"A confirmation worth keeping as proof of your reservation",

];

export default function PaymentPolicyPage() {

return (

<>

<PageHero

title="Clear Payments, Fair Pricing"

activeLabel="Payment Policy"

imageSrc="/images/payment-policy-banner.jpg"

imageAlt="Rural Bangladesh landscape at sunset"

/>

<section className="px-10 py-16">

<div className="max-w-[900px] mx-auto">

<p className="text-sm font-semibold text-orange uppercase tracking-wide mb-3">

No hidden charges. No surprise fees.

</p>

<h2 className="font-display text-2xl text-green mb-4">

Just transparent, traveller-first payments.

</h2>

<p className="text-base text-muted leading-relaxed mb-4">

At Roam Bengal, we believe trust begins with clarity. Our payment

policy is built to be simple, secure, and completely

transparent, so you always know exactly what you&rsquo;re paying

for and why.

</p>

<p className="text-base text-muted leading-relaxed">

From private tours to fully custom itineraries, every payment

reflects fair local pricing and zero hidden costs — so you can

focus on the trip, not the fine print.

</p>

</div>

</section>

<section className="px-10 pb-16">

<div className="max-w-[900px] mx-auto">

<h2 className="font-display text-2xl text-green mb-4">

🔒 Secure &amp; Transparent Payments

</h2>

<p className="text-base text-muted leading-relaxed">

We keep the payment process straightforward. Every booking

confirmation includes a written breakdown of what&rsquo;s

included and what it costs, so there&rsquo;s never any guesswork

about what you&rsquo;re paying for.

</p>

</div>

</section>

<section className="px-10 pb-16 bg-mint py-14">

<div className="max-w-[900px] mx-auto">

<h2 className="font-display text-2xl text-green mb-8">

💰 Deposit &amp; Balance

</h2>

<div className="flex flex-col gap-5">

{deposit.map((d) => (

<div key={d.title} className="flex gap-5 items-start">

<div className="flex-none w-2.5 h-2.5 rounded-full bg-green mt-2" />

<div>

<h3 className="text-sm font-semibold text-ink mb-1">

{d.title}

</h3>

<p className="text-sm text-muted leading-relaxed">

{d.detail}

</p>

</div>

</div>

))}

</div>

</div>

</section>

<section className="px-10 py-16">

<div className="max-w-[900px] mx-auto">

<h2 className="font-display text-2xl text-green mb-6">

💳 Accepted Payment Methods

</h2>

<div className="grid md:grid-cols-2 gap-4">

{methods.map((m) => (

<div

key={m.title}

className="flex gap-4 items-start bg-cream border border-rule rounded-2xl p-6"

>

<span className="text-2xl flex-none">{m.icon}</span>

<div>

<h3 className="text-sm font-semibold text-ink mb-1">

{m.title}

</h3>

<p className="text-sm text-muted leading-relaxed">

{m.detail}

</p>

</div>

</div>

))}

</div>

</div>

</section>

<section className="px-10 py-16 bg-mint">

<div className="max-w-[900px] mx-auto">

<h2 className="font-display text-2xl text-green mb-6">

💱 Currency &amp; Conversion

</h2>

<ul className="flex flex-col gap-3">

<li className="relative pl-6 text-sm text-ink leading-relaxed">

<span className="absolute left-0 top-0 text-green font-bold">✓</span>

All prices are quoted in US Dollars (USD).

</li>

<li className="relative pl-6 text-sm text-ink leading-relaxed">

<span className="absolute left-0 top-0 text-green font-bold">✓</span>

If you pay in a different currency, conversion is based on the official exchange rate on the day of payment.

</li>

<li className="relative pl-6 text-sm text-ink leading-relaxed">

<span className="absolute left-0 top-0 text-green font-bold">✓</span>

Any transfer fees or bank charges from your side are the traveller&rsquo;s responsibility.

</li>

</ul>

</div>

</section>

<section className="px-10 py-16">

<div className="max-w-[900px] mx-auto">

<h2 className="font-display text-2xl text-green mb-6">

📝 Payment Confirmation

</h2>

<p className="text-sm text-muted mb-5">

Once we receive your payment, you&rsquo;ll receive:

</p>

<ol className="flex flex-col gap-3">

{confirmationSteps.map((step, i) => (

<li

key={step}

className="relative pl-9 text-sm text-ink leading-relaxed"

>

<span className="absolute left-0 top-0 w-6 h-6 rounded-full bg-green text-white text-xs font-bold flex items-center justify-center">

{i + 1}

</span>

{step}

</li>

))}

</ol>

</div>

</section>

<section className="px-10 py-16 bg-mint">

<div className="max-w-[900px] mx-auto">

<h2 className="font-display text-2xl text-green mb-4">

🔒 Secure Transactions

</h2>

<p className="text-base text-muted leading-relaxed">

All payments are processed through encrypted, verified platforms

to keep your information safe. Roam Bengal does not store or

share your payment details.

</p>

</div>

</section>

<section className="px-10 pb-20">

<div className="max-w-[900px] mx-auto bg-green-dark text-white rounded-2xl p-10 text-center">

<h2 className="font-display text-xl mb-3">

Questions about payment?

</h2>

<p className="text-sm opacity-80 mb-2 max-w-[480px] mx-auto">

📧 hello@roambengal.com

</p>

<p className="text-sm opacity-80 mb-6 max-w-[480px] mx-auto">

📱 WhatsApp: +880 1XXX-XXXXXX

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