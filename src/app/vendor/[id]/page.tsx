"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";
import ReviewsPage from "@/app/reviews/page";

interface VendorData {
  businessName: string;
  address: string;
  email: string;
  phoneNumber: string;
  images: string[];
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
  tags: string[];
}

export default function VendorProfile() {
  const params = useParams();
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = async () => {
      if (!db) return;
      
      try {
        const vendorDoc = await getDoc(doc(db, "vendor", params.id as string));
        if (vendorDoc.exists()) {
          setVendor(vendorDoc.data() as VendorData);
        }
      } catch (error) {
        console.error("Error fetching vendor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!vendor) {
    return <div>Vendor not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="relative h-[400px] w-full overflow-hidden rounded-lg">
        <img
          src={vendor.images[0] || "/placeholder-image.jpg"}
          alt={vendor.businessName}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="md:col-span-2">
          <h1 className="text-3xl font-bold">{vendor.businessName}</h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {vendor.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="mt-6">
            <Tabs defaultValue="about">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="about">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold">About Us</h2>
                  <p className="mt-4 text-gray-600">
                    Welcome to {vendor.businessName}! We are dedicated to providing
                    exceptional service to our clients.
                  </p>
                </Card>
              </TabsContent>
              <TabsContent value="services">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold">Our Services</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {vendor.offersHome && (
                      <div className="flex items-center gap-2">
                        <Icons.home className="h-5 w-5" />
                        <span>Home Services</span>
                      </div>
                    )}
                    {vendor.offersDrive && (
                      <div className="flex items-center gap-2">
                        <Icons.arrowRight className="h-5 w-5" />
                        <span>Drive-in Services</span>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewsPage companyName={vendor.businessName} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column - Contact & Info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Icons.mail className="h-5 w-5" />
                <span>{vendor.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.phone className="h-5 w-5" />
                <span>{vendor.phoneNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.mapPin className="h-5 w-5" />
                <span>{vendor.address}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold">Payment Options</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {Object.entries(vendor.paymentOptions).map(([method, accepted]) => (
                accepted && (
                  <div key={method} className="flex items-center gap-2">
                    <Icons.check className="h-4 w-4 text-green-500" />
                    <span className="capitalize">{method}</span>
                  </div>
                )
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold">Social Media</h2>
            <div className="mt-4 flex gap-4">
              {vendor.socialmedia.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600"
                >
                  <Icons.externalLink className="h-5 w-5" />
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
} 