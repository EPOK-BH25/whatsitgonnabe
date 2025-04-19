import { useState } from "react";
import Link from "next/link";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

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

  return (
    <Card
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "p-4 space-y-2 shadow-md cursor-pointer hover:shadow-lg transition",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <Link
          href={id ? `/vendor/${id}` : links[0] ?? "#"}
          onClick={(e) => e.stopPropagation()}
          target={id ? undefined : "_blank"}
          rel={id ? undefined : "noopener noreferrer"}
          className="text-xl font-semibold text-black hover:underline"
        >
          {businessName}
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="outline">
            {tag}
          </Badge>
        ))}
      </div>

      <p className="text-sm text-gray-600">{description}</p>
      <p className="text-sm text-muted-foreground">
        {city}, {state}
      </p>

      {expanded && (
        <div className="mt-3 space-y-2">
          {rating && (
            <div>
              <p className="font-semibold text-sm">⭐ {rating} ({reviewCount} reviews)</p>
            </div>
          )}

          {amenities.length > 0 && (
            <div>
              <p className="font-semibold text-sm">Amenities:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {amenities.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-3 py-1">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {links.length > 1 && (
            <div className="pt-2 space-y-1">
              {links.slice(1).map((link, index) => (
                <Link
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline hover:text-blue-800 block"
                  onClick={(e) => e.stopPropagation()}
                >
                  Extra Link {index + 1}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
