'use client';

import { useState, useEffect } from 'react';
import ChatList from '../nopage/component/ChatList';
import ChatWindow from '../nopage/component/ChatWindow';

export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(null);
    const [chats, setChats] = useState({});

    const handleSelectChat = async (phone) => {
        setSelectedChat(phone);

        if (chats[phone]?.unreadCount > 0) {
            // Optimistic update FIRST
            setChats(prev => {
                const updatedChats = { ...prev };
                if (updatedChats[phone]) {
                    updatedChats[phone] = {
                        ...updatedChats[phone],
                        unreadCount: 0,
                    };
                }
                return updatedChats;
            });

            // Then update backend
            try {
                await fetch('/api/markAsRead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone }),
                });
            } catch (err) {
                console.error('Failed to mark as read:', err);
                // Revert optimistic update on error
                setChats(prev => {
                    const originalChats = { ...prev };
                    if (originalChats[phone]) {
                        originalChats[phone] = {
                            ...originalChats[phone],
                            unreadCount: chats[phone].unreadCount,
                        };
                    }
                    return originalChats;
                });
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

        fetchMessages(); // initial fetch
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSendMessage = async (phone, text) => {
        const res = await fetch('/api/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: phone, text }),
        });

        const data = await res.json();

        if (res.ok) {
            // Optimistic update
            const newMsg = {
                direction: 'outgoing',
                content: text,
                type: 'text',
                read: true,
                timestamp: new Date().toISOString(),
            };

            setChats(prev => {
                const prevChat = prev[phone] || {
                    messages: [],
                    unreadCount: 0,
                    lastMessage: null
                };

                const newMessages = [...prevChat.messages, newMsg];

                return {
                    ...prev,
                    [phone]: {
                        ...prevChat,
                        messages: newMessages,
                        lastMessage: newMsg.timestamp,
                    }
                };
            });
        } else {
            alert(data.error?.message || 'Failed to send message');
        }
    };

    // Convert chats object to sorted array for ChatList
    const sortedChats = Object.entries(chats).sort(
        ([, a], [, b]) => new Date(b.lastMessage) - new Date(a.lastMessage)
    );

    return (
       <div className="chat-container">
            <ChatList
                chats={sortedChats}
                onSelect={handleSelectChat}
                selected={selectedChat}
            />
            <ChatWindow
                phone={selectedChat}
                messages={selectedChat ? (chats[selectedChat]?.messages || []) : []}
                onSend={handleSendMessage}
            />
        </div>
    );
}