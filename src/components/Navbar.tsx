"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Services" },
    { href: "/vendor-dashboard", label: "Vendor Dashboard" },
    // { href: "/about", label: "About the Team" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navbar text-navbar-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold">
              EPOK
            </Link>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-navbar-foreground/80",
                    pathname === link.href
                      ? "text-navbar-foreground"
                      : "text-navbar-foreground/60"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="flex items-center">
            <span className="text-sm text-navbar-foreground/60 mr-2">
              Are you a vendor?
            </span>
            <Link
              href="/sign-up"
              className="text-sm font-medium text-navbar-foreground hover:text-navbar-foreground/80 transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 