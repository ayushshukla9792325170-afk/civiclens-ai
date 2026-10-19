import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';

const pickerIcon = L.divIcon({
  html: `
    <div style="position: relative; width: 36px; height: 44px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; bottom: 0; width: 14px; height: 6px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(2px);"></div>
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.05888 0 0 8.05888 0 18C0 30 18 44 18 44C18 44 36 30 36 18C36 8.05888 27.9411 0 18 0Z" fill="#0D9488" stroke="#FFFFFF" stroke-width="2.5" />
        <circle cx="18" cy="18" r="6" fill="#FFFFFF" />
      </svg>
    </div>
  `,
  className: 'custom-picker-marker',
  iconSize: [36, 44],
  iconAnchor: [18, 44],
});

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChangeLocation: (lat: number, lng: number, addressSuggestion?: string) => void;
  height?: string;
}

const LocationMarkerHandler: React.FC<{
  position: [number, number];
  setPosition: (pos: [number, number]) => void;
  onChange: (lat: number, lng: number) => void;
}> = ({ position, setPosition, onChange }) => {
  const map = useMap();

  useMapEvents({
    click(e) {
      const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onChange(e.latlng.lat, e.latlng.lng);
      map.panTo(e.latlng);
    },
  });

  return (
    <Marker
      position={position}
      icon={pickerIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const latlng = marker.getLatLng();
          setPosition([latlng.lat, latlng.lng]);
          onChange(latlng.lat, latlng.lng);
        },
      }}
    />
  );
};

export const LocationPickerMap: React.FC<LocationPickerProps> = ({
  latitude,
  longitude,
  onChangeLocation,
  height = '350px',
}) => {
  const [position, setPosition] = useState<[number, number]>([latitude || 18.5204, longitude || 73.8567]);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setPosition([lat, lng]);
        onChangeLocation(lat, lng, 'Current device location detected');
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location permission denied. You can tap anywhere on the map to set location.');
        } else {
          setGeoError('Could not obtain current GPS position. Please select manually on map.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-teal-600" />
          Click or drag pin to the exact location of the civic problem
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleGetCurrentLocation}
          isLoading={isLocating}
          icon={<Navigation className="w-3.5 h-3.5 text-teal-600" />}
        >
          Use Current Location
        </Button>
      </div>

      {geoError && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{geoError}</span>
        </div>
      )}

      <div style={{ height }} className="w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner relative z-0">
        <MapContainer
          center={position}
          zoom={14}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarkerHandler
            position={position}
            setPosition={setPosition}
            onChange={(lat, lng) => onChangeLocation(Number(lat.toFixed(6)), Number(lng.toFixed(6)))}
          />
        </MapContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-1">
        <span>Lat: {position[0].toFixed(5)}</span>
        <span>Lng: {position[1].toFixed(5)}</span>
      </div>
    </div>
  );
};
