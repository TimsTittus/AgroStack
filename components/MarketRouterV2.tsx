"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, Zap, ChevronRight, ArrowRight, MapIcon, Loader2, LocateFixed, X } from "lucide-react";
import { calculateMarketScores, MarketScore, getBestMarketPreview } from "@/lib/mandi";
import dynamic from "next/dynamic";

import { Input } from "@/components/ui/input";

interface MarketMapProps {
    userLocation: { lat: number; lon: number };
    destination: { name: string; lat: number; lon: number };
}

const MarketMap = dynamic<MarketMapProps>(() => import("@/components/MarketMap"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

type State = "INITIAL" | "LOCATION_PROMPT" | "MAP_VIEW";

interface MarketRouterV2Props {
    cropName: string;
}

export default function MarketRouterV2({ cropName }: MarketRouterV2Props) {
    const [state, setState] = useState<State>("INITIAL");
    const [scores, setScores] = useState<MarketScore[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);
    const [address, setAddress] = useState("");
    const [showManual, setShowManual] = useState(false);
    const [preview, setPreview] = useState<{ name: string, price: number, profit: number } | null>(null);

    useEffect(() => {
        const fetchPreview = async () => {
            const data = await getBestMarketPreview(cropName);
            setPreview(data);
        };
        fetchPreview();
    }, [cropName]);

    const handleStartRouting = () => {
        setState("LOCATION_PROMPT");
    };

    const processLocation = async (loc: { lat: number, lon: number }) => {
        setLoading(true);
        setUserLocation(loc);
        const results = await calculateMarketScores(cropName, 500, loc); // Default 500kg
        setScores(results);
        setLoading(false);
        setState("MAP_VIEW");
    };

    const handleGeolocation = () => {
        setLoading(true);
        setError(null);
        if (!navigator.geolocation) {
            setError("Geolocation not supported");
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                await processLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
            },
            (err) => {
                setError("GPS permission denied. Please enter location manually.");
                setLoading(false);
                setShowManual(true);
            }
        );
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address.trim()) return;

        setLoading(true);
        // Mock geocoding: returning Kottayam city coords if address is entered
        setTimeout(async () => {
            await processLocation({ lat: 9.5916, lon: 76.5222 });
        }, 800);
    };

    const handleBack = () => {
        setState("INITIAL");
        setError(null);
        setShowManual(false);
    };

    const bestMarket = scores[0];

    return (
        <Card className={`border-none transition-all duration-500 hover:scale-[1.01] shadow-xl ${state === "MAP_VIEW"
            ? "bg-white text-[#1b4332] lg:col-span-2 ring-2 ring-[#2d6a4f]/20"
            : "bg-gradient-to-br from-[#1b4332] to-[#2d6a4f] text-white shadow-green-900/20 shadow-xl"
            }`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className={`flex items-center gap-2 text-base md:text-lg ${state === "MAP_VIEW" ? "text-[#1a2e1a]" : "text-white"}`}>
                        <Navigation className={`h-4 w-4 md:h-5 md:w-5 ${state === "MAP_VIEW" ? "text-[#2d6a4f]" : "text-[#d8f3dc]"}`} />
                        Best Market Router
                    </CardTitle>
                    {state !== "INITIAL" && (
                        <Button variant="ghost" size="sm" onClick={handleBack} className={state === "MAP_VIEW" ? "text-gray-400" : "text-white/60"}>
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full gap-4">
                {state === "INITIAL" && (
                    <>
                        <div className="mb-2 rounded-2xl bg-white/10 p-4 md:p-6 backdrop-blur-md">
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d8f3dc]/60">Top Destination</span>
                                <Badge className="bg-green-400 text-green-950 px-2 py-0">98% Match</Badge>
                            </div>
                            <h4 className="text-2xl md:text-3xl font-black text-white">{preview?.name || "Loading..."}</h4>
                            <div className="mt-4 flex items-end gap-3 translate-y-2">
                                <div className="border-l-2 border-green-400 pl-3">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-green-200/50">Market Price</p>
                                    <p className="text-sm font-black text-white">₹{preview?.price || "..."}</p>
                                </div>
                                <div className="border-l-2 border-green-300 pl-3">
                                    <p className="text-[8px] font-bold uppercase tracking-widest text-green-200/50">Est. Profit</p>
                                    <p className="text-xl font-black text-white">₹{preview?.profit || "..."}<span className="text-[10px] font-normal opacity-60">/kg</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto flex flex-col xs:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 w-full xs:w-auto">
                                <div className="rounded-lg bg-green-400/20 p-2"><ChevronRight className="h-4 w-4 text-green-300" /></div>
                                <div className="min-w-0">
                                    <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-green-200/50 truncate">Routing Engine</p>
                                    <p className="text-xs md:text-sm font-semibold text-white truncate">Traffic & Toll Optimized</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleStartRouting}
                                className="w-full xs:w-auto rounded-xl bg-white text-[#1b4332] border-none hover:bg-green-50 h-9 md:h-10 text-xs md:text-sm font-bold shadow-lg"
                            >
                                Start Route <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                            </Button>
                        </div>
                    </>
                )}

                {state === "LOCATION_PROMPT" && (
                    <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="rounded-full bg-white/10 p-4 mb-4">
                            <LocateFixed className="h-8 w-8 text-green-300" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Routing Options</h3>
                        <p className="text-xs text-green-100/60 mb-6 max-w-[240px]">Find the most profitable market from your current location.</p>

                        {!showManual ? (
                            <div className="flex flex-col gap-3 w-full">
                                <Button onClick={handleGeolocation} disabled={loading} className="w-full bg-white text-[#1b4332] hover:bg-green-50">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LocateFixed className="h-4 w-4 mr-2" />}
                                    Use GPS Location
                                </Button>
                                <Button variant="ghost" className="text-xs text-green-200 hover:text-white" onClick={() => setShowManual(true)}>
                                    Enter Address Manually
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleManualSubmit} className="flex flex-col gap-3 w-full animate-in zoom-in-95">
                                <Input
                                    type="text"
                                    placeholder="Enter street, city, or zip code"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="bg-white/20 border-white/20 text-white placeholder:text-white/40 focus:bg-white/30 h-10 rounded-xl"
                                    autoFocus
                                />
                                <Button type="submit" disabled={loading || !address} className="w-full bg-white text-[#1b4332] hover:bg-green-50">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Calculate Route"}
                                </Button>
                                <Button variant="ghost" className="text-[10px] text-green-200 uppercase font-bold tracking-widest" onClick={() => setShowManual(false)}>
                                    Back to GPS
                                </Button>
                            </form>
                        )}
                        {error && <p className="mt-4 text-[10px] font-bold text-red-300 uppercase tracking-widest">{error}</p>}
                    </div>
                )}

                {state === "MAP_VIEW" && bestMarket && (
                    <div className="grid lg:grid-cols-2 gap-6 animate-in zoom-in-95 duration-500">
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-[#e8f0e4] border border-[#2d6a4f]/10">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-black">{bestMarket.mandi_name}</h4>
                                    <Badge className="bg-[#2d6a4f] text-white">{bestMarket.match_percentage}% Match</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-white p-2 rounded-xl text-center">
                                        <p className="text-[8px] uppercase font-bold text-gray-400">Distance</p>
                                        <p className="text-xs font-black">{bestMarket.route.distance_km}km</p>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl text-center">
                                        <p className="text-[8px] uppercase font-bold text-gray-400">Time</p>
                                        <p className="text-xs font-black">{bestMarket.route.duration_mins}m</p>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl text-center border-b-2 border-[#2d6a4f]">
                                        <p className="text-[8px] uppercase font-bold text-gray-400 text-[#2d6a4f]">Net Profit</p>
                                        <p className="text-xs font-black text-[#2d6a4f]">₹{bestMarket.net_profit.toFixed(1)}/kg</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs px-2">
                                    <span className="text-gray-500 font-medium">Fuel Cost</span>
                                    <span className="font-bold">₹{bestMarket.route.fuel_cost.toFixed(0)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs px-2">
                                    <span className="text-gray-500 font-medium">Tolls & Labor</span>
                                    <span className="font-bold">₹{(bestMarket.route.tolls + bestMarket.route.labor_cost).toFixed(0)}</span>
                                </div>
                                <Button className="w-full bg-[#1b4332] text-white rounded-xl">Open in Google Maps</Button>
                            </div>
                        </div>

                        <div className="h-64 lg:h-full min-h-[240px] rounded-2xl overflow-hidden border-2 border-gray-100 shadow-inner">
                            <MarketMap
                                userLocation={userLocation!}
                                destination={{
                                    name: bestMarket.mandi_name,
                                    lat: bestMarket.lat,
                                    lon: bestMarket.lon
                                }}
                            />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
