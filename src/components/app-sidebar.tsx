"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import { Input } from "@/components/ui/input";
import {
  HomeIcon,
  UsersIcon,
  UserIcon,
  PackageIcon,
  WarehouseIcon,
  TruckIcon,
  WalletIcon,
  MapPinIcon,
  ShoppingCartIcon,
  MessageCircleIcon,
  BarChart3Icon,
  ChevronRight,
  ClipboardListIcon,
  FileTextIcon,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import Logo from "../../public/images/One-Colis.png";
import { NavUser } from "@/components/nav-user";
import { useTranslation } from "react-i18next";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;

  const { t } = useTranslation("common");
  // parent namespace to avoid collisions with other pages
  const ns = "admin.sidebar";
  const s = (k: string) => `${ns}.${k}`;

  const [searchQuery, setSearchQuery] = React.useState("");

  // NOTE: use translated titles here so search/filter works against visible strings
  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: t(s("nav.home")),
        url: `/${locale}/admin`,
        icon: HomeIcon,
      },
      {
        title: t(s("nav.employee")),
        url: `/${locale}/admin/Employees`,
        icon: UserIcon,
      },
      {
        title: t(s("nav.seller")),
        url: `/${locale}/admin/Seller`,
        icon: UsersIcon,
      },
      {
        title: t(s("nav.stocks")),
        url: `/${locale}/admin/Stocks`,
        icon: PackageIcon,
      },
      {
        title: t(s("nav.warehouses")),
        url: `/${locale}/admin/Warehouses`,
        icon: WarehouseIcon,
      },
      {
        title: t(s("nav.deliveryAgents")),
        url: `/${locale}/admin/Delivery-Agents`,
        icon: TruckIcon,
      },
      {
        title: t(s("nav.payoutManager")),
        url: `/${locale}/admin/Payout-manager`,
        icon: WalletIcon,
      },
      {
        title: t(s("nav.managesPickup")),
        url: `/${locale}/admin/Manages-Pickups`,
        icon: ClipboardListIcon,
      },
      {
        title: t(s("nav.cityFee")),
        url: `/${locale}/admin/City-Fee`,
        icon: MapPinIcon,
      },
      {
        title: t(s("nav.orders")),
        url: `/${locale}/admin/Order`,
        icon: ShoppingCartIcon,
      },
      {
        title: t(s("nav.payouts")),
        url: `/${locale}/admin/Payout`,
        icon: WalletIcon,
      },
      {
        title: t(s("nav.invoices")),
        url: `/${locale}/admin/Invoices`,
        icon: FileTextIcon,
      },
      {
        title: t(s("nav.supportTickets")),
        url: `/${locale}/admin/Support-Tickets`,
        icon: MessageCircleIcon,
      },
      {
        title: t(s("nav.returnNotes")),
        url: `/${locale}/admin/Return-Notes`,
        icon: FileTextIcon,
      },
      {
        title: t(s("nav.report.title")),
        url: `/${locale}/admin/Order`,
        icon: FileTextIcon,
        items: [
          { title: t(s("nav.report.collectedPending")), url: `/${locale}/admin/Collection-pending`, icon: BarChart3Icon },
          { title: t(s("nav.report.deliveredReturned")), url: `/${locale}/admin/Delivered-Returned`, icon: BarChart3Icon },
          { title: t(s("nav.report.topSellers")), url: `/${locale}/admin/Top-Sellers`, icon: BarChart3Icon },
          { title: t(s("nav.report.topAgents")), url: `/${locale}/admin/Top-Agents`, icon: BarChart3Icon },
          { title: t(s("nav.report.avgDeliveryTime")), url: `/${locale}/admin/Delivery-Time`, icon: BarChart3Icon },
          { title: t(s("nav.report.topProducts")), url: `/${locale}/admin/Top-Products`, icon: BarChart3Icon },
          { title: t(s("nav.report.revenueCity")), url: `/${locale}/admin/Revenue-City`, icon: BarChart3Icon },
          { title: t(s("nav.report.stockTrend")), url: `/${locale}/admin/Stock-Trend`, icon: BarChart3Icon },
          { title: t(s("nav.report.payoutHistory")), url: `/${locale}/admin/Payout-History`, icon: BarChart3Icon },
          { title: t(s("nav.report.financialSummary")), url: `/${locale}/admin/Financial-Summary`, icon: BarChart3Icon },
        ],
      },
    ],
  };

  // Filtered menu based on search query (search against translated titles)
  const filteredNav = React.useMemo(() => {
    if (!searchQuery.trim()) return data.navMain;

    return data.navMain
      .map((item) => {
        const hasChildren = item.items && item.items.length > 0;
        if (hasChildren) {
          const filteredChildren = item.items!.filter((sub) =>
            sub.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || filteredChildren.length > 0) {
            return { ...item, items: filteredChildren };
          }
          return null;
        } else if (item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return item;
        }
        return null;
      })
      .filter(Boolean) as typeof data.navMain;
  }, [searchQuery, data.navMain]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center justify-start py-6 px-3">
          <Link href={`/${locale}/admin/`}>
            <Image src={Logo} alt={t(s("ui.logoAlt"))} className="w-40" priority />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="px-3 mb-4">
          <Input
            placeholder={t(s("ui.searchPlaceholder"))}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {filteredNav.map((item) => {
              const isActive = pathname === item.url;
              const hasChildren = item.items && item.items.length > 0;

              if (!hasChildren) {
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              return (
<Collapsible key={`${item.url}::${item.title}`} asChild defaultOpen={isActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items!.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.url}>
                            <SidebarMenuSubButton asChild>
                              <Link href={subItem.url}>
                                <subItem.icon className="h-5 w-5 shrink-0" />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with user info */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
