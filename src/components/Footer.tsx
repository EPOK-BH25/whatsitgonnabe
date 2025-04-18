import Link from "next/link";
import { Button } from "./ui/button";

interface SocialButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const SocialButton = ({ href, children, className }: SocialButtonProps) => {
  return (
    <Button
      variant="outline"
      size="icon"
      className={`rounded-full bg-white text-[#1D503A] hover:bg-[#1D503A] hover:text-white ${className}`}
      asChild
    >
      <Link href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </Link>
    </Button>
  );
};

export function Footer() {
  return (
    <footer className="bg-[#1D503A] text-[#FAF5EE] py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Supporting Your Up and Coming Beauty Cosmetics</h3>
            <p className="text-sm">
              We connect beauty professionals with clients, making it easy to find
              and book services.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="text-sm hover:underline">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect With Us</h3>
            <div className="flex space-x-4">
              <Link href="https://github.com/EPOK-BH25" className="text-sm hover:underline">
                Github
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#FAF5EE]/20 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} WhatsItGonnaBe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}