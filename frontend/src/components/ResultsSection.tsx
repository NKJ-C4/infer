import React, { useEffect, useState } from 'react';
import { Code, BarChart, Table, Copy, Check } from 'lucide-react';
import { SQLQuery, ChartData } from '../types';

interface ResultsSectionProps {
  query: SQLQuery | null;
  chartData: ChartData | null;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ query, chartData , tableHTML, chart, table, sql, conversation}) => {
const [activeTab, setActiveTab] = useState<'conversation' | 'sql' | 'visualization' | 'table'>('conversation');
  return (
    <section className="w-full py-6 px-4 transition-colors duration-300 bg-gray-50 dark:bg-gray-900/50 rounded-xl mb-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex space-x-3">
            {conversation != '' &&  <button
              onClick={() => setActiveTab('conversation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center ${
                activeTab === 'sql'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Code className="w-4 h-4 mr-2" />
              Conversation
            </button>}
{   sql != '' &&  <button
              onClick={() => setActiveTab('sql')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center ${
                activeTab === 'sql'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Code className="w-4 h-4 mr-2" />
              SQL Query
            </button>}
{   chart != ''  &&  <button
              onClick={() => setActiveTab('visualization')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center ${
                activeTab === 'visualization'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <BarChart className="w-4 h-4 mr-2" />
              Visualization
            </button>}
{   table != '' &&        <button
              onClick={() => setActiveTab('table')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center ${
                activeTab === 'table'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Table className="w-4 h-4 mr-2" />
              Data Table
            </button>}
          </div>
          {/* <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            <span>Confidence:</span>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  query.confidence > 0.8
                    ? 'bg-green-500'
                    : query.confidence > 0.6
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${query.confidence * 100}%` }}
              ></div>
            </div>
            <span>{Math.round(query.confidence * 100)}%</span>
          </div> */}
        </div>
<div
  className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg  'overflow-hidden'
  shadow-sm`}
>
          {(activeTab === 'conversation' && conversation != '') && (
            <div className="p-4 relative">
              <div className="mb-2 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Results</h3>
              </div>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                <code>{conversation}</code>
              </pre>
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  <span className="font-medium">Original Question:</span> {query}
                </p>
                <p className="mt-1 text-xs">
                  Generated at{' '}
                  {Date.now()}
                </p>
              </div>
            </div>
          )}
          {(activeTab === 'sql' && sql != '') && (
            <div className="p-4 relative">
              <div className="mb-2 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Generated SQL</h3>
              </div>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                <code>{query.sqlQuery}</code>
              </pre>
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  <span className="font-medium">Original Question:</span> {query.naturalLanguage}
                </p>
                <p className="mt-1 text-xs">
                  Generated at{' '}
                  {new Date(query.timestamp).toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hour12: true,
                  })}
                </p>
              </div>
            </div>
          )}

          {(activeTab === 'visualization' && chart != '') && (
            <div className="p-4">
              {chartData ? (
                <div className="h-80 w-full flex items-center justify-center">
                  <div className="text-center p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg w-full">
                    <BarChart className="w-12 h-12 mx-auto text-indigo-600 dark:text-indigo-400 mb-4" />
                    <p className="text-gray-700 dark:text-gray-300">
                      Visualization placeholder - This would be replaced with actual chart library
                      implementation in production
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-80 w-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  No visualization available for this query
                </div>
              )}
            </div>
          )}
          {(activeTab === 'table' && table != '') && (
            <div
            className="mt-4"
            dangerouslySetInnerHTML={{ __html: tableHTML }}
    >
          </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;