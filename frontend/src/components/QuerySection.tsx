import React, { useState } from 'react';
import { Search, ArrowRight, CornerDownRight , Mic, Voicemail } from 'lucide-react';

interface QuerySectionProps {
  onSubmitQuery: (query: string) => void;
}

const QuerySection: React.FC<QuerySectionProps> = ({ onSubmitQuery }) => {
  const [query, setQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit =async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmitQuery(query);
    }
  };


  const voice = () => {
    if (!("webkitSpeechRecognition" in window)) {
      console.error("Speech Recognition is not supported in this browser.");
      return;
    }

    let recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-GB";
    recognition.continuous = false; // Stops after one result
    recognition.interimResults = false; // Only final results

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Transcript:", transcript);
      setQuery(transcript);
    };

    recognition.onspeechend = () => {
      console.log("Speech ended, stopping recognition.");
      recognition.stop();
    };

    recognition.onend = () => {
      console.log("Recognition has stopped.");
    };

    recognition.start();
  };


  const exampleQueries = [
    'Show me sales by region for the last quarter',
    'What products had the highest profit margin last month?',
    'Compare customer satisfaction across different demographics',
    'Identify the top 10 customers by revenue'
  ];

  return (
    <section className="w-full py-10 px-4 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">
          Ask Questions in Natural Language
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
          Type your question about your data and we'll convert it to SQL and visualize the results
        </p>

        <form onSubmit={handleSubmit} className="relative mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsTyping(true);
                const timeout = setTimeout(() => setIsTyping(false), 1000);
                return () => clearTimeout(timeout);
              }}
              placeholder="Ask something like 'Show me monthly sales trends'"
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 text-gray-800 dark:text-white"
            />
            <button
              type="submit"
              className="absolute right-15 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors duration-200"
              disabled={!query.trim()}
            >
              <ArrowRight className="w-5 h-5" />

            </button>
            <button
              type="submit"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-lg transition-colors duration-200"
              onClick={()=>{voice()}}
            >
              <Mic className="w-5 h-5" />
              
            </button>
          </div>
        </form>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
            <CornerDownRight className="w-4 h-4 mr-2" />
            Try these examples
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exampleQueries.map((exampleQuery, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(exampleQuery);
                  setTimeout(() => onSubmitQuery(exampleQuery), 500);
                }}
                className="text-left p-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm transition-colors duration-200"
              >
                {exampleQuery}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuerySection;