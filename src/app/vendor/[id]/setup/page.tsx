"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface VendorSetupForm {
  businessName: string;
  email: string;
  address: string;
  phoneNumber: string;
  offersHome: boolean;
  offersDrive: boolean;
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
  images: string[];
  tags: string[];
  socialmedia: string[];
}

export default function VendorSetup() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<VendorSetupForm>({
    businessName: "",
    email: "",
    address: "",
    phoneNumber: "",
    offersHome: false,
    offersDrive: false,
    paymentOptions: {
      cash: false,
      cashapp: false,
      credit: false,
      debit: false,
      paypal: false,
      tap: false,
      venmo: false,
      zelle: false,
    },
    images: [],
    tags: [],
    socialmedia: [],
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newSocialMedia, setNewSocialMedia] = useState("");

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!params.id || !db) return;

      try {
        const vendorDoc = await getDoc(doc(db, "vendor", params.id as string));
        if (!vendorDoc.exists()) {
          toast({
            title: "Error",
            description: "Vendor not found",
            variant: "destructive",
          });
          router.push("/");
          return;
        }

        const data = vendorDoc.data();
        setFormData({
          businessName: data.businessName || "",
          email: data.email || "",
          address: data.address || "",
          phoneNumber: data.phoneNumber || "",
          offersHome: data.offersHome || false,
          offersDrive: data.offersDrive || false,
          paymentOptions: {
            cash: data.paymentOptions?.cash || false,
            cashapp: data.paymentOptions?.cashapp || false,
            credit: data.paymentOptions?.credit || false,
            debit: data.paymentOptions?.debit || false,
            paypal: data.paymentOptions?.paypal || false,
            tap: data.paymentOptions?.tap || false,
            venmo: data.paymentOptions?.venmo || false,
            zelle: data.paymentOptions?.zelle || false,
          },
          images: data.images || [],
          tags: data.tags || [],
          socialmedia: data.socialmedia || [],
        });
      } catch (error) {
        console.error("Error fetching vendor data:", error);
        toast({
          title: "Error",
          description: "Failed to load vendor data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [params.id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handlePaymentOptionChange = (option: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      paymentOptions: {
        ...prev.paymentOptions,
        [option]: checked,
      },
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (!imageFiles.length || !storage) return [];

    const uploadPromises = imageFiles.map(async (file) => {
      if (!storage) return "";
      
      const storageRef = ref(storage, `vendors/${params.id}/${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    const urls = await Promise.all(uploadPromises);
    return urls;
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddSocialMedia = () => {
    if (newSocialMedia.trim() && !formData.socialmedia.includes(newSocialMedia.trim())) {
      setFormData(prev => ({
        ...prev,
        socialmedia: [...prev.socialmedia, newSocialMedia.trim()]
      }));
      setNewSocialMedia("");
    }
  };

  const handleRemoveSocialMedia = (socialMediaToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      socialmedia: prev.socialmedia.filter(sm => sm !== socialMediaToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id || !db) {
      console.error("Missing params.id or db:", { paramsId: params.id, dbExists: !!db });
      return;
    }

    setSaving(true);
    try {
      console.log("Starting form submission...");
      console.log("Form data:", formData);
      
      // Upload images if any
      const imageUrls = await uploadImages();
      console.log("Uploaded image URLs:", imageUrls);
      
      // Update vendor document
      const vendorDoc = doc(db, "vendor", params.id as string);
      console.log("Updating vendor document:", vendorDoc.path);
      
      const updateData = {
        ...formData,
        images: [...formData.images, ...imageUrls],
        updatedAt: serverTimestamp(),
      };
      console.log("Update data:", updateData);
      
      await updateDoc(vendorDoc, updateData);
      console.log("Vendor document updated successfully");

      toast({
        title: "Success",
        description: "Vendor information updated successfully",
      });

      // Redirect to dashboard
      router.push(`/vendor/${params.id}/dashboard`);
    } catch (error) {
      console.error("Error updating vendor data:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      toast({
        title: "Error",
        description: "Failed to update vendor information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Complete Your Vendor Profile</CardTitle>
          <CardDescription>
            Fill in your business information to complete your vendor profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Service Options</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="offersHome"
                    checked={formData.offersHome}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("offersHome", checked)
                    }
                  />
                  <Label htmlFor="offersHome">Offers Home Service</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="offersDrive"
                    checked={formData.offersDrive}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("offersDrive", checked)
                    }
                  />
                  <Label htmlFor="offersDrive">Offers Drive-in Service</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payment Options</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(formData.paymentOptions).map(([option, checked]) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Switch
                        id={option}
                        checked={checked}
                        onCheckedChange={(isChecked) =>
                          handlePaymentOptionChange(option, isChecked)
                        }
                      />
                      <Label htmlFor={option} className="capitalize">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm">{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag}>Add</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Social Media Links</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.socialmedia.map((link, index) => (
                    <div key={index} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                      <span className="text-sm">{link}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSocialMedia(link)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSocialMedia}
                    onChange={(e) => setNewSocialMedia(e.target.value)}
                    placeholder="Add a social media link"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSocialMedia();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddSocialMedia}>Add</Button>
                </div>
              </div>

              <div>
                <Label>Business Images</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                  />
                </div>
                {imageFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm font-medium">Selected images:</p>
                    <ul className="list-disc list-inside">
                      {imageFiles.map((file, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <span>{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeImage(index)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.images.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Existing images:</p>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {formData.images.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`Business image ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save and Continue
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 