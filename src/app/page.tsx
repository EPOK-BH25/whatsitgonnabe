"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VendorCard } from "@/components/vendors-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Map } from "@/components/map";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Vendor } from "../../core/interface";


export default function Home() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);


  useEffect(() => {
    const fetchVendors = async () => {
      if (!db) return;

      const vendorSnapshot = await getDocs(collection(db, "vendor"));
      const vendorData: Vendor[] = [];

      for (const vendorDoc of vendorSnapshot.docs) {
        const vendor = vendorDoc.data();

        // Fetch nested services
        const servicesSnapshot = await getDocs(collection(db, "vendor", vendorDoc.id, "services"));
        const tags: string[] = [];

        servicesSnapshot.forEach(serviceDoc => {
          const data = serviceDoc.data();
          Object.entries(data).forEach(([category, serviceItems]) => {
            if (typeof serviceItems === "object" && serviceItems !== null) {
              Object.entries(serviceItems).forEach(([key, val]) => {
                if (val === true) {
                  tags.push(key.charAt(0).toUpperCase() + key.slice(1)); // Capitalize
                }
              });
            }
          });
        });

        vendorData.push({
          id: vendorDoc.id,
          businessName: vendor.businessName || "Unnamed Vendor",
          address: vendor.address || "",
          email: vendor.email || "",
          tags,
          images: vendor.images || [],
          paymentOptions: vendor.paymentOptions || {},
          city: "",   // You can parse from address later if needed
          state: "",  // Same here
        });

      }

      setVendors(vendorData);
      console.log("Fetched vendorData:", vendorData);
    };

    fetchVendors();
  }, []);

  const tagCategories: Record<"Hair" | "Nails" | "Makeup", string[]> = {
    Hair: ["Haircuts", "Treatments", "Coloring"],
    Nails: ["Acrylics", "Gel-X", "Dip Powder"],
    Makeup: ["Natural", "Glam", "Bridal"],
  };


  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
      );
  }

  const handleCategoryClick = (category: string) => {
    setExpandedCategory((prev) => (prev === category ? null : category));
  }

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setExpandedCategory(null);
  };


  const filteredVendors = vendors.filter((vendor) => {
    const query = searchQuery.toLowerCase();

    const matchesAddress = vendor.address?.toLowerCase().includes(query);
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => vendor.tags.includes(tag));

    return matchesAddress && matchesTags;
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

          {Object.keys(tagCategories).map((category) => (
            <div key={category} className="relative">
              <Badge
                onClick={() => handleCategoryClick(category)}
                className={cn(
                  "cursor-pointer select-none px-4 py-2 rounded-full text-sm font-medium transition",
                  expandedCategory === category
                    ? "bg-black text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {category}
              </Badge>

              {expandedCategory === category && (
                <div className="absolute top-full mt-2 left-0 z-10 bg-white border rounded-md shadow-md p-2 space-y-1 w-max">
                  {(tagCategories[category as keyof typeof tagCategories] || []).map((subTag) => (
                    <div
                      key={subTag}
                      onClick={() => toggleTag(subTag)}
                      className={cn(
                        "cursor-pointer text-sm px-3 py-1 rounded hover:bg-gray-100",
                        selectedTags.includes(subTag) && "bg-black text-white"
                      )}
                    >
                      {subTag}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {selectedTags.length > 0 || searchQuery !== "" ? (
            <Badge
              onClick={clearFilters}
              className="bg-gray-200 text-gray-800 hover:bg-gray-300 cursor-pointer  p-2 ml-2 transition"
            >
              Clear Filters  ✖
            </Badge>
          ) : null}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[50%] border-r p-4 flex flex-col gap-4">
          <ScrollArea className="flex-1">
            <div className="space-y-4">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor, index) => (
                  <VendorCard key={index} {...vendor} />
                ))
              ) : (
                <p className="text-gray-500 text-sm">No vendors found.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          <Map vendors={filteredVendors} />
        </div>
      </div>
    </div>
  );
}
