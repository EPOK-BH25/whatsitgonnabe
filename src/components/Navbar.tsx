"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";


// --- Modal Component ---
function Modal({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);


  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white text-black p-6 rounded-xl shadow-xl relative w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black text-lg"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}


// --- Navbar Component ---
export default function Navbar() {
  const pathname = usePathname();
  const [showLoginModal, setShowLoginModal] = useState(false);


  const navLinks = [
    { href: "/", label: "Services" },
    { href: "/vendor-dashboard", label: "Vendor Dashboard" },
    { href: "/about-me", label: "About the Team" },
  ];


  return (
    <>
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


            {/* Sign Up & Log In */}
            <div className="flex items-center">
              <span className="text-sm text-navbar-foreground/60 mr-2">
                Are you a vendor?
              </span>
              <Link
                href="/sign-up"
                className="text-sm font-medium text-navbar-foreground hover:text-navbar-foreground/80 transition-colors mr-4"
              >
                Sign up
              </Link>
              <button
                onClick={() => setShowLoginModal(true)}
                className="text-sm font-medium text-navbar-foreground hover:text-navbar-foreground/80 transition-colors"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </nav>


      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <h2 className="text-lg font-semibold mb-4">Log in</h2>
        <form className="space-y-4">
          <input
            type="tel"
            placeholder="Phone Number"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-md hover:bg-opacity-80"
          >
            Log in
          </button>
        </form>
      </Modal>
    </>
  );
}
