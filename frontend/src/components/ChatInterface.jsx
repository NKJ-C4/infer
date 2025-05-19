import React, { useRef, useEffect, useState } from 'react';
import { Send, User, Bot, AlertCircle, Mic, Download ,FileSpreadsheet ,Upload } from 'lucide-react';
const ChatInterface = ({fileUploading , messages, onSubmitQuery , csvData , setCSVData , currentChat , setCurrentChat , chats , setChats}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedRows, setLoadedRows] = useState(150);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [csvs , setCsvs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  let recognition = null;


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };



  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Speech Recognition is not supported in this browser.");
      return;
    }

    setIsListening(true);
    let recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.start();
  };

// Updated submit handler that passes both input and file
const handleSubmit = async (e) => {
  e.preventDefault();
  if (input.trim()) {
    setIsLoading(true);
    try {
      await onSubmitQuery(input, selectedFile);
    } finally {
      setIsLoading(false);
    }
    setInput('');
    // Optionally clear the file state
    setSelectedFile(null);
  }
};

  const exportToCSV = (message , csvData) => {
    setCsvs(prevCsvs => {
      const newCsvEntry = { [message.id]: csvData };
            return [...prevCsvs, newCsvEntry];
    });
    const csvEntry = csvs.find(entry => Object.hasOwnProperty.call(entry, message.id));
    const blob = new Blob([csvEntry[message.id]], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute("href", url);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderTable = (message, table) => {
    const rows = table.split('\n');
    const totalRows = rows.length;
    const displayRows = rows.slice(0, loadedRows).join('\n');
  
    return (
      <div className="mt-4">
        <details> {/* Removed 'open' attribute to make it collapsed by default */}
          <summary className="font-medium cursor-pointer bg-gray-50 dark:bg-gray-800 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            Show Data Table
          </summary>
          <div className="max-h-[500px] overflow-y-auto mt-1">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                {/* Table headers */}
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <div dangerouslySetInnerHTML={{ __html: displayRows }} />
              </tbody>
            </table>
          </div>
        </details>
        
        {totalRows > 1 ? (
          <div className="mt-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Download the file to see more results
            </p>
            <button
              onClick={() => exportToCSV(message, csvData)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to CSV
            </button>
          </div>
        ) : totalRows > loadedRows ? (
          <button
            onClick={() => setLoadedRows(prev => Math.min(prev + 50, totalRows))}
            className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Load more items...
          </button>
        ) : null}
      </div>
    );
  };
  const renderMessage = (message) => {
    const isUser = message.role === 'user';
    const isError = message.role === 'error';

    return (
      <div
      key={message.id}
      className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isError ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
        }`}>
        {isError ? <AlertCircle className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>
      )}

      <div className={`max-w-[70%] w-auto rounded-lg p-4 ${
        isUser 
        ? 'bg-indigo-600 text-white' 
        : isError
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
      }`}>
        <div className="whitespace-pre-wrap break-words">
        {(message?.sqlQuery === message?.content) ? 'Here are your results' : message.content}
        </div>
        <div className="mt-2">
        {message.sqlQuery && (
          <div className="mt-2">
          <details>
            <summary className="font-medium cursor-pointer">SQL Query:</summary>
            <pre className="p-2 bg-gray-800 text-gray-200 rounded overflow-x-auto mt-1">
            <code>{message.sqlQuery}</code>
            </pre>
          </details>
          </div>
        )}

        {message.analysisStatement && (
          <div className="mt-2">
          <details>
            <summary className="font-medium cursor-pointer">Analysis Statement:</summary>
            <pre className="p-2 bg-gray-800 text-gray-200 rounded whitespace-pre-wrap break-words mt-1">
            <code>{message.analysisStatement}</code>
            </pre>
          </details>
          </div>
        )}
        
        {message?.analysisPlot? 
          <div>
          <img 
            src={`data:image/png;base64,${message?.analysisPlot?.image}`}
            alt="Data Visualization" 
            className="chart-image"
          />
          </div>
          :
          <>{""}</>
        }
        {message.table && renderTable(message , message.table)}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
        <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </div>
      )}
      </div>
    );
  };

  const LoadingMessage = () => (
    <div className="flex gap-3 mb-4 justify-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600">
        <Bot className="w-5 h-5" />
      </div>
      <div className="max-w-[70%] rounded-lg p-4 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );

  const WelcomeScreen = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center p-6 max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
          <Bot className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Hello Sir!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          How can I assist you with your retail database queries today?
        </p>
        
        {/* CSV File Picker */}

      {fileUploading == true && <div className="mb-6 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-lg p-6 text-center">
          <input
            id="csv-file-upload"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <label htmlFor="csv-file-upload" className="cursor-pointer block">
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="w-12 h-12 text-indigo-500 mb-2" />
                <span className="font-medium text-gray-800 dark:text-white">{selectedFile.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Click to change file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
                <span className="font-medium text-gray-800 dark:text-white">Upload CSV file</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Click to browse files
                </span>
              </div>
            )}
          </label>
        </div>}
        
        <div className="space-y-2">
          <button
            onClick={() => setInput('Show me the total count of Stores')}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 w-full text-left"
          >
            Show me the total count of Stores
          </button>
          <button
            onClick={() => setInput('What\'s the average weekly sales for each type of store?')}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 w-full text-left"
          >
            What's the average weekly sales for each type of store?
          </button>
        </div>
      </div>
    </div>

  );
  useEffect(() => {
    const detailsElements = document.querySelectorAll('details');
    detailsElements.forEach((details) => {
      if (details.querySelector('summary')?.textContent === 'Analysis Statement:') {
        details.open = true;
      }
    });
  }, [messages]);
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 relative"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.length === 0 && !isLoading && <WelcomeScreen />}
        {messages.map(renderMessage)}
        {isLoading && <LoadingMessage />}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
    <form onSubmit={handleSubmit} className="flex gap-2">
    <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask a question about your data..."
        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        disabled={isLoading}
      />
      <button
        type="button"
        onClick={handleVoiceInput}
        disabled={isLoading}
        className={`p-3 rounded-lg transition-colors duration-200 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
      </button>

      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center justify-center w-12"
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
    </form>
</div>
    </div>
  );
};

export default ChatInterface;