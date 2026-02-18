"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  ChevronRight,
  Sprout,
  Zap,
  ShieldCheck,
  Users,
  Globe,
  TrendingUp,
  MessageCircle,
  Menu,
  X
} from "lucide-react";
import { AgroStackLogo } from "@/components/AgroStackLogo";
import { cn } from "@/lib/utils";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-black selection:bg-[#2d6a4f]/10 selection:text-[#1b4332]">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-black/[0.03] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <AgroStackLogo size={32} />
            <span className="text-xl font-black tracking-tight">AgroStack</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 rounded-full bg-black/5 p-1 md:flex">
            {[
              { label: "Home", href: "#about" },
              { label: "About Us", href: "#about" },
              { label: "Blog", href: "#blog" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-full px-5 py-2 text-sm font-medium transition-all",
                  item.label === "Home" ? "bg-black text-white shadow-lg" : "text-gray-500 hover:text-black hover:bg-black/5"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/login"
              className="rounded-full border border-black/10 px-6 py-2.5 text-sm font-bold transition-all hover:bg-black hover:text-white"
            >
              Log In
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-6 py-12 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex items-center gap-2 rounded-full bg-[#d8f3dc]/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#2d6a4f]"
              >
                <div className="h-2 w-2 rounded-full bg-[#2d6a4f] animate-pulse" />
                Precision Agriculture
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8 max-w-4xl text-5xl font-black leading-[1.1] tracking-tight md:text-7xl lg:text-8xl"
              >
                The Journey To A <br />
                <span className="text-[#2d6a4f]">Perfection.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-10 max-w-2xl text-lg font-medium text-gray-500 md:text-xl"
              >
                Pioneering Sustainable Agriculture. From Seed To Harvest, We Cultivate Excellence With Passion And Precision.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-4 sm:flex-row"
              >
                <Link
                  href="/login"
                  className="group flex items-center gap-2 rounded-full bg-black px-8 py-4 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
                >
                  Explore Our Farms
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </div>

          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="relative mt-16 w-full overflow-hidden bg-gray-100 shadow-2xl"
          >
            <Image
              src="/hero.png"
              alt="AgroStack Agricultural Landscape"
              width={1920}
              height={1080}
              className="h-[400px] w-full object-cover md:h-[700px] lg:h-[800px] transition-transform duration-1000 hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
          </motion.div>
        </section>

        {/* Info/Stats Section */}
        <section className="bg-white py-12 md:py-20 border-y border-black/[0.03]">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {[
                { label: "Years Of Experience", value: "2" },
                { label: "Acres Managed", value: "50+" },
                { label: "Farmers Supported", value: "25+" },
                { label: "Agricultural Impact", value: "$15 Million" }
              ].map((stat, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-3xl font-black md:text-5xl">{stat.value}</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Section */}
        <section id="about" className="px-6 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
              <div className="order-2 lg:order-1">
                <div className="mb-6 text-2xl font-black tracking-tight text-gray-300">2025</div>
                <h2 className="mb-8 text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl text-gray-900">
                  Honoring The Wisdom Of Generations, We Integrate Cutting-Edge Technology To Cultivate Smarter, Greener, And More Abundant Harvests For The Future.
                </h2>

                <div className="flex flex-wrap gap-4">
                  {["Organic Farming", "Precision Agriculture", "Sustainable Practices"].map((tag) => (
                    <span key={tag} className="text-sm font-bold text-gray-500 border-b-2 border-transparent hover:border-[#2d6a4f] transition-all cursor-default">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl">
                  <Image
                    src="/agri-tech.jpg"
                    alt="Agricultural Technology"
                    width={800}
                    height={800}
                    className="w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Sub-grid feature images */}
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="group relative overflow-hidden rounded-[2rem] h-64 bg-gray-100">
                <Image src="/organic-produce.jpg" alt="Organic Produce" fill className="object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-6">
                  <span className="text-white font-bold">Organic Harvest</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-6 p-8 rounded-[2rem] bg-[#f8faf6] border border-[#d8f3dc]">
                <h3 className="text-2xl font-black">Partner For A Brighter Harvest.</h3>
                <p className="text-sm font-medium text-gray-500">Join our network to access advanced resources, expert insights, and sustainable farming solutions.</p>
                <Link href="/login" className="group flex items-center gap-2 rounded-full bg-black px-6 py-3 text-xs font-bold text-white w-fit transition-all hover:bg-[#1b4332]">
                  Contact Our Team
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
              <div className="group relative h-64 overflow-hidden rounded-[2rem] bg-gray-100 p-8 flex flex-col justify-between text-white">
                <Image src="/ai-hand.png" alt="AI Technology" fill className="object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-linear-to-br from-black/60 via-[#1b4332]/40 to-[#2d6a4f]/20" />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <Sprout className="h-10 w-10 text-white/50" />
                  <div>
                    <h4 className="text-xl font-black mb-2">Sustainable AI</h4>
                    <p className="text-xs text-white/70 font-medium">Powered by the latest machine learning models to predict market trends and maximize yield.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Footer Section */}
        <section id="blog" className="bg-black py-24 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="mb-8 text-4xl font-black text-white md:text-6xl">Ready to grow with us?</h2>
            <p className="mb-12 text-lg text-gray-400">Join thousands of farmers and buyers scaling their business with AgroStack's precision technology.</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-white px-10 py-5 text-sm font-black text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Get Started Now
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-white py-12 border-t border-black/[0.03]">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <AgroStackLogo size={24} />
            <span className="text-lg font-black tracking-tight">AgroStack</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-gray-400">
            <Link href="#" className="hover:text-black transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-black transition-colors">Terms</Link>
            <Link href="#" className="hover:text-black transition-colors">Contact</Link>
          </div>
          <div className="text-sm font-medium text-gray-400">
            © 2026 AgroStack. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}