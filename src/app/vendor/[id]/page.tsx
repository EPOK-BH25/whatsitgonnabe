"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, MapPin, Home, Car, Instagram, Globe, Star, Clock, CreditCard, Edit, Phone } from "lucide-react";
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "keen-slider/keen-slider.min.css";
import { useKeenSlider } from "keen-slider/react";

interface VendorData {
  id: string;
  businessName: string;
  address: string;
  email: string;
  phoneNumber: string;
  images: string[];
  tags: string[];
  offersDrive: boolean;
  offersHome: boolean;
  paymentOptions: {
    cash: boolean;
    cashapp: boolean;
    credit: boolean;
    debit: boolean;
    paypal: boolean;
    tap: boolean;
    venmo: boolean;
    zelle: boolean;
  };
  socialmedia: string[];
}

interface ReviewData {
  id: string;
  userId?: string;
  name?: string;
  userName?: string;
  star?: number;
  rating?: number;
  contents?: string;
  comment?: string;
  createdAt: Date;
  phoneVerified?: boolean;
}

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

export default function VendorProfile() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [activeTab, setActiveTab] = useState("about");
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewPhone, setReviewPhone] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [reviewCountryCode, setReviewCountryCode] = useState("+1");

  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    mode: "snap",
    slides: {
      perView: 1,
    },
  });


  // Add this in your VendorProfile.tsx component to help debug image issues
// Place it right after your state declarations but before any other useEffect

