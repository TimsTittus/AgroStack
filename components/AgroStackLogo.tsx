import React from "react";

interface AgroStackLogoProps {
    size?: number;
    showText?: boolean;
}

export function AgroStackLogo({ size = 80, showText = false }: AgroStackLogoProps) {
    return (
        <div className="flex items-center gap-4">
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Bottom layer - darkest green */}
                <path
                    d="M50 75 L20 60 L20 45 L50 60 Z"
                    fill="#1b4332"
                    opacity="0.95"
                />
                <path
                    d="M50 75 L80 60 L80 45 L50 60 Z"
                    fill="#1b4332"
                    opacity="0.7"
                />
                <path
                    d="M50 60 L20 45 L50 30 L80 45 Z"
                    fill="#2d6a4f"
                />

                {/* Middle layer - medium green */}
                <path
                    d="M50 60 L25 47 L25 35 L50 48 Z"
                    fill="#2d6a4f"
                    opacity="0.95"
                />
                <path
                    d="M50 60 L75 47 L75 35 L50 48 Z"
                    fill="#2d6a4f"
                    opacity="0.7"
                />
                <path
                    d="M50 48 L25 35 L50 22 L75 35 Z"
                    fill="#52b788"
                />

                {/* Top layer - leaf shape */}
                <path
                    d="M50 45 L32 36 L32 27 L50 20 L68 27 L68 36 Z"
                    fill="#40916c"
                    opacity="0.9"
                />
                <path
                    d="M50 20 L32 27 L32 36 L50 45 Z"
                    fill="#52b788"
                />
                <path
                    d="M50 20 L68 27 L68 36 L50 45 Z"
                    fill="#40916c"
                    opacity="0.6"
                />

                {/* Negative space - data connectivity nodes */}
                <circle cx="50" cy="35" r="2" fill="#d8f3dc" />
                <circle cx="40" cy="40" r="1.5" fill="#d8f3dc" opacity="0.8" />
                <circle cx="60" cy="40" r="1.5" fill="#d8f3dc" opacity="0.8" />
                <circle cx="45" cy="50" r="1.5" fill="#d8f3dc" opacity="0.6" />
                <circle cx="55" cy="50" r="1.5" fill="#d8f3dc" opacity="0.6" />
                <circle cx="50" cy="60" r="1.5" fill="#d8f3dc" opacity="0.5" />

                {/* Connection lines */}
                <line x1="50" y1="35" x2="40" y2="40" stroke="#d8f3dc" strokeWidth="0.5" opacity="0.4" />
                <line x1="50" y1="35" x2="60" y2="40" stroke="#d8f3dc" strokeWidth="0.5" opacity="0.4" />
                <line x1="40" y1="40" x2="45" y2="50" stroke="#d8f3dc" strokeWidth="0.5" opacity="0.3" />
                <line x1="60" y1="40" x2="55" y2="50" stroke="#d8f3dc" strokeWidth="0.5" opacity="0.3" />
                <line x1="45" y1="50" x2="50" y2="60" stroke="#d8f3dc" strokeWidth="0.5" opacity="0.3" />
                <line x1="55" y1="50" x2="50" y2="60" stroke="#d8f3dc" strokeWidth="0.5" opacity="0.3" />

                {/* Leaf tip accent */}
                <path
                    d="M50 20 L48 15 C48 12 52 12 52 15 Z"
                    fill="#52b788"
                    opacity="0.8"
                />
            </svg>

            {showText && (
                <div className="flex flex-col">
                    <span
                        className="text-[#1b4332] font-semibold tracking-[0.15em] uppercase"
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: size * 0.35 }}
                    >
                        AgroStack
                    </span>
                    <span
                        className="text-[#2d6a4f] tracking-[0.2em] uppercase"
                        style={{ fontFamily: 'Inter, sans-serif', fontSize: size * 0.12, fontWeight: 400 }}
                    >
                        AI Agriculture
                    </span>
                </div>
            )}
        </div>
    );
}
