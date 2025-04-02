"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clipboard, Menu, X } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link as ScrollLink } from "react-scroll";
import { useTheme } from "next-themes";
import Image from "next/image";
import { Button } from "./ui/button";
import { AnimatePresence, motion } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { isAdmin } = useAuth();
  const { resolvedTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
        <Link href="/" className="flex items-center gap-2">
          {/* <Clipboard className="h-6 w-6 text-indigo-600 dark:text-indigo-500" /> */}
          <div>
            {resolvedTheme === 'light' ? (
              <Image
                src="/logo-light.png"
                alt="Instant ClipBoard Logo"
                className="h-7 w-7"
                width={28}
                height={28}
              />
            ) : (
              <Image
                src="/logo-dark.png"
                alt="Instant ClipBoard Logo"
                className="h-7 w-7"
                width={28}
                height={28}
              />
            )}
          </div>
          <span className="text-xl font-semibold">Instant ClipBoard</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {isHome ? (
            <>
              <ScrollLink
                to="features"
                spy={true}
                smooth={true}
                offset={-70}
                duration={500}
                className="text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500 cursor-pointer"
              >
                Features
              </ScrollLink>
              <ScrollLink
                to="how-it-works"
                spy={true}
                smooth={true}
                offset={-70}
                duration={500}
                className="text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500 cursor-pointer"
              >
                How It Works
              </ScrollLink>
              <ScrollLink
                to="testimonials"
                spy={true}
                smooth={true}
                offset={-70}
                duration={500}
                className="text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500 cursor-pointer"
              >
                Testimonials
              </ScrollLink>
            </>
          ) : (
            <Link href="/" className="text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500">
              Home
            </Link>
          )}
          <Link
            href="/forum"
            className={`text-sm ${pathname === "/forum" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500"}`}
          >
            Forum
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={`text-sm ${pathname === "/admin" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500"}`}
            >
              Admin
            </Link>
          )}
          <ModeToggle />
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-md"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 md:hidden px-4 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md z-20"
          >
            <nav className="flex flex-col space-y-4 container mx-auto">
              {isHome ? (
                <>
                  <ScrollLink
                    to="features"
                    spy={true}
                    smooth={true}
                    offset={-70}
                    duration={500}
                    className="text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500 cursor-pointer py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </ScrollLink>
                  <ScrollLink
                    to="how-it-works"
                    spy={true}
                    smooth={true}
                    offset={-70}
                    duration={500}
                    className="text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500 cursor-pointer py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How It Works
                  </ScrollLink>
                  <ScrollLink
                    to="testimonials"
                    spy={true}
                    smooth={true}
                    offset={-70}
                    duration={500}
                    className="text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500 cursor-pointer py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Testimonials
                  </ScrollLink>
                </>
              ) : (
                <Link
                  href="/"
                  className="text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              )}
              <Link
                href="/forum"
                className={`text-sm ${pathname === "/forum" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500"} py-2`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Forum
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`text-sm ${pathname === "/admin" ? "text-indigo-600 dark:text-indigo-400" : "text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-500"} py-2`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
