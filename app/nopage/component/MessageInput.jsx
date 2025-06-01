// MessageInput.js
export default function MessageInput({ text, setText, onSend, onMediaUpload }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSend();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onMediaUpload(file);
  };

  return (
    <div className="message-input">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
      />
      <input type="file" accept="image/*,audio/*" onChange={handleFileChange} />
      <button onClick={onSend}>Send</button>
    </div>
  );
}
