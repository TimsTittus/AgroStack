"use client";

import { Search, Bell, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export function Navbar() {
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="glass sticky top-0 z-50 flex h-16 items-center justify-between px-6 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#2d6a4f] to-[#52b788] shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20h10" />
            <path d="M10 20c5.5-2.5.8-6.4 3-10" />
            <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
            <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-[#1a2e1a]">
          Agro<span className="text-[#2d6a4f]">Stack</span>
        </span>
      </div>

      <div className={`relative mx-8 hidden max-w-md flex-1 transition-all duration-300 md:block ${searchFocused ? "max-w-lg" : ""}`}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5c7a5c]" />
        <Input
          placeholder="Search crops, products, farmers..."
          className="h-10 rounded-full border-[#d4e7d0] bg-white/80 pl-10 pr-4 text-sm shadow-sm transition-all duration-300 placeholder:text-[#95d5b2] focus:bg-white focus:shadow-md"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/60 transition-all duration-200 hover:bg-[#e8f0e4] hover:shadow-md">
          <Bell className="h-\[18px] w-\[18px] text-[#5c7a5c] transition-colors group-hover:text-[#2d6a4f]" />
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-linear-to-r from-[#ff6b6b] to-[#ee5a24] text-[10px] font-bold text-white shadow-sm">
            3
          </span>
        </button>
        <button className="flex items-center gap-2.5 rounded-full bg-white/60 py-1.5 pl-1.5 pr-3 transition-all duration-200 hover:bg-[#e8f0e4] hover:shadow-md">
          <Avatar className="h-8 w-8 ring-2 ring-[#b7e4c7]">
            <AvatarImage src="https://avatars.githubusercontent.com/u/73917119?v=4" />
            <AvatarFallback className="bg-linear-to-br from-[#52b788] to-[#2d6a4f] text-xs font-semibold text-white">
              AT
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium text-[#1a2e1a] lg:inline">
            Abin Thomas
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[#5c7a5c]" />
        </button>
      </div>
    </header>
  );
}
