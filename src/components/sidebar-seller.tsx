"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import {
  BoxIcon,
  CalculatorIcon,
  FileIcon,
  HomeIcon,
  ListIcon,
  PackageIcon,
  TicketIcon,
  TruckIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../public/images/One-Colis.png";
import { cn } from "@/lib/utils";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useTranslation } from "react-i18next";

type NavItem = {
  title: string;
  titleKey?: string;
  url: string;
  icon: React.ComponentType<any>;
};

export function AppSidebarSeller({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || "en";

  const { t } = useTranslation();
  const isArabic = locale === "ar";

  const sellerSidebar: { navMain: NavItem[] } = {
    navMain: [
      {
        title: "Home",
        titleKey: "sellerSidebar.home",
        url: `/${locale}/seller`,
        icon: HomeIcon,
      },
      {
        title: "Orders",
        titleKey: "sellerSidebar.orders",
        url: `/${locale}/seller/Orders`,
        icon: ListIcon,
      },
      {
        title: "My Stocks",
        titleKey: "sellerSidebar.stocks",
        url: `/${locale}/seller/Stocks`,
        icon: BoxIcon,
      },
      {
        title: "Support",
        titleKey: "sellerSidebar.tickets",
        url: `/${locale}/seller/Tickets`,
        icon: TicketIcon,
      },
      {
        title: "My Pickups",
        titleKey: "sellerSidebar.myPickups",
        url: `/${locale}/seller/My-Pickups`,
        icon: TruckIcon,
      },
      {
        title: "Invoice",
        titleKey: "sellerSidebar.invoices",
        url: `/${locale}/seller/invoices`,
        icon: FileIcon,
      },
       {
        title: "Payouts",
        titleKey: "sellerSidebar.payout",
        url: `/${locale}/seller/payouts`,
        icon: FileIcon,
      },
      {
        title: "Delivery Collection",
        titleKey: "sellerSidebar.deliveryCollection",
        url: `/${locale}/seller/Delivery`,
        icon: PackageIcon,
      },
      {
        title: "Check City Fee",
        titleKey: "sellerSidebar.cityFee",
        url: `/${locale}/seller/City-Fee`,
        icon: CalculatorIcon,
      },
      {
        title: "Seller Reports",
        titleKey: "sellerSidebar.sellerReports",
        url: `/${locale}/seller/Seller-Reports`,
        icon: CalculatorIcon,
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <div dir={isArabic ? "rtl" : "ltr"} className="relative h-full">
        <SidebarContent className="pb-20">
          {/* Logo */}
          <div className="flex items-center justify-start py-6 px-3">
            <Link href={`/${locale}/seller/`}>
              <Image src={Logo} alt="Logo" className="w-40" priority />
            </Link>
          </div>

          {/* Navigation */}
          <nav
            className="space-y-1 px-3"
            aria-label={t("sellerSidebar.navigation", { defaultValue: "Main navigation" })}
          >
            {sellerSidebar.navMain.map((item) => {
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
