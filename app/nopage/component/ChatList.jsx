// ChatList.js
import React from 'react';
import { useRouter } from 'next/navigation';

export default function ChatList({ chats, onSelect, selected }) {
    const router = useRouter();
    return (
        <div className="chat-list">
            <h2 className="chat-list-title">Chats</h2>
            
            <button
                onClick={() => router.push('/new-chat')}
                className="new-chat-button"
            >
                New Chat
            </button>
            <ul>
                {chats.length === 0 ? (
                    <li className="empty-chat">No chats yet</li>
                ) : (
                    chats.map(([phone, chatData]) => {
                        // Safely handle undefined chatData or messages
                        const messages = chatData?.messages || [];
                        const lastMessage = messages.length > 0
                            ? messages[messages.length - 1].content.substring(0, 30)
                            : 'No messages';
                        const unreadCount = chatData?.unreadCount || 0;

                        return (
                            <li
                                key={phone}
                                className={`chat-item ${selected === phone ? 'active' : ''}`}
                                onClick={() => onSelect(phone)}
                            >
                                <div className="chat-header">
                                    <span>{phone}</span>
                                    {unreadCount > 0 && (
                                        <span className="unread-badge">{unreadCount}</span>
                                    )}
                                </div>
                                <div className="last-message">
                                    {lastMessage}
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}