// Debug function to check image URLs
useEffect(() => {
    if (vendor?.images && vendor.images.length > 0) {
      console.log("🖼️ Found images in vendor data:", vendor.images.length);
      
      vendor.images.forEach((url, index) => {
        console.log(`🖼️ Image ${index} URL:`, url);
        
        // Check if URL is valid
        try {
          const urlObj = new URL(url);
          console.log(`✓ Image ${index} has valid URL format`);
          
          // Check for Firebase Storage URLs specifically
          if (url.includes('firebasestorage.googleapis.com')) {
            console.log(`✓ Image ${index} is a Firebase Storage URL`);
            
            // Check if URL has required parameters
            if (!url.includes('alt=media')) {
              console.log(`⚠️ Image ${index} is missing 'alt=media' parameter`);
            }
          }
        } catch (error) {
          console.error(`❌ Image ${index} has invalid URL format:`, url);
        }
      });
    } else {
      console.log("⚠️ No images found in vendor data");
    }
  }, [vendor]);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!vendorId || !db) return;
      
      try {
        // Fetch vendor document
        const vendorRef = doc(db, "vendor", vendorId);
        const vendorSnap = await getDoc(vendorRef);
        
        if (vendorSnap.exists()) {
          const vendorData = { id: vendorSnap.id, ...vendorSnap.data() } as VendorData;
          setVendor(vendorData);
          
          // Fetch reviews
          const reviewsRef = collection(db, "vendor", vendorId, "reviews");
          const reviewsQuery = query(reviewsRef, orderBy("createdAt", "desc"));
          const reviewsSnap = await getDocs(reviewsQuery);
          
          console.log("Reviews fetched:", reviewsSnap.docs.length);
          
          if (reviewsSnap.docs.length > 0) {
            console.log("First review data:", reviewsSnap.docs[0].data());
          }
          
          const reviewsData = reviewsSnap.docs.map(doc => {
            const data = doc.data();
            console.log("Review data:", data);
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date()
            };
          }) as ReviewData[];
          
          console.log("Processed reviews:", reviewsData);
          setReviews(reviewsData);
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">Vendor not found</h1>
      </div>
    );
  }


  const getPaymentMethods = () => {
    const methods = [];
    if (vendor.paymentOptions.cash) methods.push("Cash");
    if (vendor.paymentOptions.credit) methods.push("Credit Card");
    if (vendor.paymentOptions.debit) methods.push("Debit Card");
    if (vendor.paymentOptions.paypal) methods.push("PayPal");
    if (vendor.paymentOptions.venmo) methods.push("Venmo");
    if (vendor.paymentOptions.cashapp) methods.push("Cash App");
    if (vendor.paymentOptions.zelle) methods.push("Zelle");
    if (vendor.paymentOptions.tap) methods.push("Tap to Pay");
    return methods.join(", ");
  };

  const getSocialLinks = () => {
    const links = [];
    const instagram = vendor.socialmedia.find(link => link.includes("instagram.com") || link.startsWith("@"));
    const website = vendor.socialmedia.find(link => !link.includes("instagram.com") && !link.startsWith("@"));
    
    if (instagram) {
      // Format Instagram link properly
      let instagramUrl = instagram;
      if (instagram.startsWith("@")) {
        instagramUrl = `https://instagram.com/${instagram.substring(1)}`;
      } else if (!instagram.includes("instagram.com")) {
        instagramUrl = `https://instagram.com/${instagram}`;
      }
      links.push({ type: "instagram", url: instagramUrl, display: instagram });
    }
    
    if (website) {
      // Ensure website has proper protocol
      let websiteUrl = website;
      if (!website.startsWith("http://") && !website.startsWith("https://")) {
        websiteUrl = `https://${website}`;
      }
      links.push({ type: "website", url: websiteUrl, display: website });
    }
    
    return links;
  };

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on country code
    switch (reviewCountryCode) {
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

  // Get phone number placeholder based on country code
  const getPhoneNumberPlaceholder = () => {
    switch (reviewCountryCode) {
      case '+1': return '555-555-5555';
      case '+44': return '7911 123456';
      default: return '555-555-5555';
    }
  };

  // Handle review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPhoneVerified) {
      // In a real app, you would implement phone verification here
      // For now, we'll just simulate it
      setShowVerificationInput(true);
      toast.info("Please verify your phone number");
      return;
    }
    
    if (!reviewName || !reviewComment) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add the review to Firestore
      if (!db) {
        toast.error("Database connection error. Please try again later.");
        return;
      }
      
      const reviewsRef = collection(db, "vendor", vendorId, "reviews");
      await addDoc(reviewsRef, {
        name: reviewName,
        star: reviewRating,
        contents: reviewComment,
        createdAt: serverTimestamp(),
        phoneVerified: true
      });
      
      // Refresh reviews
      const reviewsQuery = query(reviewsRef, orderBy("createdAt", "desc"));
      const reviewsSnap = await getDocs(reviewsQuery);
      
      const reviewsData = reviewsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as ReviewData[];
      
      setReviews(reviewsData);
      
      // Reset form
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);
      setIsPhoneVerified(false);
      setShowVerificationInput(false);
      
      toast.success("Review submitted successfully!");
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Update the handlePhoneVerification function
  const handlePhoneVerification = async () => {
    if (!reviewPhone) {
      toast.error("Please enter your phone number");
      return;
    }
    
    if (!auth) {
      toast.error("Authentication service not available");
      return;
    }
    
    try {
      if (!setupRecaptcha()) return;
      
      const appVerifier = (window as any).recaptchaVerifier;
      const fullPhoneNumber = `${reviewCountryCode}${reviewPhone.replace(/\D/g, '')}`;
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      (window as any).confirmationResult = confirmationResult;
      setShowVerificationInput(true);
      toast.info("Verification code sent to your phone");
    } catch (error) {
      console.error("Error sending verification code:", error);
      toast.error("Failed to send verification code. Please try again.");
    }
  };
  
  // Simulate code verification
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }
    
    try {
      const confirmationResult = (window as any).confirmationResult;
      await confirmationResult.confirm(verificationCode);
      setIsPhoneVerified(true);
      setShowVerificationInput(false);
      toast.success("Phone number verified successfully!");
    } catch (error) {
      console.error("Error verifying code:", error);
      toast.error("Invalid verification code. Please try again.");
    }
  };

  const setupRecaptcha = () => {
    if (!auth) {
      toast.error("Authentication service not available");
      return false;
    }
    
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="relative w-full bg-muted">
        {vendor?.images && vendor.images.length > 0 ? (
          <div ref={sliderRef} className="keen-slider h-[400px] w-full overflow-hidden">
            {vendor.images.map((imageUrl, index) => (
              <div className="keen-slider__slide flex justify-center items-center aspect-square bg-muted" key={index}>
                <img
                  src={imageUrl}
                  alt={`${vendor.businessName} - Image ${index + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error(`Failed to load image ${index}:`, imageUrl);
                    e.currentTarget.src = "https://via.placeholder.com/400x400?text=Image+Unavailable";
                  }}
                />
              </div>

            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] bg-muted">
            <span className="text-muted-foreground">No images available</span>
          </div>
        )}
      </div>


      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">{vendor.businessName}</h1>
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span>{vendor.address}</span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(reviews.reduce((sum, review) => sum + ((review.star || review.rating || 0)), 0) / (reviews.length || 1))
                            ? "text-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {vendor.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => router.push(`/vendor/${vendorId}/dashboard`)}
              >
                <Edit className="h-4 w-4" />
                <span>Edit Profile</span>
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Service Locations</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vendor.offersHome && (
                      <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                          <Home className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-medium">At My Location</h3>
                            <p className="text-sm text-muted-foreground">Services available at my business location</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {vendor.offersDrive && (
                      <Card>
                        <CardContent className="flex items-center gap-4 p-4">
                          <Car className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-medium">Mobile Services</h3>
                            <p className="text-sm text-muted-foreground">I travel to your location</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Payment Methods</h2>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <span>{getPaymentMethods()}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Contact Information</h2>
                  <div className="space-y-2">
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Phone:</span>
                      <a href={`tel:${vendor.phoneNumber}`} className="text-primary hover:underline">
                        {vendor.phoneNumber}
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Email:</span>
                      <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                        {vendor.email}
                      </a>
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">
                      {reviews.length} {reviews.length === 1 ? "Review" : "Reviews"}
                    </span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    {showReviewForm ? "Cancel" : "Write a Review"}
                  </Button>
                </div>
                
                {showReviewForm && (
                  <Card className="mb-6">
                    <CardContent className="p-4">
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Your Name</Label>
                          <Input
                            id="name"
                            value={reviewName}
                            onChange={(e) => setReviewName(e.target.value)}
                            placeholder="Enter your name"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="flex gap-2">
                            <Select 
                              value={reviewCountryCode} 
                              onValueChange={setReviewCountryCode}
                            >
                              <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Code" />
                              </SelectTrigger>
                              <SelectContent>
                                {countryCodes.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.flag} {country.code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              id="phone"
                              value={reviewPhone}
                              onChange={(e) => {
                                // Only allow digits
                                const digits = e.target.value.replace(/\D/g, '');
                                // Limit length based on country
                                const maxLength = reviewCountryCode === '+1' ? 10 : 10;
                                if (digits.length <= maxLength) {
                                  setReviewPhone(formatPhoneNumber(digits));
                                }
                              }}
                              placeholder={getPhoneNumberPlaceholder()}
                              type="tel"
                              required
                              disabled={isPhoneVerified}
                            />
                            {!isPhoneVerified && !showVerificationInput && (
                              <Button 
                                type="button" 
                                onClick={handlePhoneVerification}
                                disabled={isSubmitting}
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Verify
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {showVerificationInput && !isPhoneVerified && (
                          <div className="space-y-2">
                            <Label htmlFor="verification">Verification Code</Label>
                            <div className="flex gap-2">
                              <Input
                                id="verification"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="Enter verification code"
                                required
                              />
                              <Button 
                                type="button" 
                                onClick={handleVerifyCode}
                                disabled={isSubmitting}
                              >
                                Verify Code
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Button
                                key={star}
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="p-0 h-auto"
                                onClick={() => setReviewRating(star)}
                              >
                                <Star
                                  className={`h-6 w-6 ${
                                    star <= reviewRating ? "text-yellow-500" : "text-gray-300"
                                  }`}
                                />
                              </Button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="comment">Your Review</Label>
                          <Textarea
                            id="comment"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Share your experience with this vendor"
                            required
                            rows={4}
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={isSubmitting || !isPhoneVerified}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Review"
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
                
                <div className="space-y-6">
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (review.star || review.rating || 0) ? "text-yellow-500" : "text-muted"
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {review.name || review.userName || "Anonymous"}
                            </span>
                          </div>
                          <p className="text-sm">{review.contents || review.comment || ""}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                              {review.createdAt.toLocaleDateString()}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No reviews yet. Be the first to review this vendor!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-4">Connect</h2>
                <div className="space-y-4">
                  {getSocialLinks().map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      {link.type === "instagram" ? (
                        <Instagram className="h-5 w-5" />
                      ) : (
                        <Globe className="h-5 w-5" />
                      )}
                      <span>
                        {link.type === "instagram"
                          ? link.display.startsWith("@")
                            ? link.display
                            : `@${link.display.split("/").pop()}`
                          : link.display}
                      </span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div id="recaptcha-container"></div>
    </div>
  );
} 