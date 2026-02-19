"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";

const MandiMap = dynamic(() => import("@/components/MandiMap"), {
    ssr: false,
    loading: () => <div className="h-64 w-full bg-gray-50 flex items-center justify-center text-xs text-gray-400">Loading Map...</div>
});
import {
    TrendingUp,
    TrendingDown,
    Info,
    Map as MapIcon,
    CloudRain,
    Thermometer,
    Droplets,
    Calculator,
    Navigation,
    ArrowRight,
    ChevronRight,
    Maximize2,
    Zap,
    Calendar as CalendarIcon,
    Trash2,
    Plus,
    MapPin,
    Search,
} from "lucide-react";
import { getMarketTickerData, MarketData, getHistoricalPrices, findBestMandis, geocodeLocation, MandiRecommendation } from "@/lib/mandi";
import { AgroStackLogo } from "@/components/AgroStackLogo";

// --- Self-contained UI Components (to avoid missing dependency issues) ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const hasBg = className.includes("bg-");
    return (
        <div className={`rounded-3xl border border-gray-100 shadow-sm transition-all ${!hasBg ? "bg-white" : ""} ${className}`}>
            {children}
        </div>
    );
};

const CardHeader = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-6 pb-2 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <h3 className={`text-xl font-bold text-[#1a2e1a] ${className}`}>{children}</h3>
);

