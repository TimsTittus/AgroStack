"use client";

import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import GoogleTranslate from "./GoogleTranslate";
import LanguageSwitcher from "./LanguageSwitcher";
import { authClient, signOut } from "@/lib/auth-client";
import { AgroStackLogo } from "./AgroStackLogo";

export function Navbar() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;
  const userName = user?.name ?? "User";
  const userEmail = user?.email ?? "";
  const userImage = user?.image ?? "";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header className="glass sticky top-0 z-50 flex h-16 items-center justify-between px-6 transition-all duration-300">
      <div className="flex items-center gap-3">
        <AgroStackLogo size={32} showText={true} />
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
        <div className="flex justify-end gap-4 p-4">
          <GoogleTranslate />
          <LanguageSwitcher />
        </div>

        {/* User profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          {isPending ? (
            <div className="flex items-center gap-2.5 rounded-full bg-white/60 py-1.5 pl-1.5 pr-3">
              <div className="h-8 w-8 animate-pulse rounded-full bg-[#d4e7d0]" />
              <div className="hidden lg:flex lg:flex-col lg:items-start gap-1">
                <div className="h-3.5 w-24 animate-pulse rounded-md bg-[#d4e7d0]" />
                <div className="h-2.5 w-32 animate-pulse rounded-md bg-[#e8f0e4]" />
              </div>
              <div className="h-3.5 w-3.5 animate-pulse rounded bg-[#e8f0e4]" />
            </div>
          ) : (
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-full bg-white/60 py-1.5 pl-1.5 pr-3 transition-all duration-200 hover:bg-[#e8f0e4] hover:shadow-md"
              title={userEmail}
            >
              <Avatar className="h-8 w-8 ring-2 ring-[#b7e4c7]">
                <AvatarImage src={userImage} />
                <AvatarFallback className="bg-linear-to-br from-[#52b788] to-[#2d6a4f] text-xs font-semibold text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex lg:flex-col lg:items-start">
                <span className="text-sm font-medium text-[#1a2e1a]">
                  {userName}
                </span>
                <span className="text-[11px] text-[#5c7a5c]">
                  {userEmail}
                </span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 text-[#5c7a5c] transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
          )}

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-[#d4e7d0] bg-white shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="border-b border-[#e8f0e4] px-4 py-3">
                <p className="text-sm font-semibold text-[#1a2e1a]">{userName}</p>
                <p className="text-xs text-[#5c7a5c]">{userEmail}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-colors duration-150 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
