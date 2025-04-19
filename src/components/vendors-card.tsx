import { useState } from "react";
import Link from "next/link";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Vendor } from "../../core/interface";

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
}: Vendor) {
  const [expanded, setExpanded] = useState(false);

  // Parse city/state from address if possible
  const addressParts = address.split(",");
  const city = addressParts[1]?.trim() || "City";
  const state = addressParts[2]?.trim() || "State";

  const description = `${offersHome ? "Home services available. " : ""}${
    offersDrive ? "Drive-in services available." : ""
  }`;

  const amenities = Object.entries(paymentOptions)
    .filter(([_, accepted]) => accepted)
    .map(([method]) => method);

  const primaryImage = images?.[0];

  return (
    <Card
      onClick={() => setExpanded(!expanded)}
      className={cn(
        "p-4 space-y-2 shadow-md cursor-pointer hover:shadow-lg transition"
      )}
    >
      <div className="flex items-start gap-4">
        {primaryImage && (
          <img
            src={primaryImage}
            alt={businessName}
            className="w-16 h-16 rounded object-cover"
          />
        )}
        <div className="flex-1">
          <Link
            href={`/vendor/${id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xl font-semibold text-black hover:underline"
          >
            {businessName}
          </Link>
        </div>
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
          <div>
            <p className="font-semibold text-sm">Contact:</p>
            <p className="text-sm text-gray-700">{email}</p>
            <p className="text-sm text-gray-700">{phoneNumber}</p>
          </div>

          {amenities.length > 0 && (
            <div>
              <p className="font-semibold text-sm">Accepted Payments:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {amenities.map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs px-3 py-1"
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {socialmedia?.length > 0 && (
            <div className="pt-2 space-y-1">
              {socialmedia.map((link, index) => (
                <Link
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline hover:text-blue-800 block"
                  onClick={(e) => e.stopPropagation()}
                >
                  Social Link {index + 1}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
