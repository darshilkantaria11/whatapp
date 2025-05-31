"use client"
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
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.direction === 'outgoing' ? 'sent' : 'received'}`}
                    >
                        {msg.type === 'text' && <p>{msg.content}</p>}

                        {msg.type === 'image' && (
                            <img
                                src={`/api/media?url=${encodeURIComponent(msg.content)}`}
                                alt="Image"
                                style={{ maxWidth: '300px', borderRadius: '8px' }}
                            />
                        )}

                        {msg.type === 'audio' && (
                            <audio controls>
                                <source src={`/api/media?url=${encodeURIComponent(msg.content)}`} type="audio/mpeg" />
                                Your browser does not support the audio element.
                            </audio>
                        )}

                        {msg.type === 'sticker' && (
                            <img
                                src={`/api/media?url=${encodeURIComponent(msg.content)}`}
                                alt="Sticker"
                                style={{ maxWidth: '150px' }}
                            />
                        )}


                        {msg.type !== 'text' && !msg.mediaUrl && (
                            <p>[{msg.type.toUpperCase()} received — no preview]</p>
                        )}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
            <MessageInput text={text} setText={setText} onSend={handleSend} />
        </div>
    );
}
