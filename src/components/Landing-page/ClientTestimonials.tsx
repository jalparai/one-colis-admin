"use client";

import Image from "next/image";

const testimonials = [
  {
    name: "Salma T",
    role: "Casablanca (Fashion Boutique)",
    image: "/client-profile-1.png",
    text: "We scaled from 30 to 200+ orders/month thanks to their bulk shipping tools. What used to take 3 hours now takes 15 minutes!",
  },
  {
    name: "Ahmed S.",
    role: "Agadir (Artisan Goods)",
    image:"/client-profile-2.png",
    text: "Finding reliable COD delivery for rural customers was impossible. Now we ship to every corner of Morocco with the same confidence as city orders.",
  },
  {
    name: "Youssef L",
    role: "Rabat (Electronics Store)",
    image:"/client-profile-3.png",
    text: "Before OneColis, I waited weeks for COD payments. Now I get paid the next day – my cash flow improved so much I could finally hire an assistant!",
  },
  {
    name: "Nadia B",
    role: "Fes (Beauty & Cosmetics)",
    image: "/client-profile-2.png",
    text: "The customer support is top-notch. Whenever I have a question, they’re quick and helpful. Love working with them!",
  },
  {
    name: "Karim E.",
    role: "Tangier (Home Decor)",
    image: "/client-profile-2.png",
    text: "Deliveries are always on time, and COD processing is fast. Game-changer for small businesses like mine.",
  },
  {
    name: "Laila M",
    role: "Marrakech (Handmade Goods)",
    image: "/client-profile-2.png",
    text: "We doubled our monthly orders within 2 months of switching. The analytics dashboard is super useful too.",
  },
];

export default function ClientTestimonials() {
  const repeated = [...testimonials, ...testimonials];

  return (
    <section className="bg-gray-50 py-16 overflow-hidden">
      <div className="w-[95%] lg:w-[90%] mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Clients Say</h2>
        <p className="text-lg text-gray-600 mb-12 w-[95%] lg:w-[90%] mx-auto">
          Real stories from real businesses. See how we’ve helped transform delivery,
          cash flow, and customer satisfaction for our partners across Morocco.
        </p>

        {/* Auto-scroll container */}
        <div className="relative overflow-hidden">
          <div className="flex space-x-6 animate-slide-slow px-1">
            {repeated.map((t, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-100 p-6 w-[320px] flex-shrink-0 relative"
              >
                <div className="flex items-center mb-4">
                  <Image
                    src={t.image}
                    alt={t.name}
                    width={50}
                    height={50}
                    className="rounded-full object-cover mr-4"
                  />
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed relative z-10">
                  <span className="text-3xl text-gray-300 absolute top-[-10px] left-[-10px] z-0">
                    &ldquo;
                  </span>
                  {t.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <button 
            className="bg-[#2BC3F1] m-auto hover:bg-sky-400 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 transition">
            Scale your business
          </button>
        </div>
      </div>

      {/* Inline CSS for animation */}
      <style jsx>{`
        @keyframes slide-slow {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-slide-slow {
          animation: slide-slow 60s linear infinite;
        }
      `}</style>
    </section>
  );
}
