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
  businessName: string;
  tags: string[];
  description: string;
  city: string;
  state: string;
};

type Props = {
  vendors: Vendor[];
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
        console.error("Geolocation error:", error);
      }
    );
  }, [map, onLocationFound]);

  return null;
}

export function Map({ vendors }: Props) {
  const [vendorLocations, setVendorLocations] = useState<
    { lat: number; lon: number; vendor: Vendor }[]
  >([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    const fetchCoordinates = async () => {
      const results: { lat: number; lon: number; vendor: Vendor }[] = [];

      for (const vendor of vendors) {
        const query = `${vendor.city}, ${vendor.state}`;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
        );
        const data = await response.json();
        if (data.length > 0) {
          const { lat, lon } = data[0];
          results.push({
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            vendor,
          });
        }
      }

      setVendorLocations(results);
    };

    fetchCoordinates();
  }, [vendors]);

  const defaultCenter: [number, number] = [37.0902, -95.7129]; // USA center

  return (
    <MapContainer center={defaultCenter} zoom={4} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <SetViewToCurrentLocation onLocationFound={setUserLocation} />

      {userLocation && (
        <Marker
          position={userLocation}
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

      {vendorLocations.map(({ lat, lon, vendor }, i) => (
        <Marker 
        eventHandlers={{
          mouseover: (e) => e.target.openPopup(), // Show on hover
          mouseout: (e) => e.target.closePopup(), // Hide on mouse out
        }}
        key={i} position={[lat, lon]}>
          <Popup>
            <strong>{vendor.businessName}</strong>
            <br />
            {vendor.city}, {vendor.state}
            <br />
            {vendor.description}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
