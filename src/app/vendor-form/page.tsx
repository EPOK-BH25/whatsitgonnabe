// Full Vendor SignUp Page with At-Home Address Field

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const serviceCategories = {
  Nails: ["Mani/Pedi", "Foot Massage", "Nail Art", "Gel X", "Cat Eyes"],
  Hair: ["Salon", "Braids"],
  "Make-Up": ["Bridal", "Events"],
};

const mainCategories = Object.keys(serviceCategories);

const paymentOptionsList = [
  "Credit Card",
  "Cash",
  "Bank Transfer",
  "PayPal",
  "Mobile Payment",
];

const deliveryOptionsList = [
  "Vendor's At-Home Service",
  "Drive-to-you Service",
];

const vendorFormSchema = z
  .object({
    businessName: z.string().min(1, "Business name is required"),
    email: z.string().email("Invalid email"),
    businessPhone: z.string().regex(/^\d+$/, "Only numbers allowed"),
    services: z.array(z.string()).min(1, "Select at least one category"),
    services_Nails: z.array(z.string()).optional(),
    services_Hair: z.array(z.string()).optional(),
    services_Make_Up: z.array(z.string()).optional(),
    paymentOptions: z.array(z.string()).min(1, "Select at least one method"),
    deliveryOptions: z.array(z.string()).min(1, "Select at least one delivery option"),
    address: z.string().optional(),
  })
  .refine(
    (data) => {
      const requiresAddress = data.deliveryOptions.includes("Vendor's At-Home Service");
      return !requiresAddress || (data.address && data.address.trim().length > 0);
    },
    {
      message: "Address is required for At-Home Service",
      path: ["address"],
    }
  );

const categoryFieldKeys: {
  [K in keyof typeof serviceCategories]: keyof z.infer<typeof vendorFormSchema>;
} = {
  Nails: "services_Nails",
  Hair: "services_Hair",
  "Make-Up": "services_Make_Up",
};

const VendorSignUp = () => {
  const form = useForm<z.infer<typeof vendorFormSchema>>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      businessName: "",
      email: "",
      businessPhone: "",
      services: [],
      services_Nails: [],
      services_Hair: [],
      services_Make_Up: [],
      paymentOptions: [],
      deliveryOptions: [],
      address: "",
    },
  });

  const hasAtHomeService = form.watch("deliveryOptions")?.includes("Vendor's At-Home Service");

  const handleSubmit = async (data: z.infer<typeof vendorFormSchema>) => {
    try {
      if (!db) throw new Error("Firestore instance is undefined.");

      const vendorDocRef = doc(
        db,
        "vendors",
        `${data.businessName.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}`
      );

      await setDoc(vendorDocRef, {
        businessName: data.businessName,
        email: data.email,
        businessPhone: data.businessPhone,
        services: data.services,
        services_Nails: data.services_Nails || [],
        services_Hair: data.services_Hair || [],
        services_Make_Up: data.services_Make_Up || [],
        paymentOptions: data.paymentOptions,
        deliveryOptions: data.deliveryOptions,
        address: data.address || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Vendor Registered",
        description: "Thank you for signing up!",
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-semibold mb-6 text-center">Vendor Sign Up</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Business Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="businessName" render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="businessPhone" render={({ field }) => (
            <FormItem>
              <FormLabel>Business Phone</FormLabel>
              <FormControl>
                <Input {...field} onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "");
                  field.onChange(digits);
                }} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          {/* Service Categories */}
          <FormField control={form.control} name="services" render={() => (
            <FormItem>
              <FormLabel>Service Categories</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {mainCategories.map((category) => (
                  <FormField key={category} control={form.control} name="services" render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value?.includes(category)}
                          onCheckedChange={(checked) => {
                            if (checked) field.onChange([...field.value, category]);
                            else field.onChange(field.value.filter((v) => v !== category));
                          }} />
                      </FormControl>
                      <FormLabel>{category}</FormLabel>
                    </FormItem>
                  )} />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )} />

          {/* Sub-services */}
          {mainCategories.map((category) => {
            const fieldName = categoryFieldKeys[category as keyof typeof categoryFieldKeys];
            const isSelected = form.watch("services")?.includes(category);
            return (
              <FormField key={fieldName} control={form.control} name={fieldName} render={() => (
                <FormItem className="mt-3">
                  <FormLabel className="text-sm font-medium">{category} Services</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {serviceCategories[category as keyof typeof serviceCategories].map((sub) => (
                      <FormField key={sub} control={form.control} name={fieldName} render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox disabled={!isSelected} checked={field.value?.includes(sub)}
                              onCheckedChange={(checked) => {
                                if (!isSelected) return;
                                if (checked) field.onChange([...(field.value || []), sub]);
                                else field.onChange((field.value || []).filter((v) => v !== sub));
                              }} />
                          </FormControl>
                          <FormLabel className={isSelected ? "font-normal" : "text-muted-foreground"}>{sub}</FormLabel>
                        </FormItem>
                      )} />
                    ))}
                  </div>
                </FormItem>
              )} />
            );
          })}

          {/* Payment Options */}
          <FormField control={form.control} name="paymentOptions" render={() => (
            <FormItem>
              <FormLabel>Payment Methods</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {paymentOptionsList.map((method) => (
                  <FormField key={method} control={form.control} name="paymentOptions" render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value?.includes(method)}
                          onCheckedChange={(checked) => {
                            if (checked) field.onChange([...field.value, method]);
                            else field.onChange(field.value.filter((v) => v !== method));
                          }} />
                      </FormControl>
                      <FormLabel>{method}</FormLabel>
                    </FormItem>
                  )} />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )} />

          {/* Delivery Options */}
          <FormField control={form.control} name="deliveryOptions" render={() => (
            <FormItem>
              <FormLabel>Delivery Options</FormLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {deliveryOptionsList.map((option) => (
                  <FormField key={option} control={form.control} name="deliveryOptions" render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox checked={field.value?.includes(option)}
                          onCheckedChange={(checked) => {
                            if (checked) field.onChange([...field.value, option]);
                            else field.onChange(field.value.filter((v) => v !== option));
                          }} />
                      </FormControl>
                      <FormLabel>{option}</FormLabel>
                    </FormItem>
                  )} />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )} />

          {/* Conditional Address */}
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem className={hasAtHomeService ? "" : "opacity-50 pointer-events-none"}>
              <FormLabel>Address (for At-Home Service)</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St, Apt 2B, San Jose, CA 95113" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" className="w-full">Submit</Button>
        </form>
      </Form>
    </div>
  );
};

export default VendorSignUp;
