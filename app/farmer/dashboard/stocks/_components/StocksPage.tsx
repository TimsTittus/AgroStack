"use client";

import { useState } from "react";
import { 
  ArrowUpDown, 
  SlidersHorizontal, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowRight,
  Download,
  Filter
} from "lucide-react";

const holdingsSummary = {
  currentValue: "13,04,160",
  totalReturns: "2,68,118",
  totalReturnsPct: "25.88",
  totalReturnsUp: true,
  invested: "10,36,042",
  oneDayReturns: "8,233",
  oneDayReturnsPct: "0.63",
  oneDayReturnsUp: false,
};

const holdings = [
  { name: "Rubber", shares: 388, avgPrice: "35.10", price: "36.58", change: "+0.58", pct: "1.63", up: true, color: "bg-blue-600", initials: "E" },
  { name: "Tapioca", shares: 25, avgPrice: "450.00", price: "476.05", change: "+3.20", pct: "0.68", up: true, color: "bg-indigo-900", initials: "TP" },
  { name: "Papper", shares: 500, avgPrice: "115.50", price: "110.17", change: "-0.85", pct: "0.77", up: false, color: "bg-orange-600", initials: "CB" },
  { name: "Cardamom", shares: 15, avgPrice: "4,200.00", price: "4,475.95", change: "+12.30", pct: "0.28", up: true, color: "bg-purple-700", initials: "CA" },
];

export default function WidePortfolio() {
  const [activeTab, setActiveTab] = useState("Stocks");

  return (
    <div className="w-full max-w-360 mx-auto p-6 font-sans antialiased text-slate-900">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">My Portfolio</h1>
          <p className="text-slate-500 font-medium">Manage your assets and track performance</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          {["Stocks", "Mutual Funds", "Gold", "FD"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${
                activeTab === tab
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Wallet className="w-6 h-6 text-emerald-400" />
                </div>
                <button className="text-white/60 hover:text-white transition-colors">
                  <Download size={20} />
                </button>
              </div>

              <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Current Portfolio Value</p>
              <h2 className="text-4xl font-black mb-8">₹{holdingsSummary.currentValue}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Total Returns</p>
                  <p className="text-emerald-400 font-bold text-lg">+{holdingsSummary.totalReturnsPct}%</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                  <p className="text-white/40 text-[10px] font-bold uppercase mb-1">Invested</p>
                  <p className="text-white font-bold text-lg">₹10.3L</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-colors" />
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-[24px] p-6 flex items-center justify-between">
            <div>
              <p className="text-emerald-800 text-sm font-bold">Market is Bullish Today</p>
              <p className="text-emerald-600/80 text-xs font-medium">Your 1D returns are up by ₹{holdingsSummary.oneDayReturns}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <TrendingUp size={20} />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
          
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white">
            <h3 className="text-lg font-bold text-slate-800">Individual Assets</h3>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                <Filter size={14} /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
                <ArrowUpDown size={14} /> Sort
              </button>
            </div>
          </div>

          <div className="grid grid-cols-10 px-8 py-4 bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <div className="col-span-4">Asset Name</div>
            <div className="col-span-2 text-right">Avg Price / Shares</div>
            <div className="col-span-2 text-right">Market Price</div>
            <div className="col-span-2 text-right">Returns</div>
          </div>

          <div className="flex-1">
            {holdings.map((item, idx) => (
              <div 
                key={idx} 
                className="grid grid-cols-10 px-8 py-6 items-center hover:bg-slate-50/80 transition-all cursor-pointer group border-b border-slate-50 last:border-0"
              >
                <div className="col-span-4 flex items-center gap-4">
                  <div className={`${item.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:scale-110 transition-transform`}>
                    {item.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</p>
                    <p className="text-xs text-slate-400 font-medium tracking-tight">Equity • NSE</p>
                  </div>
                </div>

                <div className="col-span-2 text-right">
                  <p className="text-sm font-bold text-slate-700">₹{item.avgPrice}</p>
                  <p className="text-[11px] text-slate-400 font-bold">{item.shares} Qty</p>
                </div>

                <div className="col-span-2 text-right">
                  <p className="text-sm font-bold text-slate-900">₹{item.price}</p>
                  <div className="flex items-center justify-end gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.up ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <p className={`text-[11px] font-bold ${item.up ? 'text-emerald-500' : 'text-red-500'}`}>{item.pct}%</p>
                  </div>
                </div>

                <div className="col-span-2 text-right">
                  <button className="p-2 bg-slate-100 rounded-lg text-slate-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-900 hover:text-white">
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 bg-slate-50/30 border-t border-slate-50 text-center">
            <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors">
              View Detailed Tax Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}