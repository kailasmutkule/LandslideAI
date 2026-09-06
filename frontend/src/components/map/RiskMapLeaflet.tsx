import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { RiskLocation } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { Layers, Search, Eye, AlertCircle, Mountain, Droplets, Compass } from 'lucide-react';
import { NER_CENTER } from '../../constants/regions';

interface RiskMapLeafletProps {
  locations: RiskLocation[];
  onSelectLocation?: (location: RiskLocation) => void;
  selectedLocationId?: string | null;
  height?: string;
  showControls?: boolean;
}

// Controller to auto-pan when selection changes
const MapViewController: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 8 }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

export const RiskMapLeaflet: React.FC<RiskMapLeafletProps> = ({
  locations,
  onSelectLocation,
  selectedLocationId,
  height = '500px',
  showControls = true
}) => {
  const [activeLayer, setActiveLayer] = useState<'terrain' | 'satellite' | 'street'>('terrain');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected location or default NER center
  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const mapCenter: [number, number] = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : [NER_CENTER.lat, NER_CENTER.lng];

  // Tile layers configuration
  // Terrain uses OpenTopoMap for 3D hillshade relief
  const tileLayers = {
    terrain: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    },
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors'
    }
  };

  // Filter locations
  const filteredLocations = locations.filter(loc => {
    const matchesRisk = riskFilter === 'ALL' || loc.riskLevel === riskFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      loc.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loc.district && loc.district.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRisk && matchesSearch;
  });

  // Create custom pulsing SVG marker icons
  const createCustomMarker = (loc: RiskLocation) => {
    let color = '#10b981'; // green
    let pulseColor = 'rgba(16, 185, 129, 0.4)';

    if (loc.riskLevel === 'Critical') {
      color = '#e11d48'; // crimson
      pulseColor = 'rgba(225, 29, 72, 0.45)';
    } else if (loc.riskLevel === 'High') {
      color = '#ea580c'; // orange
      pulseColor = 'rgba(234, 88, 12, 0.45)';
    } else if (loc.riskLevel === 'Moderate') {
      color = '#eab308'; // yellow
      pulseColor = 'rgba(234, 179, 8, 0.4)';
    }

    const html = `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${pulseColor}; animation: markerPulse 2s infinite ease-out;"></div>
        <div style="width: 24px; height: 24px; border-radius: 50%; background: ${color}; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #ffffff;">
          ${loc.riskScore}
        </div>
      </div>
      <style>
        @keyframes markerPulse {
          0% { transform: scale(0.7); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `;

    return L.divIcon({
      html,
      className: 'custom-landslide-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
      popupAnchor: [0, -18]
    });
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100" style={{ height }}>
      {/* Controls Overlay */}
      {showControls && (
        <div className="absolute top-4 left-4 right-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Search bar */}
          <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-md max-w-xs w-full">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search hotspot, road, district..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none"
            />
          </div>

          {/* Layer and Severity Filters */}
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            {/* Risk Filters */}
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md text-xs font-semibold">
              {(['ALL', 'Critical', 'High', 'Moderate', 'Low'] as const).map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setRiskFilter(lvl)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    riskFilter === lvl
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Layer Toggle */}
            <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-md text-xs font-semibold">
              <span className="flex items-center gap-1 pl-2 text-slate-500">
                <Layers className="h-3.5 w-3.5" />
              </span>
              {(['terrain', 'satellite', 'street'] as const).map(layer => (
                <button
                  key={layer}
                  onClick={() => setActiveLayer(layer)}
                  className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                    activeLayer === layer
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {layer === 'terrain' ? 'Relief Terrain' : layer}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leaflet Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={selectedLocation ? 10 : 7}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
      >
        <MapViewController center={mapCenter} zoom={selectedLocation ? 10 : 7} />

        <TileLayer
          url={tileLayers[activeLayer].url}
          attribution={tileLayers[activeLayer].attribution}
          maxZoom={18}
        />

        {filteredLocations.map(loc => (
          <Marker
            key={loc.id}
            position={[loc.latitude, loc.longitude]}
            icon={createCustomMarker(loc)}
            eventHandlers={{
              click: () => onSelectLocation && onSelectLocation(loc)
            }}
          >
            <Popup>
              <div className="p-4 w-72 sm:w-80">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5 mb-2.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 leading-snug">
                      {loc.location}
                    </h4>
                    <p className="text-[11px] font-medium text-slate-500">
                      {loc.district ? `${loc.district}, ` : ''}{loc.state} &bull; {loc.elevation || 1200}m ASL
                    </p>
                  </div>
                  <RiskBadge level={loc.riskLevel} size="sm" />
                </div>

                {/* Core KPI metrics grid */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                      <Droplets className="h-3 w-3 text-sky-600" />
                      Rain 24h
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{loc.rainfall24h} mm</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                      <Mountain className="h-3 w-3 text-amber-600" />
                      Slope
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{loc.slope}°</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500">
                      <Compass className="h-3 w-3 text-purple-600" />
                      Soil Sat.
                    </div>
                    <p className="text-xs font-bold text-slate-900 mt-0.5">{loc.soilMoisture}%</p>
                  </div>
                </div>

                {/* AI Trigger & Explainability snippet */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-3">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Primary Trigger:</span> {loc.primaryTrigger || 'Monsoon rainfall surcharge'}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Recommended Action:</span> {loc.recommendedAction || 'Pre-position emergency response crews.'}
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    AI Confidence: {loc.confidence}% &bull; Window: {loc.expectedWindow || '3-6 Hours'}
                  </div>
                </div>

                {/* View details button */}
                {onSelectLocation && (
                  <button
                    onClick={() => onSelectLocation(loc)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Detailed Risk Timeline
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 shadow-md text-[11px] text-slate-700 font-semibold flex items-center gap-3">
        <span className="text-slate-400">Risk Severity:</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Critical</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Moderate</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Low</span>
      </div>
    </div>
  );
};
