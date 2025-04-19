"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, X, Instagram, Facebook, Twitter, Youtube, Linkedin, Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";

interface VendorData {
  id: string;
  businessName: string;
  address: string;
  email: string;
  phoneNumber: string;
  images: string[];
  tags: string[];
  offersDrive: boolean;
  offersHome: boolean;
  paymentOptions: {
    cash: boolean;
    cashapp: boolean;
    credit: boolean;
    debit: boolean;
    paypal: boolean;
    tap: boolean;
    venmo: boolean;
    zelle: boolean;
  };
  socialmedia: string[];
}

interface Service {
  id: string;
  name: string;
  enabled: boolean;
}

interface ServicesData {
  hair: Service[];
  nails: Service[];
  makeup: Service[];
}

interface SocialMediaLink {
  platform: string;
  value: string;
}

const defaultServices: ServicesData = {
  hair: [
    { id: "brazilian", name: "Brazilian", enabled: false },
    { id: "brows", name: "Brows", enabled: false },
    { id: "color", name: "Color", enabled: false },
    { id: "extensions", name: "Extensions", enabled: false },
    { id: "haircuts", name: "Haircuts", enabled: false },
    { id: "laser", name: "Laser", enabled: false },
    { id: "restoration", name: "Restoration", enabled: false },
    { id: "treatments", name: "Treatments", enabled: false },
    { id: "wax", name: "Wax", enabled: false }
  ],
  nails: [
    { id: "acrylics", name: "Acrylics", enabled: false },
    { id: "manicure", name: "Manicure", enabled: false },
    { id: "pedicure", name: "Pedicure", enabled: false }
  ],
  makeup: [
    { id: "bridal", name: "Bridal", enabled: false },
    { id: "natural", name: "Natural", enabled: false },
    { id: "prom", name: "Prom", enabled: false },
    { id: "tattooCover", name: "Tattoo Cover", enabled: false }
  ]
};

