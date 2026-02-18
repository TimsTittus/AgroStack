"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
    Search,
    Send,
    Check,
    CheckCheck,
    MessageSquare,
    ArrowLeft,
    UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/trpc/client";
import { useDebounce } from "@/lib/hooks/use-debounce";

type Message = {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    createdAt: string;
    read: boolean;
};

type Conversation = {
    id: string;
    name: string;
    image: string | null;
    role: string | null;
    lastMessage?: string;
    lastMessageTime?: string;
    unread: number;
};

export default function MessagesPage() {
    const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isTyping, setIsTyping] = useState(false);

    // Debounce search query to avoid too many requests
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const utils = trpc.useUtils();

    useEffect(() => {
        fetch("/api/auth/get-session", { credentials: "include" })
            .then((r) => r.json())
            .then((data) => {
                if (data?.user?.id) setCurrentUserId(data.user.id);
            })
            .catch(() => { });
    }, []);

    const { data: conversations = [], isLoading: loadingConversations } =
        trpc.messaging.getConversations.useQuery(undefined, {
            refetchInterval: 1000,
            refetchIntervalInBackground: true,
        });

    // Search for new users who are NOT in conversations
    const { data: searchResults = [], isLoading: isSearching } =
        trpc.messaging.searchUsers.useQuery(
            { query: debouncedSearchQuery },
            {
                enabled: debouncedSearchQuery.length > 0,
            }
        );

    const { data: chatMessages = [], isLoading: loadingMessages } =
        trpc.messaging.getMessages.useQuery(
            { otherUserId: selectedUser?.id ?? "" },
            {
                enabled: !!selectedUser,
                refetchInterval: 1000,
                refetchIntervalInBackground: true,
            }
        );

    // Poll for selected user's status (typing)
    const { data: userStatus } = trpc.messaging.getUserStatus.useQuery(
        { userId: selectedUser?.id ?? "" },
        {
            enabled: !!selectedUser,
            refetchInterval: 2000,
        }
    );

    // Handle my typing status
    const setTypingMutation = trpc.messaging.setTypingStatus.useMutation();
    const debouncedTyping = useDebounce(inputValue, 500);

    useEffect(() => {
        if (!selectedUser) return;
        if (inputValue.length > 0 && !isTyping) {
            setIsTyping(true);
            setTypingMutation.mutate({ isTyping: true });
        } else if (inputValue.length === 0 && isTyping) {
            setIsTyping(false);
            setTypingMutation.mutate({ isTyping: false });
        }
    }, [inputValue, selectedUser, isTyping]);

    // Cleanup typing status on debounce (user stopped typing)
    useEffect(() => {
        if (isTyping && inputValue.length > 0) {
            const timer = setTimeout(() => {
                setIsTyping(false);
                setTypingMutation.mutate({ isTyping: false });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [debouncedTyping]);

    const sendMessageMutation = trpc.messaging.sendMessage.useMutation({
        onSettled: () => {
            utils.messaging.getMessages.invalidate({
                otherUserId: selectedUser?.id ?? "",
            });
            utils.messaging.getConversations.invalidate();
            setTypingMutation.mutate({ isTyping: false });
            setIsTyping(false);
        },
    });

    const markAsReadMutation = trpc.messaging.markAsRead.useMutation({
        onSuccess: () => {
            utils.messaging.getConversations.invalidate();
        },
    });

    useEffect(() => {
        if (selectedUser && selectedUser.unread > 0) {
            markAsReadMutation.mutate({ otherUserId: selectedUser.id });
        }
    }, [selectedUser?.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const handleSend = useCallback(() => {
        if (!inputValue.trim() || !selectedUser) return;

        sendMessageMutation.mutate({
            receiverId: selectedUser.id,
            content: inputValue.trim(),
        });
        setInputValue("");
        inputRef.current?.focus();
    }, [inputValue, selectedUser, sendMessageMutation]);

    // Helpers
    const getInitials = (name: string | null) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 86400000)
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (diff < 604800000)
            return d.toLocaleDateString([], { weekday: "short" });
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const isMyMessage = (msg: Message) => msg.senderId === currentUserId;

    // Filter conversations locally
    const filteredConversations = conversations.filter((c) =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter search results to exclude existing conversations
    const newUsers = searchResults.filter(
        (u) => !conversations.some((c) => c.id === u.id)
    );

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-1 overflow-hidden border-t border-gray-200 bg-white shadow-sm">
            {/* Sidebar */}
            <div
                className={`${selectedUser ? "hidden md:flex" : "flex"
                    } w-full md:w-64 lg:w-72 flex-col shrink-0 border-r border-gray-200 bg-gray-50/30`}
            >
                {/* Apps Header style */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white/50 backdrop-blur-sm sticky top-0 z-10 h-[60px]">
                    <h2 className="text-base font-bold text-gray-900 tracking-tight">Messages</h2>
                </div>

                <div className="p-3 border-b border-gray-100/50">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-white border border-gray-200 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1 min-h-0 custom-scrollbar">
                    {/* Conversations List */}
                    {filteredConversations.length > 0 && (
                        <div className="space-y-0.5 mt-2">
                            <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                                Conversations
                            </div>
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedUser(conv)}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 ${selectedUser?.id === conv.id
                                        ? "bg-white shadow-sm ring-1 ring-gray-200"
                                        : "hover:bg-gray-100/80"
                                        }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Avatar className="h-8 w-8 border border-gray-100">
                                            <AvatarImage src={conv.image ?? undefined} />
                                            <AvatarFallback className="bg-gradient-to-br from-green-50 to-green-100 text-green-700 font-semibold text-[10px]">
                                                {getInitials(conv.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        {conv.unread > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 h-3 min-w-[12px] flex items-center justify-center bg-green-500 rounded-full ring-1.5 ring-white">
                                                <span className="text-[8px] font-bold text-white px-0.5">
                                                    {conv.unread}
                                                </span>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className="font-medium text-xs text-gray-900 truncate">
                                                {conv.name}
                                            </span>
                                            {conv.lastMessageTime && (
                                                <span className="text-[9px] text-gray-400 flex-shrink-0 ml-1.5">
                                                    {formatTime(conv.lastMessageTime)}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-[11px] truncate ${conv.unread > 0 ? "font-medium text-gray-900" : "text-gray-500"}`}>
                                            {conv.lastMessage || "No messages"}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* New Users Search Results */}
                    {searchQuery && newUsers.length > 0 && (
                        <div className="space-y-0.5 mt-3">
                            <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <UserPlus className="h-3 w-3" />
                                More Users
                            </div>
                            {newUsers.map((user) => (
                                <button
                                    key={user.id}
                                    onClick={() => setSelectedUser({ ...user, unread: 0 })}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-200 ${selectedUser?.id === user.id
                                        ? "bg-white shadow-sm ring-1 ring-gray-200"
                                        : "hover:bg-gray-100/80"
                                        }`}
                                >
                                    <Avatar className="h-8 w-8 border border-gray-100">
                                        <AvatarImage src={user.image ?? undefined} />
                                        <AvatarFallback className="bg-gray-100 text-gray-600 font-medium text-[10px]">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 text-left">
                                        <span className="font-medium text-xs text-gray-900 truncate block">
                                            {user.name}
                                        </span>
                                        <span className="text-[10px] text-gray-500 capitalize">
                                            {user.role}
                                        </span>
                                    </div>
                                    <div className="p-1 rounded-full bg-gray-50 text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                                        <MessageSquare className="h-3.5 w-3.5" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!loadingConversations &&
                        !isSearching &&
                        filteredConversations.length === 0 &&
                        newUsers.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                                    <Search className="h-5 w-5 text-gray-300" />
                                </div>
                                <h3 className="text-xs font-medium text-gray-900">No results found</h3>
                                <p className="text-[10px] text-gray-500 max-w-[150px] mt-1">
                                    No conversations found for "{searchQuery}"
                                </p>
                            </div>
                        )}
                </div>
            </div>

            {/* Chat Area */}
            <div className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 flex-col bg-white overflow-hidden relative`}>
                {selectedUser ? (
                    <>
                        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20 h-[60px]">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="md:hidden p-1.5 -ml-1 rounded-full hover:bg-gray-50 text-gray-500"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <Avatar className="h-8 w-8 ring-1 ring-gray-100">
                                <AvatarImage src={selectedUser.image ?? undefined} />
                                <AvatarFallback className="bg-green-100 text-green-700 font-semibold text-xs">
                                    {getInitials(selectedUser.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm truncate">
                                    {selectedUser.name}
                                </h3>
                                <div className="flex items-center gap-1.5 h-4">
                                    {userStatus?.isTyping ? (
                                        <>
                                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
                                            <span className="text-[10px] text-green-600 font-medium animate-pulse">Typing...</span>
                                        </>
                                    ) : (
                                        <span className="text-[10px] text-gray-500 capitalize">{selectedUser.role ?? "User"}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-gray-50/30 scroll-smooth">
                            {loadingMessages ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                    <div className="h-16 w-16 rounded-full bg-blue-50/50 flex items-center justify-center mb-3">
                                        <MessageSquare className="h-8 w-8 text-blue-400" />
                                    </div>
                                    <h3 className="text-gray-900 font-medium text-sm mb-1">Say Hello! 👋</h3>
                                    <p className="text-xs text-gray-500 max-w-xs">
                                        Start a conversation with <span className="font-medium text-gray-700">{selectedUser.name}</span>
                                    </p>
                                </div>
                            ) : (
                                chatMessages.map((msg) => {
                                    const mine = isMyMessage(msg);
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[75%] sm:max-w-[60%] px-3 py-2 rounded-2xl shadow-sm text-sm relative group transition-all leading-relaxed
                                                ${mine
                                                        ? "bg-green-600 text-white rounded-tr-sm"
                                                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                                                    }`}
                                            >
                                                <p className="whitespace-pre-wrap text-[13px]">
                                                    {msg.content}
                                                </p>
                                                <div className={`flex items-center gap-1 mt-0.5 ${mine ? "justify-end opacity-90" : "opacity-50"}`}>
                                                    <span className="text-[9px] font-medium">
                                                        {formatTime(msg.createdAt)}
                                                    </span>
                                                    {mine && (
                                                        msg.read ? <CheckCheck className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 bg-white border-t border-gray-100">
                            <div className="flex items-center gap-2 max-w-4xl mx-auto">
                                <div className="flex-1 relative">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Type your message..."
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleSend();
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-400"
                                    />
                                </div>
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim()}
                                    className="h-10 w-10 flex items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-4 bg-gray-50/30">
                        <div className="h-20 w-20 rounded-2xl bg-white shadow-lg shadow-green-900/5 flex items-center justify-center mb-4 transform -rotate-3">
                            <MessageSquare className="h-10 w-10 text-green-500" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome to Messages</h1>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                            Select an existing conversation or search for a user to start chatting.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
