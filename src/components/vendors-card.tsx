
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface VendorCardProps {
  businessName: string;
  tags: string[];
  description: string;
  city: string;
  state: string;
  className?: string;
}

export function VendorCard({
  businessName,
  tags,
  description,
  city,
  state,
  className,
}: VendorCardProps) {
  return (
    <Card className={cn("p-4 space-y-2 shadow-md", className)}>
      <h3 className="text-xl font-semibold">{businessName}</h3>
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
    </Card>
  );
}
