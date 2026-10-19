import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Complaint, IssueCategory, IssueSeverity } from '../../types';
import { StatusBadge, SeverityBadge } from '../common/Badge';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink } from 'lucide-react';

// Component to handle map resize and center adjustment
const MapResizeHandler: React.FC<{ center?: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [map, center, zoom]);
  return null;
};

// Generate custom SVG icons based on category and severity
const createCategoryIcon = (category: IssueCategory | string, severity: IssueSeverity | string) => {
  const colors: Record<string, string> = {
    POTHOLE: '#ea580c',       // Orange
    GARBAGE: '#16a34a',       // Green
    STREETLIGHT: '#ca8a04',   // Yellow
    DRAINAGE: '#0284c7',      // Sky Blue
    ROAD_DAMAGE: '#dc2626',   // Red
    DAMAGED_SIGN: '#9333ea',  // Purple
    WATER_LEAKAGE: '#0891b2', // Cyan
    ILLEGAL_DUMPING: '#475569', // Slate
    OTHER: '#64748b',
  };

  const color = colors[category] || '#0d9488';
  const isCritical = severity === 'CRITICAL';

  const svgHtml = `
    <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center;">
      ${isCritical ? '<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: rgba(225, 29, 72, 0.3); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>' : ''}
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="${color}" stroke="#ffffff" stroke-width="2.5" />
        <circle cx="17" cy="16" r="6" fill="#ffffff" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -38],
  });
};

interface ComplaintsMapProps {
  complaints: Complaint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onSelectComplaint?: (complaint: Complaint) => void;
  selectedId?: string | null;
}

export const ComplaintsMap: React.FC<ComplaintsMapProps> = ({
  complaints,
  center = [18.5204, 73.8567], // Demo city center
  zoom = 12,
  height = '500px',
  onSelectComplaint,
  selectedId,
}) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div style={{ height }} className="w-full bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <MapPin className="w-5 h-5 animate-bounce text-teal-600" />
          <span>Loading interactive map...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <MapResizeHandler center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {complaints.map((c) => {
          if (!c.latitude || !c.longitude) return null;
          const isSelected = selectedId === c.id;

          return (
            <Marker
              key={c.id}
              position={[c.latitude, c.longitude]}
              icon={createCategoryIcon(c.category, c.severity)}
              eventHandlers={{
                click: () => onSelectComplaint && onSelectComplaint(c),
              }}
            >
              <Popup className="civiclens-popup">
                <div className="p-1 min-w-[220px] max-w-[280px]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                      {c.reference_number}
                    </span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">
                    {c.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {c.address}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <SeverityBadge severity={c.severity} size="sm" />
                    <Link
                      to={`/complaints/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:text-teal-800"
                    >
                      <span>Details</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
