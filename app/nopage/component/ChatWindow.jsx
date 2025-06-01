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

    const handleMediaUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('phone', phone);
        formData.append('type', file.type.startsWith('video') ? 'video' : 'image');

        const res = await fetch('/api/sendMedia', {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        if (!data.success) {
            alert('Failed to send media: ' + (data.error || 'Unknown error'));
        }
    };

    if (!phone) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Select a chat to start messaging.
            </div>
        );
    }

    const sortedMessages = [...(messages || [])].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Chat with {phone}
                </h3>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                {sortedMessages.map((msg, index) => {
                    const isSent = msg.direction === 'outgoing';
                    const mediaUrl = `/api/media?url=${encodeURIComponent(msg.content)}`;

                    return (
                        <div
                            key={index}
                            className={`max-w-[75%] break-words rounded-xl px-4 py-2 text-sm ${
                                isSent
                                    ? 'ml-auto bg-blue-600 text-white rounded-br-none'
                                    : 'mr-auto bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                            }`}
                        >
                            {msg.type === 'text' && <p>{msg.content}</p>}

                            {msg.type === 'image' && (
                                <MediaWithFallback type="image" url={mediaUrl} alt="Image" />
                            )}

                            {msg.type === 'video' && (
                                <MediaWithFallback type="video" url={mediaUrl} />
                            )}

                            {msg.type === 'sticker' && (
                                <MediaWithFallback type="sticker" url={mediaUrl} alt="Sticker" />
                            )}
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <MessageInput
                    text={text}
                    setText={setText}
                    onSend={handleSend}
                    onMediaUpload={handleMediaUpload}
                />
            </div>
        </div>
    );
}

// 🖼️ Media component
function MediaWithFallback({ type, url, alt }) {
    const [error, setError] = useState(false);

    if (error) {
        return <p className="text-xs italic text-gray-400">[{type.toUpperCase()} could not load]</p>;
    }

    if (type === 'image' || type === 'sticker') {
        return (
            <img
                src={url}
                alt={alt}
                className="mt-2 rounded-lg max-w-[200px] object-cover"
                onError={() => setError(true)}
            />
        );
    }

    if (type === 'audio') {
        return (
            <audio controls onError={() => setError(true)} className="mt-2 w-full">
                <source src={url} type="audio/mpeg" />
                Your browser does not support the audio element.
            </audio>
        );
    }

    if (type === 'video') {
        return (
            <video
                controls
                onError={() => setError(true)}
                className="mt-2 max-w-[250px] rounded-lg"
            >
                <source src={url} type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        );
    }

    return null;
}
