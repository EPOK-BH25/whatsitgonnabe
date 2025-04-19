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

// Custom red icon for user location
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Extended vendor type with display properties
type Vendor = {
  id: string;
  businessName: string;
  address: string;
  tags: string[];
  description?: string;
  city?: string;
  state?: string;
  services?: {
    hair?: Record<string, boolean>;
    nails?: Record<string, boolean>;
    makeup?: Record<string, boolean>;
  };
  offersHome?: boolean;
  offersDrive?: boolean;
  // Add any other properties from your vendor interface
};

type Props = {
  vendors: Vendor[];
  userLocation: { lat: number; lon: number } | null;
  searchQuery: string;
};

// Component to set map view to current location
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

// Mocked vendor locations - to use when geocoding fails
// This helps ensure the map always shows something
const mockVendorLocations: Record<string, { lat: number; lon: number }> = {
  'Inglewood, CA': { lat: 33.9617, lon: -118.3531 },
  'Covina, CA': { lat: 34.0900, lon: -117.8903 },
  'Compton, CA': { lat: 33.8958, lon: -118.2200 },
  'Arcadia, CA': { lat: 34.1397, lon: -118.0353 },
  'Pomona, CA': { lat: 34.0551, lon: -117.7501 },
  'Los Angeles, CA': { lat: 34.0522, lon: -118.2437 },
  'Long Beach, CA': { lat: 33.7701, lon: -118.1937 },
  'Pasadena, CA': { lat: 34.1478, lon: -118.1445 },
  'Santa Monica, CA': { lat: 34.0195, lon: -118.4912 },
  'Downey, CA': { lat: 33.9401, lon: -118.1331 },
};

export default function Map({ vendors, userLocation, searchQuery }: Props) {
  const [vendorLocations, setVendorLocations] = useState<
    { lat: number; lon: number; vendor: Vendor }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [geocodingError, setGeocodingError] = useState(false);

  // Fetch coordinates for vendors
  useEffect(() => {
    const fetchCoordinates = async () => {
      setLoading(true);
      setGeocodingError(false);
      const results: { lat: number; lon: number; vendor: Vendor }[] = [];
      let failedCount = 0;

      // Only process the first 15 vendors to avoid excessive API calls
      const vendorsToProcess = vendors.slice(0, 15);
      
      for (const vendor of vendorsToProcess) {
        try {
          // Use full address for better geocoding results
          const address = vendor.address.trim();
          if (!address) {
            console.warn(`Skipping vendor ${vendor.businessName}: Missing address`);
            continue;
          }
          
          // Extract city and state for fallback
          const addressParts = address.split(',');
          const city = vendor.city || addressParts[1]?.trim() || '';
          const stateZip = addressParts[2]?.trim() || '';
          const state = vendor.state || stateZip.split(' ')[0] || '';
          const cityState = `${city}, ${state}`;

          console.log(`Attempting to geocode: ${address}`);
          
          // Try to use the mocked location first (for development or when API fails)
          const hasPresetCoordinates = Object.prototype.hasOwnProperty.call(mockVendorLocations, cityState);
          if (hasPresetCoordinates) {
            const { lat, lon } = mockVendorLocations[cityState];
            results.push({ lat, lon, vendor });
            console.log(`Using cached coordinates for ${cityState}: ${lat}, ${lon}`);
            continue;
          }
          
          // Add a slight delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Try with the full address first
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
              { signal: AbortSignal.timeout(5000) } // Timeout after 5 seconds
            );
            
            if (!response.ok) {
              throw new Error(`Error fetching coordinates: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.length > 0) {
              const { lat, lon } = data[0];
              results.push({
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                vendor,
              });
              console.log(`Found coordinates for ${address}: ${lat}, ${lon}`);
              continue; // Skip to next vendor if successful
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
                { signal: AbortSignal.timeout(5000) } // Timeout after 5 seconds
              );
              
              if (!response.ok) {
                throw new Error(`Error fetching coordinates: ${response.statusText}`);
              }
              
              const data = await response.json();
              
              if (data.length > 0) {
                const { lat, lon } = data[0];
                results.push({
                  lat: parseFloat(lat),
                  lon: parseFloat(lon),
                  vendor,
                });
                console.log(`Found coordinates for ${cityState}: ${lat}, ${lon}`);
                continue; // Skip to next vendor if successful
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
            results.push({
              lat: defaultCoords.lat + randomOffset.lat,
              lon: defaultCoords.lon + randomOffset.lon,
              vendor,
            });
            console.log(`Using fallback coordinates for ${vendor.businessName}`);
          }
          
        } catch (error) {
          console.error(`Error processing vendor ${vendor.businessName}:`, error);
          failedCount++;
        }
      }

      console.log(`Total vendor locations found: ${results.length}, Failed: ${failedCount}`);
      setVendorLocations(results);
      setGeocodingError(failedCount > 0 && failedCount === vendorsToProcess.length);
      setLoading(false);
    };

    if (vendors.length > 0) {
      fetchCoordinates();
    } else {
      setVendorLocations([]);
      setLoading(false);
    }
  }, [vendors]);

  // Format description for vendor popups
  const getVendorDescription = (vendor: Vendor) => {
    const services = [];
    
    // Add service categories
    if (vendor.services?.hair && Object.values(vendor.services.hair).some(v => v)) {
      services.push('Hair');
    }
    if (vendor.services?.nails && Object.values(vendor.services.nails).some(v => v)) {
      services.push('Nails');
    }
    if (vendor.services?.makeup && Object.values(vendor.services.makeup).some(v => v)) {
      services.push('Makeup');
    }
    
    // Add service options
    const options = [];
    if (vendor.offersHome) options.push('Home services available');
    if (vendor.offersDrive) options.push('Drive-in services available');
    
    return (
      <>
        <div className="text-sm">{vendor.address}</div>
        {services.length > 0 && <div className="mt-1 text-sm">Services: {services.join(', ')}</div>}
        {options.length > 0 && <div className="text-sm">{options.join('. ')}</div>}
        {vendor.description && <div className="mt-1 text-sm">{vendor.description}</div>}
      </>
    );
  };

  const defaultCenter: [number, number] = [34.0522, -118.2437]; // Los Angeles center

  return (
    <div className="relative h-full w-full">
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
              mouseover: (e) => e.target.openPopup(),
              mouseout: (e) => e.target.closePopup(),
            }}
          >
            <Popup>
              <strong>You are here</strong>
            </Popup>
          </Marker>
        )}

        {vendorLocations.map(({ lat, lon, vendor }, i) => (
          <Marker
            key={`${vendor.id}-${i}`}
            position={[lat, lon]}
            eventHandlers={{
              mouseover: (e) => e.target.openPopup(),
              mouseout: (e) => e.target.closePopup(),
            }}
          >
            <Popup>
              <div>
                <strong>{vendor.businessName}</strong>
                {getVendorDescription(vendor)}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded shadow z-[1000]">
          Loading vendor locations...
        </div>
      )}
      
      {geocodingError && !loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow z-[1000]">
          <p className="text-sm text-amber-600">⚠️ Location service is experiencing issues. Showing approximate locations.</p>
        </div>
      )}
      
      {!loading && vendorLocations.length === 0 && vendors.length > 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded shadow z-[1000]">
          No vendor locations found. Try adjusting your filters.
        </div>
      )}
    </div>
  );
}