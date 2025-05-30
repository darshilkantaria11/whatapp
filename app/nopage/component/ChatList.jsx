import React from 'react';

export default function ChatList({ chats, onSelect, selected }) {
  return (
    <div className="chat-list">
      <h2 className="chat-list-title">Chats</h2>
      <ul>
        {chats.length === 0 ? (
          <li className="empty-chat">No chats yet</li>
        ) : (
          chats.map((phone) => (
            <li
              key={phone}
              className={`chat-item ${selected === phone ? 'active' : ''}`}
              onClick={() => onSelect(phone)}
            >
              {phone}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
