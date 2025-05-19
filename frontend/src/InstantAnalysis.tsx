import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import { MessageHistory } from './types';
import { PanelLeftClose, PanelLeft, Heading1 } from 'lucide-react';
import { toast } from 'react-toastify';


const MAX_MESSAGES = 10;

function InstantAnalysis() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [csvData, setCSVData] = useState<any>(null);
  const [currentChat, setCurrentChat] = useState<number | null>(0);
  const [files, setFiles] = useState<Record<string, any>>({});
  const [chats , setChats] = useState<any[]>([]);
  const [messageHistory, setMessageHistory] = useState<MessageHistory[]>(() => {
    const saved = sessionStorage.getItem('InstantChatHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);


  useEffect(() => {
    sessionStorage.setItem('InstantChatHistory', JSON.stringify(messageHistory));
    const savedChatsString = sessionStorage.getItem('instant-chats');
    const savedChats = savedChatsString ? JSON.parse(savedChatsString) : [];    
    if (currentChat !== null) {
      savedChats[currentChat] = JSON.parse(sessionStorage.getItem('InstantChatHistory'));
    }
    sessionStorage.setItem('instant-chats', JSON.stringify(savedChats));
    setChats(savedChats)
    sessionStorage.setItem('currentInstantChat', JSON.stringify(currentChat))
    if (messageHistory.length >= MAX_MESSAGES) {
      alert('Maximum message limit reached. Please start a new chat to continue.');
    }
  }, [messageHistory]);

  const handleNewChat = () => {
    if(messageHistory?.length == 0){
      return
    }
    const savedChatsString = sessionStorage.getItem('instant-chats');
    const savedChats = savedChatsString ? JSON.parse(savedChatsString) : [];    
    if (currentChat !== null) {
      savedChats[currentChat] = messageHistory;
    }
    sessionStorage.setItem('instant-chats', JSON.stringify(savedChats));
    setChats(savedChats);
    setMessageHistory([]);  // Not setMessageHistory[0]
    setCurrentChat(currentChat => {
      return currentChat !== null ? currentChat + 1 : 0;
    });
  };

  useEffect(() => {
    const savedChatsString = sessionStorage.getItem('instant-chats');
    const savedChats = savedChatsString ? JSON.parse(savedChatsString) : [];
    setMessageHistory(savedChats[currentChat] || []);
    setChats(savedChats);
  },[currentChat])



    // Helper function to convert File to base64
const convertFileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]); // Remove the data URL prefix
    reader.onerror = error => reject(error);
  });
};

  // Helper function to convert base64 back to File
  const base64ToFile = (base64, filename, mimeType) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new File([byteArray], filename, { type: mimeType });
  }

  
  const handleSubmitQuery = async (query, fileData) => {
      if (messageHistory.length >= MAX_MESSAGES) {
        alert('Maximum message limit reached. Please start a new chat to continue.');
        return;
      }
      
      // File handling logic - now storing the actual file in sessionStorage
      let fileToSubmit = null;
      
      // If a file was provided in this request
      if (fileData) {
        try {
          // Convert file to base64 for storage
          const fileAsBase64 = await convertFileToBase64(fileData);
          
          // Store file data in sessionStorage
          const filesList = JSON.parse(sessionStorage.getItem('fileReferences') || '{}');
          filesList[currentChat] = {
            name: fileData.name,
            type: fileData.type,
            size: fileData.size,
            lastModified: fileData.lastModified,
            data: fileAsBase64
          };
          
          sessionStorage.setItem('fileReferences', JSON.stringify(filesList));
          
          fileToSubmit = fileData;
        } catch (error) {
          console.error("Error storing file:", error);
          alert("Could not store the file. It may be too large.");
          return;
        }
      } else {
        // No file provided, check if we have one stored in sessionStorage for this chat
        const filesList = JSON.parse(sessionStorage.getItem('fileReferences') || '{}');
        if (filesList[currentChat]) {
          try {
            // Convert back to File object
            const storedFile = filesList[currentChat];
            fileToSubmit = base64ToFile(
              storedFile.data,
              storedFile.name,
              storedFile.type
            );
            console.log("Using stored file for chat ID:", currentChat);
          } 
          catch (error) {
            console.error("Error retrieving stored file:", error);
          }
        } else {

          console.log("No file available for this chat");
          toast.error("Please Upload a file to proceed or start with new chat");
          return;
        }
      }
      
      try {
        const newMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: query,
          timestamp: new Date(),
        };
        
        setMessageHistory(prev => [...prev, newMessage]);
        setLoading(true);
        
        // Create FormData object to send both JSON and file
        const formData = new FormData();
        
        // Add the JSON data
        const jsonData = {
          query,
          chat_history: messageHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        };
        
        formData.append('json_data', JSON.stringify(jsonData));
        console.log("fileToSubmit", fileToSubmit);
        
        // Add the file if it exists
        if (fileToSubmit) {
          formData.append('file', fileToSubmit);
        }
        
        console.log("FormData:", formData);
        for (const [key, value] of formData.entries()) {
          console.log(`${key}: ${value}`);
        }
        
        const response = await fetch(`http://127.0.0.1:8000/get_csv_data`, {
          method: "POST",
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log("response", response);
        const data = await response.json();
        console.log("data", data);
        
        if (data?.csv_data) {
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
          analysisStatement: data?.analysis_statement
        };
        
        setMessageHistory(prev => [...prev, aiResponse]);
        setLoading(false);
      } catch (error) {
        console.error("API Error:", error);
        setMessageHistory(prev => [...prev, {
          id: Date.now().toString(),
          role: 'error',
          content: 'Failed to connect to the server. Please ensure it is running at http://127.0.0.1:8000',
          timestamp: new Date(),
        }]);
        setLoading(false);
      }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <Header loading = {loading}/>
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
                fileUploading={true}
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

export default InstantAnalysis;