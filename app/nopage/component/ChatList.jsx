export default function ChatList({ chats, onSelect, selected }) {
  // Sort chats by last message timestamp
  const sortedChats = Object.entries(chats).sort(
    ([, a], [, b]) => new Date(b.lastMessage) - new Date(a.lastMessage)
  );

  return (
    <div className="chat-list">
      <h2>Chats</h2>
      <ul>
        {sortedChats.length === 0 ? (
          <li className="empty-chat">No chats yet</li>
        ) : (
          sortedChats.map(([phone, chatData]) => (
            <li
              key={phone}
              className={`chat-item ${selected === phone ? 'active' : ''}`}
              onClick={() => onSelect(phone)}
            >
              <div className="chat-header">
                <span>{phone}</span>
                {chatData.unreadCount > 0 && (
                  <span className="unread-badge">{chatData.unreadCount}</span>
                )}
              </div>
              <div className="last-message">
                {chatData.messages[0]?.content?.substring(0, 30) || 'No messages'}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}