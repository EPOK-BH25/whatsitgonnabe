import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix leaflet icon issue
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
  address: string;
  tags: string[];
  description?: string;
  city?: string;
  state?: string;
  lat?: number;
  lon?: number;
  services?: {
    hair?: Record<string, boolean>;
    nails?: Record<string, boolean>;
    makeup?: Record<string, boolean>;
  };
  offersHome?: boolean;
  offersDrive?: boolean;
};

type Props = {
  vendors: Vendor[];
  userLocation: { lat: number; lon: number } | null;
  searchQuery: string;
};

function SetViewToCurrentLocation({ onLocationFound }: { onLocationFound: (coords: [number, number]) => void }) {
  const map = useMap();

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.latitude, position.coords.longitude];
        map.setView(coords, 12);
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
  const [vendorLocations, setVendorLocations] = useState<{ lat: number; lon: number; vendor: Vendor }[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocodingError, setGeocodingError] = useState(false);

  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      setGeocodingError(false);
      const results: { lat: number; lon: number; vendor: Vendor }[] = [];
      let failedCount = 0;
      const vendorsToProcess = vendors.slice(0, 15);

      for (const vendor of vendorsToProcess) {
        try {
          const address = vendor.address.trim();
          const city = vendor.city || address.split(',')[1]?.trim() || '';
          const stateZip = address.split(',')[2]?.trim() || '';
          const state = vendor.state || stateZip.split(' ')[0] || '';
          const cityState = `${city}, ${state}`;

          await new Promise(resolve => setTimeout(resolve, 300));
          console.log(`🌎 Trying full address: ${address}`);

          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
            { signal: AbortSignal.timeout(5000) }
          );

          if (!response.ok) throw new Error(response.statusText);
          const data = await response.json();

          if (data.length > 0) {
            const { lat, lon } = data[0];
            console.log(`✅ Geocoded ${vendor.businessName} → ${lat}, ${lon}`);
            results.push({ lat: parseFloat(lat), lon: parseFloat(lon), vendor });
            continue;
          }

          // Fallback to city/state
          console.warn(`⚠️ Full address failed. Trying fallback for ${vendor.businessName}: ${cityState}`);
          const fallbackRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityState)}&format=json&limit=1`,
            { signal: AbortSignal.timeout(5000) }
          );

          const fallbackData = await fallbackRes.json();
          if (fallbackData.length > 0) {
            const { lat, lon } = fallbackData[0];
            console.log(`🟡 Fallback success for ${vendor.businessName} → ${lat}, ${lon}`);
            results.push({ lat: parseFloat(lat), lon: parseFloat(lon), vendor });
          } else {
            console.warn(`❌ No location found for ${vendor.businessName}`);
            failedCount++;
          }
        } catch (error) {
          console.error(`🔥 Error processing ${vendor.businessName}:`, error);
          failedCount++;
        }
      }

      let finalResults = results;
      if (userLocation) {
        finalResults = results.filter(({ lat, lon }) =>
          haversineDistance(userLocation.lat, userLocation.lon, lat, lon) <= 20
        );
        console.log(`📍 Filtered to ${finalResults.length} vendors within 20 miles of user`);
      }

      console.log("📦 Final vendorLocations set:", finalResults);
      setVendorLocations(finalResults);
      setGeocodingError(failedCount > 0 && failedCount === vendorsToProcess.length);
      setLoading(false);
    };

    if (vendors.length > 0) fetchCoordinates();
    else setLoading(false);
  }, [vendors]);


  const defaultCenter: [number, number] = [34.0522, -118.2437];

  return (
    <div className="relative h-full w-full">
      <MapContainer center={defaultCenter} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <SetViewToCurrentLocation onLocationFound={() => {}} />
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={redIcon}>
            <Popup><strong>You are here</strong></Popup>
          </Marker>
        )}
        {vendorLocations.map(({ lat, lon, vendor }, i) => (
          <Marker key={`${vendor.id}-${i}`} position={[lat, lon]}>
            <Popup>
              <div>
                <strong>{vendor.businessName}</strong>
                <div className="text-sm">{vendor.address}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {loading && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded shadow">Loading vendor locations...</div>}
      {geocodingError && !loading && <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white p-2 rounded shadow">⚠️ Geocoding error occurred.</div>}
    </div>
  );
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8;
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}