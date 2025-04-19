"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  const [filterApplied, setFilterApplied] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 3958.8;
    const toRad = (deg: number) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }


  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const vendorsCache = useRef<Vendor[]>([]);

  const categories = ["Hair", "Nails", "Makeup"];

  const nestedTags: Record<string, string[]> = {
    Hair: ["Brazilian", "Color", "Extensions", "Haircuts", "Laser", "Wax", "Brows"],
    Nails: ["Acrylics", "Manicure", "Pedicure"],
    Makeup: ["Bridal", "Natural", "Prom", "TattooCover"]
  };

  // Fetch vendors from Firebase with caching
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        // Check if we have cached vendors
        if (vendorsCache.current.length > 0) {
          setVendors(vendorsCache.current);
          setLoading(false);
          return;
        }

        if (!db) return;
        
        // Show loading state only if we don't have cached data
        setLoading(true);
        
        const vendorSnapshot = await getDocs(collection(db, "vendor"));
        const vendorsData: Vendor[] = [];

        // Process vendors in batches to avoid blocking the UI
        const batchSize = 5;
        const vendorDocs = vendorSnapshot.docs;
        
        for (let i = 0; i < vendorDocs.length; i += batchSize) {
          const batch = vendorDocs.slice(i, i + batchSize);
          const batchPromises = batch.map(async (vendorDoc) => {
            const vendorData = vendorDoc.data();

            // Destructure all required fields from vendorData
            const {
              businessName,
              address,
              email,
              phoneNumber,
              images = [],
              tags = [],
              offersDrive = false,
              offersHome = false,
              paymentOptions = {
                cash: false,
                cashapp: false,
                credit: false,
                debit: false,
                paypal: false,
                tap: false,
                venmo: false,
                zelle: false,
              },
              socialmedia = [],
            } = vendorData;

            // Get the nested services document
            if (db) {
              const servicesRef = collection(db, "vendor", vendorDoc.id, "services");
              const servicesSnapshot = await getDocs(servicesRef);

              let flattenedServices = {};
              if (!servicesSnapshot.empty) {
                // Get the first document in the services subcollection
                const serviceDoc = servicesSnapshot.docs[0];
                if (serviceDoc) {
                  flattenedServices = serviceDoc.data();
                }
              }

              // Fetch reviews to calculate review count and average rating
              const reviewsRef = collection(db, "vendor", vendorDoc.id, "reviews");
              const reviewsSnapshot = await getDocs(reviewsRef);
              const reviews = reviewsSnapshot.docs.map(doc => doc.data());
              
              const reviewCount = reviews.length;
              const averageRating = reviewCount > 0 
                ? reviews.reduce((sum, review) => sum + (review.star || 0), 0) / reviewCount 
                : 0;

              return {
                id: vendorDoc.id,
                businessName,
                address,
                email,
                phoneNumber,
                images,
                tags: tags.map((tag: string) => tag.toLowerCase()),
                offersDrive,
                offersHome,
                paymentOptions,
                socialmedia,
                services: flattenedServices,
                reviewCount,
                averageRating,
              };
            }
            return null;
          });
          
          // Wait for all promises in the batch to resolve
          const batchResults = await Promise.all(batchPromises);
          const validResults = batchResults.filter(Boolean) as Vendor[];
          vendorsData.push(...validResults);
          
          // Update the state after each batch to show progress
          setVendors(prev => [...prev, ...validResults]);
        }

        // Cache the vendors for future use
        vendorsCache.current = vendorsData;
        setVendors(vendorsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching vendors:", error);
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setExpandedTag(null);
      }
    };

    if (expandedTag !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [expandedTag]);


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

  const toggleCategory = (category: string) => {
    // Force re-render with state update
    setFilterApplied(prev => !prev);
    
    const isSelected = selectedCategories.includes(category);
    
    const newSelectedCategories = isSelected
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    console.log(`Toggling category: ${category}, new selection:`, newSelectedCategories);

    // Update selected categories immediately to trigger filtering
    setSelectedCategories(newSelectedCategories);

    if (isSelected) {
      // Remove all subtags related to this category
      setSelectedSubTags((prev) =>
        prev.filter((tag) => !nestedTags[category].map(t => t.toLowerCase()).includes(tag.toLowerCase()))
      );
      setExpandedTag(null);
    } else {
      // Set this category as the expanded tag to show subtags
      setExpandedTag(category);
    }
  };

  // Toggle subtag selection
  const toggleSubTag = (subTag: string) => {
    setFilterApplied(prev => !prev);

    const isSelected = selectedSubTags.some(tag => tag.toLowerCase() === subTag.toLowerCase());

    const newSelectedSubTags = isSelected
      ? selectedSubTags.filter((tag) => tag.toLowerCase() !== subTag.toLowerCase())
      : [...selectedSubTags, subTag];

    console.log(`Toggling subtag: ${subTag}, new selection:`, newSelectedSubTags);

    setSelectedSubTags(newSelectedSubTags);
  };


  // Update delayed query after user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDelayedQuery(searchQuery);
    }, 1000); // Wait for 1 second after typing stops

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const filteredVendors = useMemo(() => {
  console.log("Filtering vendors with:");
  console.log(`- Selected categories: ${selectedCategories.join(', ')}`);
  console.log(`- Selected subtags: ${selectedSubTags.join(', ')}`);
  console.log(`- Search query: ${searchQuery}`);

  if (vendors.length === 0) {
    console.log("No vendors to filter");
    return [];
  }

  const results = vendors.filter((vendor) => {
    if (!vendor.address) return false;

    // Location filter
    const addressParts = vendor.address.split(',');
    const city = addressParts[1]?.trim().toLowerCase() || '';
    const state = addressParts[2]?.trim().toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    const matchesCityOrState = !query || city.includes(query) || state.includes(query);
    if (!matchesCityOrState) return false;

    // Convert vendor tags to lowercase for case-insensitive comparison
    const vendorTags = (vendor.tags || []).map(tag => tag.toLowerCase());

    // If no categories selected, return all vendors
    if (selectedCategories.length === 0) return true;

    // Filter by category and subtag combo
    return selectedCategories.some((category) => {
      const categoryKey = category.toLowerCase();
      const hasCategoryTag = vendorTags.includes(categoryKey);

      // If no subtags selected → only check for category tag
      if (selectedSubTags.length === 0) {
        return hasCategoryTag;
      }

      // Only consider subtags from this category
      const categorySubtags = nestedTags[category].map(tag => tag.toLowerCase()) || [];
      const activeSubtagsForCategory = selectedSubTags.map(tag => tag.toLowerCase()).filter((tag) =>
        categorySubtags.includes(tag)
      );

      // If subtags selected for this category → must match category AND one subtag
      if (activeSubtagsForCategory.length > 0) {
        return (
          hasCategoryTag &&
          activeSubtagsForCategory.some((subtag) => vendorTags.includes(subtag))
        );
      }

      // Fallback to category-only match
      return hasCategoryTag;
    });
  });

  console.log(`Filtered vendors: ${results.length} out of ${vendors.length}`);
  return results;
}, [vendors, selectedCategories, selectedSubTags, searchQuery, filterApplied]);


  const displayVendors = useMemo(() => {
    return filteredVendors.map(vendor => {
      // Log the vendor data to check images
      console.log(`Vendor ${vendor.businessName} images:`, vendor.images);
      
      // Handle empty address case
      if (!vendor.address) {
        return {
          ...vendor,
          city: '',
          state: '',
          description: `${vendor.offersHome ? 'Home services available. ' : ''}${vendor.offersDrive ? 'Drive-in services available.' : ''}`
        };
      }
      
      const addressParts = vendor.address.split(',');
      const city = addressParts[1]?.trim() || '';
      const stateZip = addressParts[2]?.trim() || '';
      const state = stateZip.split(' ')[0] || '';

      return {
        ...vendor,
        city,
        state,
        description: `${vendor.offersHome ? 'Home services available. ' : ''}${vendor.offersDrive ? 'Drive-in services available.' : ''}`
      };
    });
  }, [filteredVendors]);

  // Handle map loaded event
  const handleMapLoaded = () => {
    setMapLoaded(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="p-4 flex flex-wrap items-center gap-2">
        <Input
          type="text"
          placeholder="Search by city or state..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setFilterApplied(prev => !prev); // Force re-render
          }}
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
              <div 
              ref={dropdownRef}
              className="absolute top-full left-0 mt-2 flex flex-wrap gap-1 z-10 bg-white border rounded shadow-lg p-2 min-w-[200px]">
                {nestedTags[category].map((subTag) => (
                  <Badge
                    key={subTag}
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent event bubbling
                      toggleSubTag(subTag);
                    }}
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
        <div className="w-full md:w-[50%] border-r p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {loading ? "Loading..." : 
               `Showing ${filteredVendors.length} ${filteredVendors.length === 1 ? 'vendor' : 'vendors'}`}
            </p>
            
            {(selectedCategories.length > 0 || selectedSubTags.length > 0) && (
              <button 
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedSubTags([]);
                  setExpandedTag(null);
                  setFilterApplied(prev => !prev);
                }}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Loading vendors...</p>
                </div>
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <VendorCard key={vendor.id} {...vendor} />
                ))
              ) : (
                <p className="text-gray-500 text-sm">No vendors found matching your criteria.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="hidden md:flex flex-1 bg-gray-100 items-center justify-center">
          {displayVendors.length > 0 ? (
            <Map
              vendors={displayVendors}
              userLocation={userLocation}
              searchQuery={delayedQuery}
              onMapLoaded={handleMapLoaded}
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