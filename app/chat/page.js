'use client';

import { useState } from 'react';
import ChatList from '../nopage/component/ChatList';
import ChatWindow from '../nopage/component/ChatWindow';
import { useEffect } from 'react';


export default function ChatPage() {
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState({}); // key: phone number, value: array of messages
  const [chats, setChats] = useState({});
  
    const handleSelectChat = async (phone) => {
        setSelectedChat(phone);
        if (chats[phone]?.unreadCount > 0) {
            await fetch('/api/markAsRead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            // Optimistic update
            setChats(prev => ({
                ...prev,
                [phone]: {
                    ...prev[phone],
                    unreadCount: 0,
                    messages: prev[phone].messages.map(m =>
                        m.direction === 'incoming' ? { ...m, read: true } : m
                    )
                }
            }));
        }
    };

    useEffect(() => {
        const fetchMessages = async () => {
            const res = await fetch('/api/messages');
            const data = await res.json();
            setChats(data);
        };

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
            const newMsg = {
                from: 'me',
                to: phone,
                content: text,
                timestamp: new Date().toISOString(),
                direction: 'outgoing',
                type: 'text',
            };
            setMessages((prev) => {
                const prevMsgs = prev[phone] || [];
                return {
                    ...prev,
                    [phone]: [...prevMsgs, newMsg],
                };
            });
        } else {
            alert(data.error?.message || 'Failed to send message');
        }
    };

    return (
        <div className="chat-container">
            <ChatList
                chats={Object.keys(messages)}
                onSelect={handleSelectChat}
                selected={selectedChat}
            />
            <ChatWindow
                phone={selectedChat}
                messages={messages[selectedChat] || []}
                onSend={handleSendMessage}
            />
        </div>
    );
}