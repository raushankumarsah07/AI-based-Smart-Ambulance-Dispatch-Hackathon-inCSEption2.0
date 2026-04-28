"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Send, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const isSpeechSynthesisSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Hello! I'm your AI assistant for emergency dispatch. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const RecognitionConstructor =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!RecognitionConstructor) {
      setVoiceSupported(false);
      return;
    }

    setVoiceSupported(true);
    const recognition = new RecognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        setInputText(transcript);
      }
    };

    recognition.onend = () => setIsListening(false);

    recognition.onerror = (event: any) => {
      const message = event?.error || "Speech recognition failed.";
      console.error("Speech recognition error:", message);
      setVoiceError("Voice input is not available right now.");
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakText = (text: string) => {
    if (!isSpeechSynthesisSupported) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const getCurrentPosition = async (): Promise<Coordinates> => {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocation is not available."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: Number(position.coords.latitude.toFixed(6)),
            lng: Number(position.coords.longitude.toFixed(6)),
          });
        },
        (error) => {
          reject(new Error(error.message || "Unable to determine location."));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    });
  };

  const callDispatchApi = async (addressText: string) => {
    const coords = await getCurrentPosition();
    const response = await fetch("/api/dispatch/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: coords.lat,
        lng: coords.lng,
        address: addressText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || "Failed to dispatch ambulance. Please try again."
      );
    }

    return (await response.json()) as {
      ok: boolean;
      ambulance: { callSign: string };
      estimatedArrivalMinutes: number;
    };
  };

  const matchesDispatchRequest = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const dispatchKeywords = /(send|dispatch|call|request|need).{0,40}(ambulance|help|aid|medical)/;
    const ambulanceKeywords = /(ambulance|help|aid|medical)/;
    return (
      dispatchKeywords.test(lowerQuery) ||
      (ambulanceKeywords.test(lowerQuery) && lowerQuery.includes("my"))
    );
  };

  const generateResponse = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();

    if (matchesDispatchRequest(query)) {
      try {
        const dispatchData = await callDispatchApi(
          `SOS request detected from chatbot: ${query}`
        );

        return `✅ An ambulance (${dispatchData.ambulance.callSign}) is now dispatched to your current location. Estimated arrival time is ${dispatchData.estimatedArrivalMinutes} minute(s). Please stay safe and wait for first responders.`;
      } catch (error) {
        console.error("Dispatch failed:", error);
        return (
          error instanceof Error
            ? `I could not dispatch an ambulance automatically: ${error.message}`
            : "I could not dispatch an ambulance automatically. Please ensure location access is allowed and try again."
        );
      }
    }

    if (lowerQuery.includes("location") && lowerQuery.includes("detect")) {
      return "If you ask me to send an ambulance, I can use your browser's location permission to dispatch to your current position.";
    }

    if (lowerQuery.includes("ambulance") || lowerQuery.includes("available")) {
      return "You can check available ambulances in the Ambulances tab. If you want, say 'send ambulance to my location' and I will dispatch one to you.";
    }

    if (lowerQuery.includes("hospital") || lowerQuery.includes("bed")) {
      return "Hospital status is available in the Hospitals tab. I can also dispatch the nearest available ambulance to your location if you ask.";
    }

    if (lowerQuery.includes("dispatch") || lowerQuery.includes("route")) {
      return "The dispatch system calculates the best route and ambulance automatically. Ask me 'send ambulance to my location' to trigger the nearest unit.";
    }

    if (lowerQuery.includes("status") || lowerQuery.includes("update")) {
      return "Emergency statuses are updated live. Ask me to dispatch an ambulance and I will use your current location to send help.";
    }

    return "I'm here to help with emergency dispatch. Try saying 'send ambulance to my location' or ask about ambulance and hospital availability.";
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsProcessing(true);

    try {
      const response = await generateResponse(text.trim());
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      speakText(response);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: "Sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      speakText(errorMessage.text);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputText);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border-2 border-background bg-accent text-accent-foreground shadow-lg transition-all hover:shadow-xl",
          isOpen && "bg-muted text-muted-foreground"
        )}
        aria-label="Toggle chatbot"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-card-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-card-border bg-accent/5 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-muted">Online</span>
            </div>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.isUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                    message.isUser
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground max-w-[80%] rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-1">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                      <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-card-border p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
                disabled={isProcessing}
              />
              <button
                onClick={isListening ? stopListening : startListening}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border border-card-border transition-colors",
                  isListening
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-accent text-accent-foreground hover:bg-accent/80"
                )}
                disabled={!voiceSupported || isProcessing}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isProcessing}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            {isListening && (
              <p className="mt-2 text-xs text-muted">Listening... Click the mic again to stop.</p>
            )}
            {!voiceSupported && (
              <p className="mt-2 text-xs text-muted">Voice input is unavailable in this browser.</p>
            )}
            {voiceError && (
              <p className="mt-2 text-xs text-red-500">{voiceError}</p>
            )}
            {isSpeechSynthesisSupported && (
              <p className="mt-2 text-xs text-muted">Voice replies enabled.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
