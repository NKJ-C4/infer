import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQItem } from '../types';

const faqs: FAQItem[] = [
  {
    question: 'What types of databases does Phaser support?',
    answer: 'Phaser currently supports Snowflake, PostgreSQL, MySQL, and SQL Server databases. We\'re continuously adding support for more database types.'
  },
  {
    question: 'How accurate is the natural language to SQL conversion?',
    answer: 'Our NL-to-SQL engine typically achieves 85-95% accuracy for standard analytical queries. We display a confidence score with each query to help you assess its reliability. For complex or ambiguous questions, our system will prompt for clarification.'
  },
  {
    question: 'Can I edit the generated SQL queries?',
    answer: 'Yes, you can edit any generated SQL query before execution. Phaser provides a full SQL editor with syntax highlighting and auto-completion to help you refine queries when needed.'
  },
  {
    question: 'How do I connect my own Snowflake database?',
    answer: 'Go to Settings > Connections and click "Add Connection". You\'ll need your Snowflake account URL, warehouse name, database name, schema, username, and password. We securely store connection details using industry-standard encryption.'
  },
  {
    question: 'What file formats can I upload to Snowflake?',
    answer: 'Phaser supports CSV, Excel (.xlsx), JSON, and Parquet files for direct upload to Snowflake. Files are automatically parsed and converted into tables based on their structure.'
  },
  {
    question: 'Can I save my queries and visualizations?',
    answer: 'Yes, you can save both queries and their results, including visualizations. Saved items can be organized into dashboards and shared with team members or exported to various formats.'
  }
];

const QnASection: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  return (
    <section className="w-full py-10 px-4 transition-colors duration-300 mb-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8">
          <HelpCircle className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`border rounded-lg overflow-hidden transition-all duration-300 ${
                openItems.includes(index)
                  ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between focus:outline-none"
              >
                <span className="font-medium text-gray-800 dark:text-white">
                  {faq.question}
                </span>
                {openItems.includes(index) ? (
                  <ChevronUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </button>
              
              {openItems.includes(index) && (
                <div 
                  className="px-5 pb-4 text-gray-600 dark:text-gray-300"
                  style={{ 
                    animation: 'fadeIn 0.3s ease-in-out',
                  }}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg text-center">
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
            Have more questions?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Our support team is ready to help you with any questions you may have.
          </p>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors duration-200">
            Contact Support
          </button>
        </div>
      </div>
    </section>
  );
};

export default QnASection;