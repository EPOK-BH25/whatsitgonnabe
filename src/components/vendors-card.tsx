import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Vendor } from "../../core/interface";
import { ChevronDown, Home, Car, Check, Star } from "lucide-react";

export function VendorCard({
  id,
  businessName,
  address,
  email,
  phoneNumber,
  images,
  tags,
  offersDrive,
  offersHome,
  paymentOptions,
  socialmedia,
  reviewCount = 0,
  averageRating = 0,
}: Vendor) {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Parse city/state from address if possible
  const addressParts = address.split(",");
  const city = addressParts[1]?.trim() || "City";
  const state = addressParts[2]?.trim() || "State";

  const amenities = Object.entries(paymentOptions)
    .filter(([_, accepted]) => accepted)
    .map(([method]) => method);

  const primaryImage = images && images.length > 0 ? images[0] : null;

  // Function to scroll to the corresponding marker on the map
  const scrollToMarker = () => {
    // Use the global centerOnVendor function
    if (typeof window !== 'undefined' && (window as any).centerOnVendor) {
      (window as any).centerOnVendor(id);
    }
  };

  // Handle card click
  const handleCardClick = () => {
    setExpanded(!expanded);
    if (!expanded) {
      // When expanding, scroll to the marker after a short delay
      setTimeout(scrollToMarker, 100);
    }
  };

  return (
    <Card
      ref={cardRef}
      onClick={handleCardClick}
      className={cn(
        "p-4 space-y-2 shadow-md cursor-pointer hover:shadow-lg transition bg-[#D2EFE2]"
      )}
    >
      <div className="flex items-start gap-4">
        {primaryImage ? (
          <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
            <img
              src={primaryImage}
              alt={businessName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="w-16 h-16 rounded bg-[#B8E5D0] flex-shrink-0 flex items-center justify-center">
            <span className="text-[#4A8A6F] text-xs">No image</span>
          </div>
        )}
        <div className="flex-1">
          <Link
            href={`/vendor/${id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xl font-semibold text-black hover:underline"
          >
            {businessName}
          </Link>
          {reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.round(averageRating) ? "text-yellow-500" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-1">
                ({reviewCount})
              </span>
            </div>
          )}
        </div>
        <ChevronDown 
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-300",
            expanded ? "transform rotate-180" : ""
          )}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge 
            key={index} 
            variant="outline"
            className="bg-[#B8E5D0] text-[#2A6A4F] border-[#A8D5C0] hover:bg-[#A8D5C0]"
          >
            {tag}
          </Badge>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {offersHome && (
          <div className="flex items-center gap-2 text-sm text-[#2A6A4F]">
            <Home className="h-4 w-4 text-[#3A7A5F]" />
            <span>Home services available</span>
            <Check className="h-3 w-3 text-[#4A8A6F] ml-1" />
          </div>
        )}
        {offersDrive && (
          <div className="flex items-center gap-2 text-sm text-[#2A6A4F]">
            <Car className="h-4 w-4 text-[#3A7A5F]" />
            <span>Drive-in services available</span>
            <Check className="h-3 w-3 text-[#4A8A6F] ml-1" />
          </div>
        )}
      </div>

      <p className="text-sm text-[#2A6A4F]">
        {city}, {state}
      </p>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div>
            <p className="font-semibold text-sm text-[#1A5A3F]">Contact:</p>
            <p className="text-sm text-[#2A6A4F]">{email}</p>
            <p className="text-sm text-[#2A6A4F]">{phoneNumber}</p>
          </div>

          {amenities.length > 0 && (
            <div>
              <p className="font-semibold text-sm text-[#1A5A3F]">Accepted Payments:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {amenities.map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-3 py-1 bg-[#B8E5D0] text-[#2A6A4F] hover:bg-[#A8D5C0]"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
