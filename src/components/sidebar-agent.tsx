"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import { FileIcon, HomeIcon, ListIcon } from "lucide-react";
import { useTranslation } from "react-i18next"; // ✅ consistent with others

import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import Image from "next/image";
import Logo from "../../public/images/One-Colis.png";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function AppSidebarAgent({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;

  const { t } = useTranslation();

  const agentSidebar = {
    navMain: [
      {
        title: t("agentSidebar.home", { defaultValue: "Home" }),
        url: `/${locale}/agent`,
        icon: HomeIcon,
      },
      {
        title: t("agentSidebar.myOrders", { defaultValue: "My Orders" }),
        url: `/${locale}/agent/My-Orders`,
        icon: ListIcon,
      },
       {
        title: t("agentSidebar.returnNote", { defaultValue: "Return-Notes" }),
        url: `/${locale}/agent/Return-Notes`,
        icon: FileIcon,
      },
       {
        title: t("agentSidebar.returnNote", { defaultValue: "My-Pickups" }),
        url: `/${locale}/agent/My-Pickups`,
        icon: ListIcon,
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        {/* ✅ Logo */}
        <div className="flex items-center justify-start py-6 px-3">
          <Link href={`/${locale}/agent`}>
            <Image src={Logo} alt="Logo" className="w-40" priority />
          </Link>
        </div>

        {/* ✅ Navigation */}
        <nav
          className="space-y-1 px-3"
          aria-label={t("agentSidebar.navigation", { defaultValue: "Main navigation" })}
        >
          {agentSidebar.navMain.map((item) => {
            const isActive = pathname === item.url;
            return (
              <Link
                key={item.url}
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

      {/* ✅ Footer fixed at bottom */}
      <SidebarFooter className="absolute bottom-0 left-0 w-full border-t bg-white dark:bg-gray-900 px-3 py-3">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
