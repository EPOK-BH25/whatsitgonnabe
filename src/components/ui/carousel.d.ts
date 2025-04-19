import * as React from "react";

export interface CarouselProps {
  children: React.ReactNode;
  className?: string;
}

export interface CarouselContentProps {
  children: React.ReactNode;
  className?: string;
}

export interface CarouselItemProps {
  children: React.ReactNode;
  className?: string;
}

export function Carousel(props: CarouselProps): JSX.Element;
export function CarouselContent(props: CarouselContentProps): JSX.Element;
export function CarouselItem(props: CarouselItemProps): JSX.Element;
export function CarouselPrevious(props: { className?: string }): JSX.Element;
export function CarouselNext(props: { className?: string }): JSX.Element; 