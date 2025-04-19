"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInWithPhoneNumber, RecaptchaVerifier, PhoneAuthProvider, signInWithCredential, onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "@/hooks/use-toast";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Country codes data
const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "GB", flag: "🇬🇧" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+7", country: "RU", flag: "🇷🇺" },
];

const formatPhoneNumber = (value: string, countryCode: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format based on country code
  switch (countryCode) {
    case '+1': // US/Canada format: XXX-XXX-XXXX
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    case '+44': // UK format: XXXX XXXXXX
      if (digits.length <= 4) return digits;
      return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
    default: // Default format: XXX-XXX-XXXX
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

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
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [verificationCode, setVerificationCode] = useState("");
  const [user, setUser] = useState<User | null>(null);

  // Listen for authentication state changes
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      console.log("Auth state changed:", user ? "User logged in" : "User logged out");
    });

    return () => unsubscribe();
  }, []);

  const handleVendorDashboardClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user?.phoneNumber || !db) return;

    try {
      // Format the phone number to match the database format (e.g., "+15555555555")
      const formattedPhoneNumber = user.phoneNumber.startsWith('+') 
        ? user.phoneNumber 
        : `+${user.phoneNumber}`;

      // Query Firestore for the vendor with matching phone number
      const vendorsRef = collection(db, "vendor");
      const q = query(vendorsRef, where("phoneNumber", "==", formattedPhoneNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Error",
          description: "No vendor profile found for this phone number",
          variant: "destructive",
        });
        return;
      }

      // Get the first matching vendor's ID
      const vendorDoc = querySnapshot.docs[0];
      const vendorId = vendorDoc.id;

      // Redirect to the vendor's edit profile page
      router.push(`/vendor/${vendorId}/dashboard`);
    } catch (error) {
      console.error("Error finding vendor profile:", error);
      toast({
        title: "Error",
        description: "Failed to find vendor profile",
        variant: "destructive",
      });
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    ...(user ? [{ href: "/vendor-dashboard", label: "Vendor Dashboard", onClick: handleVendorDashboardClick }] : []),
    { href: "/about-me", label: "About the Team" },
  ];

  const setupRecaptcha = () => {
    if (!auth) {
      toast({
        title: "Error",
        description: "Authentication service not available",
        variant: "destructive",
      });
      return false;
    }
    
    try {
      // Clear any existing verifier
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.warn("reCAPTCHA already cleared:", e);
        }
        (window as any).recaptchaVerifier = undefined;
      }

      // Create a new invisible reCAPTCHA verifier
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'login-recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log("reCAPTCHA verified successfully");
        },
        'expired-callback': () => {
          console.log("reCAPTCHA expired");
          // Silently refresh the reCAPTCHA
          if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
            try {
              (window as any).recaptchaVerifier.clear();
            } catch (e) {
              console.warn("reCAPTCHA already cleared:", e);
            }
            (window as any).recaptchaVerifier = undefined;
          }
          // Re-initialize the reCAPTCHA
          if (auth) {
            const newRecaptchaVerifier = new RecaptchaVerifier(auth, 'login-recaptcha-container', {
              size: 'invisible',
              callback: () => {
                console.log("reCAPTCHA verified successfully");
              },
              'expired-callback': () => {
                console.log("reCAPTCHA expired");
              }
            });
            (window as any).recaptchaVerifier = newRecaptchaVerifier;
          }
        }
      });

      (window as any).recaptchaVerifier = recaptchaVerifier;
      return true;
    } catch (error) {
      console.error("Error setting up reCAPTCHA:", error);
      toast({
        title: "Error",
        description: "Failed to initialize verification. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    
    setIsLoading(true);

    try {
      // Check if the phone number exists in the vendor collection
      const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
      const vendorsRef = collection(db, "vendor");
      const q = query(vendorsRef, where("phoneNumber", "==", fullPhoneNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Error",
          description: "No vendor account found with this phone number. Please sign up first.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!setupRecaptcha()) {
        setIsLoading(false);
        return;
      }

      console.log("Attempting to send verification code to:", fullPhoneNumber);
      
      const recaptchaVerifier = (window as any).recaptchaVerifier;
      if (!recaptchaVerifier) {
        throw new Error("reCAPTCHA not initialized");
      }

      // Store the vendor ID for later use
      const vendorDoc = querySnapshot.docs[0];
      const vendorId = vendorDoc.id;
      (window as any).pendingVendorId = vendorId;

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        fullPhoneNumber,
        recaptchaVerifier
      );
      
      setVerificationId(confirmationResult.verificationId);
      setStage("code");
      toast({
        title: "Verification code sent",
        description: "Please check your phone for the verification code.",
      });
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !verificationId) return;
    
    setIsLoading(true);

    try {
      // Get the stored vendor ID
      const vendorId = (window as any).pendingVendorId;
      if (!vendorId) {
        throw new Error("Vendor ID not found. Please try again.");
      }

      // Verify the code
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      
      // Sign in with the credential
      await signInWithCredential(auth, credential);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      setShowLoginModal(false);
      setStage("phone");
      setPhoneNumber("");
      setVerificationCode("");
      router.push("/");
    } catch (error: any) {
      console.error("Error verifying code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    
    try {
      await auth.signOut();
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navbar text-[#FAF5EE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-[#FAF5EE]">
                MINTY EXTERIOR
              </Link>
            </div>

            {/* Center Navigation Links */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={link.onClick}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-[#FAF5EE]/80",
                      pathname === link.href
                        ? "text-[#FAF5EE]"
                        : "text-[#FAF5EE]/60"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Sign Up & Log In */}
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-[#FAF5EE]/60">
                    {user.phoneNumber}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-[#FAF5EE] hover:text-[#FAF5EE]/80 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm text-[#FAF5EE]/60 mr-2">
                    Are you a vendor?
                  </span>
                  <Link
                    href="/sign-up"
                    className="text-sm font-medium text-[#FAF5EE] hover:text-[#FAF5EE]/80 transition-colors mr-4"
                  >
                    Sign up
                  </Link>
                  <button
                    onClick={handleLoginClick}
                    className="text-sm font-medium text-[#FAF5EE] hover:text-[#FAF5EE]/80 transition-colors"
                  >
                    Log in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      <Modal isOpen={showLoginModal} onClose={() => {
        setShowLoginModal(false);
        setStage("phone");
        setPhoneNumber("");
        setVerificationCode("");
        // Clear reCAPTCHA when closing modal
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {
            console.warn("reCAPTCHA already cleared:", e);
          }
          (window as any).recaptchaVerifier = undefined;
        }
      }}>
        <h2 className="text-lg font-semibold mb-4">Log in</h2>
        {stage === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div className="flex gap-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map(({ code, country, flag }) => (
                    <SelectItem key={code} value={code}>
                      {flag} {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="tel"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value, countryCode);
                  setPhoneNumber(formatted);
                }}
                className="flex-1"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !phoneNumber}
            >
              {isLoading ? "Sending..." : "Continue"}
            </Button>
            <div id="login-recaptcha-container" />
          </form>
        ) : (
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Verification Code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full"
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !verificationCode}
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
