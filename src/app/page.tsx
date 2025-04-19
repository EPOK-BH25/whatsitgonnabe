"use client";

import { useState } from "react";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VendorCard } from "@/components/vendors-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Map } from "@/components/map";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);


  const vendors = [
    {
      businessName: "Glow Beauty Bar",
      tags: ["Hair", "Nails", "Makeup"],
      description: "Providing glam services for all occasions.",
      city: "Los Angeles",
      state: "CA",
    },
    {
      businessName: "City Styles",
      tags: ["Haircuts", "Color"],
      description: "Trendy haircuts and styling from pro stylists.",
      city: "New York",
      state: "NY",
    },
  ];

  const tags = ["Hair", "Nails", "Makeup", "Color", "Haircuts"];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
      );
  }

  const filteredVendors = vendors.filter((vendor) => {
    const query = searchQuery.toLowerCase();

    const matchesCityOrState = vendor.city.toLowerCase().includes(query) || vendor.state.toLowerCase().includes(query);
    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) =>  vendor.tags.includes(tag));

    return matchesCityOrState && matchesTags;
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
