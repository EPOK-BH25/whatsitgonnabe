import { useState } from "react";
import Link from "next/link";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

// Function to generate random pastel olive hues
function getRandomPastelOlive() {
  // Base olive hue is around 60-80
  const hue = 60 + Math.random() * 20;
  // Keep saturation low for pastel effect (20-40%)
  const saturation = 20 + Math.random() * 20;
  // Keep lightness high for pastel effect (80-90%)
  const lightness = 80 + Math.random() * 10;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

interface VendorCardProps {
  id?: string;
  businessName: string;
  tags: string[];
  description?: string;
  city: string;
  state: string;
  links?: string[];
  amenities?: string[];
  rating?: number;
  reviewCount?: number;
  className?: string;
}

export function VendorCard({
  id,
  businessName,
  tags,
  description,
  city,
  state,
  links = [],
  amenities = [],
  rating,
  reviewCount,
  className,
}: VendorCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [backgroundColor] = useState(getRandomPastelOlive);

  return (
    <Card
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "p-4 h-full flex flex-col transition-all duration-300",
        "border border-gray-200/50 hover:border-gray-300/50",
        "shadow-lg hover:shadow-2xl hover:-translate-y-1",
        className
      )}
      style={{ backgroundColor }}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <Link
            href={id ? `/vendor/${id}` : links[0] ?? "#"}
            onClick={(e) => e.stopPropagation()}
            target={id ? undefined : "_blank"}
            rel={id ? undefined : "noopener noreferrer"}
            className="text-xl font-semibold text-black hover:underline line-clamp-2 transition-transform duration-300 hover:scale-105"
          >
            {businessName}
          </Link>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.slice(0, 3).map((tag, index) => (
            <Badge 
              key={index} 
              variant="outline"
              className="text-xs px-2 py-0.5 bg-white/50 transition-transform duration-300 hover:scale-110"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{description}</p>
        )}

        <div className="mt-auto">
          <p className="text-sm text-muted-foreground">
            {city}, {state}
          </p>
          {rating && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-sm font-medium">{rating}</span>
              <span className="text-sm text-muted-foreground">
                ({reviewCount} reviews)
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
