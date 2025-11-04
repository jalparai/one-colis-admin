"use client"

import * as React from "react"
import { useParams, usePathname } from "next/navigation"
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
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"

import { Input } from "@/components/ui/input"
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
} from "lucide-react"

import Image from "next/image"
import Link from "next/link"
import Logo from "../../public/images/One-Colis.png"
import { NavUser } from "@/components/nav-user"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const pathname = usePathname()
  const locale = params.locale as string

  const [searchQuery, setSearchQuery] = React.useState("")

  const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
      {
        title: "Home",
        url: `/${locale}/admin`,
        icon: HomeIcon,
      },
      {
        title: "Employee",
        url: `/${locale}/admin/Employees`,
        icon: UserIcon,
      },
      {
        title: "Seller",
        url: `/${locale}/admin/Seller`,
        icon: UsersIcon,
      },
      {
        title: "Stocks",
        url: `/${locale}/admin/Stocks`,
        icon: PackageIcon,
      },
      {
        title: "Ware House",
        url: `/${locale}/admin/Warehouses`,
        icon: WarehouseIcon,
      },
      {
        title: "Delivery Agents",
        url: `/${locale}/admin/Delivery-Agents`,
        icon: TruckIcon,
      },
      {
        title: "Payout Manager",
        url: `/${locale}/admin/Payout-manager`,
        icon: WalletIcon,
      },
      {
        title: "Manages Pickup",
        url: `/${locale}/admin/Manages-Pickups`,
        icon: ClipboardListIcon,
      },
      {
        title: "City & Fee",
        url: `/${locale}/admin/City-Fee`,
        icon: MapPinIcon,
      },
      {
        title: "Orders",
        url: `/${locale}/admin/Order`,
        icon: ShoppingCartIcon,
      },
      {
        title: "Payouts",
        url: `/${locale}/admin/Payout`,
        icon: WalletIcon,
      },
      {
        title: "Invoices",
        url: `/${locale}/admin/Invoices`,
        icon: FileTextIcon,
      },
      {
        title: "Support Tickets",
        url: `/${locale}/admin/Support-Tickets`,
        icon: MessageCircleIcon,
      },
      {
        title: "Return & Delivery Notes",
        url: `/${locale}/admin/Return-Notes`,
        icon: FileTextIcon,
      },
      {
        title: "Report",
        url: `/${locale}/admin/Order`,
        icon: FileTextIcon,
        items: [
          { title: "Collected Pending", url: `/${locale}/admin/Collection-pending`, icon: BarChart3Icon },
          { title: "Delivered Returned", url: `/${locale}/admin/Delivered-Returned`, icon: BarChart3Icon },
          { title: "Top Sellers", url: `/${locale}/admin/Top-Sellers`, icon: BarChart3Icon },
          { title: "Top Agents", url: `/${locale}/admin/Top-Agents`, icon: BarChart3Icon },
          { title: "Average Delivery Time", url: `/${locale}/admin/Delivery-Time`, icon: BarChart3Icon },
          { title: "Top Products", url: `/${locale}/admin/Top-Products`, icon: BarChart3Icon },
          { title: "Revenue City", url: `/${locale}/admin/Revenue-City`, icon: BarChart3Icon },
          { title: "Stock Trend", url: `/${locale}/admin/Stock-Trend`, icon: BarChart3Icon },
          { title: "Payout History", url: `/${locale}/admin/Payout-History`, icon: BarChart3Icon },
          { title: "Financial Summary", url: `/${locale}/admin/Financial-Summary`, icon: BarChart3Icon },
        ],
      },
    ],
  }

  // ✅ Filtered menu based on search query
  const filteredNav = React.useMemo(() => {
    if (!searchQuery.trim()) return data.navMain

    return data.navMain
      .map((item) => {
        const hasChildren = item.items && item.items.length > 0
        if (hasChildren) {
          const filteredChildren = item.items.filter((sub) =>
            sub.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
          if (item.title.toLowerCase().includes(searchQuery.toLowerCase()) || filteredChildren.length > 0) {
            return { ...item, items: filteredChildren }
          }
          return null
        } else if (item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return item
        }
        return null
      })
      .filter(Boolean) as typeof data.navMain
  }, [searchQuery, data.navMain])

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center justify-start py-6 px-3">
          <Link href={`/${locale}/admin/`}>
            <Image src={Logo} alt="Logo" className="w-40" priority />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="px-3 mb-4">
          <Input
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {filteredNav.map((item) => {
              const isActive = pathname === item.url
              const hasChildren = item.items && item.items.length > 0

              if (!hasChildren) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              return (
                <Collapsible key={item.title} asChild defaultOpen={isActive} className="group/collapsible">
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
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
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
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with user info */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
