import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface LocationMarker {
    id: number;
    name: string;
    nameEn: string;
    category: string;
    lat: number;
    lng: number;
    address: string;
    phone: string;
    hours: string;
    description: string;
}

interface LeafletMapProps {
    locations: LocationMarker[];
    selectedMarker: LocationMarker | null;
    setSelectedMarker: (marker: LocationMarker | null) => void;
    userLocation: { lat: number; lng: number } | null;
    openInGoogleMaps: (loc: LocationMarker) => void;
    openDirections: (loc: LocationMarker) => void;
}

const categoryConfig: { [key: string]: { color: string; icon: string } } = {
    lawyers: { color: '#3b82f6', icon: '⚖️' },
    notary: { color: '#a855f7', icon: '📜' },
    courts: { color: '#ef4444', icon: '🏢' },
    registry: { color: '#22c55e', icon: '📋' }
};

const iconCache = new Map<string, L.DivIcon>();

function getCategoryIcon(category: string, isSelected: boolean): L.DivIcon {
    const cacheKey = `${category}-${isSelected}`;
    
    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey)!;
    }
    
    const config = categoryConfig[category] || { color: '#f59e0b', icon: '🏛️' };
    const size = isSelected ? 44 : 36;
    const fontSize = isSelected ? 20 : 16;
    
    const icon = L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                width: ${size}px;
                height: ${size}px;
                background: ${config.color};
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${fontSize}px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                position: relative;
            ">
                ${config.icon}
            </div>
            <div style="
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-top: 10px solid ${config.color};
                position: absolute;
                bottom: -8px;
                left: 50%;
                transform: translateX(-50%);
            "></div>
        `,
        iconSize: [size, size + 10],
        iconAnchor: [size / 2, size + 10],
        popupAnchor: [0, -size]
    });
    
    iconCache.set(cacheKey, icon);
    return icon;
}

const userLocationIcon = L.divIcon({
    className: 'user-location-marker',
    html: `
        <div style="
            width: 20px;
            height: 20px;
            background: #2563eb;
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 0 20px rgba(37, 99, 235, 0.5);
        "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

function MapController({ selectedMarker, locations }: { selectedMarker: LocationMarker | null; locations: LocationMarker[] }) {
    const map = useMap();
    
    useEffect(() => {
        if (selectedMarker) {
            map.flyTo([selectedMarker.lat, selectedMarker.lng], 15, { duration: 0.5 });
        } else if (locations.length > 0) {
            if (locations.length === 1) {
                map.flyTo([locations[0].lat, locations[0].lng], 14, { duration: 0.5 });
            } else {
                try {
                    const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
                    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
                } catch (e) {
                    map.flyTo([35.7219, 51.3890], 12);
                }
            }
        }
    }, [selectedMarker, locations, map]);
    
    return null;
}

const LeafletMapComponent: React.FC<LeafletMapProps> = ({
    locations,
    selectedMarker,
    setSelectedMarker,
    userLocation,
    openInGoogleMaps,
    openDirections
}) => {
    const defaultCenter: [number, number] = [35.7219, 51.3890];

    const markerIcons = useMemo(() => {
        const icons: { [key: number]: { normal: L.DivIcon; selected: L.DivIcon } } = {};
        locations.forEach(loc => {
            icons[loc.id] = {
                normal: getCategoryIcon(loc.category, false),
                selected: getCategoryIcon(loc.category, true)
            };
        });
        return icons;
    }, [locations]);

    return (
        <div className="relative w-full h-full" style={{ minHeight: '500px' }}>
            <style>{`
                .custom-marker { background: transparent !important; border: none !important; }
                .user-location-marker { background: transparent !important; border: none !important; }
                .leaflet-popup-content-wrapper { border-radius: 12px; }
                .leaflet-popup-content { margin: 12px; }
            `}</style>
            
            <MapContainer 
                center={defaultCenter} 
                zoom={12} 
                style={{ height: '500px', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                <MapController selectedMarker={selectedMarker} locations={locations} />
                
                {locations.map((loc) => (
                    <Marker
                        key={loc.id}
                        position={[loc.lat, loc.lng]}
                        icon={selectedMarker?.id === loc.id ? markerIcons[loc.id]?.selected : markerIcons[loc.id]?.normal}
                        eventHandlers={{
                            click: () => setSelectedMarker(loc)
                        }}
                    >
                        <Popup>
                            <div className="text-right" dir="rtl" style={{ minWidth: '200px' }}>
                                <h4 className="font-bold text-gray-900 mb-1">{loc.name}</h4>
                                <p className="text-xs text-gray-500 mb-2">{loc.nameEn}</p>
                                <p className="text-sm text-gray-600 mb-1">📍 {loc.address}</p>
                                <p className="text-sm text-gray-600 mb-1">📞 {loc.phone}</p>
                                <p className="text-sm text-gray-600 mb-2">⏰ {loc.hours}</p>
                                <div className="flex gap-2 mt-2">
                                    <button 
                                        onClick={() => openInGoogleMaps(loc)}
                                        className="flex-1 py-1.5 px-2 bg-yellow-500 text-gray-900 text-xs font-bold rounded"
                                    >
                                        نقشه
                                    </button>
                                    <button 
                                        onClick={() => openDirections(loc)}
                                        className="flex-1 py-1.5 px-2 bg-blue-500 text-white text-xs font-bold rounded"
                                    >
                                        مسیریابی
                                    </button>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
                
                {userLocation && (
                    <Marker
                        position={[userLocation.lat, userLocation.lng]}
                        icon={userLocationIcon}
                    >
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-blue-600">موقعیت شما</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
            
            <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-[1000]">
                <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-2">راهنمای نشانگرها:</p>
                <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs shadow-md">⚖️</div>
                        <span className="text-gray-700 dark:text-gray-300">دفاتر وکالت</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs shadow-md">📜</div>
                        <span className="text-gray-700 dark:text-gray-300">دفاتر اسناد رسمی</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs shadow-md">🏢</div>
                        <span className="text-gray-700 dark:text-gray-300">دادگاه‌ها</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs shadow-md">📋</div>
                        <span className="text-gray-700 dark:text-gray-300">ثبت اسناد</span>
                    </div>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {locations.length} مکان یافت شد
                    </p>
                </div>
            </div>
            
            {userLocation && (
                <div className="absolute bottom-4 left-4 bg-yellow-500 text-gray-900 px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-[1000] flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                    موقعیت شما ثبت شد
                </div>
            )}
        </div>
    );
};

export default LeafletMapComponent;
