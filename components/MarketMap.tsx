"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MarketMapProps {
    userLocation: { lat: number; lon: number };
    destination: { name: string; lat: number; lon: number };
}

function RecenterMap({ coords }: { coords: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(coords, map.getZoom());
    }, [coords, map]);
    return null;
}

export default function MarketMap({ userLocation, destination }: MarketMapProps) {
    const userPos: [number, number] = [userLocation.lat, userLocation.lon];
    const destPos: [number, number] = [destination.lat, destination.lon];

    // Simulated traffic-aware path (just a curve for visual)
    const path: [number, number][] = [
        userPos,
        [(userPos[0] + destPos[0]) / 2 + 0.02, (userPos[1] + destPos[1]) / 2 - 0.02],
        destPos
    ];

    return (
        <div className="h-full w-full">
            <MapContainer
                center={userPos}
                zoom={11}
                scrollWheelZoom={false}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={userPos}>
                    <Popup>Your Location</Popup>
                </Marker>
                <Marker position={destPos}>
                    <Popup>{destination.name} Market</Popup>
                </Marker>
                <Polyline positions={path} color="#2d6a4f" weight={4} opacity={0.7} dashArray="10, 10" />
                <RecenterMap coords={userPos} />
            </MapContainer>
        </div>
    );
}
