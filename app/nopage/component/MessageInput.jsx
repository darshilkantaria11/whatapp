import React from 'react';

export default function MessageInput({ text, setText, onSend }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="message-input">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message"
      />
      <button onClick={onSend}>Send</button>
    </div>
  );
}
