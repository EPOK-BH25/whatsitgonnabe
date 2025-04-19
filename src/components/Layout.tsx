// components/Layout.tsx
import { ReactNode } from "react";
import { Footer } from "./Footer";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
