"use client";

import { useTranslation } from "react-i18next";
import { CheckCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

// ✅ generateStaticParams for static export

export function ThankYouPage({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";  const { t } = useTranslation("common");

  return (
    <section className="relative h-[100vh] w-full flex items-center justify-center bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 text-white">
      <div className="text-center px-6">
        <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6 animate-bounce" />

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {t("thankYouPage.title")}
        </h1>

        <p className="text-lg md:text-xl max-w-xl mx-auto text-gray-100 mb-6">
          {t("thankYouPage.message")}
        </p>

     <button
  onClick={() => (window.location.href = `/${locale}/`)}
  className="bg-[#dbb160] hover:bg-yellow-500 text-white px-6 py-3 rounded-full font-semibold transition shadow-md"
>
  {t("thankYouPage.backToHome")}
</button>

      </div>
    </section>
  );
}
