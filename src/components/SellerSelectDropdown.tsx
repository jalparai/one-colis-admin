"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SellerSelectDropdownProps {
  sellers: { id: string; name: string }[]
  selectedSellerId: string | null
  onSellerChange: (sellerId: string) => void
  placeholder?: string
}

export function SellerSelectDropdown({
  sellers,
  selectedSellerId,
  onSellerChange,
  placeholder = "Select a seller...",
}: SellerSelectDropdownProps) {
  const [open, setOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")

  const filteredSellers = useMemo(() => {
    if (!searchInput.trim()) return sellers
    const query = searchInput.toLowerCase()
    return sellers.filter((seller) => seller.name.toLowerCase().includes(query))
  }, [sellers, searchInput])

  const selectedSellerName = sellers.find((s) => s.id === selectedSellerId)?.name

  const handleSelect = (sellerId: string) => {
    onSellerChange(sellerId)
    setOpen(false)
    setSearchInput("")
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Select Seller</label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-transparent"
          >
            <span className="truncate">{selectedSellerName || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start">
          <div className="p-2 space-y-2">
            <Input
              placeholder="Search seller..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-8"
              autoFocus
            />

            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredSellers.length > 0 ? (
                filteredSellers.map((seller) => (
                  <button
                    key={seller.id}
                    onClick={() => handleSelect(seller.id)}
                    className={cn(
                      "w-full text-left px-2 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between",
                      selectedSellerId === seller.id && "bg-accent text-accent-foreground",
                    )}
                  >
                    <span>{seller.name}</span>
                    {selectedSellerId === seller.id && <Check className="h-4 w-4" />}
                  </button>
                ))
              ) : (
                <div className="px-2 py-2 text-sm text-muted-foreground text-center">No sellers found</div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <p className="text-xs text-gray-500 dark:text-gray-400">Type to search or click to select from the dropdown</p>
    </div>
  )
}
