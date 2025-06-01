'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCirclePlus } from 'lucide-react';

export default function ChatList({ chats, onSelect, selected }) {
    const router = useRouter();

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Chats</h2>
                <button
                    onClick={() => router.push('/new-chat')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <MessageCirclePlus size={16} />
                    New
                </button>
            </div>

            {/* Chat List */}
            <ul className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
                {chats.length === 0 ? (
                    <li className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No chats yet
                    </li>
                ) : (
                    chats.map(([phone, chatData]) => {
                        const messages = chatData?.messages || [];
                        const lastMessage =
                            messages.length > 0
                                ? messages[messages.length - 1].content.substring(0, 40)
                                : 'No messages';
                        const unreadCount = chatData?.unreadCount || 0;
                        const isActive = selected === phone;

                        return (
                            <li
                                key={phone}
                                onClick={() => onSelect(phone)}
                                className={`cursor-pointer px-4 py-3 border-b border-gray-100 dark:border-gray-800 transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
                                    isActive ? 'bg-blue-50 dark:bg-blue-900' : ''
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-800 dark:text-gray-200">
                                        {phone}
                                    </span>
                                    {unreadCount > 0 && (
                                        <span className="text-xs bg-green-600 text-white rounded-full px-2 py-0.5">
                                            {unreadCount}
                                        </span>
                                    )}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {lastMessage}
                                </div>
                            </li>
                        );
                    })
                )}
            </ul>
        </div>
    );
}
