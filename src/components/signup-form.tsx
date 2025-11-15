"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next"; // ✅ import translator
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import Logo from "../../public/images/One-Colis.png";
import LanguageSwitcher from "./LanguageSwitcher";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { t, i18n } = useTranslation(); // ✅ add i18n
  const isArabic = i18n.language === "ar"; // ✅ check if Arabic

  // 🔹 States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const role = "seller";
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");

  const [storeName, setStoreName] = useState("");
  const [estimatedMonthlyOrders, setEstimatedMonthlyOrders] = useState("");
  const [isCurrentlySellingOnline, setIsCurrentlySellingOnline] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 🔹 Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://cod-ecommerce-two.vercel.app/api/auth/register",
        {
          name,
          email,
          password,
          role,
          city,
          phoneNumber,
          storeName,
          estimatedMonthlyOrders: Number(estimatedMonthlyOrders),
          isCurrentlySellingOnline,
        }
      );

      const data = res.data;

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      setSuccess(t("signup.success"));

      router.push(`/${locale}/thankyou`);
    } catch (err: any) {
      console.error("Signup error:", err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || t("signup.failed"));
      } else {
        setError(t("signup.unexpected"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={isArabic ? "rtl" : "ltr"} // ✅ RTL support
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="w-[100%] flex justify-end">
        <LanguageSwitcher />
      </div>

      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* ✅ RTL will affect input placeholders, labels, etc. */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl text-gray-500 font-bold">{t("signup.title")}</h1>
                <p className="text-xs text-gray-500 leading-snug mt-1">
                  {t("signup.subtitle")}
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              {success && (
                <p className="text-green-600 text-sm text-center">{success}</p>
              )}

              {/* Name */}
              <Input
                type="text"
                placeholder={t("signup.name")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* Email */}
              <Input
                type="email"
                placeholder={t("signup.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Password */}
              <Input
                type="password"
                placeholder={t("signup.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Phone Number */}
              <Input
                type="text"
                placeholder={t("signup.phone")}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />

              {/* City */}
              <Input
                type="text"
                placeholder={t("signup.city")}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />

              {/* Store Name */}
              <Input
                type="text"
                placeholder={t("signup.storeName")}
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />

              {/* Estimated Monthly Orders */}
              <Input
                type="number"
                placeholder={t("signup.monthlyOrders")}
                value={estimatedMonthlyOrders}
                onChange={(e) => setEstimatedMonthlyOrders(e.target.value)}
                required
              />

              {/* Currently Selling Online */}
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">
                  {t("signup.sellingOnline")}
                </p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                    <input
                      type="radio"
                      name="isCurrentlySellingOnline"
                      value="yes"
                      checked={isCurrentlySellingOnline === true}
                      onChange={() => setIsCurrentlySellingOnline(true)}
                    />
                    {t("common.yes")}
                  </label>
                  <label className="flex items-center gap-2 lg:overflow-auto overflow-x-scroll">
                    <input
                      type="radio"
                      name="isCurrentlySellingOnline"
                      value="no"
                      checked={isCurrentlySellingOnline === false}
                      onChange={() => setIsCurrentlySellingOnline(false)}
                    />
                    {t("common.no")}
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full hover:bg-sky-400 bg-[#2BC3F1]" disabled={loading}>
                {loading ? t("signup.loading") : t("signup.button")}
              </Button>

              <div className="text-center text-sm">
                {t("signup.alreadyHave")}{" "}
                <Link
                  href={`/${locale}/login`}
                  className="underline underline-offset-4"
                >
                  {t("signup.login")}
                </Link>
              </div>
            </div>
          </form>

          {/* Side Image */}
          <div className="bg-muted relative hidden md:flex justify-center items-center">
            <Image
              src={Logo}
              alt="Image"
              className="inset-0 h-auto w-[200px] block object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground text-center text-xs">
        {t("signup.agreement")}{" "}
        <a href="#">{t("signup.terms")}</a> {t("common.and")}{" "}
        <a href="#">{t("signup.privacy")}</a>.
      </div>
    </div>
  );
}
