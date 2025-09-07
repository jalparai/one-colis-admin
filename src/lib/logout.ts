"use client";

import { useRouter, useParams } from "next/navigation";

export function useLogout() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const logout = async () => {
    try {
      // ✅ Call logout API
      const token = localStorage.getItem("token");
      await fetch("https://cod-ecommerce-two.vercel.app/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      // ✅ Clear storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // ✅ Redirect to login
      router.push(`/${locale}/login`);
    } catch (error) {
      console.error("Logout failed:", error);
      // Optionally still clear storage and redirect
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push(`/${locale}/login`);
    }
  };

  return { logout };
}
