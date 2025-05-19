import React, { useState } from 'react';
import { Upload, Check, X, FileText, Server } from 'lucide-react';

const FileUploadSection: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    setUploadStatus('uploading');
    setProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadStatus('success');
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    

  };

  return (
    <section className="w-full py-8 px-4 transition-colors duration-300 mb-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Server className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Upload Data to Snowflake
          </h2>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600'
          }`}
        >
          {uploadStatus === 'idle' && (
            <>
              <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drag & Drop your data file here
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                or click to browse for CSV, Excel, or JSON files
              </p>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".csv,.xlsx,.json"
                onChange={handleFileChange}
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" />
                Browse Files
              </label>
            </>
          )}

          {uploadStatus === 'uploading' && (
            <div className="px-4 py-6">
              <div className="flex items-center mb-4">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{fileName}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Uploading... {progress}%
              </div>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="px-4 py-6">
              <div className="flex items-center mb-4">
                <Check className="w-8 h-8 text-green-500 mr-3" />
                <div>
                  <h4 className="text-gray-800 dark:text-gray-200 font-medium">{fileName}</h4>
                  <p className="text-green-600 dark:text-green-400 text-sm">
                    Successfully uploaded to Snowflake
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadStatus('idle')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Upload Another File
              </button>
            </div>
          )}

          {uploadStatus === 'error' && (
            <div className="px-4 py-6">
              <div className="flex items-center mb-4">
                <X className="w-8 h-8 text-red-500 mr-3" />
                <div>
                  <h4 className="text-gray-800 dark:text-gray-200 font-medium">{fileName}</h4>
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    Error uploading file to Snowflake
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadStatus('idle')}
                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>
            Your data will be securely uploaded to Snowflake and automatically converted into tables
            for analysis. Files will be stored at <code>data/uploads/</code> in your Snowflake
            instance.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FileUploadSection;