"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CarouselProps = {
  children: React.ReactNode;
  className?: string;
};

export type CarouselContentProps = {
  children: React.ReactNode;
  className?: string;
};

export type CarouselItemProps = {
  children: React.ReactNode;
  className?: string;
};

type CarouselButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick: () => void;
};

export function Carousel({ children, className }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [items, setItems] = React.useState<React.ReactNode[]>([]);

  React.useEffect(() => {
    if (React.Children.count(children) > 0) {
      setItems(React.Children.toArray(children));
    }
  }, [children]);

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  return (
    <div className={cn("relative", className)}>
      {items[currentIndex]}
      <CarouselButton
        className="absolute left-4 top-1/2 -translate-y-1/2"
        onClick={goToPrevious}
      >
        <ChevronLeft className="h-6 w-6" />
      </CarouselButton>
      <CarouselButton
        className="absolute right-4 top-1/2 -translate-y-1/2"
        onClick={goToNext}
      >
        <ChevronRight className="h-6 w-6" />
      </CarouselButton>
    </div>
  );
}

export function CarouselContent({ children, className }: CarouselContentProps) {
  return <div className={cn("", className)}>{children}</div>;
}

export function CarouselItem({ children, className }: CarouselItemProps) {
  return <div className={cn("", className)}>{children}</div>;
}

export function CarouselPrevious({ className }: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

export function CarouselNext({ className }: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm",
        className
      )}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

function CarouselButton({ children, className, onClick }: CarouselButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Button>
  );
} 