"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VendorCard } from "@/components/vendors-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Dynamically import Map component with SSR disabled
const Map = dynamic(() => import("@/components/map").then((mod) => mod.default), { ssr: false });

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

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [delayedQuery, setDelayedQuery] = useState<string>("");
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [loading, setLoading] = useState(true);

  // Original filter tags
  const tags = ["Hair", "Nails", "Makeup", "Color", "Haircuts"];

  // Fetch vendors from Firebase
  useEffect(() => {
    const fetchVendors = async () => {
      if (!db) return;
      
      try {
        const vendorsRef = collection(db, "vendor");
        const querySnapshot = await getDocs(vendorsRef);
        
        const vendorsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VendorData[];
        
        setVendors(vendorsData);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // Get current user location on mount
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lon: longitude });
        },
        () => {
          console.error("Error fetching user location.");
        }
      );
    }
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  // Process vendor data for display
  const processedVendors = vendors.map(vendor => {
    // Extract city and state from address
    const addressParts = vendor.address.split(',');
    const city = addressParts[1]?.trim() || 'Los Angeles'; // Default to LA if not found
    const state = addressParts[2]?.trim() || 'CA'; // Default to CA if not found
    
    return {
      id: vendor.id,
      businessName: vendor.businessName,
      tags: vendor.tags,
      description: `${vendor.offersHome ? 'Home services available. ' : ''}${vendor.offersDrive ? 'Drive-in services available.' : ''}`,
      city,
      state,
      links: vendor.socialmedia,
      amenities: Object.entries(vendor.paymentOptions)
        .filter(([_, accepted]) => accepted)
        .map(([method]) => method),
    };
  });

  const filteredVendors = processedVendors.filter((vendor) => {
    const query = searchQuery.toLowerCase();
    const matchesCityOrState =
      vendor.city.toLowerCase().includes(query) || vendor.state.toLowerCase().includes(query);
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => vendor.tags.includes(tag));

    return matchesCityOrState && matchesTags;
  });

  // Update delayed query after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDelayedQuery(searchQuery);
    }, 1000); // Wait for 1 second after typing stops

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="flex justify-between items-center p-4 md:p-6 bg-black text-white">
        <p className="font-bold text-xl">EPOK</p>
        <Link href="/sign-up" className="flex items-center">
          Sign Up <Icons.arrowRight className="h-4 w-4 ml-1" />
        </Link>
      </header>

      <div className="p-4 flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Search by city or state..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-[80%] md:w-[300px]"
        />

        {tags.map((tag) => (
          <Badge
            key={tag}
            onClick={() => toggleTag(tag)}
            className={cn(
              "cursor-pointer select-none px-4 py-2 rounded-full text-sm font-medium transition",
              selectedTags.includes(tag)
                ? "bg-black text-white text-md"
                : "bg-muted text-muted-forground text-md"
            )}
          >
            {tag}
          </Badge>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[50%] border-r p-4 flex flex-col gap-4">
          <ScrollArea className="flex-1">
            <div className="space-y-4">
              {loading ? (
                <p className="text-gray-500 text-sm">Loading vendors...</p>
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <VendorCard key={vendor.id} {...vendor} />
                ))
              ) : (
                <p className="text-gray-500 text-sm">No vendors found.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          <Map
            vendors={filteredVendors}
            userLocation={userLocation}
            searchQuery={delayedQuery}
          />
        </div>
      </div>
    </div>
  );
}
