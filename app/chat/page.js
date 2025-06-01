'use client';

import { useState, useEffect } from 'react';
import ChatList from '../nopage/component/ChatList';
import ChatWindow from '../nopage/component/ChatWindow';
import { ArrowLeft } from 'lucide-react';

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(null);
    const [chats, setChats] = useState({});

    const handleSelectChat = async (phone) => {
        setSelectedChat(phone);

        if (chats[phone]?.unreadCount > 0) {
            setChats((prev) => {
                const updatedChats = { ...prev };
                if (updatedChats[phone]) {
                    updatedChats[phone].unreadCount = 0;
                }
                return updatedChats;
            });

            try {
                await fetch('/api/markAsRead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone }),
                });
            } catch (err) {
                console.error('Failed to mark as read:', err);
            }
        }
    };

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch('/api/messages');
                const data = await res.json();
                setChats(data);
            } catch (err) {
                console.error('Failed to fetch messages:', err);
            }
        };

        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSendMessage = async (phone, text) => {
        const res = await fetch('/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
            },
            body: JSON.stringify({ to: phone, text }),
        });

        const data = await res.json();

        if (res.ok) {
            const newMsg = {
                direction: 'outgoing',
                content: text,
                type: 'text',
                read: true,
                timestamp: new Date().toISOString(),
            };

            setChats((prev) => {
                const prevChat = prev[phone] || {
                    messages: [],
                    unreadCount: 0,
                    lastMessage: null,
                };

                const newMessages = [...prevChat.messages, newMsg];

                return {
                    ...prev,
                    [phone]: {
                        ...prevChat,
                        messages: newMessages,
                        lastMessage: newMsg.timestamp,
                    },
                };
            });
        } else {
            alert(data.error?.message || 'Failed to send message');
        }
    };

    const sortedChats = Object.entries(chats).sort(
        ([, a], [, b]) => new Date(b.lastMessage) - new Date(a.lastMessage)
    );

    return (
        <div className="h-screen w-full bg-gray-100 dark:bg-gray-900">
            {/* Desktop View */}
            <div className="hidden md:flex h-full">
                <div className="w-1/3 lg:w-1/4 border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-y-auto">
                    <ChatList
                        chats={sortedChats}
                        onSelect={handleSelectChat}
                        selected={selectedChat}
                    />
                </div>
                <div className="flex-1 bg-gray-50 dark:bg-gray-900 overflow-hidden">
                    {selectedChat ? (
                        <ChatWindow
                            phone={selectedChat}
                            messages={chats[selectedChat]?.messages || []}
                            onSend={handleSendMessage}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                            Select a chat to start messaging
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile View */}
            <div className="flex flex-col md:hidden h-full">
                {!selectedChat ? (
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
                        <ChatList
                            chats={sortedChats}
                            onSelect={handleSelectChat}
                            selected={selectedChat}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
                        {/* Header with Back arrow and number inline, fixed at top */}
                        <div className="flex items-center p-4 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 fixed top-0 left-0 right-0 z-20">
                            <button
                                onClick={() => setSelectedChat(null)}
                                className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                            >
                                <ArrowLeft className="h-5 w-5 mr-2" />
                            </button>
                            <span className="text-gray-800 dark:text-white font-medium truncate">
                                {selectedChat}
                            </span>
                        </div>

                        {/* Add padding-top to chat window container so content is not hidden behind fixed header */}
                        <div className="flex-1 overflow-y-auto pt-16">
                            <ChatWindow
                                phone={selectedChat}
                                messages={chats[selectedChat]?.messages || []}
                                onSend={handleSendMessage}
                            />
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
