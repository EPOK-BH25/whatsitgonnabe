import { VendorCard } from "./vendors-card";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface VendorsBentoGridProps {
  vendors: any[];
  className?: string;
}

export function VendorsBentoGrid({ vendors, className }: VendorsBentoGridProps) {
  // Create a state to store the randomized positions
  const [randomizedVendors, setRandomizedVendors] = useState<any[]>([]);
  
  // Randomize the vendors on component mount
  useEffect(() => {
    // Create a copy of the vendors array
    const vendorsCopy = [...vendors];
    
    // Fisher-Yates shuffle algorithm
    for (let i = vendorsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [vendorsCopy[i], vendorsCopy[j]] = [vendorsCopy[j], vendorsCopy[i]];
    }
    
    setRandomizedVendors(vendorsCopy);
  }, [vendors]);

  return (
    <motion.div 
      className={cn("grid grid-cols-3 gap-4 auto-rows-[200px]", className)}
      layout
    >
      <AnimatePresence mode="popLayout">
        {randomizedVendors.map((vendor, index) => {
          // Create a bento box pattern with varying sizes
          let sizeClass = "";
          
          // Pattern repeats every 5 items
          const patternIndex = index % 5;
          
          switch (patternIndex) {
            case 0:
              sizeClass = "col-span-1 row-span-2"; 
              break;
            case 1:
              sizeClass = "col-span-2 row-span-1"; 
              break;
            case 2:
              sizeClass = "col-span-1 row-span-1"; 
              break;
            case 3:
              sizeClass = "col-span-1 row-span-2"; 
              break;
            case 4:
              sizeClass = "col-span-2 row-span-1"; 
              break;
          }

          return (
            <motion.div
              key={vendor.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                opacity: { duration: 0.3 },
                layout: { duration: 0.3 },
                scale: { duration: 0.3 }
              }}
              className={cn(
                "transition-all duration-300 hover:scale-[1.02]",
                sizeClass
              )}
            >
              <VendorCard
                {...vendor}
                className="h-full"
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
} 