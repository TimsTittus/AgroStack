"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
} from "lucide-react";
import { getMarketTickerData, MarketData, getHistoricalPrices } from "@/lib/mandi";
import MarketRouterV2 from "@/components/MarketRouterV2";
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
    market_ticker: [
        { crop_name: "Rubber", live_modal_price: 184.50, day_change_percentage: 1.25, trend_color_code: "#22c55e" },
        { crop_name: "Black Pepper", live_modal_price: 615.00, day_change_percentage: -0.45, trend_color_code: "#ef4444" },
        { crop_name: "Cardamom", live_modal_price: 2450.00, day_change_percentage: 2.10, trend_color_code: "#22c55e" },
        { crop_name: "Coffee Robusta", live_modal_price: 158.00, day_change_percentage: 0.85, trend_color_code: "#22c55e" },
        { crop_name: "Arecanut", live_modal_price: 432.00, day_change_percentage: -1.15, trend_color_code: "#ef4444" },
    ],
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

// --- Sub-components ---

const MarketTicker = ({ tickerData }: { tickerData: MarketData[] }) => (
    <div className="relative overflow-hidden bg-[#1b4332] py-2 text-white/90 shadow-inner">
        <motion.div
            animate={{ x: ["0%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            className="flex whitespace-nowrap"
        >
            {[...tickerData, ...tickerData].map((item, idx) => (
                <div key={idx} className="mx-4 md:mx-8 flex items-center gap-2 md:gap-3 border-r border-white/10 pr-4 md:pr-8 last:border-0">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-green-300/80">{item.crop_name}</span>
                    <span className="text-xs md:text-sm font-mono font-semibold">₹{item.live_modal_price.toFixed(2)}</span>
                    <span className={`flex items-center text-[10px] md:text-xs font-bold ${item.day_change_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.day_change_percentage >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                        {Math.abs(item.day_change_percentage)}%
                    </span>
                </div>
            ))}
        </motion.div>
    </div>
);

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

const IntelligenceCard = ({ crop, isSelected, onSelect, livePrice }: { crop: any, isSelected: boolean, onSelect: () => void, livePrice?: number }) => {
    const displayPrice = livePrice || crop.current_live_price;
    return (
        <motion.div
            whileHover={{ y: -4 }}
            onClick={onSelect}
            className={`relative cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${isSelected ? 'border-[#2d6a4f] bg-white shadow-xl shadow-[#2d6a4f]/10' : 'border-gray-100 bg-white/50 hover:border-[#b7e4c7] hover:shadow-lg'
                }`}
        >
            <div className="p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className={`flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${isSelected ? 'from-[#2d6a4f] to-[#40916c] text-white' : 'from-[#d8f3dc] to-[#b7e4c7] text-[#1b4332]'}`}>
                            <Zap className="h-4 w-4 md:h-5 md:w-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-[#1a2e1a] truncate text-sm md:text-base">{crop.name}</h3>
                            <p className="text-[8px] md:text-[10px] font-semibold uppercase tracking-widest text-gray-400 truncate">AI Intelligence Active</p>
                        </div>
                    </div>
                    <Badge variant="outline" className={`${isSelected ? 'border-[#2d6a4f] text-[#2d6a4f]' : ''} text-[10px] px-1.5 md:px-2.5`}>Live</Badge>
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
            {isSelected && <motion.div layoutId="active-indicator" className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#2d6a4f] to-[#40916c]" />}
        </motion.div>
    );
};

// --- Main Page Component ---

export default function OverviewPage() {
    const [tickerData, setTickerData] = useState<MarketData[]>(DASHBOARD_DATA.market_ticker);
    const [selectedCrop, setSelectedCrop] = useState(DASHBOARD_DATA.crop_intelligence_cards[0]);
    const [calcQuantity, setCalcQuantity] = useState(100);
    const [historicalData, setHistoricalData] = useState<{ date: string, price: number }[]>([]);

    React.useEffect(() => {
        const fetchPrices = async () => {
            try {
                const liveData = await getMarketTickerData();
                if (liveData && liveData.length > 0) {
                    setTickerData(liveData);
                }
            } catch (error) {
                console.error("Failed to fetch live prices:", error);
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

    const getLivePriceForCrop = (name: string) => {
        const liveMatch = tickerData.find(t => t.crop_name === name || (name === "Rubber" && t.crop_name === "Rubber") || (name === "Black Pepper" && t.crop_name === "Black Pepper"));
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
                        <Button variant="outline" className="flex-1 md:flex-none gap-2 border-[#d8f3dc] bg-white/50 backdrop-blur-sm px-3 md:px-4">
                            <CalendarIcon className="h-4 w-4" /> <span className="hidden xs:inline">Last 30 Days</span><span className="xs:hidden">30d</span>
                        </Button>
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
                        {DASHBOARD_DATA.crop_intelligence_cards.map((crop) => (
                            <IntelligenceCard
                                key={crop.listing_id}
                                crop={crop}
                                isSelected={selectedCrop.listing_id === crop.listing_id}
                                onSelect={() => setSelectedCrop(crop)}
                                livePrice={getLivePriceForCrop(crop.name)}
                            />
                        ))}
                        <div className="flex items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5 transition-colors hover:bg-gray-50">
                            <div className="text-center">
                                <Button variant="ghost" className="h-10 w-10 rounded-full bg-green-100/50 text-[#2d6a4f] text-2xl">+</Button>
                                <p className="mt-2 text-xs font-semibold text-gray-400 uppercase tracking-widest">Add Watchlist</p>
                            </div>
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
                                        <p className="text-2xl md:text-3xl font-black text-white">{DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.status}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-200/60">Risk Status</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg md:text-xl font-mono text-white">{DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.shock_influence_coefficient * 100}%</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-green-200/60">Impact</p>
                                    </div>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1 rounded-xl bg-white/10 p-2.5">
                                        <div className="flex items-center gap-2 text-green-300"><Thermometer className="h-3 w-3" /><span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Temp</span></div>
                                        <span className="text-sm font-bold text-white">{DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.current_metrics.temp}°C</span>
                                    </div>
                                    <div className="flex flex-col gap-1 rounded-xl bg-white/10 p-2.5">
                                        <div className="flex items-center gap-2 text-green-300"><Droplets className="h-3 w-3" /><span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Humid</span></div>
                                        <span className="text-sm font-bold text-white">{DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.current_metrics.humidity}%</span>
                                    </div>
                                </div>
                                <div className="mt-6 border-t border-white/10 pt-4"><p className="text-[11px] leading-relaxed italic text-green-100/80">"{DASHBOARD_DATA.analytics_deep_dive.weather_impact_meter.advisory}"</p></div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Hybrid Graph Card - Now on Right for Desktop */}
                    <Card className="col-span-1 overflow-hidden lg:col-span-2 border-none bg-white shadow-xl shadow-green-900/5 order-1 lg:order-2">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-50 pb-6 gap-4">
                            <div>
                                <CardTitle className="text-xl md:text-2xl font-bold text-[#1a2e1a]">Hybrid Analytics: {selectedCrop.name}</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 font-bold border-green-100">Prophet + LSTM</Badge>
                                    <span className="text-xs">Market Trend Deep Dive</span>
                                </CardDescription>
                            </div>
                            <div className="flex gap-3 text-[9px] md:text-[10px] font-bold uppercase text-gray-400">
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#1b4332]" />
                                    <span>Historical</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="h-2 w-2 md:h-2.5 md:w-2.5 rounded-full bg-[#2d6a4f] opacity-40" />
                                    <span>AI Projected</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8">
                            <div className="relative h-48 md:h-64 w-full">
                                <div className="absolute inset-x-0 bottom-0 h-px bg-gray-100" />
                                <div className="absolute inset-y-0 left-0 w-px bg-gray-100" />
                                <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 250">
                                    <motion.path
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 1.5 }}
                                        d={graphPaths.historical}
                                        fill="none" stroke="#1b4332" strokeWidth="4" strokeLinecap="round"
                                    />
                                    <motion.path
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 }}
                                        d={graphPaths.predicted}
                                        fill="none" stroke="#2d6a4f" strokeWidth="4" strokeDasharray="8,8" strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute top-0 h-full w-px border-l-2 border-dashed border-[#2d6a4f]/30" style={{ left: `${(graphPaths.currentX / 500) * 100}%` }}>
                                    <div className="absolute -top-4 -translate-x-1/2 rounded-md bg-[#2d6a4f] px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">Current</div>
                                </div>
                            </div>
                            <div className="mt-8 md:mt-10 flex items-start gap-3 md:gap-4 rounded-2xl bg-[#f0f7ed] p-4 md:p-5">
                                <div className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2d6a4f] shadow-sm"><Info className="h-4 w-4 md:h-5 md:w-5" /></div>
                                <p className="text-xs md:text-sm leading-relaxed text-[#2d6a4f]"><span className="font-bold">Expert Note:</span> {selectedCrop.expert_xai_snippet}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Global Opportunities - Heatmap and Router */}
                <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
                    <Card className="border-none bg-white shadow-xl shadow-green-900/5 transition-transform hover:scale-[1.01]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base md:text-lg text-[#1a2e1a]"><MapIcon className="h-4 w-4 md:h-5 md:w-5 text-[#2d6a4f]" /> Nearby Mandi Heatmap</CardTitle>
                            <CardDescription className="text-xs md:text-sm">Price distribution within 50km of {DASHBOARD_DATA.analytics_deep_dive.market_heatmap.center}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative h-48 w-full rounded-3xl bg-[#e8f0e4] flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-x-0 h-px bg-white/30 top-1/2" />
                                <div className="absolute inset-y-0 w-px bg-white/30 left-1/2" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border-4 border-white bg-[#2d6a4f] shadow-lg animate-pulse" />
                                    <p className="mt-2 text-center text-[8px] md:text-[10px] font-black uppercase text-[#1b4332] tracking-widest">{DASHBOARD_DATA.analytics_deep_dive.market_heatmap.center}</p>
                                </div>
                                {DASHBOARD_DATA.analytics_deep_dive.market_heatmap.locations.map((loc, i) => {
                                    const x = (loc.lon - 76.6853) * 1000 + 50;
                                    const y = (9.7118 - loc.lat) * 1000 + 50;
                                    const liveBaseline = getLivePriceForCrop(selectedCrop.name) || selectedCrop.current_live_price;
                                    return (
                                        <div key={i} className="absolute group cursor-pointer" style={{ left: `${x}%`, top: `${y}%` }}>
                                            <div className={`h-3 w-3 md:h-4 md:w-4 rounded-full border-2 border-white shadow-md ${loc.modal_price > liveBaseline ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#1b4332] text-white text-[9px] md:text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                {loc.mandi}: ₹{loc.modal_price}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <MarketRouterV2
                        cropName={selectedCrop.name}
                        baselinePrice={getLivePriceForCrop(selectedCrop.name) || selectedCrop.current_live_price}
                    />
                </div>
            </main>
        </div>
    );
}
