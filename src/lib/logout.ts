"use client";

import { useRouter, useParams } from "next/navigation";

export function useLogout() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const logout = () => {
    // ✅ Clear storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // ✅ Redirect to login
    router.push(`/${locale}/login`);
  };

  return { logout };
}
