"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next"; // ✅ translator
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import Logo from "../../public/images/One-Colis.png";
import LanguageSwitcher from "./LanguageSwitcher";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const { t } = useTranslation();

  const isArabic = locale === "ar"; // ✅ Detect Arabic

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        "https://cod-ecommerce-two.vercel.app/api/auth/login",
        { email, password }
      );

      const data = res.data;

      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      const role = data.data.user.role;

      // Redirect based on role
      if (role === "admin") {
        router.push(`/${locale}/admin`);
      } else if (role === "seller") {
        router.push(`/${locale}/thankyou`);
      } else if (role === "employee") {
        router.push(`/${locale}/employee`);
      } else {
        router.push(`/${locale}/login`);
      }
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || t("login.failed"));
      } else {
        setError(t("login.unexpected"));
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
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold text-gray-400">{t("login.title")}</h1>
                <p className="text-muted-foreground text-balance">
                  {t("login.subtitle")}
                </p>
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              {/* Email */}
              <div className="grid gap-3">
                {/* <Label htmlFor="email">{t("login.email")}</Label> */}
                <Input
                  id="email"
                  type="email"
                  placeholder={t("login.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="grid gap-3">
                {/* <Label htmlFor="password">{t("login.password")}</Label> */}
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={t("login.password")}
                />
              </div>

              <Button type="submit" className="w-full hover:bg-sky-400 bg-[#2BC3F1]" disabled={loading}>
                {loading ? t("login.loading") : t("login.button")}
              </Button>

              <div className="text-center text-sm">
                {t("login.noAccount")}{" "}
                <Link
                  href={`/${locale}/signup`}
                  className="underline underline-offset-4"
                >
                  {t("login.signup")}
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
    </div>
  );
}
