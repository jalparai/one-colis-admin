"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import Logo from "../../../public/One-Colis.png"
import  LanguageSwitcher  from "../LanguageSwitcher"
export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
 <div className="border-b border-border bg-white sticky top-0 z-50">
   <header className="w-[90%] m-auto">
      <div className="container mx-auto lg:px-4 flex items-center justify-between h-20">
        {/* Logo */}
        <div className="flex">
          <Image src={Logo} alt="Logo" className="h-16 w-auto" />
          <div>
         <h1 className="text-3xl font-bold tracking-wide relative top-3 left-2">
  <span className="text-[#2BC3F1]">One</span>
  <span className="text-[#E0B660]">Colis</span>
</h1>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#process" className="text-gray-800 hover:text-foreground transition-colors">
            Process
          </a>
          <a href="#infrastructure" className="text-gray-800 hover:text-foreground transition-colors">
            Service
          </a>
          <a href="#dashboard" className="text-gray-800 hover:text-foreground transition-colors">
            Dashboard
          </a>
           <a href="#tracking" className="text-gray-800 hover:text-foreground transition-colors">
            Track Order
          </a>
           <a href="#pricing" className="text-gray-800 hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#contact" className="text-gray-800 hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>

        {/* CTA Button (Desktop only) */}
        <button 
            className="bg-[#2BC3F1] hover:bg-sky-600 lg:block hidden text-white px-6 py-3 rounded-full font-semibold  items-center gap-2 transition"
>          Get Started
        </button>
<LanguageSwitcher />
        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-muted"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <nav className="flex flex-col space-y-2 p-4">
          <a href="#process" className="text-gray-800 hover:text-foreground transition-colors"           onClick={() => setIsOpen(!isOpen)}
>
            Process
          </a>
          <a href="#infrastructure" className="text-gray-800 hover:text-foreground transition-colors"           onClick={() => setIsOpen(!isOpen)}
>
            Infrastructure
          </a>
          <a href="#dashboard" className="text-gray-800 hover:text-foreground transition-colors"           onClick={() => setIsOpen(!isOpen)}
>
            Dashboard
          </a>
           <a href="#tracking" className="text-gray-800 hover:text-foreground transition-colors"           onClick={() => setIsOpen(!isOpen)}
>
            Track Order
          </a>
           <a href="#pricing" className="text-gray-800 hover:text-foreground transition-colors"           onClick={() => setIsOpen(!isOpen)}
>
            Pricing
          </a>
          <a href="#contact" className="text-gray-800 hover:text-foreground transition-colors"           onClick={() => setIsOpen(!isOpen)}
>
            Contact
          </a>
            <button 
            className="bg-[#2BC3F1] hover:bg-sky-600  text-white px-6 py-3 rounded-full font-semibold  items-center gap-2 transition"
>              Get Started
            </button>
          </nav>
        </div>
      )}
    </header>
 </div>
  )
}
