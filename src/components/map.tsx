import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState, useRef } from 'react';


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
  onMapLoaded?: () => void;
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

export default function Map({ vendors, userLocation, searchQuery, onMapLoaded }: Props) {
  const [vendorLocations, setVendorLocations] = useState<{ lat: number; lon: number; vendor: Vendor }[]>([]);
  const [loading, setLoading] = useState(true);
  const [geocodingError, setGeocodingError] = useState(false);
  const mapRef = useRef<any>(null);
  const geocodingCache = useRef<Record<string, { lat: number; lon: number }>>({});
  const mapInitialized = useRef(false);


  // Function to center map on a specific vendor
  const centerOnVendor = (vendorId: string) => {
    const vendorLocation = vendorLocations.find(loc => loc.vendor.id === vendorId);
    if (vendorLocation && mapRef.current) {
      mapRef.current.setView([vendorLocation.lat, vendorLocation.lon], mapRef.current.getZoom());
      
      // Find and highlight the marker
      const markerElement = document.querySelector(`[data-vendor-id="${vendorId}"]`);
      if (markerElement) {
        markerElement.classList.add('highlight-marker');
        setTimeout(() => {
          markerElement.classList.remove('highlight-marker');
        }, 2000);
      }
    }
  };

  // Expose the centerOnVendor function to the window object
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).centerOnVendor = centerOnVendor;
    }
  }, [vendorLocations]);

  // Handle map initialization
  useEffect(() => {
    if (mapRef.current && !mapInitialized.current) {
      mapInitialized.current = true;
      if (onMapLoaded) {
        onMapLoaded();
      }
    }
  }, [onMapLoaded]);

  // Fetch coordinates for vendors with optimized geocoding

  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      setGeocodingError(false);
      const results: { lat: number; lon: number; vendor: Vendor }[] = [];
      let failedCount = 0;
      const vendorsToProcess = vendors.slice(0, 15);
      
      // Process vendors in parallel batches
      const batchSize = 5;
      for (let i = 0; i < vendorsToProcess.length; i += batchSize) {
        const batch = vendorsToProcess.slice(i, i + batchSize);
        const batchPromises = batch.map(async (vendor) => {
          try {
            // Use full address for better geocoding results
            const address = vendor.address.trim();
            if (!address) {
              console.warn(`Skipping vendor ${vendor.businessName}: Missing address`);
              return null;
            }
            
            // Extract city and state for fallback
            const addressParts = address.split(',');
            const city = vendor.city || addressParts[1]?.trim() || '';
            const stateZip = addressParts[2]?.trim() || '';
            const state = vendor.state || stateZip.split(' ')[0] || '';
            const cityState = `${city}, ${state}`;

            // Check cache first
            if (geocodingCache.current[cityState]) {
              const { lat, lon } = geocodingCache.current[cityState];
              return { lat, lon, vendor };
            }
            
            // Try with the full address first
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
                { signal: AbortSignal.timeout(3000) } // Reduced timeout to 3 seconds
              );
              
              if (!response.ok) {
                throw new Error(`Error fetching coordinates: ${response.statusText}`);
              }
              
              const data = await response.json();
              
              if (data.length > 0) {
                const { lat, lon } = data[0];
                // Cache the result
                geocodingCache.current[cityState] = { lat: parseFloat(lat), lon: parseFloat(lon) };
                return {
                  lat: parseFloat(lat),
                  lon: parseFloat(lon),
                  vendor,
                };
              }
            } catch (error) {
              console.warn(`Failed to geocode full address: ${address}. Trying city/state...`);
              // Continue to try with city/state
            }
            
            // Fallback to city and state if full address fails
            if (city && state) {
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityState)}&format=json&limit=1`,
                  { signal: AbortSignal.timeout(3000) } // Reduced timeout to 3 seconds
                );
                
                if (!response.ok) {
                  throw new Error(`Error fetching coordinates: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (data.length > 0) {
                  const { lat, lon } = data[0];
                  // Cache the result
                  geocodingCache.current[cityState] = { lat: parseFloat(lat), lon: parseFloat(lon) };
                  return {
                    lat: parseFloat(lat),
                    lon: parseFloat(lon),
                    vendor,
                  };
                }
              } catch (error) {
                console.error(`Failed to geocode city/state: ${cityState}`);
                failedCount++;
              }
            }
            
            // If we get here, both geocoding attempts failed
            // Add a random offset to a base location for development testing
            if (city && state) {
              // Check if we have a mock location for a nearby city
              const defaultCoords = { lat: 34.0522, lon: -118.2437 }; // Los Angeles
              const randomOffset = {
                lat: (Math.random() - 0.5) * 0.1, // Random offset ±0.05 degrees
                lon: (Math.random() - 0.5) * 0.1
              };
              const result = {
                lat: defaultCoords.lat + randomOffset.lat,
                lon: defaultCoords.lon + randomOffset.lon,
                vendor,
              };
              // Cache the result
              geocodingCache.current[cityState] = { lat: result.lat, lon: result.lon };
              return result;
            }
            
            return null;
          } catch (error) {
            console.error(`Error processing vendor ${vendor.businessName}:`, error);
            failedCount++;
            return null;
          }
        });
        
        // Wait for all promises in the batch to resolve
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(Boolean) as { lat: number; lon: number; vendor: Vendor }[]);
        
        // Update the state after each batch to show progress
        //setVendorLocations(prev => [...prev, ...batchResults.filter(Boolean) as { lat: number; lon: number; vendor: Vendor }[]]);
      }

      let finalResults = results;
      // if (userLocation) {
      //   finalResults = results.filter(({ lat, lon }) =>
      //     haversineDistance(userLocation.lat, userLocation.lon, lat, lon) <= 10000
      //   );
      //   console.log(`📍 Filtered to ${finalResults.length} vendors within 20 miles of user`);
      // }

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
    <div className="w-full h-full rounded-lg overflow-hidden">
      <MapContainer
        center={[40.7128, -74.0060]}
        zoom={13}
        className="w-full h-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vendorLocations.map((location) => (
          <Marker
            key={location.vendor.id}
            position={[location.lat, location.lon]}
            icon={redIcon}
            data-vendor-id={location.vendor.id}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{location.vendor.businessName}</h3>
                <p className="text-sm">{location.vendor.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={new L.Icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            })}
          >
            <Popup>
              <div className="p-2">
                <p className="text-sm">Your location</p>
              </div>
            </Popup>
          </Marker>
        )}
        <SetViewToCurrentLocation
          onLocationFound={(coords) => {
            if (mapRef.current) {
              mapRef.current.setView(coords, 12);
            }
          }}
        />
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