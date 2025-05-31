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

            {msg.type === 'image' && msg.mediaUrl && (
              <img src={msg.mediaUrl} alt="sent image" style={{ maxWidth: 200, borderRadius: '8px' }} />
            )}

            {msg.type === 'audio' && msg.mediaUrl && (
              <audio controls src={msg.mediaUrl} />
            )}

            {msg.type === 'sticker' && msg.mediaUrl && (
              <img src={msg.mediaUrl} alt="sticker" style={{ maxWidth: 150 }} />
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
