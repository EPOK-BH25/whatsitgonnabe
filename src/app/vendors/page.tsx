"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface VendorData {
  id: string;
  businessName: string;
  address: string;
  email: string;
  phoneNumber: string;
  images: string[];
  tags: string[];
}

export default function VendorsList() {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      if (!db) return;
      
      try {
        const vendorsRef = collection(db, "vendor");
        const querySnapshot = await getDocs(vendorsRef);
        
        const vendorsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VendorData[];
        
        setVendors(vendorsData);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">All Vendors</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="p-6">
            <div className="aspect-video w-full overflow-hidden rounded-md mb-4">
              <img
                src={vendor.images[0] || "/placeholder-image.jpg"}
                alt={vendor.businessName}
                className="h-full w-full object-cover"
              />
            </div>
            <h2 className="text-xl font-semibold">{vendor.businessName}</h2>
            <p className="text-gray-600 mt-1">{vendor.address}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {vendor.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
            <Link 
              href={`/vendor/${vendor.id}`}
              className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              View Profile
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
} 