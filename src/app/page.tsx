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
import { Vendor } from "../../core/interface";

// Dynamically import Map component with SSR disabled
const Map = dynamic(() => import("@/components/map").then((mod) => mod.default), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100">
    <p className="text-gray-500">Loading map...</p>
  </div>
});

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [delayedQuery, setDelayedQuery] = useState<string>("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [selectedSubTags, setSelectedSubTags] = useState<string[]>([]);

  const categories = ["Hair", "Nails", "Makeup"];

  const nestedTags: Record<string, string[]> = {
    Hair: ["brazilian", "color", "extensions", "haircuts", "laser", "wax"],
    Nails: ["acrylics", "manicure", "pedicure"],
    Makeup: ["bridal", "natural", "prom", "tattooCover"]
  };

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
        })) as Vendor[];
        
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

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
    
    // If we're deselecting a category, also deselect all its subtags
    if (selectedCategories.includes(category)) {
      setSelectedSubTags(prev => 
        prev.filter(tag => !nestedTags[category].includes(tag))
      );
    }
    
    // When clicking a category, expand/collapse its subtags
    setExpandedTag(expandedTag === category ? null : category);
  };

  // Toggle subtag selection
  const toggleSubTag = (subTag: string) => {
    setSelectedSubTags((prev) =>
      prev.includes(subTag)
        ? prev.filter((tag) => tag !== subTag)
        : [...prev, subTag]
    );
  };

  // Update delayed query after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDelayedQuery(searchQuery);
    }, 1000); // Wait for 1 second after typing stops

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter vendors based on search query, categories, and subtags
  const filteredVendors = vendors.filter(vendor => {
    // Filter by search query (city or state)
    const addressParts = vendor.address.split(',');
    const city = addressParts[1]?.trim().toLowerCase() || '';
    const state = addressParts[2]?.trim().toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    const matchesCityOrState = 
      !query || city.includes(query) || state.includes(query);
    
    // If no categories selected, show all vendors
    if (selectedCategories.length === 0 && selectedSubTags.length === 0) {
      return matchesCityOrState;
    }
    
    // Check if vendor matches selected categories or subtags
    const services = vendor.services || {};
    
    // Filter by category
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.some(category => {
        // Check if any service in this category exists
        const categoryKey = category.toLowerCase() as 'hair' | 'nails' | 'makeup';
        return services[categoryKey] && Object.keys(services[categoryKey] || {}).length > 0;
      });
    
    // Filter by subtags if any are selected
    const matchesSubTags = selectedSubTags.length === 0 || 
      selectedSubTags.some(subTag => {
        // Go through each category of services to find the subtag
        return Object.entries(services).some(([category, categoryServices]) => {
          if (typeof categoryServices === 'object' && categoryServices) {
            // Check if the subtag is in this category and is set to true
            return subTag in categoryServices && categoryServices[subTag] === true;
          }
          return false;
        });
      });
    
    return matchesCityOrState && (matchesCategory || matchesSubTags);
  });

  // Format vendors for display and map
  const displayVendors = filteredVendors.map(vendor => {
    const addressParts = vendor.address.split(',');
    const city = addressParts[1]?.trim() || '';
    const stateZip = addressParts[2]?.trim() || '';
    const state = stateZip.split(' ')[0] || '';
    const description = `${vendor.offersHome ? 'Home services available. ' : ''}${vendor.offersDrive ? 'Drive-in services available.' : ''}`;

    // Make sure the vendor has city and state properties for the map component
    return {
      ...vendor,
      city,
      state,
      description
    };
  });

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

        {categories.map((category) => (
          <div key={category} className="relative">
            <Badge
              onClick={() => toggleCategory(category)}
              className={cn(
                "cursor-pointer select-none px-4 py-2 rounded-full text-sm font-medium transition",
                selectedCategories.includes(category) || expandedTag === category 
                  ? "bg-black text-white" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {category}
            </Badge>

            {expandedTag === category && (
              <div className="absolute top-full left-0 mt-2 flex flex-wrap gap-1 z-10 bg-white border rounded shadow-lg p-2">
                {nestedTags[category].map((subTag) => (
                  <Badge
                    key={subTag}
                    onClick={() => toggleSubTag(subTag)}
                    className={cn(
                      "cursor-pointer select-none px-3 py-1 rounded-full text-xs transition",
                      selectedSubTags.includes(subTag)
                        ? "bg-black text-white"
                        : "bg-gray-200 text-gray-700"
                    )}
                  >
                    {subTag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
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
          {displayVendors.length > 0 ? (
            <Map
              vendors={displayVendors}
              userLocation={userLocation}
              searchQuery={delayedQuery}
            />
          ) : (
            <div className="text-center">
              <p className="text-gray-500">No locations to display on map.</p>
              <p className="text-gray-400 text-sm mt-2">Try adjusting your search filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}