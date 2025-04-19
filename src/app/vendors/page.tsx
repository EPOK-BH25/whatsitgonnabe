"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Icons } from "@/components/icons";
import { Loader2, Image as ImageIcon } from "lucide-react";

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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">All Vendors</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : vendors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="overflow-hidden">
              <div className="relative h-48">
                {vendor.images && vendor.images.length > 0 ? (
                  <Image
                    src={vendor.images[0]}
                    alt={vendor.businessName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2">{vendor.businessName}</h2>
                <p className="text-sm text-gray-500 mb-2">{vendor.address}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {vendor.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex justify-between">
                  <Link href={`/vendor/${vendor.id}`}>
                    <Button variant="outline" size="sm">View Profile</Button>
                  </Link>
                  <Link href={`/vendor/${vendor.id}/dashboard`}>
                    <Button variant="outline" size="sm">Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No vendors found.</p>
      )}
    </div>
  );
} 