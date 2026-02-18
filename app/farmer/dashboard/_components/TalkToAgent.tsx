"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, X, Sparkles } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function TalkToAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([0.3, 0.3, 0.3, 0.3, 0.3]);
  const [statusText, setStatusText] = useState("Listening...");
  const [history, setHistory] = useState<Message[]>([]);

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);
  const isMutedRef = useRef(false);
  const isConnectedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Silence detection config
  const SILENCE_THRESHOLD = 7;
  const SILENCE_DURATION_MS = 2000;

  // Keep refs in sync with state
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isConnectedRef.current = isConnected;
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // Cleanup audio resources
  const cleanupAudio = useCallback(() => {
    isRecordingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    analyserRef.current = null;
    setAudioLevels([0.3, 0.3, 0.3, 0.3, 0.3]);
  }, []);

  // Monitor audio levels and detect silence
  const monitorAudio = useCallback((stopRecordingFn: () => void) => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.fftSize);

    const checkLevel = () => {
      if (!isRecordingRef.current) return;

      analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS for audio level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length) * 100;

      // Map RMS to 5 audio level bars
      if (!isMutedRef.current) {
        const levels = Array.from({ length: 5 }, (_, i) => {
          const base = Math.max(0.1, rms * 0.03);
          const variation = Math.random() * 0.15;
          return Math.min(1, base + variation + (i === 2 ? 0.1 : 0));
        });
        setAudioLevels(levels);
      } else {
        setAudioLevels([0.3, 0.3, 0.3, 0.3, 0.3]);
      }

      // Silence detection (only when not muted)
      if (!isMutedRef.current) {
        if (rms < SILENCE_THRESHOLD) {
          if (!silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              stopRecordingFn();
            }, SILENCE_DURATION_MS);
          }
        } else {
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(checkLevel);
    };

    checkLevel();
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecordingRef.current || isProcessing) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio API for level monitoring
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        // Cleanup recording resources but keep the connected state
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        analyserRef.current = null;
        mediaRecorderRef.current = null;
        setAudioLevels([0.3, 0.3, 0.3, 0.3, 0.3]);

        await processVoiceTurn(blob);
      };

      mediaRecorder.start(250);
      isRecordingRef.current = true;
      setStatusText("Listening...");

      // Create a stable stop function for the monitor
      const stopFn = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          isRecordingRef.current = false;
          mediaRecorderRef.current.stop();
        }
      };

      monitorAudio(stopFn);
    } catch (err) {
      console.error("Microphone access denied", err);
      setStatusText("Microphone access denied");
    }
  }, [isProcessing, monitorAudio]);

  // Process recorded audio through the API
  const processVoiceTurn = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setStatusText("Processing...");
    setAudioLevels([0.3, 0.3, 0.3, 0.3, 0.3]);

    // Create an AbortController so we can cancel the fetch on disconnect
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    if (conversationIdRef.current) {
      formData.append("conversationId", conversationIdRef.current);
    }

    try {
      const res = await fetch("/api/stts", {
        method: "POST",
        body: formData,
        signal: abortController.signal,
      });

      // Bail out if disconnected while waiting for response
      if (!isConnectedRef.current) return;

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Update conversation history
      const newMessages: Message[] = [
        { role: "user", content: data.transcript },
      ];

      if (data.response) {
        newMessages.push({ role: "assistant", content: data.response });
      }

      setHistory((prev) => [...prev, ...newMessages]);

      // Play TTS audio response
      if (data.audio && isConnectedRef.current) {
        setStatusText("Speaking...");
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        currentAudioRef.current = audio;
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
        currentAudioRef.current = null;
      }
    } catch (error) {
      // Ignore abort errors (expected on disconnect)
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Voice processing failed", error);
      if (isConnectedRef.current) {
        setHistory((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Failed to process audio. Please try again." },
        ]);
      }
    } finally {
      abortControllerRef.current = null;
      setIsProcessing(false);
      // Auto-start listening again if still connected
      if (isConnectedRef.current) {
        setStatusText("Listening...");
        // Small delay before restarting recording
        setTimeout(() => {
          if (isConnectedRef.current) {
            startRecording();
          }
        }, 500);
      }
    }
  };

  // Handle "Start Call"
  const handleStartCall = async () => {
    setIsConnecting(true);
    // Generate a new conversation ID for this call session
    conversationIdRef.current = crypto.randomUUID();

    try {
      // Request mic permission and start recording
      await startRecording();
      setIsConnecting(false);
      setIsConnected(true);
    } catch {
      setIsConnecting(false);
      setStatusText("Failed to connect");
    }
  };

  // Handle "End Call"
  const handleEndCall = useCallback(() => {
    isRecordingRef.current = false;
    isConnectedRef.current = false;

    // Abort any in-flight API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Stop any currently playing TTS audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = "";
      currentAudioRef.current = null;
    }

    // Clear conversation ID so next call gets a fresh one
    conversationIdRef.current = null;

    cleanupAudio();
    setIsConnected(false);
    setIsConnecting(false);
    setIsProcessing(false);
    setIsMuted(false);
    setStatusText("Listening...");
    setTimeout(() => setIsOpen(false), 300);
  }, [cleanupAudio]);

  // Handle mute toggle
  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (newMuted) {
        // When muting, clear silence timeout so it won't auto-stop
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }
      return newMuted;
    });
  }, []);

  const handleClose = () => {
    if (isConnected || isProcessing) {
      handleEndCall();
    } else {
      setIsOpen(false);
    }
  };

  // Determine the status text for display
  const displayStatus = isConnecting
    ? "Connecting..."
    : isConnected
      ? isProcessing
        ? "Processing..."
        : "Connected"
      : "Your farming assistant";

  const listeningText = isProcessing
    ? statusText
    : isMuted
      ? "Microphone muted"
      : statusText;

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-full bg-linear-to-r from-[#2d6a4f] to-[#40916c] px-5 py-3 text-white shadow-lg shadow-[#2d6a4f]/30 transition-all hover:shadow-xl hover:scale-105"
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
              className="relative w-full max-w-sm mx-4 rounded-3xl bg-linear-to-b from-[#1a2e1a] to-[#0d1f0d] p-8 shadow-2xl"
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
                    className="relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-[#40916c] to-[#2d6a4f] shadow-lg shadow-[#2d6a4f]/50"
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
                  {displayStatus}
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
                    {listeningText}
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
                      onClick={handleToggleMute}
                      className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${isMuted
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
