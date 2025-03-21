"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clipboard } from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Link as ScrollLink } from "react-scroll";

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Clipboard className="h-6 w-6 text-indigo-600 dark:text-indigo-500" />
          <span className="text-xl font-semibold">Instant ClipBoard</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
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
      </div>
    </header>
  );
}
