"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Send, Phone, Video, MoreVertical, Check, CheckCheck, Smile } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// ── Mock Data ──────────────────────────────────────────────
const MOCK_USERS = [
    {
        id: "1",
        name: "Ravi Kumar",
        image: "",
        role: "farmer",
        online: true,
        lastMessage: "The organic tomatoes are freshly harvested today!",
        lastMessageTime: "09:30",
        unread: 2,
    },
    {
        id: "2",
        name: "Priya Sharma",
        image: "",
        role: "buyer",
        online: true,
        lastMessage: "Can I get 50kg of basmati rice?",
        lastMessageTime: "08:45",
        unread: 0,
    },
    {
        id: "3",
        name: "Arun Patel",
        image: "",
        role: "farmer",
        online: false,
        lastMessage: "Will deliver the mangoes by tomorrow morning.",
        lastMessageTime: "Yesterday",
        unread: 0,
    },
    {
        id: "4",
        name: "Meera Nair",
        image: "",
        role: "buyer",
        online: false,
        lastMessage: "Thank you for the fresh vegetables!",
        lastMessageTime: "Yesterday",
        unread: 0,
    },
    {
        id: "5",
        name: "Suresh Reddy",
        image: "",
        role: "farmer",
        online: true,
        lastMessage: "Yes, we have turmeric in stock",
        lastMessageTime: "Mon",
        unread: 1,
    },
    {
        id: "6",
        name: "Lakshmi Devi",
        image: "",
        role: "farmer",
        online: false,
        lastMessage: "You: Great, I'll take 20kg then",
        lastMessageTime: "Mon",
        unread: 0,
    },
];

type MockMessage = {
    id: string;
    content: string;
    time: string;
    isMe: boolean;
    status: "sent" | "delivered" | "read";
};

const MOCK_MESSAGES: Record<string, MockMessage[]> = {
    "1": [
        { id: "m1", content: "Hi Ravi, do you have organic tomatoes available?", time: "09:20", isMe: true, status: "read" },
        { id: "m2", content: "Yes! We just harvested a fresh batch this morning 🍅", time: "09:22", isMe: false, status: "read" },
        { id: "m3", content: "How much per kg?", time: "09:25", isMe: true, status: "read" },
        { id: "m4", content: "₹60 per kg for organic. Minimum order 5kg.", time: "09:27", isMe: false, status: "read" },
        { id: "m5", content: "I'll take 10kg. Can you deliver today?", time: "09:28", isMe: true, status: "read" },
        { id: "m6", content: "The organic tomatoes are freshly harvested today!", time: "09:30", isMe: false, status: "delivered" },
    ],
    "2": [
        { id: "m1", content: "Hi Priya! How can I help you?", time: "08:30", isMe: true, status: "read" },
        { id: "m2", content: "I'm looking for premium basmati rice", time: "08:32", isMe: false, status: "read" },
        { id: "m3", content: "We have 1121 basmati at ₹120/kg", time: "08:35", isMe: true, status: "read" },
        { id: "m4", content: "Can I get 50kg of basmati rice?", time: "08:45", isMe: false, status: "read" },
    ],
    "3": [
        { id: "m1", content: "When can you deliver the Alphonso mangoes?", time: "14:00", isMe: true, status: "read" },
        { id: "m2", content: "Will deliver the mangoes by tomorrow morning.", time: "14:15", isMe: false, status: "read" },
    ],
    "4": [
        { id: "m1", content: "Your order has been delivered!", time: "10:00", isMe: true, status: "read" },
        { id: "m2", content: "Thank you for the fresh vegetables!", time: "10:05", isMe: false, status: "read" },
    ],
    "5": [
        { id: "m1", content: "Do you have organic turmeric?", time: "11:00", isMe: true, status: "read" },
        { id: "m2", content: "Yes, we have turmeric in stock", time: "11:10", isMe: false, status: "delivered" },
    ],
    "6": [
        { id: "m1", content: "We have fresh curry leaves at ₹30/bundle", time: "09:00", isMe: false, status: "read" },
        { id: "m2", content: "Sounds good! What about coriander?", time: "09:15", isMe: true, status: "read" },
        { id: "m3", content: "Coriander is ₹20/bundle, organic", time: "09:20", isMe: false, status: "read" },
        { id: "m4", content: "Great, I'll take 20kg then", time: "09:25", isMe: true, status: "delivered" },
    ],
};

