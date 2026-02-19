"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import { MandiRecommendation } from "@/lib/mandi";

// Fix Leaflet default icon issue in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom Green Icon for Best Mandi
const BestMandiIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Custom Blue Icon for User
const UserIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Standard Red/Gold for other Mandis
const ShopIcon = L.icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MandiMapProps {
    userLocation: { lat: number; lon: number; address: string };
    recommendations: MandiRecommendation[];
}

/**
 * Forces the map to recalculate its size after mounting.
 * This fixes the common Leaflet issue where tiles render
 * incorrectly (gray areas) when inside dynamic containers.
 */
function InvalidateSize() {
    const map = useMap();
    useEffect(() => {
        // Small delay to ensure the container has its final dimensions
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export default function MandiMap({ userLocation, recommendations }: MandiMapProps) {
    // Determine center: user location or default Kerala
    const center: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lon]
        : [9.5916, 76.5221]; // Default to Kottayam

    return (
        <MapContainer
            center={center}
            zoom={10}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%", minHeight: "256px", borderRadius: "1rem" }}
            className="z-0"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <InvalidateSize />
            <ChangeView center={center} zoom={11} />

            {/* User Marker */}
            {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lon]} icon={UserIcon}>
                    <Popup>
                        <strong>Your Location</strong><br />
                        {userLocation.address}
                    </Popup>
                </Marker>
            )}

            {/* Mandi Markers */}
            {recommendations.map((mandi, idx) => {
                const isBest = idx === 0;
                return (
                    <Marker
                        key={idx}
                        position={[mandi.coordinates.lat, mandi.coordinates.lon]}
                        icon={isBest ? BestMandiIcon : ShopIcon}
                    >
                        <Popup>
                            <strong>{mandi.mandi_name}</strong>
                            <br />
                            Price: ₹{mandi.modal_price}<br />
                            Profit: ₹{mandi.net_profit_per_kg}/kg<br />
                            Distance: {mandi.distance_km} km
                        </Popup>
                    </Marker>
                );
            })}

            {/* Route Line to Best Mandi */}
            {userLocation && recommendations.length > 0 && (
                <Polyline
                    positions={[
                        [userLocation.lat, userLocation.lon],
                        [recommendations[0].coordinates.lat, recommendations[0].coordinates.lon]
                    ]}
                    color="#2d6a4f"
                    weight={4}
                    dashArray="10, 10"
                    opacity={0.7}
                />
            )}
        </MapContainer>
    );
}
