import { useState, useRef, useEffect } from 'react';
import MessageInput from './MessageInput';

export default function ChatWindow({ phone, messages, onSend }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    // Scroll to the bottom on new messages
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
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <MessageInput text={text} setText={setText} onSend={handleSend} />
    </div>
  );
}
