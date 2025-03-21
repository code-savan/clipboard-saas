import Link from 'next/link'
import React from 'react'

const Footer = () => {
  return (
    <footer className="py-6 border-t border-slate-200 dark:border-slate-800 mt-auto">
    <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
      <div className="text-slate-500 dark:text-slate-400 text-sm mb-4 md:mb-0">
        © {new Date().getFullYear()} Instant ClipBoard. All rights reserved.
      </div>
      <div className="flex space-x-6">
        <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
          Terms of Service
        </Link>
        <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300">
          Privacy Policy
        </Link>
      </div>
    </div>
  </footer>
  )
}

export default Footer
