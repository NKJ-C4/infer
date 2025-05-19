import React, { useEffect } from 'react';
import { MessageSquare, Plus, RefreshCcw } from 'lucide-react';

const Sidebar = ({currentChat, setCurrentChat , messages, onNewChat ,chats , setChats , loading }) => {
  const firstUserMessage = messages.find(message => message.role === 'user');
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
      <button
  onClick={onNewChat}
  disabled={loading}
  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
    loading ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
  } text-white`}
>
  <RefreshCcw className="w-4 h-4" />
  <span>New Chat</span>
</button>
      </div>
      {chats.length > 0 &&       
      <div className="flex-1 overflow-y-auto p-4">
        {chats.map((chat, index) => (
          chat.length !== 0 && (
<div
  key={index}
  onClick={loading ? undefined : () => setCurrentChat(index)}
  className={`flex items-center gap-3 mb-[5px] px-3 py-2 rounded-lg ${
    index == currentChat
      ? 'bg-indigo-600 text-white'
      : 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'
  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
>
  <MessageSquare className="w-4 h-4 flex-shrink-0" />
  <span className="truncate text-sm">{chat[0]?.content}</span>
</div>
          )
        ))}
      </div>}
    </div>
  );
};

export default Sidebar;