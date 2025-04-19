"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type Vendor = {
  id: string;
  businessName: string;
  tags: string[];
  description: string;
  city: string;
  state: string;
};

type Props = {
  vendors: Vendor[];
  userLocation: { lat: number; lon: number } | null;
  searchQuery: string;
};

function SetViewToCurrentLocation({
  onLocationFound,
}: {
  onLocationFound: (coords: [number, number]) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        map.setView(coords, 12); // zoom to user
        onLocationFound(coords);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  }, [map, onLocationFound]);

  return null;
}

export default function Map({ vendors, userLocation, searchQuery }: Props) {
  const [vendorLocations, setVendorLocations] = useState<
    { lat: number; lon: number; vendor: Vendor }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      const results: { lat: number; lon: number; vendor: Vendor }[] = [];

      for (const vendor of vendors) {
        try {
          const query = `${vendor.city}, ${vendor.state}`;
          console.log(`Fetching coordinates for: ${query}`);
          
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
          );
          
          if (!response.ok) {
            console.error(`Error fetching coordinates for ${query}: ${response.statusText}`);
            continue;
          }
          
          const data = await response.json();
          
          if (data.length > 0) {
            const { lat, lon } = data[0];
            results.push({
              lat: parseFloat(lat),
              lon: parseFloat(lon),
              vendor,
            });
            console.log(`Found coordinates for ${query}: ${lat}, ${lon}`);
          } else {
            console.warn(`No coordinates found for ${query}`);
          }
        } catch (error) {
          console.error(`Error processing vendor ${vendor.businessName}:`, error);
        }
      }

      console.log(`Total vendor locations found: ${results.length}`);
      setVendorLocations(results);
      setLoading(false);
    };

    if (vendors.length > 0) {
      fetchCoordinates();
    } else {
      setVendorLocations([]);
      setLoading(false);
    }
  }, [vendors]);

  const defaultCenter: [number, number] = [34.0522, -118.2437]; // Los Angeles center

  return (
    <MapContainer center={defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SetViewToCurrentLocation onLocationFound={(coords) => {}} />

      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lon]}
          icon={redIcon}
          eventHandlers={{
            mouseover: (e) => e.target.openPopup(), // Show on hover
            mouseout: (e) => e.target.closePopup(), // Hide on mouse out
          }}
        >
          <Popup>
            <strong>You are here</strong>
          </Popup>
        </Marker>
      )}

      {loading ? (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded shadow">
          Loading vendor locations...
        </div>
      ) : (
        vendorLocations.map(({ lat, lon, vendor }, i) => (
          <Marker
            key={`${vendor.id}-${i}`}
            position={[lat, lon]}
            eventHandlers={{
              mouseover: (e) => e.target.openPopup(), // Show on hover
              mouseout: (e) => e.target.closePopup(), // Hide on mouse out
            }}
          >
            <Popup>
              <strong>{vendor.businessName}</strong>
              <br />
              {vendor.city}, {vendor.state}
              <br />
              {vendor.description}
            </Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
}
