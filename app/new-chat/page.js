'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewChatPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const validatePhoneNumber = (number) => {
    const regex = /^[0-9]{10,15}$/;
    return regex.test(number);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError('');

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Enter a valid phone number (10-15 digits)');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneNumber, text: message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send message');
      }

      router.push(`/chat?phone=${encodeURIComponent(phoneNumber)}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className='bg-gray-800 h-screen p-10'>
    <div className="max-w-md mx-auto  p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Start a New Chat</h1>

      <form onSubmit={handleSendMessage} className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block p-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 919558302454"
            className="mt-1 block w-full rounded-md p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm p-2 font-medium text-gray-700 dark:text-gray-300">
            Message
          </label>
          <textarea
            id="message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="mt-1 block w-full rounded-md p-2 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={isSending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-50"
        >
          {isSending ? 'Sending...' : 'Send Message'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/chat" className="text-blue-600 hover:underline text-sm">
          ← Back to Chats
        </Link>
      </div>
    </div>
    </div>
  );
}