const CardDescription = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <p className={`text-sm text-gray-500 ${className}`}>{children}</p>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const Badge = ({ children, className = "", variant = "default" }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" | "secondary" }) => {
    const variants = {
        default: "bg-[#2d6a4f] text-white",
        outline: "border border-gray-200 text-gray-500",
        secondary: "bg-gray-100 text-gray-900"
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};

const Button = ({ children, className = "", variant = "default", onClick }: { children: React.ReactNode, className?: string, variant?: "default" | "outline" | "ghost", onClick?: () => void }) => {
    const variants = {
        default: "bg-[#2d6a4f] text-white hover:bg-[#1b4332]",
        outline: "border border-[#d8f3dc] bg-white text-[#1b4332] hover:bg-gray-50",
        ghost: "text-[#2d6a4f] hover:bg-green-50"
    };
    return (
        <button onClick={onClick} className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

// --- Mock Data (Based on farmer_dashboard_data.json) ---
const DASHBOARD_DATA = {
    crop_intelligence_cards: [
        {
            listing_id: "a1b2c3d4-e5f6-4a5b-bc6d-7e8f90123456",
            name: "Rubber",
            current_live_price: 184.50,
            predicted_price: 192.30,
            forecast_30d: 195.40,
            sparkline_7d_data: [182, 183.5, 183, 184, 184.2, 184, 184.5],
            expert_xai_snippet: "Price increase driven by 15% rainfall deficit in Kottayam regions. Prophet seasonal peaks aligned with LSTM volatility indicators."
        },
        {
            listing_id: "b2c3d4e5-f6a7-5b6c-cd7e-8f9012345678",
            name: "Black Pepper",
            current_live_price: 615.00,
            predicted_price: 608.15,
            forecast_30d: 598.00,
            sparkline_7d_data: [625, 622, 620, 618, 616, 615.5, 615],
            expert_xai_snippet: "Short-term price decrease detected (shock factor 4.2%). Hybrid model indicates correction after over-supply from Idukki harvest."
        }
    ],
    analytics_deep_dive: {
        hybrid_graph: {
            labels: ["Feb 07", "Feb 08", "Feb 09", "Feb 10", "Feb 11", "Feb 12", "Feb 13", "Feb 14", "Feb 15", "Feb 16"],
            historic_mandi: [178, 179, 181, 180, 182, 184, 184.5, null, null, null],
            ai_predicted_dotted: [178, 179.5, 180, 181, 182.5, 183.8, 184.5, 186, 189, 192.3]
        },
        market_heatmap: {
            center: "Palai",
            radius_km: 50,
            locations: [
                { mandi: "Kottayam", lat: 9.5916, lon: 76.5221, modal_price: 186.20 },
                { mandi: "Palai", lat: 9.7118, lon: 76.6853, modal_price: 185.00 },
                { mandi: "Kanjirappally", lat: 9.5559, lon: 76.7869, modal_price: 187.50 },
                { mandi: "Thodupuzha", lat: 9.8959, lon: 76.7184, modal_price: 183.80 }
            ]
        },
        weather_impact_meter: {
            current_metrics: { temp: 32.5, humidity: 68, rain_24h: 0.2 },
            shock_influence_coefficient: 0.12,
            status: "Moderate",
            advisory: "Dry spell detected in rubber-growing belts; minor tapping gains expected before seasonal drop."
        }
    }
};

// --- Master Pool of Supported Crops for Watchlist ---
const POOL_CROPS = [
    {
        listing_id: "a1b2c3d4-e5f6-4a5b-bc6d-7e8f90123456",
        name: "Rubber",
        current_live_price: 184.50,
        predicted_price: 192.30,
        forecast_30d: 195.40,
        sparkline_7d_data: [182, 183.5, 183, 184, 184.2, 184, 184.5],
        expert_xai_snippet: "Price increase driven by 15% rainfall deficit in Kottayam regions."
    },
    {
        listing_id: "b2c3d4e5-f6a7-5b6c-cd7e-8f9012345678",
        name: "Black Pepper",
        current_live_price: 615.00,
        predicted_price: 608.15,
        forecast_30d: 598.00,
        sparkline_7d_data: [625, 622, 620, 618, 616, 615.5, 615],
        expert_xai_snippet: "Short-term price decrease detected (shock factor 4.2%)."
    },
    {
        listing_id: "c3d4e5f6-a7b8-6c7d-de8f-9a0123456789",
        name: "Cardamom",
        current_live_price: 2450.00,
        predicted_price: 2510.00,
        forecast_30d: 2580.00,
        sparkline_7d_data: [2400, 2420, 2410, 2440, 2455, 2445, 2450],
        expert_xai_snippet: "Export demand surge from Middle East markets pushing prices up."
    },
    {
        listing_id: "d4e5f6a7-b8c9-7d8e-ef9a-012345678901",
        name: "Coffee Robusta",
        current_live_price: 158.00,
        predicted_price: 164.50,
        forecast_30d: 168.00,
        sparkline_7d_data: [152, 155, 154, 157, 158.5, 157, 158],
        expert_xai_snippet: "Global supply constraints in Vietnam providing price support."
    },
    {
        listing_id: "e5f6a7b8-c9d0-8e9f-f0a1-123456789012",
        name: "Arecanut",
        current_live_price: 432.00,
        predicted_price: 425.00,
        forecast_30d: 418.00,
        sparkline_7d_data: [445, 440, 438, 435, 433, 434, 432],
        expert_xai_snippet: "Domestic demand stabilization expected after festive peak."
    },
    {
        listing_id: "f6a7b8c9-d0e1-9f0a-a1b2-234567890123",
        name: "Ginger",
        current_live_price: 145.00,
        predicted_price: 152.00,
        forecast_30d: 158.00,
        sparkline_7d_data: [140, 142, 141, 144, 146, 145, 145],
        expert_xai_snippet: "Reduced cultivation area in Wayanad supporting firm prices."
    },
    {
        listing_id: "a7b8c9d0-e1f2-0a1b-b2c3-345678901234",
        name: "Turmeric",
        current_live_price: 112.50,
        predicted_price: 108.00,
        forecast_30d: 105.00,
        sparkline_7d_data: [120, 118, 115, 114, 112, 113, 112.5],
        expert_xai_snippet: "New harvest arrivals in Nizamabad expected to cool local sentiment."
    },
    {
        listing_id: "b8c9d0e1-f2a3-1b2c-c3d4-456789012345",
        name: "Nutmeg",
        current_live_price: 540.00,
        predicted_price: 555.00,
        forecast_30d: 562.00,
        sparkline_7d_data: [530, 535, 532, 538, 542, 539, 540],
        expert_xai_snippet: "Stable demand for high-quality mace driving whole nutmeg prices."
    },
    {
        listing_id: "c9d0e1f2-a3b4-2c3d-d4e5-567890123456",
        name: "Cocoa",
        current_live_price: 285.00,
        predicted_price: 298.00,
        forecast_30d: 310.00,
        sparkline_7d_data: [270, 275, 272, 280, 286, 284, 285],
        expert_xai_snippet: "International price rally triggered by Ivorian supply shortages."
    }
];

// --- Sub-components ---

const MarketTicker = ({ tickerData }: { tickerData: MarketData[] }) => {
    // If no data yet, show mock skeleton or empty
    const displayData = tickerData.length > 0 ? tickerData : [
        { crop_name: "Rubber", live_modal_price: 184.50, day_change_percentage: 1.25, trend_color_code: "#22c55e" },
        { crop_name: "Black Pepper", live_modal_price: 615.00, day_change_percentage: -0.45, trend_color_code: "#ef4444" },
        { crop_name: "Cardamom", live_modal_price: 2450.00, day_change_percentage: 2.1, trend_color_code: "#22c55e" },
        { crop_name: "Coffee Robusta", live_modal_price: 158.00, day_change_percentage: 0.85, trend_color_code: "#22c55e" },
        { crop_name: "Arecanut", live_modal_price: 432.00, day_change_percentage: -1.15, trend_color_code: "#ef4444" }
    ];

    return (
        <div className="relative overflow-hidden bg-[#0c1a0c] py-2 text-white/95 border-b border-white/5">
            <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                className="flex whitespace-nowrap"
            >
                {[...displayData, ...displayData].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 px-8 border-r border-white/10">
                        <span className="text-[10px] md:text-sm font-black uppercase tracking-widest text-green-400">
                            {item.crop_name}
                        </span>
                        <span className="text-xs md:text-base font-mono font-bold">
                            ₹{item.live_modal_price.toFixed(2)}
                        </span>
                        <span className={`flex items-center gap-1 text-[10px] md:text-xs font-black ${item.day_change_percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {item.day_change_percentage >= 0 ? (
                                <TrendingUp className="h-3 w-3" strokeWidth={3} />
                            ) : (
                                <TrendingDown className="h-3 w-3" strokeWidth={3} />
                            )}
                            {Math.abs(item.day_change_percentage)}%
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max === min ? 1 : max - min;
    const height = 40;
    const width = 120;
    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * width,
        y: height - ((d - min) / range) * height
    }));

    const pathData = `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`;

    return (
        <svg width={width} height={height} className="overflow-visible">
            <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d={pathData} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" opacity="0.1" />
        </svg>
    );
};

const IntelligenceCard = ({ crop, isSelected, onSelect, onDelete, livePrice }: { crop: any, isSelected: boolean, onSelect: () => void, onDelete: (e: React.MouseEvent) => void, livePrice?: number }) => {
    const displayPrice = livePrice || crop.current_live_price;
    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={onSelect}
            className={`relative group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${isSelected ? 'border-[#2d6a4f] bg-white shadow-xl shadow-[#2d6a4f]/10' : 'border-gray-100 bg-white/50 hover:border-[#b7e4c7] hover:shadow-lg'
                }`}
        >
            {/* Delete Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(e);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 z-10"
                title="Remove from watchlist"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>

            <div className="p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className={`flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${isSelected ? 'from-[#2d6a4f] to-[#40916c] text-white' : 'from-[#d8f3dc] to-[#b7e4c7] text-[#1b4332]'}`}>
                            <Zap className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-[#1a2e1a] truncate text-sm md:text-base">{crop.name}</h3>
                            <p className="text-[8px] md:text-[10px] font-semibold uppercase tracking-widest text-gray-400 truncate">AI Intelligence Active</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div>
                        <p className="text-[8px] md:text-[10px] font-medium uppercase tracking-wider text-gray-500">Current</p>
                        <p className="text-base md:text-xl font-bold text-[#1a2e1a]">₹{displayPrice.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] md:text-[10px] font-medium uppercase tracking-wider text-[#2d6a4f]">Predicted Price</p>
                        <p className="text-base md:text-xl font-bold text-[#2d6a4f]">₹{crop.forecast_30d.toFixed(2)}</p>
                    </div>
                </div>
                <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="w-full sm:w-auto overflow-hidden">
                        <Sparkline data={crop.sparkline_7d_data} color={crop.forecast_30d > displayPrice ? "#22c55e" : "#ef4444"} />
                    </div>
                    <div className="flex flex-col items-start sm:items-end">
                        <span className={`text-[10px] md:text-xs font-bold ${crop.forecast_30d > displayPrice ? 'text-green-600' : 'text-red-600'}`}>
                            {((crop.forecast_30d - displayPrice) / displayPrice * 100).toFixed(1)}% {crop.forecast_30d > displayPrice ? 'Gain' : 'Loss'}
                        </span>
                    </div>
                </div>
            </div>
            {isSelected && <motion.div layoutId="active-indicator" className="absolute bottom-0 left-0 h-1 w-full bg-linear-to-r from-[#2d6a4f] to-[#40916c]" />}
        </motion.div>
    );
};

// --- Main Page Component ---

export default function OverviewPage() {
    const [tickerData, setTickerData] = useState<MarketData[]>([]);
    const [isLoadingPrices, setIsLoadingPrices] = useState(true);
    const [crops, setCrops] = useState(POOL_CROPS.slice(0, 2)); // Start with Rubber & Pepper
    const [selectedCrop, setSelectedCrop] = useState(POOL_CROPS[0]);
    const [calcQuantity, setCalcQuantity] = useState(100);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [historicalData, setHistoricalData] = useState<{ date: string, price: number }[]>([]);
    const [weatherData, setWeatherData] = useState<{
        temp: number;
        humidity: number;
        status: string;
        advisory: string;
        shock: number;
    }>({
        temp: DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.current_metrics.temp,
        humidity: DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.current_metrics.humidity,
        status: DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.status,
        advisory: DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.advisory,
        shock: DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.shock_influence_coefficient,
    });

    React.useEffect(() => {
        const fetchWeather = async () => {
            try {
                // Open Meteo API for Kottayam (9.5916, 76.5221)
                const response = await fetch(
                    "https://api.open-meteo.com/v1/forecast?latitude=9.5916&longitude=76.5221&current=temperature_2m,relative_humidity_2m,rain,weather_code"
                );
                const data = await response.json();

                if (data.current) {
                    const temp = data.current.temperature_2m;
                    const humidity = data.current.relative_humidity_2m;
                    const rain = data.current.rain;

                    // Determine status and advisory based on conditions
                    let status = "Moderate";
                    let advisory = "Conditions are stable for rubber and pepper crops.";
                    let shock = 0.12;

                    if (temp > 35) {
                        status = "High";
                        advisory = "Extreme heat detected; irrigation recommended to prevent moisture stress.";
                        shock = 0.25;
                    } else if (rain > 15) {
                        status = "High";
                        advisory = "Heavy rainfall detected; plan for drainage and fungal protection.";
                        shock = 0.30;
                    } else if (temp < 20) {
                        status = "Low";
                        advisory = "Cooler weather may slow crop maturation but reduces water demand.";
                        shock = 0.05;
                    } else if (humidity < 40) {
                        status = "Moderate";
                        advisory = "Low humidity detected; monitor for potential dry-spell impacts.";
                        shock = 0.15;
                    }

                    setWeatherData({
                        temp,
                        humidity,
                        status,
                        advisory,
                        shock
                    });
                }
            } catch (error) {
                console.error("Failed to fetch live weather:", error);
            }
        };

        fetchWeather();
    }, []);

    // ── Location & Mandi Optimizer ─────────────────────────────────
    const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; address: string } | null>(null);
    const [locationQuery, setLocationQuery] = useState("");
    const [isLocating, setIsLocating] = useState(false);
    const [mandiRecommendations, setMandiRecommendations] = useState<MandiRecommendation[]>([]);

    const fetchRecommendations = async (lat: number, lon: number) => {
        const recs = await findBestMandis(selectedCrop.name, calcQuantity, lat, lon);
        setMandiRecommendations(recs);
    };

    const handleGPS = () => {
        if (!navigator.geolocation) return;
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserLocation({ lat: latitude, lon: longitude, address: "GPS Location" });
            await fetchRecommendations(latitude, longitude);
            setIsLocating(false);
        }, (err) => {
            console.error(err);
            setIsLocating(false);
        });
    };

    const handleManualLocation = async () => {
        if (!locationQuery) return;
        setIsLocating(true);
        const loc = await geocodeLocation(locationQuery);
        if (loc) {
            setUserLocation({ lat: loc.lat, lon: loc.lon, address: loc.display_name });
            await fetchRecommendations(loc.lat, loc.lon);
        }
        setIsLocating(false);
    };

    React.useEffect(() => {
        if (userLocation) {
            fetchRecommendations(userLocation.lat, userLocation.lon);
        }
    }, [selectedCrop.name, calcQuantity]);

    React.useEffect(() => {
        const fetchPrices = async () => {
            setIsLoadingPrices(true);
            try {
                const liveData = await getMarketTickerData();
                if (liveData && liveData.length > 0) {
                    setTickerData(liveData);

                    // Update initial selected crop with live price if available
                    const firstCrop = DASHBOARD_DATA.crop_intelligence_cards[0];
                    const liveMatch = liveData.find(t => t.crop_name === firstCrop.name);
                    if (liveMatch) {
                        setSelectedCrop(prev => ({
                            ...prev,
                            current_live_price: liveMatch.live_modal_price
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch live prices:", error);
            } finally {
                setIsLoadingPrices(false);
            }
        };
        fetchPrices();
    }, []);

    React.useEffect(() => {
        const fetchHistory = async () => {
            const data = await getHistoricalPrices(selectedCrop.name);
            setHistoricalData(data);
        };
        fetchHistory();
    }, [selectedCrop.name]);

    const handleAddCrop = (crop: any) => {
        if (!crops.find(c => c.listing_id === crop.listing_id)) {
            setCrops([...crops, crop]);
        }
        setShowAddMenu(false);
    };

    const handleDeleteCrop = (listingId: string) => {
        const filtered = crops.filter(c => c.listing_id !== listingId);
        setCrops(filtered);
        if (selectedCrop.listing_id === listingId && filtered.length > 0) {
            setSelectedCrop(filtered[0]);
        }
    };

    const getLivePriceForCrop = (name: string) => {
        const liveMatch = tickerData?.find(t => t.crop_name === name || (name === "Rubber" && t.crop_name === "Rubber") || (name === "Black Pepper" && t.crop_name === "Black Pepper"));
        return liveMatch?.live_modal_price;
    };

    // --- Dynamic SVG Paths for Hybrid Graph ---
    const generatePaths = () => {
        if (historicalData.length === 0) return { historical: "", predicted: "", currentX: 300 };

        const prices = historicalData.map(h => h.price);
        const min = Math.min(...prices) * 0.95;
        const max = Math.max(...prices, selectedCrop.predicted_price) * 1.05;
        const range = max - min;

        const hPoints = historicalData.map((h, i) => ({
            x: (i / (historicalData.length - 1)) * 500,
            y: 250 - ((h.price - min) / range) * 200
        }));

        const currentX = hPoints[hPoints.length - 1].x;
        const currentY = hPoints[hPoints.length - 1].y;
        const targetY = 250 - ((selectedCrop.predicted_price - min) / range) * 200;

        return {
            historical: `M ${hPoints.map(p => `${p.x},${p.y}`).join(" L ")}`,
            predicted: `M ${currentX},${currentY} L 400,${targetY} L 500,${targetY - 20}`,
            currentX
        };
    };

    const graphPaths = generatePaths();

    // ── Decision-Support Engine ────────────────────────────────────
    const VOLATILITY = 0.12;        // ±12%
    const STORAGE_PER_KG_MONTH = 1.5;  // ₹/kg/month
    const COST_RATIO = 0.6;         // ~60% cost ratio estimate

    const currentPrice = parseFloat(
        (getLivePriceForCrop(selectedCrop.name) || selectedCrop.current_live_price).toFixed(2)
    );
    const price3m = parseFloat((currentPrice * 1.05).toFixed(2));
    const price6m = parseFloat((currentPrice * 1.10).toFixed(2));

    const estimatedCost = calcQuantity * currentPrice * COST_RATIO;
    const breakEvenPrice = calcQuantity > 0 ? parseFloat((estimatedCost / calcQuantity).toFixed(2)) : 0;

    // Storage costs
    const storageCost3m = calcQuantity * STORAGE_PER_KG_MONTH * 3;
    const storageCost6m = calcQuantity * STORAGE_PER_KG_MONTH * 6;

    // Net profits (revenue - cost - storage)
    const currentProfit = parseFloat(((calcQuantity * currentPrice) - estimatedCost).toFixed(2));
    const profit3m = parseFloat(((calcQuantity * price3m) - estimatedCost - storageCost3m).toFixed(2));
    const profit6m = parseFloat(((calcQuantity * price6m) - estimatedCost - storageCost6m).toFixed(2));

    // Price volatility ranges
    const price3mLow = parseFloat((price3m * (1 - VOLATILITY)).toFixed(2));
    const price3mHigh = parseFloat((price3m * (1 + VOLATILITY)).toFixed(2));
    const price6mLow = parseFloat((price6m * (1 - VOLATILITY)).toFixed(2));
    const price6mHigh = parseFloat((price6m * (1 + VOLATILITY)).toFixed(2));

    // Risk level
    const riskLevel = VOLATILITY * 100 < 8 ? "Low" : VOLATILITY * 100 <= 15 ? "Medium" : "High";

    // Confidence score
    let confidence = 75;
    if (VOLATILITY * 100 > 15) confidence -= 10;
    // rainfall data not available client-side; default
    confidence = Math.max(0, Math.min(100, confidence));

    // Smart recommendation
    const getRecommendation = (): string => {
        if (currentPrice < breakEvenPrice) {
            return `⚠️ Current price (₹${currentPrice}) is below break-even (₹${breakEvenPrice}/kg). Consider reducing costs or waiting.`;
        }
        if (price3m < breakEvenPrice && price6m < breakEvenPrice) {
            return "📉 Projected prices remain below break-even. Sell now to minimize losses.";
        }
        if (riskLevel === "High") {
            return "⚡ High market volatility. Consider selling 50% now and holding the rest.";
        }
        if (profit6m > profit3m && profit6m > currentProfit) {
            return `📈 Holding for 6 months yields the highest net profit (₹${profit6m.toLocaleString()} vs ₹${currentProfit.toLocaleString()} now), even after storage costs.`;
        }
        if (profit3m > currentProfit) {
            return `📊 Selling after 3 months offers better returns (₹${profit3m.toLocaleString()} vs ₹${currentProfit.toLocaleString()} now) with moderate risk.`;
        }
        return "✅ Selling now is your best option. Projected gains don't justify storage costs.";
    };
    const recommendation = getRecommendation();

    return (
        <div className="flex-1 bg-[#f8faf6] pb-12 min-w-0">
            <MarketTicker tickerData={tickerData} />

            <main className="mx-auto max-w-7xl px-4 py-6 md:py-8 sm:px-6 lg:px-8">
                <div className="mb-8 md:mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-center gap-6">
                        <AgroStackLogo size={48} />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1b4332]">Market Intelligence</h1>
                            <p className="mt-2 text-base md:text-lg text-gray-600">AI-driven insights for your farm portfolio.</p>
                        </div>
                    </div>
                    <div className="flex gap-2 md:gap-3">
                        {/* <Button variant="outline" className="flex-1 md:flex-none gap-2 border-[#d8f3dc] bg-white/50 backdrop-blur-sm px-3 md:px-4">
                            <CalendarIcon className="h-4 w-4" /> <span className="hidden xs:inline">Last 30 Days</span><span className="xs:hidden">30d</span>
                        </Button> */}
                        {/* <Button className="flex-1 md:flex-none gap-2 px-3 md:px-4">
                            <Maximize2 className="h-4 w-4" /> <span className="hidden xs:inline">Full Report</span><span className="xs:hidden">Report</span>
                        </Button> */}
                    </div>
                </div>

                <div className="mb-10">
                    <div className="mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-[#2d6a4f]" />
                        <h2 className="text-xl font-bold text-[#1b4332]">Price Forecasters</h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {crops.map((crop) => (
                            <IntelligenceCard
                                key={crop.listing_id}
                                crop={crop}
                                isSelected={selectedCrop.listing_id === crop.listing_id}
                                onSelect={() => {
                                    const livePrice = getLivePriceForCrop(crop.name);
                                    setSelectedCrop({
                                        ...crop,
                                        current_live_price: livePrice || crop.current_live_price
                                    });
                                }}
                                onDelete={() => handleDeleteCrop(crop.listing_id)}
                                livePrice={isLoadingPrices ? undefined : getLivePriceForCrop(crop.name)}
                            />
                        ))}

                        <div className="relative group/add">
                            <div
                                onClick={() => setShowAddMenu(!showAddMenu)}
                                className="flex h-full min-h-[160px] items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 transition-all hover:bg-white hover:border-[#2d6a4f] hover:shadow-lg cursor-pointer"
                            >
                                <div className="text-center">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-green-100/50 text-[#2d6a4f] text-2xl">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <p className="mt-2 text-xs font-semibold text-gray-400 uppercase tracking-widest group-hover/add:text-[#2d6a4f]">Add Watchlist</p>
                                </div>
                            </div>

                            <AnimatePresence>
                                {showAddMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                        className="absolute top-full left-0 right-0 z-50 mt-2 rounded-2xl bg-white p-2 shadow-2xl border border-gray-100"
                                    >
                                        <div className="p-2 border-b border-gray-50 mb-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Available Crops</p>
                                        </div>
                                        <div className="space-y-1">
                                            {POOL_CROPS.filter(p => !crops.find(c => c.listing_id === p.listing_id)).map(p => (
                                                <button
                                                    key={p.listing_id}
                                                    onClick={() => handleAddCrop(p)}
                                                    className="flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-left text-sm font-bold text-[#1a2e1a] hover:bg-green-50 hover:text-[#2d6a4f] transition-colors"
                                                >
                                                    {p.name}
                                                    <ChevronRight className="h-4 w-4 opacity-50" />
                                                </button>
                                            ))}
                                            {POOL_CROPS.filter(p => !crops.find(c => c.listing_id === p.listing_id)).length === 0 && (
                                                <p className="p-4 text-center text-xs text-gray-400">All available crops are in your watchlist.</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                <div className="mb-10 grid gap-6 lg:gap-8 lg:grid-cols-3">
                    {/* Side Module Stack - Now on Left for Desktop */}
                    <div className="flex flex-col gap-6 lg:gap-8 order-2 lg:order-1">
                        <Card className="border-none bg-white shadow-xl shadow-green-900/5 transition-transform hover:scale-[1.01]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base md:text-lg flex items-center gap-2 text-[#1a2e1a]"><Calculator className="h-4 w-4 md:h-5 md:w-5 text-[#2d6a4f]" /> Revenue Projection</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-4">
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Quantity</span>
                                        <span className="text-sm font-mono font-bold text-[#2d6a4f]">{calcQuantity} kg</span>
                                    </div>
                                    <div className="px-1">
                                        <input type="range" min="0" max="2000" step="10" value={calcQuantity} onChange={(e) => setCalcQuantity(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#2d6a4f]" />
                                    </div>
                                </div>
                                <div className="rounded-2xl bg-gray-50/50 p-4 space-y-4">
                                    <div className="flex justify-between border-b border-gray-100 pb-3">
                                        <span className="text-[10px] font-semibold text-gray-400 font-mono uppercase tracking-widest">Current</span>
                                        <span className="text-sm font-bold text-[#1a2e1a]">₹{(calcQuantity * (getLivePriceForCrop(selectedCrop.name) || selectedCrop.current_live_price)).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="text-[10px] font-bold text-[#2d6a4f] uppercase tracking-widest flex items-center gap-1 opacity-80"><Zap className="h-3 w-3" /> AI Target</span>
                                        <span className="text-base md:text-lg font-black text-[#2d6a4f]">₹{(calcQuantity * selectedCrop.predicted_price).toLocaleString()}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none bg-[#1b4332] text-white shadow-xl shadow-green-900/10 transition-all hover:scale-[1.01]">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base md:text-lg flex items-center gap-2 text-white"><CloudRain className="h-4 w-4 md:h-5 md:w-5 text-green-300" /> Climate Risk Level</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mt-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-2xl md:text-3xl font-black text-white">{weatherData.status}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-200/60">Risk Status</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg md:text-xl font-mono text-white">{(weatherData.shock * 100).toFixed(0)}%</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-200/60">Impact</p>
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1 rounded-xl bg-white/10 p-2.5">
                                        <div className="flex items-center gap-2 text-green-300"><Thermometer className="h-3 w-3" /><span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Temp</span></div>
                                        <span className="text-sm font-bold text-white">{weatherData.temp}°C</span>
                                    </div>
                                    <div className="flex flex-col gap-1 rounded-xl bg-white/10 p-2.5">
                                        <div className="flex items-center gap-2 text-green-300"><Droplets className="h-3 w-3" /><span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Humid</span></div>
                                        <span className="text-sm font-bold text-white">{weatherData.humidity}%</span>
                                    </div>
                                </div>
                                <div className="mt-6 border-t border-white/10 pt-4"><p className="text-[11px] leading-relaxed italic text-green-100/80">"{weatherData.advisory}"</p></div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="col-span-1 lg:col-span-2 bg-white shadow-xl shadow-green-900/5">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#2d6a4f]" /> Forward Price Outlook</CardTitle>
                                    <CardDescription>Revenue & Profit Projection · {calcQuantity} kg · {selectedCrop.name}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={`text-[10px] px-2 py-1 ${riskLevel === "Low" ? "bg-green-100 text-green-700" :
                                        riskLevel === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                            "bg-red-100 text-red-700"
                                        }`}>{riskLevel} Risk</Badge>
                                    <Badge variant="outline" className="text-[10px] px-2 py-1 border-[#2d6a4f] text-[#2d6a4f]">{confidence}% Confidence</Badge>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Break-Even Line */}
                            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
                                    <Calculator className="h-4 w-4 text-[#2d6a4f]" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Break-Even Price</p>
                                    <p className="text-sm font-bold text-[#1a2e1a]">₹{breakEvenPrice.toLocaleString()}/kg</p>
                                </div>
                                <div className={`text-xs font-bold px-2 py-1 rounded-lg ${currentPrice > breakEvenPrice ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                    {currentPrice > breakEvenPrice ? "✓ Above" : "✗ Below"}
                                </div>
                            </div>

                            {/* Price Comparison Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Current */}
                                <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sell Now</p>
                                    <p className="text-xl font-bold text-[#1a2e1a] mt-1">₹{currentPrice.toLocaleString()}/kg</p>
                                    <div className="mt-3 pt-3 border-t border-green-100">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Net Profit</p>
                                        <p className="text-lg font-black text-[#2d6a4f]">₹{currentProfit.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-400">No storage cost</p>
                                    </div>
                                </div>

                                {/* 3 Months */}
                                <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">After 3 Months</p>
                                    <p className="text-xl font-bold text-[#1a2e1a] mt-1">₹{price3m.toLocaleString()}/kg</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Range: ₹{price3mLow} – ₹{price3mHigh}</p>
                                    <div className="mt-3 pt-3 border-t border-blue-100">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Net Profit</p>
                                        <p className={`text-lg font-black ${profit3m > currentProfit ? "text-[#2d6a4f]" : "text-gray-600"}`}>₹{profit3m.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-400">Storage: ₹{storageCost3m.toLocaleString()}</p>
                                    </div>
                                </div>

                                {/* 6 Months */}
                                <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">After 6 Months</p>
                                    <p className="text-xl font-bold text-[#1a2e1a] mt-1">₹{price6m.toLocaleString()}/kg</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Range: ₹{price6mLow} – ₹{price6mHigh}</p>
                                    <div className="mt-3 pt-3 border-t border-purple-100">
                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Net Profit</p>
                                        <p className={`text-lg font-black ${profit6m > currentProfit ? "text-[#2d6a4f]" : "text-gray-600"}`}>₹{profit6m.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-400">Storage: ₹{storageCost6m.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Confidence Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <span>Projection Confidence</span>
                                    <span className="text-[#2d6a4f]">{confidence}%</span>
                                </div>
                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${confidence}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#40916c]"
                                    />
                                </div>
                            </div>

                            {/* AI Recommendation */}
                            <div className="p-4 rounded-xl bg-[#f0f7ed] border border-[#d8f3dc]">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#2d6a4f] shadow-sm">
                                        <Zap className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#2d6a4f] mb-1">AI Recommendation</p>
                                        <p className="text-sm leading-relaxed text-[#1a2e1a]">{recommendation}</p>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                </div>

                {/* Global Opportunities - Heatmap and Router */}
                {/* Dynamically replaced Mandi Finder */}
                <div className="w-full">
                    <Card className="border-none bg-white shadow-xl shadow-green-900/5 transition-transform hover:scale-[1.005] overflow-hidden relative">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-[#1a2e1a]">
                                <Navigation className="h-4 w-4 md:h-5 md:w-5 text-[#2d6a4f]" />
                                Smart Mandi Finder
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm">
                                Find the most profitable market based on your location and real-time prices.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter Village / Pincode"
                                        value={locationQuery}
                                        onChange={(e) => setLocationQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleManualLocation()}
                                        disabled={isLocating}
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2d6a4f] transition-colors disabled:opacity-50"
                                    />
                                </div>
                                <Button onClick={handleManualLocation} className="h-auto rounded-xl px-4">Find</Button>
                                <button
                                    onClick={handleGPS}
                                    disabled={isLocating}
                                    className="h-auto aspect-square flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
                                    title="Use GPS"
                                >
                                    <MapIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Address Display */}
                            {userLocation && (
                                <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                                    <MapPin className="h-3.5 w-3.5 text-[#2d6a4f]" />
                                    <span className="font-medium">Location:</span> {userLocation.address}
                                </div>
                            )}

                            {isLocating && (
                                <div className="py-8 text-center text-gray-500 flex flex-col items-center gap-3">
                                    <div className="h-6 w-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs">Locating & Analyzing Markets...</p>
                                </div>
                            )}

                            {!isLocating && mandiRecommendations.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">
                                        <span>Market Option</span>
                                        <span>Profit Potential</span>
                                    </div>
                                    {mandiRecommendations.map((mandi, idx) => (
                                        <div
                                            key={idx}
                                            className={`relative p-3 rounded-xl border transition-all hover:scale-[1.01] cursor-default
                                                ${idx === 0 ? "bg-[#f0f7ed] border-[#2d6a4f] shadow-sm" : "bg-white border-gray-100 hover:border-gray-200"}
                                            `}
                                        >
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className={`text-sm font-bold ${idx === 0 ? "text-[#1a2e1a]" : "text-gray-700"}`}>{mandi.mandi_name}</h4>
                                                <span className={`text-xs font-bold ${idx === 0 ? "text-[#2d6a4f]" : "text-gray-900"}`}>
                                                    ₹{mandi.net_profit_per_kg.toFixed(2)}<span className="text-[10px] font-normal text-gray-500">/kg</span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                                <span className="flex items-center gap-1"><Navigation className="h-3 w-3" /> {mandi.distance_km} km</span>
                                                <span className="flex items-center gap-1">⏱ {mandi.travel_time_mins} min</span>
                                                <span className="ml-auto font-medium text-gray-500">Modal Price: ₹{mandi.modal_price}</span>
                                            </div>
                                            {idx === 0 && (
                                                <div className="absolute -top-2 -right-2 bg-[#2d6a4f] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                                    BEST CHOICE
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-[10px] text-gray-500 leading-relaxed border border-gray-100">
                                        <span className="font-bold text-gray-700">Profit Logic:</span> (Price × Yield) - (Road Distance × ₹0.5/kg/km × Yield). Estimated yield: {calcQuantity}kg.
                                    </div>

                                    {/* Map Visualization */}
                                    {userLocation && (
                                        <div className="mt-4 h-120 w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                                            <MandiMap userLocation={userLocation} recommendations={mandiRecommendations} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {!isLocating && mandiRecommendations.length === 0 && !userLocation && (
                                <div className="py-8 text-center text-gray-400">
                                    <MapPin className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">Enter your location to find nearby markets</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>

    );
}