// ── Component ──────────────────────────────────────────────
export default function MessagesPage() {
    const [selectedUser, setSelectedUser] = useState<(typeof MOCK_USERS)[0] | null>(null);
    const [messageInput, setMessageInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [localMessages, setLocalMessages] = useState(MOCK_MESSAGES);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedUser, localMessages]);

    const filteredUsers = MOCK_USERS.filter((u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSend = () => {
        if (!messageInput.trim() || !selectedUser) return;
        const newMsg: MockMessage = {
            id: `m-${Date.now()}`,
            content: messageInput,
            time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
            isMe: true,
            status: "sent",
        };
        setLocalMessages((prev) => ({
            ...prev,
            [selectedUser.id]: [...(prev[selectedUser.id] || []), newMsg],
        }));
        setMessageInput("");
    };

    return (
        <main className="flex-1 overflow-hidden p-4 md:p-6">
            <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-[#e8f0e4] bg-white shadow-sm">
                {/* ── Left Panel: Conversations ── */}
                <div
                    className={cn(
                        "flex w-full flex-col border-r border-[#e8f0e4] md:w-80 lg:w-96",
                        selectedUser ? "hidden md:flex" : "flex"
                    )}
                >
                    {/* Header */}
                    <div className="border-b border-[#e8f0e4] p-4">
                        <h1 className="text-xl font-bold text-[#1a2e1a]">Messages</h1>
                        <p className="text-xs text-[#5c7a5c]">Chat with farmers & buyers</p>
                    </div>

                    {/* Search */}
                    <div className="p-3">
                        <div className="flex items-center gap-2 rounded-xl bg-[#f4f8f2] px-3 py-2">
                            <Search className="h-4 w-4 text-[#7ca87c]" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent text-sm text-[#1a2e1a] outline-none placeholder:text-[#a3bfa3]"
                            />
                        </div>
                    </div>

                    {/* Conversation List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredUsers.map((user) => (
                            <button
                                key={user.id}
                                onClick={() => setSelectedUser(user)}
                                className={cn(
                                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-all duration-150",
                                    selectedUser?.id === user.id
                                        ? "bg-[#2d6a4f]/5 border-r-2 border-[#2d6a4f]"
                                        : "hover:bg-[#f4f8f2]"
                                )}
                            >
                                <div className="relative">
                                    <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                                        <AvatarImage src={user.image} />
                                        <AvatarFallback className="bg-gradient-to-br from-[#2d6a4f] to-[#52b788] text-sm font-bold text-white">
                                            {user.name.split(" ").map((n) => n[0]).join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    {user.online && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#52b788]" />
                                    )}
                                </div>

                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-[#1a2e1a] truncate">{user.name}</span>
                                        <span className="text-[10px] text-[#7ca87c]">{user.lastMessageTime}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                        <p className="truncate text-xs text-[#5c7a5c]">{user.lastMessage}</p>
                                        {user.unread > 0 && (
                                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2d6a4f] px-1.5 text-[10px] font-bold text-white">
                                                {user.unread}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Right Panel: Chat ── */}
                <div
                    className={cn(
                        "flex flex-1 flex-col",
                        !selectedUser ? "hidden md:flex" : "flex"
                    )}
                >
                    {selectedUser ? (
                        <>
                            {/* Chat Header */}
                            <div className="flex items-center justify-between border-b border-[#e8f0e4] px-5 py-3">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="mr-1 text-[#5c7a5c] hover:text-[#1a2e1a] md:hidden"
                                    >
                                        ←
                                    </button>
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarImage src={selectedUser.image} />
                                            <AvatarFallback className="bg-gradient-to-br from-[#2d6a4f] to-[#52b788] text-sm font-bold text-white">
                                                {selectedUser.name.split(" ").map((n) => n[0]).join("")}
                                            </AvatarFallback>
                                        </Avatar>
                                        {selectedUser.online && (
                                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#52b788]" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-[#1a2e1a]">{selectedUser.name}</h2>
                                        <p className="text-[11px] text-[#52b788]">
                                            {selectedUser.online ? "Online" : "Offline"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button className="rounded-lg p-2 text-[#5c7a5c] hover:bg-[#f4f8f2] hover:text-[#2d6a4f] transition-colors">
                                        <Phone className="h-4 w-4" />
                                    </button>
                                    <button className="rounded-lg p-2 text-[#5c7a5c] hover:bg-[#f4f8f2] hover:text-[#2d6a4f] transition-colors">
                                        <Video className="h-4 w-4" />
                                    </button>
                                    <button className="rounded-lg p-2 text-[#5c7a5c] hover:bg-[#f4f8f2] hover:text-[#2d6a4f] transition-colors">
                                        <MoreVertical className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto px-5 py-4" ref={scrollRef}>
                                <div className="flex flex-col gap-3">
                                    {(localMessages[selectedUser.id] || []).map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn("flex", msg.isMe ? "justify-end" : "justify-start")}
                                        >
                                            <div
                                                className={cn(
                                                    "relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                                                    msg.isMe
                                                        ? "bg-gradient-to-br from-[#2d6a4f] to-[#40916c] text-white rounded-br-md"
                                                        : "bg-[#f4f8f2] text-[#1a2e1a] rounded-bl-md"
                                                )}
                                            >
                                                <p className="leading-relaxed">{msg.content}</p>
                                                <div
                                                    className={cn(
                                                        "mt-1 flex items-center justify-end gap-1",
                                                        msg.isMe ? "text-white/60" : "text-[#7ca87c]"
                                                    )}
                                                >
                                                    <span className="text-[10px]">{msg.time}</span>
                                                    {msg.isMe &&
                                                        (msg.status === "read" ? (
                                                            <CheckCheck className="h-3 w-3 text-[#b7e4c7]" />
                                                        ) : (
                                                            <Check className="h-3 w-3" />
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Input Area */}
                            <div className="border-t border-[#e8f0e4] px-4 py-3">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSend();
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <button
                                        type="button"
                                        className="rounded-lg p-2 text-[#5c7a5c] hover:bg-[#f4f8f2] hover:text-[#2d6a4f] transition-colors"
                                    >
                                        <Smile className="h-5 w-5" />
                                    </button>
                                    <input
                                        type="text"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Your message..."
                                        className="flex-1 rounded-xl border border-[#e8f0e4] bg-[#f4f8f2] px-4 py-2.5 text-sm text-[#1a2e1a] outline-none transition-all focus:border-[#2d6a4f]/30 focus:ring-2 focus:ring-[#2d6a4f]/10 placeholder:text-[#a3bfa3]"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2d6a4f] to-[#52b788] text-white shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        /* Empty State */
                        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#d8f3dc] to-[#b7e4c7] shadow-sm">
                                <svg
                                    className="h-10 w-10 text-[#2d6a4f]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-[#1a2e1a]">Your Messages</h3>
                            <p className="mt-1.5 max-w-xs text-sm text-[#5c7a5c]">
                                Select a conversation to start chatting with farmers and buyers.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
