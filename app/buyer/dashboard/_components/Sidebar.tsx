"use client";

import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  MessageCircle,
  Heart,
  CreditCard,
  Settings,
  TrendingUp,
  Menu,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AgroStackLogo } from "@/components/AgroStackLogo";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", route: "/buyer/dashboard" },
  { icon: ShoppingBag, label: "Products", route: "/buyer/dashboard/products" },
  { icon: Package, label: "Orders", route: "/buyer/dashboard/orders" },
  { icon: CreditCard, label: "Wallet", route: "/buyer/dashboard/wallet" },
  { icon: MessageCircle, label: "Messages", route: "/buyer/dashboard/messages" },
  { icon: Settings, label: "Settings", route: "/buyer/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const NavLinks = ({ onClick }: { onClick?: () => void }) => {
    return (
      <nav className="flex flex-col gap-1">
        {navItems.map(({ icon: Icon, label, route }) => {
          const isActive = pathname === route;
          return (
            <Link
              key={label}
              href={route}
              onClick={onClick}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-2 py-2 transition-all duration-200",
                isActive
                  ? "bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] ring-1 ring-black/5"
                  : "hover:bg-black/[0.03]"
              )}
            >
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200",
                isActive ? "text-black" : "text-gray-400 group-hover:text-black"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "flex-1 text-sm font-medium transition-colors duration-200",
                isActive ? "text-black" : "text-gray-500 group-hover:text-black"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  };

  const SidebarHeader = () => (
    <div className="mb-10 px-2 flex items-center gap-3">
      <AgroStackLogo size={32} />
      <div className="flex flex-col">
        <span className="text-lg font-black tracking-tight text-black">AgroStack</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Buyer Portal</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Trigger */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-2xl transition-transform hover:scale-105 active:scale-95">
              <Menu className="h-6 w-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] bg-[#f3f3f3] p-6 border-none">
            <SidebarHeader />
            <NavLinks onClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col bg-[#f3f3f3] border-r border-gray-100 px-6 py-8 md:flex">
        <SidebarHeader />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <NavLinks />
        </div>
      </aside>
    </>
  );
}