"use client";

import React from "react";

type BusinessInfo = {
  name: string;
  phone: string;
  email: string;
  socialMedia: {
    platform: string;
    link: string;
  }[];
  services: string[];
  deliveryOptions: string[];
  paymentOptions: string[];
};

const mockBusiness: BusinessInfo = {
  name: "Glow & Go Salon",
  phone: "+1 (123) 456-7890",
  email: "contact@glowgo.com",
  socialMedia: [
    { platform: "Instagram", link: "https://instagram.com/glowgo" },
    { platform: "Facebook", link: "https://facebook.com/glowgo" },
  ],
  services: ["Hair Styling", "Manicure", "Makeup", "Facials"],
  deliveryOptions: ["In-Store", "At-Home"],
  paymentOptions: ["Credit Card", "Cash", "PayPal"],
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-6">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <div className="bg-white rounded-xl shadow-md p-4">{children}</div>
  </div>
);

const BusinessDashboard: React.FC = () => {
  const info = mockBusiness;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Business Information</h1>

      <Section title="Business Name">
        <p>{info.name}</p>
      </Section>

      <Section title="Contact Details">
        <p><strong>Phone:</strong> {info.phone}</p>
        <p><strong>Email:</strong> {info.email}</p>
        <ul className="mt-2">
          {info.socialMedia.map((s, idx) => (
            <li key={idx}>
              <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {s.platform}
              </a>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="List of Services">
        <ul className="list-disc list-inside">
          {info.services.map((service, idx) => (
            <li key={idx}>{service}</li>
          ))}
        </ul>
      </Section>

      <Section title="Delivery Options">
        <ul className="list-disc list-inside">
          {info.deliveryOptions.map((option, idx) => (
            <li key={idx}>{option}</li>
          ))}
        </ul>
      </Section>

      <Section title="Payment Options">
        <ul className="list-disc list-inside">
          {info.paymentOptions.map((option, idx) => (
            <li key={idx}>{option}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
};

export default BusinessDashboard;
