import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { MessageHistory } from './types';
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { BrowserRouter } from 'react-router-dom';


const MAX_MESSAGES = 10;

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [csvData, setCSVData] = useState<any>(null);
  const [currentChat, setCurrentChat] = useState<number | null>(0);
  const [chats , setChats] = useState<any[]>([]);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>(() => {
    const saved = localStorage.getItem('chatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(messageHistory));
    const savedChatsString = localStorage.getItem('chats');
    const savedChats = savedChatsString ? JSON.parse(savedChatsString) : [];    
    if (currentChat !== null) {
      savedChats[currentChat] = JSON.parse(localStorage.getItem('chatHistory'));
    }
    localStorage.setItem('chats', JSON.stringify(savedChats));
    setChats(savedChats)
    localStorage.setItem('currentChat', JSON.stringify(currentChat))
    if (messageHistory.length >= MAX_MESSAGES) {
      alert('Maximum message limit reached. Please start a new chat to continue.');
    }
  }, [messageHistory]);

  const handleNewChat = () => {
    if(messageHistory?.length == 0){
      return
    }
    const savedChatsString = localStorage.getItem('chats');
    const savedChats = savedChatsString ? JSON.parse(savedChatsString) : [];    
    if (currentChat !== null) {
      savedChats[currentChat] = messageHistory;
    }
    localStorage.setItem('chats', JSON.stringify(savedChats));
    setChats(savedChats);
    setMessageHistory([]);  // Not setMessageHistory[0]
    setCurrentChat(currentChat => {
      return currentChat !== null ? currentChat + 1 : 0;
    });
  };

  useEffect(() => {
    const savedChatsString = localStorage.getItem('chats');
    const savedChats = savedChatsString ? JSON.parse(savedChatsString) : [];
    setMessageHistory(savedChats[currentChat] || []);
    setChats(savedChats);
  },[currentChat])

  useEffect(() => {
    console.log("Current chat:")
  },[])
  const handleSubmitQuery = async (query: string) => {
    if (messageHistory.length >= MAX_MESSAGES) {
      alert('Maximum message limit reached. Please start a new chat to continue.');
      return;
    }

    try {
      const newMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date(),
      };

      setMessageHistory(prev => [...prev, newMessage]);
      setLoading(true)
      const response = await fetch(`http://127.0.0.1:8000/get_user_data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          chat_history: messageHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.csv_data) {
        const csvData = data.csv_data;
        setCSVData(csvData);
      }
      
      const aiResponse = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.output || data.sql_query,
        timestamp: new Date(),
        sqlQuery: data.sql_query,
        table: data.table?.body ? JSON.parse(data.table.body) : null,
        chart: data.response_type === 'visualization' ? data : null,
        analysisStatement: data?.analysis_statement,
        analysisPlot: data?.analysis_plot,
      };

      setMessageHistory(prev => [...prev, aiResponse]);
      setLoading(false)
    } catch (error) {
      setMessageHistory(prev => [...prev, {
        id: Date.now().toString(),
        role: 'error',
        content: 'Failed to connect to the server. Please ensure it is running at http://127.0.0.1:8000',
        timestamp: new Date(),
      }]);
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <Header loading={loading} />
        <div className="flex h-[calc(100vh-5rem)]">
          <div 
            className={`fixed inset-y-16 left-0 z-30 w-64 transform bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <Sidebar
              currentChat={currentChat}
              setCurrentChat={setCurrentChat}
              chats={chats}
              setChats={setChats}
              messages={messageHistory}
              onNewChat={handleNewChat}
              loading={loading}
            />
          </div>
          
          <button
            onClick={toggleSidebar}
            className="fixed bottom-4 left-4 z-40 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-colors duration-200"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>

          <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
            <main className="h-[calc(100vh-5rem)] p-4">
              <ChatInterface
                fileUploading={false}
                messages={messageHistory}
                onSubmitQuery={handleSubmitQuery}
                csvData={csvData}
                setCSVData={setCSVData}
                currentChat={currentChat}
                setCurrentChat={setCurrentChat}
                chats={chats}
                setChats={setChats}
              />
            </main>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;