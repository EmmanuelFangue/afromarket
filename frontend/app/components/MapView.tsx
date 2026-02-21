'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Business } from '../lib/types';

// Fix for default marker icon in react-leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map center and zoom updates
function MapUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
}

interface MapViewProps {
  businesses: Business[];
  userLocation?: { latitude: number; longitude: number };
}

export default function MapView({ businesses, userLocation }: MapViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('home');

  // Filter businesses with valid location data
  const businessesWithLocation = useMemo(() => {
    return businesses.filter(b =>
      b.location &&
      typeof b.location.lat === 'number' &&
      typeof b.location.lon === 'number' &&
      !isNaN(b.location.lat) &&
      !isNaN(b.location.lon)
    );
  }, [businesses]);

  // Calculate map center and bounds
  const mapCenter = useMemo((): [number, number] => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }

    if (businessesWithLocation.length > 0) {
      const latSum = businessesWithLocation.reduce((sum, b) => sum + b.location.lat, 0);
      const lonSum = businessesWithLocation.reduce((sum, b) => sum + b.location.lon, 0);
      return [latSum / businessesWithLocation.length, lonSum / businessesWithLocation.length];
    }

    // Default to Montreal, Canada
    return [45.5017, -73.5673];
  }, [businessesWithLocation, userLocation]);

  const getBusinessName = (business: Business): string => {
    try {
      const translations = typeof business.nameTranslations === 'string'
        ? JSON.parse(business.nameTranslations)
        : business.nameTranslations;
      return translations[locale] || translations['fr'] || business.name || '';
    } catch {
      return business.name || '';
    }
  };

  const handleMarkerClick = (businessId: string) => {
    router.push(`/${locale}/business/${businessId}`);
  };

  if (businessesWithLocation.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
        <p className="text-gray-600 dark:text-gray-400">{t('map.noLocation')}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
      <MapContainer
        center={mapCenter}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <MapUpdater center={mapCenter} zoom={userLocation ? 13 : 12} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.latitude, userLocation.longitude]}
            icon={L.icon({
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41]
            })}
          >
            <Popup>
              <div className="text-center font-semibold">
                Your Location
              </div>
            </Popup>
          </Marker>
        )}

        {/* Business markers */}
        {businessesWithLocation.map((business) => (
          <Marker
            key={business.id}
            position={[business.location.lat, business.location.lon]}
            icon={icon}
            eventHandlers={{
              click: () => handleMarkerClick(business.id)
            }}
          >
            <Popup>
              <div className="min-w-48">
                <h3 className="font-semibold text-base mb-1">{getBusinessName(business)}</h3>
                <p className="text-sm text-gray-600 mb-2">{business.categoryName}</p>
                <p className="text-xs text-gray-500 mb-2">{business.address}</p>
                <button
                  onClick={() => handleMarkerClick(business.id)}
                  className="text-xs text-blue-600 hover:text-blue-700 underline"
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        {t('map.clickMarker')}
      </p>
    </div>
  );
}
