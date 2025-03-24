'use client';

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { useTheme } from 'next-themes'

const Footer = () => {
  const { resolvedTheme } = useTheme()
  return (
    <footer className="py-12 bg-slate-900 text-slate-300">
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-6 md:mb-0 gap-2">
          {/* <Clipboard className="h-6 w-6 text-indigo-400 mr-2" /> */}
          <div>
            {resolvedTheme === 'dark' ? (
              <Image
                src="/logo-dark.png"
                alt="Instant ClipBoard Logo"
                className="h-7 w-7"
                width={28}
                height={28}
              />
            ) : (
              <Image
                src="/logo-light.png"
                alt="Instant ClipBoard Logo"
                className="h-7 w-7"
                width={28}
                height={28}
              />
            )}
          </div>
          <span className="text-xl font-semibold text-white">Instant ClipBoard</span>
        </div>

        <div className="flex gap-8">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/forum" className="hover:text-white transition-colors">
            Forum
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Instant ClipBoard. All rights reserved.
      </div>
    </div>
  </footer>
  )
}

export default Footer
