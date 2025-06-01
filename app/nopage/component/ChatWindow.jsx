'use client';
import { useState, useRef, useEffect } from 'react';
import MessageInput from './MessageInput';

export default function ChatWindow({ phone, messages, onSend }) {
    const [text, setText] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (text.trim()) {
            onSend(phone, text.trim());
            setText('');
        }
    };

    if (!phone) {
        return <div className="chat-window">Select a chat to start messaging.</div>;
    }

    return (
        <div className="chat-window">
            <div className="chat-header">Chat with {phone}</div>
            <div className="chat-messages">
                {messages.map((msg, index) => {
                    const mediaUrl = `/api/media?url=${encodeURIComponent(msg.content)}`;

                    return (
                        <div
                            key={index}
                            className={`message ${msg.direction === 'outgoing' ? 'sent' : 'received'}`}
                        >
                            {msg.type === 'text' && <p>{msg.content}</p>}

                            {msg.type === 'image' && (
                                <MediaWithFallback type="image" url={mediaUrl} alt="Image" />
                            )}

                            {msg.type === 'audio' && (
                                <MediaWithFallback type="audio" url={mediaUrl} />
                            )}

                            {msg.type === 'sticker' && (
                                <MediaWithFallback type="sticker" url={mediaUrl} alt="Sticker" />
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>
            <MessageInput text={text} setText={setText} onSend={handleSend} />
        </div>
    );
}

// ✅ Fallback component for image/audio/sticker
function MediaWithFallback({ type, url, alt }) {
    const [error, setError] = useState(false);

    if (error) {
        return <p>[{type.toUpperCase()} received — no preview]</p>;
    }

    if (type === 'image' || type === 'sticker') {
        return (
            <img
                src={url}
                alt={alt}
                style={{ maxWidth: type === 'sticker' ? '150px' : '300px', borderRadius: '8px' }}
                onError={() => setError(true)}
            />
        );
    }

    if (type === 'audio') {
        return (
            <audio controls onError={() => setError(true)}>
                <source src={url} type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio>
        );
    }

    return null;
}
