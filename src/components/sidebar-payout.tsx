"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import { IconWallet } from "@tabler/icons-react";
import { HomeIcon } from "lucide-react";
import { useTranslation } from "react-i18next"; // ✅ consistent with others

import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import Image from "next/image";
import Logo from "../../public/images/One-Colis.png";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppSidebarPayout({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;

  const { t } = useTranslation(); // ✅ use react-i18next

  const navItems = [
    {
      title: t("payoutSidebar.home"),
      url: `/${locale}/payout`,
      icon: HomeIcon,
    },
    {
      title: t("payoutSidebar.myPayout"),
      url: `/${locale}/payout/My-Payouts`,
      icon: IconWallet,
    },
  ];

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        {/* ✅ Logo Section */}
        <div className="flex items-center justify-start py-6">
          <Link href={`/${locale}/payout`}>
            <Image src={Logo} alt="Logo" className="w-40" priority />
          </Link>
        </div>

        {/* ✅ Navigation Links */}
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.title}
                href={item.url}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  isActive
                    ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
                    : "text-gray-600 dark:text-gray-300"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </SidebarContent>

      {/* ✅ Footer with User Info */}
      <SidebarFooter className="absolute bottom-0 left-0 w-full border-t bg-white dark:bg-gray-900 px-3 py-3">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