export default function VendorDashboard() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [editedVendor, setEditedVendor] = useState<VendorData | null>(null);
  const [services, setServices] = useState<ServicesData>({ 
    hair: [
      { id: "brazilian", name: "Brazilian", enabled: false },
      { id: "brows", name: "Brows", enabled: false },
      { id: "color", name: "Color", enabled: false },
      { id: "extensions", name: "Extensions", enabled: false },
      { id: "haircuts", name: "Haircuts", enabled: false },
      { id: "laser", name: "Laser", enabled: false },
      { id: "restoration", name: "Restoration", enabled: false },
      { id: "treatments", name: "Treatments", enabled: false },
      { id: "wax", name: "Wax", enabled: false }
    ],
    nails: [
      { id: "acrylics", name: "Acrylics", enabled: false },
      { id: "manicure", name: "Manicure", enabled: false },
      { id: "pedicure", name: "Pedicure", enabled: false }
    ],
    makeup: [
      { id: "bridal", name: "Bridal", enabled: false },
      { id: "natural", name: "Natural", enabled: false },
      { id: "prom", name: "Prom", enabled: false },
      { id: "tattooCover", name: "Tattoo Cover", enabled: false }
    ]
  });
  const [editedServices, setEditedServices] = useState<ServicesData>({ 
    hair: [
      { id: "brazilian", name: "Brazilian", enabled: false },
      { id: "brows", name: "Brows", enabled: false },
      { id: "color", name: "Color", enabled: false },
      { id: "extensions", name: "Extensions", enabled: false },
      { id: "haircuts", name: "Haircuts", enabled: false },
      { id: "laser", name: "Laser", enabled: false },
      { id: "restoration", name: "Restoration", enabled: false },
      { id: "treatments", name: "Treatments", enabled: false },
      { id: "wax", name: "Wax", enabled: false }
    ],
    nails: [
      { id: "acrylics", name: "Acrylics", enabled: false },
      { id: "manicure", name: "Manicure", enabled: false },
      { id: "pedicure", name: "Pedicure", enabled: false }
    ],
    makeup: [
      { id: "bridal", name: "Bridal", enabled: false },
      { id: "natural", name: "Natural", enabled: false },
      { id: "prom", name: "Prom", enabled: false },
      { id: "tattooCover", name: "Tattoo Cover", enabled: false }
    ]
  });
  const [socialMediaLinks, setSocialMediaLinks] = useState<SocialMediaLink[]>([]);
  const [newSocialMediaLink, setNewSocialMediaLink] = useState<SocialMediaLink>({ platform: "instagram", value: "" });
  const [activeTab, setActiveTab] = useState("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch vendor data and services
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!vendorId || !db) return;
      
      try {
        // Fetch vendor document
        const vendorRef = doc(db, "vendor", vendorId);
        const vendorSnap = await getDoc(vendorRef);
        
        if (vendorSnap.exists()) {
          const vendorData = { id: vendorSnap.id, ...vendorSnap.data() } as VendorData;
          setVendor(vendorData);
          setEditedVendor(vendorData);
          
          // Parse social media links
          const parsedLinks = parseSocialMediaLinks(vendorData.socialmedia);
          setSocialMediaLinks(parsedLinks);
          
          // Initialize services based on tags
          const initialServices: ServicesData = {
            hair: defaultServices.hair.map(service => ({
              ...service,
              enabled: vendorData.tags.includes(service.name)
            })),
            nails: defaultServices.nails.map(service => ({
              ...service,
              enabled: vendorData.tags.includes(service.name)
            })),
            makeup: defaultServices.makeup.map(service => ({
              ...service,
              enabled: vendorData.tags.includes(service.name)
            }))
          };
          
          setServices(initialServices);
          setEditedServices(initialServices);
        } else {
          toast.error("Vendor not found");
          router.push("/vendors");
        }
      } catch (error) {
        console.error("Error fetching vendor data:", error);
        toast.error("Failed to load vendor data");
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId, router]);

  const parseSocialMediaLinks = (links: string[]): SocialMediaLink[] => {
    return links.map(link => {
      if (link.includes("instagram.com") || link.startsWith("@")) {
        const handle = link.startsWith("@") ? link : link.split("/").pop() || "";
        return { platform: "instagram", value: handle };
      } else if (link.includes("facebook.com")) {
        return { platform: "facebook", value: link };
      } else if (link.includes("twitter.com") || link.includes("x.com")) {
        return { platform: "twitter", value: link };
      } else if (link.includes("youtube.com")) {
        return { platform: "youtube", value: link };
      } else if (link.includes("tiktok.com")) {
        return { platform: "tiktok", value: link };
      } else if (link.includes("linkedin.com")) {
        return { platform: "linkedin", value: link };
      } else {
        return { platform: "website", value: link };
      }
    });
  };

  const formatSocialMediaLink = (link: SocialMediaLink): string => {
    switch (link.platform) {
      case "instagram":
        const handle = link.value.startsWith("@") ? link.value.substring(1) : link.value;
        return `https://instagram.com/${handle}`;
      case "facebook":
        return link.value.startsWith("http") ? link.value : `https://facebook.com/${link.value}`;
      case "twitter":
        return link.value.startsWith("http") ? link.value : `https://twitter.com/${link.value}`;
      case "youtube":
        return link.value.startsWith("http") ? link.value : `https://youtube.com/${link.value}`;
      case "tiktok":
        return link.value.startsWith("http") ? link.value : `https://tiktok.com/@${link.value}`;
      case "linkedin":
        return link.value.startsWith("http") ? link.value : `https://linkedin.com/in/${link.value}`;
      case "website":
        return link.value.startsWith("http") ? link.value : `https://${link.value}`;
      default:
        return link.value;
    }
  };

  const getSocialMediaIcon = (platform: string) => {
    switch (platform) {
      case "instagram":
        return <Instagram className="h-5 w-5" />;
      case "facebook":
        return <Facebook className="h-5 w-5" />;
      case "twitter":
        return <Twitter className="h-5 w-5" />;
      case "youtube":
        return <Youtube className="h-5 w-5" />;
      case "tiktok":
        return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>;
      case "linkedin":
        return <Linkedin className="h-5 w-5" />;
      default:
        return <Globe className="h-5 w-5" />;
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!editedVendor) return;
    
    setEditedVendor({
      ...editedVendor,
      [field]: value
    });
  };

  const handlePaymentOptionChange = (option: string, checked: boolean) => {
    if (!editedVendor) return;
    
    setEditedVendor({
      ...editedVendor,
      paymentOptions: {
        ...editedVendor.paymentOptions,
        [option]: checked
      }
    });
  };

  const handleServiceChange = (category: keyof ServicesData, serviceId: string, enabled: boolean) => {
    if (!editedServices || !editedVendor) return;
    
    // Update the service state
    const updatedServices = { ...editedServices };
    const serviceIndex = updatedServices[category].findIndex(s => s.id === serviceId);
    
    if (serviceIndex !== -1) {
      updatedServices[category][serviceIndex].enabled = enabled;
      setEditedServices(updatedServices);
      
      // Get the service name
      const serviceName = updatedServices[category][serviceIndex].name;
      
      // Update the tags array
      let updatedTags = [...editedVendor.tags];
      
      if (enabled) {
        // Add the service tag if it's not already there
        if (!updatedTags.includes(serviceName)) {
          updatedTags.push(serviceName);
        }
        
        // Add category tag if needed
        const categoryTag = category.charAt(0).toUpperCase() + category.slice(1);
        if (!updatedTags.includes(categoryTag)) {
          updatedTags.push(categoryTag);
        }
      } else {
        // Remove the service tag
        updatedTags = updatedTags.filter(tag => tag !== serviceName);
        
        // Check if we should remove the category tag
        const categoryTag = category.charAt(0).toUpperCase() + category.slice(1);
        const hasOtherEnabledServices = updatedServices[category].some(s => s.enabled);
        if (!hasOtherEnabledServices) {
          updatedTags = updatedTags.filter(tag => tag !== categoryTag);
        }
      }
      
      // Update the edited vendor with the new tags
      setEditedVendor({
        ...editedVendor,
        tags: updatedTags
      });
    }
  };

  const handleAddSocialMediaLink = () => {
    if (!newSocialMediaLink.value) return;
    
    setSocialMediaLinks([...socialMediaLinks, newSocialMediaLink]);
    setNewSocialMediaLink({ platform: "instagram", value: "" });
  };

  const handleRemoveSocialMediaLink = (index: number) => {
    const updatedLinks = [...socialMediaLinks];
    updatedLinks.splice(index, 1);
    setSocialMediaLinks(updatedLinks);
  };

  const handleRemoveAllSocialMediaLinks = () => {
    setSocialMediaLinks([]);
  };

  const handleSave = async () => {
    if (!editedVendor || !vendorId || !db) return;
    
    setSaving(true);
    
    try {
      // Update vendor document
      const vendorRef = doc(db, "vendor", vendorId);
      
      // Format social media links
      const formattedSocialMediaLinks = socialMediaLinks.map(link => formatSocialMediaLink(link));
      
      // Update vendor document
      await updateDoc(vendorRef, {
        businessName: editedVendor.businessName,
        address: editedVendor.address,
        email: editedVendor.email,
        phoneNumber: editedVendor.phoneNumber,
        tags: editedVendor.tags,
        offersDrive: editedVendor.offersDrive,
        offersHome: editedVendor.offersHome,
        paymentOptions: editedVendor.paymentOptions,
        socialmedia: formattedSocialMediaLinks
      });
      
      setVendor({
        ...editedVendor,
        socialmedia: formattedSocialMediaLinks
      });
      
      toast.success("Vendor information updated successfully");
    } catch (error) {
      console.error("Error updating vendor:", error);
      toast.error("Failed to update vendor information");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editedVendor || !vendorId || !db) return;
    
    setUploadingImage(true);
    
    try {
      const file = e.target.files[0];
      const imageRef = ref(storage!, `vendorImages/${vendorId}/${Date.now()}_${file.name}`);
      
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      const updatedImages = [...(editedVendor.images || []), downloadURL];
      
      // Update vendor document with new image URL
      const vendorRef = doc(db, "vendor", vendorId);
      await updateDoc(vendorRef, {
        images: updatedImages
      });
      
      setEditedVendor({
        ...editedVendor,
        images: updatedImages
      });
      
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (!editedVendor || !vendorId || !db) return;
    
    try {
      // Extract the path from the URL
      const imagePath = imageUrl.split("/o/")[1].split("?")[0];
      const decodedPath = decodeURIComponent(imagePath);
      const imageRef = ref(storage!, decodedPath);
      
      // Delete the image from storage
      await deleteObject(imageRef);
      
      // Update vendor document
      const updatedImages = editedVendor.images.filter(img => img !== imageUrl);
      const vendorRef = doc(db, "vendor", vendorId);
      await updateDoc(vendorRef, {
        images: updatedImages
      });
      
      setEditedVendor({
        ...editedVendor,
        images: updatedImages
      });
      
      toast.success("Image removed successfully");
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Failed to remove image");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!vendor || !editedVendor) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold">Vendor not found</h1>
        <Button onClick={() => router.push("/vendors")} className="mt-4">
          Back to Vendors
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{vendor.businessName}</h1>
        <Button variant="outline" onClick={() => router.push(`/vendor/${vendorId}`)}>
          View Public Profile
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Business Images</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {editedVendor?.images?.map((imageUrl, index) => (
                    <div key={imageUrl} className="relative group aspect-square">
                      <Image
                        src={imageUrl}
                        alt={`Business image ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveImage(imageUrl)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="aspect-square flex items-center justify-center border-2 border-dashed rounded-lg border-gray-300 hover:border-primary cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}>
                    <div className="text-center">
                      <Plus className="h-8 w-8 mx-auto text-gray-400" />
                      <span className="text-sm text-gray-500">Add Image</span>
                    </div>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={editedVendor.businessName}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={editedVendor.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedVendor.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    value={editedVendor.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Services Offered</Label>
                
                {/* Hair Services */}
                <div className="space-y-2">
                  <h3 className="font-medium">Hair Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {editedServices.hair.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Switch
                          id={`hair-${service.id}`}
                          checked={service.enabled}
                          onCheckedChange={(checked) => handleServiceChange("hair", service.id, checked)}
                        />
                        <Label htmlFor={`hair-${service.id}`}>{service.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Nails Services */}
                <div className="space-y-2">
                  <h3 className="font-medium">Nail Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {editedServices.nails.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Switch
                          id={`nails-${service.id}`}
                          checked={service.enabled}
                          onCheckedChange={(checked) => handleServiceChange("nails", service.id, checked)}
                        />
                        <Label htmlFor={`nails-${service.id}`}>{service.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Makeup Services */}
                <div className="space-y-2">
                  <h3 className="font-medium">Makeup Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {editedServices.makeup.map((service) => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Switch
                          id={`makeup-${service.id}`}
                          checked={service.enabled}
                          onCheckedChange={(checked) => handleServiceChange("makeup", service.id, checked)}
                        />
                        <Label htmlFor={`makeup-${service.id}`}>{service.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Custom Tags */}
                <div className="space-y-2">
                  <Label htmlFor="customTags">Custom Tags</Label>
                  <Textarea
                    id="customTags"
                    value={editedVendor.tags.filter(tag => 
                      !["Hair", "Nails", "Makeup"].includes(tag) && 
                      !editedServices.hair.some(s => s.name === tag) &&
                      !editedServices.nails.some(s => s.name === tag) &&
                      !editedServices.makeup.some(s => s.name === tag)
                    ).join(", ")}
                    onChange={(e) => {
                      const customTags = e.target.value
                        .split(",")
                        .map(tag => tag.trim())
                        .filter(Boolean);
                      
                      // Get service tags
                      const serviceTags = [
                        ...(editedServices.hair.some(s => s.enabled) ? ["Hair"] : []),
                        ...(editedServices.nails.some(s => s.enabled) ? ["Nails"] : []),
                        ...(editedServices.makeup.some(s => s.enabled) ? ["Makeup"] : []),
                        ...editedServices.hair.filter(s => s.enabled).map(s => s.name),
                        ...editedServices.nails.filter(s => s.enabled).map(s => s.name),
                        ...editedServices.makeup.filter(s => s.enabled).map(s => s.name)
                      ];
                      
                      // Combine service tags with custom tags
                      const allTags = [...new Set([...serviceTags, ...customTags])];
                      
                      handleInputChange("tags", allTags);
                    }}
                    placeholder="Enter custom tags separated by commas (e.g., mens haircuts, french pedicure)"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Service Locations</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="offersHome"
                    checked={editedVendor.offersHome}
                    onCheckedChange={(checked) => handleInputChange("offersHome", checked)}
                  />
                  <Label htmlFor="offersHome">Offers home services</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="offersDrive"
                    checked={editedVendor.offersDrive}
                    onCheckedChange={(checked) => handleInputChange("offersDrive", checked)}
                  />
                  <Label htmlFor="offersDrive">Offers drive-in services</Label>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Payment Options</CardTitle>
              <CardDescription>Configure accepted payment methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="cash"
                    checked={editedVendor.paymentOptions.cash}
                    onCheckedChange={(checked) => handlePaymentOptionChange("cash", checked)}
                  />
                  <Label htmlFor="cash">Cash</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="credit"
                    checked={editedVendor.paymentOptions.credit}
                    onCheckedChange={(checked) => handlePaymentOptionChange("credit", checked)}
                  />
                  <Label htmlFor="credit">Credit Card</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="debit"
                    checked={editedVendor.paymentOptions.debit}
                    onCheckedChange={(checked) => handlePaymentOptionChange("debit", checked)}
                  />
                  <Label htmlFor="debit">Debit Card</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="paypal"
                    checked={editedVendor.paymentOptions.paypal}
                    onCheckedChange={(checked) => handlePaymentOptionChange("paypal", checked)}
                  />
                  <Label htmlFor="paypal">PayPal</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="venmo"
                    checked={editedVendor.paymentOptions.venmo}
                    onCheckedChange={(checked) => handlePaymentOptionChange("venmo", checked)}
                  />
                  <Label htmlFor="venmo">Venmo</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="cashapp"
                    checked={editedVendor.paymentOptions.cashapp}
                    onCheckedChange={(checked) => handlePaymentOptionChange("cashapp", checked)}
                  />
                  <Label htmlFor="cashapp">Cash App</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="zelle"
                    checked={editedVendor.paymentOptions.zelle}
                    onCheckedChange={(checked) => handlePaymentOptionChange("zelle", checked)}
                  />
                  <Label htmlFor="zelle">Zelle</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tap"
                    checked={editedVendor.paymentOptions.tap}
                    onCheckedChange={(checked) => handlePaymentOptionChange("tap", checked)}
                  />
                  <Label htmlFor="tap">Tap to Pay</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Social Media Links</Label>
                  {socialMediaLinks.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRemoveAllSocialMediaLinks}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove All
                    </Button>
                  )}
                </div>
                
                <div className="space-y-2">
                  {socialMediaLinks.map((link, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                        {getSocialMediaIcon(link.platform)}
                      </div>
                      <Input
                        value={link.value}
                        onChange={(e) => {
                          const updatedLinks = [...socialMediaLinks];
                          updatedLinks[index].value = e.target.value;
                          setSocialMediaLinks(updatedLinks);
                        }}
                        placeholder={`Enter your ${link.platform} ${link.platform === "instagram" ? "handle" : "link"}`}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSocialMediaLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Select
                    value={newSocialMediaLink.platform}
                    onValueChange={(value) => setNewSocialMediaLink({ ...newSocialMediaLink, platform: value })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    value={newSocialMediaLink.value}
                    onChange={(e) => setNewSocialMediaLink({ ...newSocialMediaLink, value: e.target.value })}
                    placeholder={`Enter your ${newSocialMediaLink.platform} ${newSocialMediaLink.platform === "instagram" ? "handle" : "link"}`}
                    className="flex-1"
                  />
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAddSocialMediaLink}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 