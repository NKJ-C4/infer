import React, { useState } from 'react';
import { Database, LayoutGrid, ClipboardCheck, Info } from 'lucide-react';
import { TableSchema } from '../types';

// Mock data for tables
const mockTables: TableSchema[] = [
  {
    id: '1',
    name: 'sales_data',
    columns: [
      { name: 'id', type: 'integer' },
      { name: 'date', type: 'date' },
      { name: 'amount', type: 'decimal' },
      { name: 'customer_id', type: 'integer' },
      { name: 'region', type: 'varchar' }
    ],
    rowCount: 15423,
    selected: false
  },
  {
    id: '2',
    name: 'customers',
    columns: [
      { name: 'id', type: 'integer' },
      { name: 'name', type: 'varchar' },
      { name: 'email', type: 'varchar' },
      { name: 'signup_date', type: 'date' },
      { name: 'region', type: 'varchar' }
    ],
    rowCount: 3287,
    selected: false
  },
  {
    id: '3',
    name: 'products',
    columns: [
      { name: 'id', type: 'integer' },
      { name: 'name', type: 'varchar' },
      { name: 'category', type: 'varchar' },
      { name: 'price', type: 'decimal' },
      { name: 'in_stock', type: 'boolean' }
    ],
    rowCount: 512,
    selected: false
  },
  {
    id: '4',
    name: 'regions',
    columns: [
      { name: 'id', type: 'integer' },
      { name: 'name', type: 'varchar' },
      { name: 'country', type: 'varchar' },
      { name: 'manager', type: 'varchar' }
    ],
    rowCount: 24,
    selected: false
  }
];

const TableSelectorSection: React.FC = () => {
  const [tables, setTables] = useState<TableSchema[]>(mockTables);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  const selectedCount = tables.filter(table => table.selected).length;
  
  const toggleTableSelection = (id: string) => {
    setTables(tables.map(table => 
      table.id === id ? { ...table, selected: !table.selected } : table
    ));
  };
  
  const showTableDetails = (id: string) => {
    setSelectedTableId(id === selectedTableId ? null : id);
  };
  
  return (
    <section className="w-full py-8 px-4 transition-colors duration-300 mb-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Database className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Select Tables from Snowflake
            </h2>
          </div>
          
          {selectedCount > 0 && (
            <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-medium">
              {selectedCount} table{selectedCount !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {tables.map(table => (
            <div 
              key={table.id}
              className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                table.selected 
                  ? 'border-indigo-500 dark:border-indigo-500 shadow-md' 
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <LayoutGrid className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                    <h3 className="font-medium text-gray-800 dark:text-white">{table.name}</h3>
                  </div>
                  <button
                    onClick={() => toggleTableSelection(table.id)}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-colors duration-200 ${
                      table.selected 
                        ? 'bg-indigo-600 text-white' 
                        : 'border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {table.selected && <ClipboardCheck className="w-3 h-3" />}
                  </button>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {table.rowCount.toLocaleString()} rows · {table.columns.length} columns
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {table.columns.slice(0, 3).map(column => (
                    <span 
                      key={column.name}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs"
                    >
                      {column.name}
                    </span>
                  ))}
                  {table.columns.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                      +{table.columns.length - 3} more
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => showTableDetails(table.id)}
                  className="flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors duration-200"
                >
                  <Info className="w-3 h-3 mr-1" />
                  {selectedTableId === table.id ? 'Hide schema' : 'View schema'}
                </button>
                
                {selectedTableId === table.id && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Schema
                    </h4>
                    <div className="space-y-1">
                      {table.columns.map(column => (
                        <div 
                          key={column.name}
                          className="flex justify-between text-xs"
                        >
                          <span className="text-gray-800 dark:text-gray-200">{column.name}</span>
                          <span className="text-gray-500 dark:text-gray-400">{column.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end">
          <button
            disabled={selectedCount === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              selectedCount > 0
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                : 'bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Run Analysis on Selected Tables
          </button>
        </div>
      </div>
    </section>
  );
};

export default TableSelectorSection;