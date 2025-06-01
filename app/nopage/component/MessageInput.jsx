import { Paperclip, SendHorizonal } from 'lucide-react';

export default function MessageInput({ text, setText, onSend, onMediaUpload }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSend();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onMediaUpload(file);
    e.target.value = ''; // reset input to allow re-uploading same file
  };

  return (
    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
      {/* Media Upload Button */}
      {/* <label className="cursor-pointer">
        <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label> */}

      {/* Text Input */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="flex-1 bg-white dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Send Button */}
      <button
        onClick={onSend}
        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full"
      >
        <SendHorizonal className="w-5 h-5" />
      </button>
    </div>
  );
}
