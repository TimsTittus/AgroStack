"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, X, Sparkles } from "lucide-react";

export function TalkToAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([0.3, 0.5, 0.7, 0.5, 0.3]);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isConnected && !isMuted) {
      animationRef.current = setInterval(() => {
        setAudioLevels(
          Array.from({ length: 5 }, () => Math.random() * 0.7 + 0.3)
        );
      }, 150);
    } else {
      setAudioLevels([0.3, 0.3, 0.3, 0.3, 0.3]);
    }

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isConnected, isMuted]);

  const handleStartCall = () => {
    //trpccc.call.start();
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
    }, 2000);
  };

  const handleEndCall = () => {
    setIsConnected(false);
    setIsConnecting(false);
    setIsMuted(false);
    setTimeout(() => setIsOpen(false), 300);
  };

  const handleClose = () => {
    if (isConnected) {
      handleEndCall();
    } else {
      setIsOpen(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#2d6a4f] to-[#40916c] px-5 py-3 text-white shadow-lg shadow-[#2d6a4f]/30 transition-all hover:shadow-xl hover:scale-105"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="h-5 w-5" />
        <span className="text-sm font-semibold">Talk to Agent</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm mx-4 rounded-3xl bg-gradient-to-b from-[#1a2e1a] to-[#0d1f0d] p-8 shadow-2xl"
            >
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#40916c]/20"
                    animate={{
                      scale: isConnected ? [1, 1.3, 1] : 1,
                      opacity: isConnected ? [0.5, 0, 0.5] : 0.3,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ width: 140, height: 140, margin: -20 }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#2d6a4f]/30"
                    animate={{
                      scale: isConnected ? [1, 1.2, 1] : 1,
                      opacity: isConnected ? [0.6, 0.2, 0.6] : 0.4,
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.2,
                    }}
                    style={{ width: 120, height: 120, margin: -10 }}
                  />

                  <motion.div
                    className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#40916c] to-[#2d6a4f] shadow-lg shadow-[#2d6a4f]/50"
                    animate={{
                      boxShadow: isConnected
                        ? [
                            "0 0 20px rgba(45, 106, 79, 0.5)",
                            "0 0 40px rgba(45, 106, 79, 0.8)",
                            "0 0 20px rgba(45, 106, 79, 0.5)",
                          ]
                        : "0 0 20px rgba(45, 106, 79, 0.3)",
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="h-10 w-10 text-white" />
                  </motion.div>
                </div>

                <h3 className="mt-6 text-xl font-bold text-white">AgroStack AI</h3>
                <p className="mt-1 text-sm text-white/60">
                  {isConnecting
                    ? "Connecting..."
                    : isConnected
                    ? "Connected"
                    : "Your farming assistant"}
                </p>

                {isConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center gap-1"
                  >
                    {audioLevels.map((level, i) => (
                      <motion.div
                        key={i}
                        className="w-1 rounded-full bg-[#40916c]"
                        animate={{ height: level * 32 }}
                        transition={{ duration: 0.15 }}
                      />
                    ))}
                  </motion.div>
                )}

                {isConnected && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 text-xs text-white/50"
                  >
                    {isMuted ? "Microphone muted" : "Listening..."}
                  </motion.p>
                )}
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                {!isConnected && !isConnecting && (
                  <motion.button
                    onClick={handleStartCall}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[#40916c] text-white shadow-lg shadow-[#40916c]/30 transition-all hover:bg-[#2d6a4f] hover:shadow-xl"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Phone className="h-7 w-7" />
                  </motion.button>
                )}

                {isConnecting && (
                  <motion.div
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[#40916c]/50"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="h-8 w-8 rounded-full border-2 border-white/30 border-t-white" />
                  </motion.div>
                )}

                {isConnected && (
                  <>
                    <motion.button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${
                        isMuted
                          ? "bg-red-500/20 text-red-400"
                          : "bg-white/10 text-white/80 hover:bg-white/20"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isMuted ? (
                        <MicOff className="h-6 w-6" />
                      ) : (
                        <Mic className="h-6 w-6" />
                      )}
                    </motion.button>

                    <motion.button
                      onClick={handleEndCall}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition-all hover:bg-red-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <PhoneOff className="h-7 w-7" />
                    </motion.button>
                  </>
                )}
              </div>

              {/* Help Text */}
              {!isConnected && !isConnecting && (
                <p className="mt-6 text-center text-xs text-white/40">
                  Tap the call button to speak with our AI agent about your crops, prices, and recommendations.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
