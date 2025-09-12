"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import Logo from "../../public/images/One-Colis.png";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  // 🔹 States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const role = "seller"; // fixed role
  const [phoneNumber, setPhoneNumber] = useState("");
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
          phoneNumber,
          storeName,
          estimatedMonthlyOrders,
          isCurrentlySellingOnline,
        }
      );

      const data = res.data;

      // ✅ Store token & user in localStorage
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      setSuccess("Signup successful! Redirecting...");

      setTimeout(() => {
        router.push(`/${locale}/thankyou`);
      }, 1500);
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Signup failed");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create Your Account</h1>
        <p className="text-xs text-gray-500 leading-snug mt-1">
  Please fill in all required information to complete your signup. Accurate details
  will help us verify your seller account quickly.
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
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              {/* Email */}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* Password */}
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {/* Phone Number */}
              <Input
                type="text"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />

              {/* Store Name */}
              <Input
                type="text"
                placeholder="Store Name"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
              />

              {/* Estimated Monthly Orders */}
              <Input
                type="number"
                placeholder="Estimated Monthly Orders"
                value={estimatedMonthlyOrders}
                onChange={(e) => setEstimatedMonthlyOrders(e.target.value)}
                required
              />

              {/* Currently Selling Online */}
             {/* Currently Selling Online */}
<div className="flex flex-col gap-2">
  <p className="text-sm text-gray-600">Currently selling online?</p>
  <div className="flex gap-6">
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="isCurrentlySellingOnline"
        value="yes"
        checked={isCurrentlySellingOnline === true}
        onChange={() => setIsCurrentlySellingOnline(true)}
      />
      Yes
    </label>
    <label className="flex items-center gap-2">
      <input
        type="radio"
        name="isCurrentlySellingOnline"
        value="no"
        checked={isCurrentlySellingOnline === false}
        onChange={() => setIsCurrentlySellingOnline(false)}
      />
      No
    </label>
  </div>
</div>


              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing up..." : "Signup"}
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  href={`/${locale}/login`}
                  className="underline underline-offset-4"
                >
                  Login
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
        By clicking continue, you agree to our{" "}
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
