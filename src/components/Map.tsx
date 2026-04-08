import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Location, KIGALI_HUBS } from '../lib/geo';
import { MapPin, Bus, Navigation } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

interface Vehicle {
  id: string;
  type: 'bus' | 'minibus' | 'taxi';
  driverId: string;
  location: Location;
  totalSeats: number;
  availableSeats: number;
  destination: string;
  status: 'active' | 'inactive';
}

interface MapProps {
  userLocation: Location;
  vehicles: Vehicle[];
  onVehicleClick: (vehicle: Vehicle) => void;
}

// Custom Icons using Lucide
const createDivIcon = (icon: React.ReactNode, color: string, label?: string) => {
  return L.divIcon({
    html: renderToStaticMarkup(
      <div className="flex flex-col items-center">
        <div className={`p-2 rounded-full shadow-lg border-2 border-white ${color}`}>
          {icon}
        </div>
        {label && (
          <span className="mt-1 text-[10px] font-bold bg-white/90 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap border border-slate-200">
            {label}
          </span>
        )}
      </div>
    ),
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Component to handle map centering
const ChangeView = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

const Map: React.FC<MapProps> = ({ userLocation, vehicles, onVehicleClick }) => {
  const center: [number, number] = [userLocation.lat, userLocation.lng];

  return (
    <div className="w-full h-full bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner relative z-0">
      <MapContainer 
        center={center} 
        zoom={14} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView center={center} />

        {/* User Location Marker */}
        <Marker 
          position={[userLocation.lat, userLocation.lng]} 
          icon={createDivIcon(<Navigation className="w-5 h-5 text-white fill-current" />, 'bg-blue-600', 'You')}
        >
          <Popup>You are here</Popup>
        </Marker>

        {/* Hubs Markers */}
        {Object.values(KIGALI_HUBS).map((hub) => (
          <Marker 
            key={hub.name}
            position={[hub.lat, hub.lng]} 
            icon={createDivIcon(<MapPin className="w-4 h-4 text-slate-500" />, 'bg-white', hub.name)}
          >
            <Popup>{hub.name} Hub</Popup>
          </Marker>
        ))}

        {/* Vehicle Markers */}
        {vehicles.map((vehicle) => (
          <Marker 
            key={vehicle.id}
            position={[vehicle.location.lat, vehicle.location.lng]} 
            icon={createDivIcon(
              <Bus className="w-5 h-5 text-white" />, 
              vehicle.availableSeats > 0 ? 'bg-green-500' : 'bg-red-500'
            )}
            eventHandlers={{
              click: () => onVehicleClick(vehicle),
            }}
          >
            <Popup>
              <div className="p-1">
                <p className="font-bold text-slate-900">{vehicle.id}</p>
                <p className="text-xs text-slate-500">{vehicle.destination}</p>
                <p className="text-xs font-bold text-blue-600 mt-1">{vehicle.availableSeats} seats available</p>
                <button 
                  onClick={() => onVehicleClick(vehicle)}
                  className="mt-2 w-full bg-blue-600 text-white text-[10px] py-1 rounded font-bold"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-slate-200 text-[10px] font-bold text-slate-600 z-[1000] flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Full</span>
        </div>
        <div className="w-px h-3 bg-slate-200" />
        <span>Kigali Live Map</span>
      </div>
    </div>
  );
};

export default Map;
