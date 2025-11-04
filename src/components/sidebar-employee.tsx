"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import {
  IconList,
  IconTruck,
  IconBuildingStore,
  IconBox,
  IconWallet,
  IconCreditCard,
  IconTicket,
  IconUsers,
} from "@tabler/icons-react";
import { ClipboardListIcon, HomeIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import { NavUser } from "@/components/nav-user";
import { cn } from "@/lib/utils";
import Logo from "../../public/images/One-Colis.png";

export function AppSidebarEmployee({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || "en";

  const { t } = useTranslation();
  const isArabic = locale === "ar";

  // ✅ Employee state (from localStorage)
  const [employee, setEmployee] = React.useState<{
    name: string;
    email: string;
    customRole: string;
    permissions: {
      addStock: boolean;
      manageOrders: boolean;
      assignOrders: boolean;
      assignProducts: boolean;
      assignPayouts: boolean;
      SupportTick: boolean;
      managePickups: boolean;
    };
  }>({
    name: "",
    email: "",
    customRole: "",
    permissions: {
      addStock: false,
      manageOrders: false,
      assignOrders: false,
      assignProducts: false,
      assignPayouts: false,
      SupportTick: false,
      managePickups: false,
    },
  });

  React.useEffect(() => {
    const stored = localStorage.getItem("employee");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEmployee(parsed);
      } catch (err) {
        console.error("Error parsing employee data:", err);
      }
    }
  }, []);

  // ✅ Build navigation dynamically
  const employeeSidebar = React.useMemo(() => {
    const baseNav = [
      {
        title: "Home",
        titleKey: "employeeSidebar.home",
        url: `/${locale}/employee`,
        icon: HomeIcon,
      },
      {
        title: "Sellers",
        titleKey: "employeeSidebar.sellers",
        url: `/${locale}/employee/Sellers`,
        icon: IconUsers,
      },
      ...(employee.permissions.managePickups
        ? [
            {
              title: "Manage Pickups",
              titleKey: "employeeSidebar.managePickups",
              url: `/${locale}/employee/Manage-Pickups`,
              icon: ClipboardListIcon,
            },
          ]
        : []),
      ...(employee.permissions.managePickups
        ? [
            {
              title: "Orders",
              titleKey: "employeeSidebar.orders",
              url: `/${locale}/employee/Orders`,
              icon: IconList,
            },
          ]
        : []),
      {
        title: "Delivery Agents",
        titleKey: "employeeSidebar.deliveryAgents",
        url: `/${locale}/employee/Delivery-Agent`,
        icon: IconTruck,
      },
      {
        title: "Ware Houses",
        titleKey: "employeeSidebar.warehouses",
        url: `/${locale}/employee/Ware-House`,
        icon: IconBuildingStore,
      },
      ...(employee.permissions.addStock
        ? [
            {
              title: "Stocks",
              titleKey: "employeeSidebar.stocks",
              url: `/${locale}/employee/Stocks`,
              icon: IconBox,
            },
          ]
        : []),
      {
        title: "Payout Manager",
        titleKey: "employeeSidebar.payoutManager",
        url: `/${locale}/employee/Payout-manager`,
        icon: IconWallet,
      },
      {
        title: "Payout",
        titleKey: "employeeSidebar.payout",
        url: `/${locale}/employee/Payout`,
        icon: IconCreditCard,
      },
      ...(employee.permissions.SupportTick
        ? [
            {
              title: "Tickets",
              titleKey: "employeeSidebar.tickets",
              url: `/${locale}/employee/Support-Tickets`,
              icon: IconTicket,
            },
          ]
        : []),
    ];

    return { navMain: baseNav };
  }, [employee, locale]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <div dir={isArabic ? "rtl" : "ltr"} className="relative h-full">
        <SidebarContent className="pb-20">
          {/* ✅ Logo */}
          <div className="flex items-center justify-start py-6 px-3">
            <Link href={`/${locale}/employee`}>
              <Image src={Logo} alt="Logo" className="w-40" priority />
            </Link>
          </div>

          {/* ✅ Main Navigation */}
          <nav
            className="space-y-1 px-3"
            aria-label={t("employeeSidebar.navigation", { defaultValue: "Main navigation" })}
          >
            {employeeSidebar.navMain.map((item) => {
              const normalizedPath = pathname?.split("?")[0] ?? "";
              const isActive =
                normalizedPath === item.url ||
                normalizedPath.startsWith(item.url + "/") ||
                normalizedPath === item.url + "/";

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
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.titleKey ? t(item.titleKey, { defaultValue: item.title }) : item.title}</span>
                </Link>
              );
            })}
          </nav>
        </SidebarContent>

        {/* ✅ Fixed Footer */}
        <SidebarFooter className="absolute bottom-0 left-0 w-full border-t bg-white dark:bg-gray-900 px-3 py-3">
          <NavUser />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
