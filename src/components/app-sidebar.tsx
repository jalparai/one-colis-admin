"use client"

import * as React from "react"
import { useParams, usePathname } from "next/navigation" // ✅ get current path
import {
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconListDetails,
  IconUsers,
} from "@tabler/icons-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar"
import Image from "next/image"
import Logo from "../../public/images/One-Colis.png"
import Link from "next/link"
import { cn } from "@/lib/utils" 
import { HomeIcon, PersonStandingIcon, Warehouse } from "lucide-react"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const params = useParams()
  const pathname = usePathname()
  const locale = params.locale as string 

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
        icon: PersonStandingIcon,
      },
      {
        title: "Seller",
        url: `/${locale}/admin/Seller`,
        icon: IconUsers,
      },
      {
        title: "Ware House",
        url: `/${locale}/admin/Warehouses`,
        icon: Warehouse,
      },
      {
        title: "Delivery Agents",
        url: `/${locale}/admin/Delivery-Agents`,
        icon: IconFolder,
      },
      {
        title: "Payout Management",
        url: `/${locale}/admin/Payout-manager`,
        icon: IconUsers,
      },
        {
        title: "Orders",
        url: `/${locale}/admin/Order`,
        icon: IconUsers,
      },
    ],
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent>
        {/* ✅ Logo */}
        <div className="flex items-center justify-start py-6">
      <Link href={`/${locale}/admin/`}>
                  <Image src={Logo} alt="Logo" className="w-40" priority />

      </Link>
          
        </div>

        {/* ✅ Main Nav */}
        <nav className="space-y-1 px-3">
          {data.navMain.map((item) => {
            const isActive = pathname === item.url
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
            )
          })}
        </nav>
      </SidebarContent>

      {/* ✅ Footer with user info */}
  <SidebarFooter>
<NavUser/>
</SidebarFooter>
    </Sidebar>
  )
}
