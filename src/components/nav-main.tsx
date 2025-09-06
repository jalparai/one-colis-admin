"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

export function NavMain({ items }: { items: any[] }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => (
        <Link
          key={item.title}
          href={item.url}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.title}
        </Link>
      ))}
    </nav>
  )
}
