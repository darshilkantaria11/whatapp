'use client';

import { useState } from 'react';
import ChatList from '../nopage/component/ChatList';
import ChatWindow from '../nopage/component/ChatWindow';
import { useEffect } from 'react';


export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState({}); // key: phone number, value: array of messages

  const handleSelectChat = (phone) => {
    setSelectedChat(phone);
  };

  useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch('/api/messages');
    const data = await res.json();
    setMessages(data); // update messages state
  }, 3000);

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
      };
      setMessages((prev) => ({
        ...prev,
        [phone]: [...(prev[phone] || []), newMsg],
      }));
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
