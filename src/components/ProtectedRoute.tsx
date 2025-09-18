"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation"; // ✅ get current path

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[]; // optional: restrict by role
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const locale = (params?.locale as string) || "en"; // fallback to 'en'
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push(`/${locale}/login`); // 🔹 redirect to login if not authenticated
      return;
    }

    const parsedUser = JSON.parse(user);
    if (allowedRoles && !allowedRoles.includes(parsedUser.role)) {
      router.push(`/${locale}/login`); // 🔹 redirect if role not allowed
      return;
    }

    setIsAuthorized(true);
  }, [router, allowedRoles, locale]);

  if (!isAuthorized) return null; // optional: loading spinner here

  return <>{children}</>;
}
