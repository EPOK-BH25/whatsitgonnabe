import { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (!db) {
    return {
      title: "Vendor Not Found",
    };
  }

  try {
    const vendorRef = doc(db, "vendor", params.id);
    const vendorSnap = await getDoc(vendorRef);
    
    if (!vendorSnap.exists()) {
      return {
        title: "Vendor Not Found",
      };
    }

    const vendor = vendorSnap.data();
    const imageUrl = vendor.images && vendor.images.length > 0 
      ? vendor.images[0] 
      : "/placeholder-image.jpg";

    return {
      title: vendor.businessName,
      description: `${vendor.businessName} - ${vendor.offersHome ? 'Home services' : ''} ${vendor.offersDrive ? 'Drive-in services' : ''} available in ${vendor.address}`,
      openGraph: {
        title: vendor.businessName,
        description: `${vendor.businessName} - ${vendor.offersHome ? 'Home services' : ''} ${vendor.offersDrive ? 'Drive-in services' : ''} available in ${vendor.address}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: vendor.businessName,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: vendor.businessName,
        description: `${vendor.businessName} - ${vendor.offersHome ? 'Home services' : ''} ${vendor.offersDrive ? 'Drive-in services' : ''} available in ${vendor.address}`,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Vendor Not Found",
    };
  }
} 