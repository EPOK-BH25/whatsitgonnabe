"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { isUsernameAvailable } from "@/services/username-availability";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  signOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  sendEmailVerification,
} from "firebase/auth";
import { createProfile, updateProfile as updateFirestoreProfile } from "@/services/profile-service";
import { auth, db } from "@/lib/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doc, setDoc, updateDoc, serverTimestamp, setLogLevel, connectFirestoreEmulator } from "firebase/firestore";

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
  // Add more country codes as needed
];

const formSchema = z.object({
  phone: z.string().min(10),
  username: z.string().min(3),
  countryCode: z.string(),
  password: z.string().min(8),
  passwordConfirm: z.string(),
  code: z.string().optional()
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

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

const getPhoneNumberPlaceholder = (countryCode: string) => {
  switch (countryCode) {
    case '+1': return '555-555-5555';
    case '+44': return '7911 123456';
    default: return '555-555-5555';
  }
};

const SignUp = () => {
  const [stage, setStage] = useState<"phone" | "code">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string>("");
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      countryCode: "+1", // Default to US
      password: "",
      passwordConfirm: "",
      code: "",
      username: "vendor_" + Math.random().toString(36).substring(2, 8), // Generate a random username
    },
    mode: "onChange",
  });

  // Add this useEffect to log form state changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name) {
        console.log(`Field ${name} changed:`, value[name]);
      }
      console.log("Form state:", form.formState);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Password validation states
  const [hasLowercase, setHasLowercase] = useState(false);
  const [hasUppercase, setHasUppercase] = useState(false);
  const [hasNumber, setHasNumber] = useState(false);
  const [hasSpecialChar, setHasSpecialChar] = useState(false);
  const [isMinLength, setIsMinLength] = useState(false);

  // Get the current password value from the form
  const passwordValue = form.watch("password");

  // Update validation states when password changes
  useEffect(() => {
    setHasLowercase(/[a-z]/.test(passwordValue));
    setHasUppercase(/[A-Z]/.test(passwordValue));
    setHasNumber(/[0-9]/.test(passwordValue));
    setHasSpecialChar(/[^a-zA-Z0-9\s]/.test(passwordValue));
    setIsMinLength(passwordValue.length >= 8);
  }, [passwordValue]);

  useEffect(() => {
    if (typeof window === "undefined") return; // ✅ Prevent SSR crash

    if (stage === "phone" && auth) {
      try {
        console.log("Setting up reCAPTCHA...");

        // Clear any existing verifier
        if ((window as any).recaptchaVerifier) {
          try {
            (window as any).recaptchaVerifier.clear();
          } catch (e) {
            console.warn("reCAPTCHA already cleared:", e);
          }
          (window as any).recaptchaVerifier = undefined;
        }

        // Create a new invisible reCAPTCHA verifier with auto-verification
        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (response: any) => {
            console.log("reCAPTCHA verified successfully", response);
          },
          'expired-callback': () => {
            console.log("reCAPTCHA expired");
            // Silently refresh the reCAPTCHA instead of showing an error
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
              const newRecaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
                callback: (response: any) => {
                  console.log("reCAPTCHA verified successfully", response);
                },
                'expired-callback': () => {
                  console.log("reCAPTCHA expired");
                }
              });
              (window as any).recaptchaVerifier = newRecaptchaVerifier;
            }
          }
        });

        // Store it globally
        (window as any).recaptchaVerifier = recaptchaVerifier;
        console.log("reCAPTCHA setup complete");

      } catch (error) {
        console.error("Error setting up reCAPTCHA:", error);
        // Silently handle the error instead of showing a toast
      }
    }

    // Cleanup function
    return () => {
      if (typeof window !== "undefined" && (window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
        } catch (e) {
          console.warn("reCAPTCHA already cleared:", e);
        }
        (window as any).recaptchaVerifier = undefined;
      }
    };
  }, [stage, auth]);


  // Enable debug logging
  useEffect(() => {
    setLogLevel("debug");
    
    // Check emulator connection
    if (process.env.NODE_ENV === "development" && db) {
      console.log("🚨 connecting to emulator");
      connectFirestoreEmulator(db, "localhost", 8080);
    }

    // Run smoke test
    (async () => {
      if (!db) {
        console.error("🔥 Firestore not initialized");
        return;
      }
      try {
        await setDoc(doc(db, "smokeTest", "ping"), { pong: true });
        console.log("✅ smoke test write succeeded");
      } catch (e: any) {
        console.error("🔥 smoke test write FAILED:", e.code, e.message);
      }
    })();
  }, []);

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (stage === "phone") {
        if (!auth) {
          throw new Error("Authentication service not initialized");
        }

        // Store the phone number and password temporarily
        localStorage.setItem('pendingPhone', `${data.countryCode}${data.phone}`);
        localStorage.setItem('pendingPassword', data.password);

        // Create a temporary user to send verification
        const phoneNumber = `${data.countryCode}${data.phone}`;
        const recaptchaVerifier = (window as any).recaptchaVerifier;
        
        if (!recaptchaVerifier) {
          throw new Error("reCAPTCHA not initialized");
        }

        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
        setVerificationId(confirmationResult.verificationId);
        setStage("code");
      } else if (stage === "code") {
        if (!auth || !verificationId || !data.code) {
          throw new Error("Authentication not initialized, verification ID missing, or code not provided");
        }

        // Verify the phone number
        const credential = PhoneAuthProvider.credential(verificationId, data.code);
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;
        
        if (!user) {
          throw new Error("Failed to create user");
        }
        
        // Create the user profile in Firestore with incremental writes
        try {
          if (!db) {
            throw new Error("Firestore is not initialized");
          }
          
          // Step 1: Basic write with just uid
          console.log("Step 1: Writing basic profile with uid");
          const userDoc = doc(db, 'profiles', user.uid);
          await setDoc(userDoc, {
            uid: user.uid
          });
          
          // Step 2: Add phoneNumber
          console.log("Step 2: Adding phoneNumber");
          await setDoc(userDoc, {
            uid: user.uid,
            phoneNumber: user.phoneNumber || ''
          });
          
          // Step 3: Add isVerified
          console.log("Step 3: Adding isVerified");
          await setDoc(userDoc, {
            uid: user.uid,
            phoneNumber: user.phoneNumber || '',
            isVerified: true
          });
          
          // Step 4: Add timestamps and username
          console.log("Step 4: Adding timestamps and username");
          await setDoc(userDoc, {
            uid: user.uid,
            phoneNumber: user.phoneNumber || '',
            isVerified: true,
            username: data.username,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          // Create vendor document
          console.log("Creating vendor document");
          const vendorDoc = doc(db, 'vendor', user.uid);
          await setDoc(vendorDoc, {
            uid: user.uid,
            phoneNumber: user.phoneNumber || '',
            businessName: '',
            email: '',
            address: '',
            offersHome: false,
            offersDrive: false,
            paymentOptions: {
              cash: false,
              cashapp: false,
              credit: false,
              debit: false,
              paypal: false,
              tap: false,
              venmo: false,
              zelle: false,
            },
            images: [],
            username: data.username,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          console.log("✅ Profile and vendor document created successfully");
          
          // Update Firebase profile with username
          await updateFirebaseProfile(user, {
            displayName: data.username
          });
          
          // Redirect to vendor setup page
          router.push(`/vendor/${user.uid}/setup`);
        } catch (firestoreError) {
          console.error("Error creating profile:", firestoreError);
          // If profile creation fails, delete the user
          await user.delete();
          throw new Error("Failed to create user profile");
        }
      }
    } catch (error) {
      console.error("Error during sign up:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container relative flex h-screen w-screen flex-col items-center justify-center md:grid lg:max-w-none">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Icons.shield className="mx-auto h-6 w-6" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            {stage === "phone" && "Enter your phone number and password to create an account."}
            {stage === "code" && "Please verify your phone number to continue."}
          </p>
        </div>
        <Form {...form}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              console.log("Form submit event triggered");
              console.log("Form state:", form.formState);
              console.log("Form values:", form.getValues());
              console.log("Form errors:", form.formState.errors);
              
              if (form.formState.isSubmitting) {
                console.log("Form is already submitting");
                return;
              }
              
              try {
                const values = form.getValues();
                console.log("Submitting form with values:", values);
                handleSubmit(values);
              } catch (error) {
                console.error("Error in form submission:", error);
              }
            }} 
            className="space-y-4"
          >
            {stage === "phone" && (
              <>
                <div className="flex space-x-2">
                  <FormField
                    control={form.control}
                    name="countryCode"
                    render={({ field }) => (
                      <FormItem className="w-[100px]">
                        <FormLabel>Code</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          console.log("Country code changed:", value);
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Code" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countryCodes.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => {
                      const countryCode = form.watch("countryCode");
                      return (
                        <FormItem className="flex-1">
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={getPhoneNumberPlaceholder(countryCode)}
                              {...field}
                              value={formatPhoneNumber(field.value, countryCode)}
                              onChange={(e) => {
                                // Only allow digits
                                const digits = e.target.value.replace(/\D/g, '');
                                // Limit length based on country
                                const maxLength = countryCode === '+1' ? 10 : 10;
                                if (digits.length <= maxLength) {
                                  field.onChange(digits);
                                  console.log("Phone number changed:", digits);
                                }
                              }}
                              onKeyPress={(e) => {
                                // Only allow numbers
                                if (!/^\d$/.test(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                {/* Invisible reCAPTCHA container */}
                <div id="recaptcha-container" className="sr-only"></div>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            console.log("Password changed:", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-1">
                  <p className="text-sm font-medium">Password must contain:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li
                      className={cn({
                        "text-green-500": hasLowercase,
                        "text-muted-foreground": !hasLowercase,
                      })}
                    >
                      At least one lowercase letter
                    </li>
                    <li
                      className={cn({
                        "text-green-500": hasUppercase,
                        "text-muted-foreground": !hasUppercase,
                      })}
                    >
                      At least one uppercase letter
                    </li>
                    <li
                      className={cn({
                        "text-green-500": hasNumber,
                        "text-muted-foreground": !hasNumber,
                      })}
                    >
                      At least one number
                    </li>
                    <li
                      className={cn({
                        "text-green-500": hasSpecialChar,
                        "text-muted-foreground": !hasSpecialChar,
                      })}
                    >
                      At least one special character
                    </li>
                    <li
                      className={cn({
                        "text-green-500": isMinLength,
                        "text-muted-foreground": !isMinLength,
                      })}
                    >
                      At least 8 characters
                    </li>
                  </ul>
                </div>

                <FormField
                  control={form.control}
                  name="passwordConfirm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            console.log("Password confirm changed:", e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {stage === "code" && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Code</FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button 
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {stage === "phone" && "Create Account"}
              {stage === "code" && "Verify Phone"}
            </Button>

            {stage === "code" && (
              <div className="text-center text-sm text-muted-foreground">
                <p>Haven't received the verification code?</p>
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={async () => {
                    const pendingPhone = localStorage.getItem('pendingPhone');
                    if (!pendingPhone || !auth) {
                      toast({
                        title: "Error",
                        description: "Session expired. Please start over.",
                        variant: "destructive",
                      });
                      setStage("phone");
                      return;
                    }

                    try {
                      // Use the existing reCAPTCHA verifier if available
                      let recaptchaVerifier = (window as any).recaptchaVerifier;
                      
                      // If not available, create a new one
                      if (!recaptchaVerifier) {
                        if (!auth) {
                          throw new Error("Authentication service not initialized");
                        }
                        recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                          'size': 'invisible',
                          'callback': () => {
                            console.log("reCAPTCHA verified");
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
                            if (!auth) {
                              throw new Error("Authentication service not initialized");
                            }
                            const newRecaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                              'size': 'invisible',
                              'callback': () => {
                                console.log("reCAPTCHA verified");
                              },
                              'expired-callback': () => {
                                console.log("reCAPTCHA expired");
                              }
                            });
                            (window as any).recaptchaVerifier = newRecaptchaVerifier;
                          }
                        });
                        (window as any).recaptchaVerifier = recaptchaVerifier;
                      }

                      const confirmationResult = await signInWithPhoneNumber(auth, pendingPhone, recaptchaVerifier);
                      setVerificationId(confirmationResult.verificationId);
                      
                      toast({
                        title: "Verification code resent",
                        description: "Please enter the new verification code.",
                      });
                    } catch (error) {
                      console.error("Error resending verification code:", error);
                      toast({
                        title: "Error",
                        description: "Failed to resend verification code. Please try again later.",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Click here to resend
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
};

export default SignUp;