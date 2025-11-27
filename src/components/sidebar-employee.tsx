// ---------------------------------------------------------------------------
// SidebarEmployee.tsx (Corrected Permission Usage)
// ---------------------------------------------------------------------------
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

export function AppSidebarEmployee(props: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params?.locale as string) || "en";
  const { t } = useTranslation();
  const isArabic = locale === "ar";

  const [employee, setEmployee] = React.useState({
    name: "",
    email: "",
    customRole: "",
    permissions: {
      addStock: false,
      supportOperations: false,
      manageOrders: false,
      scanOrders: false,
      assignOrders: false,
      assignPickups: false,
      assignProducts: false,
      assignPayouts: false,
      SupportTick: false,
      managePickups: false,
      manageSellers: false,
      manageInvoices: false,
      manageWarehouse: false,
      manageDeliveryAgents: false,
    },
  });

  // Load employee from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("employee");
    if (stored) {
      try {
        setEmployee(JSON.parse(stored));
      } catch {
        console.warn("Failed to parse employee from localStorage");
      }
    }
  }, []);

  // Generate sidebar links based on employee permissions
  const employeeSidebar = React.useMemo(() => {
    const navItems = [
      {
        title: "Home",
        titleKey: "employeeSidebar.home",
        url: `/${locale}/employee`,
        icon: HomeIcon,
      },
      employee.permissions.manageSellers && {
        title: "Sellers",
        titleKey: "employeeSidebar.sellers",
        url: `/${locale}/employee/Sellers`,
        icon: IconUsers,
      },
      employee.permissions.managePickups && {
        title: "Manage Pickups",
        titleKey: "employeeSidebar.managePickups",
        url: `/${locale}/employee/Manage-Pickups`,
        icon: ClipboardListIcon,
      },
      employee.permissions.manageOrders && {
        title: "Orders",
        titleKey: "employeeSidebar.orders",
        url: `/${locale}/employee/Orders`,
        icon: IconList,
      },
      employee.permissions.manageDeliveryAgents && {
        title: "Delivery Agents",
        titleKey: "employeeSidebar.deliveryAgents",
        url: `/${locale}/employee/Delivery-Agent`,
        icon: IconTruck,
      },
      employee.permissions.manageWarehouse && {
        title: "Warehouse",
        titleKey: "employeeSidebar.warehouses",
        url: `/${locale}/employee/Ware-House`,
        icon: IconBuildingStore,
      },
      employee.permissions.addStock && {
        title: "Stocks",
        titleKey: "employeeSidebar.stocks",
        url: `/${locale}/employee/Stocks`,
        icon: IconBox,
      },
      employee.permissions.assignPayouts && {
        title: "Payout Manager",
        titleKey: "employeeSidebar.payoutManager",
        url: `/${locale}/employee/Payout-manager`,
        icon: IconWallet,
      },
      employee.permissions.assignPayouts && {
        title: "Payout",
        titleKey: "employeeSidebar.payout",
        url: `/${locale}/employee/Payout`,
        icon: IconCreditCard,
      },
      employee.permissions.SupportTick && {
        title: "Tickets",
        titleKey: "employeeSidebar.tickets",
        url: `/${locale}/employee/Support-Tickets`,
        icon: IconTicket,
      },
      employee.permissions.manageInvoices && {
        title: "Invoices",
        titleKey: "employeeSidebar.invoices",
        url: `/${locale}/employee/Invoices`,
        icon: IconList,
      },
    ].filter(Boolean);

    return { navMain: navItems };
  }, [employee, locale]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <div dir={isArabic ? "rtl" : "ltr"} className="relative h-full">
        <SidebarContent className="pb-20">
          <div className="flex items-center justify-start py-6 px-3">
            <Link href={`/${locale}/employee`}>
              <Image src={Logo} alt="Logo" className="w-40" priority />
            </Link>
          </div>

          <nav className="space-y-1 px-3">
            {employeeSidebar.navMain
              // filter out falsy values and narrow type
              .filter((item): item is Exclude<typeof item, false> => Boolean(item))
              .map((item) => {
                const active = pathname?.startsWith(item.url);

                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-white"
                        : "text-gray-600 dark:text-gray-300"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{t(item.titleKey, { defaultValue: item.title })}</span>
                  </Link>
                );
              })}
          </nav>

        </SidebarContent>

        <SidebarFooter className="absolute bottom-0 left-0 w-full border-t bg-white dark:bg-gray-900 px-3 py-3">
          <NavUser />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
