"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import Logo from "../../public/images/One-Colis.png"
export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await axios.post("https://cod-ecommerce-two.vercel.app/api/auth/register", {
        name,
        email,
        password,
      });

      const data = res.data;

      // ✅ Store token & user in localStorage
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));

      setSuccess("Signup successful! Redirecting...");

      // ✅ Redirect after signup (to dashboard or login)
      setTimeout(() => {
        router.push(`/${locale}/login`);
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
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-muted-foreground text-balance">
                  Signup to your Acme Inc account
                </p>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              {success && <p className="text-green-600 text-sm text-center">{success}</p>}

              <div className="grid gap-3">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

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
              className=" inset-0 h-auto w-[200px] block object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground text-center text-xs">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
