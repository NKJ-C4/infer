import React, { useState } from 'react';
import { Play, BookOpen, Video, ArrowRight, PauseCircle } from 'lucide-react';

const TutorialSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'guide'>('video');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: 'Upload your data',
      description: 'Begin by uploading your CSV, Excel, or JSON files to Snowflake using the upload section.'
    },
    {
      title: 'Select your tables',
      description: 'Choose the tables you want to analyze from your Snowflake database.'
    },
    {
      title: 'Ask questions in natural language',
      description: 'Type your questions about your data in plain English, and we\'ll convert them to SQL.'
    },
    {
      title: 'View and export results',
      description: 'See the results as visualizations or data tables, and export them for your presentations.'
    }
  ];

  return (
    <section className="w-full py-10 px-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl transition-colors duration-300 mb-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <BookOpen className="w-6 h-6 mr-3 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            How to Use Phaser
          </h2>
        </div>

        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center ${
              activeTab === 'video'
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Video className="w-4 h-4 mr-2" />
            Video Tutorial
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center ${
              activeTab === 'guide'
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Step-by-Step Guide
          </button>
        </div>

        {activeTab === 'video' && (
          <div className="bg-black rounded-lg overflow-hidden shadow-lg relative aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              {!videoPlaying ? (
                <button
                  onClick={() => setVideoPlaying(true)}
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-200 rounded-full p-4 flex items-center justify-center group"
                >
                  <Play className="w-10 h-10 text-white group-hover:scale-110 transition-transform duration-200" />
                </button>
              ) : (
                <div className="absolute bottom-4 right-4 flex items-center space-x-3">
                  <button
                    onClick={() => setVideoPlaying(false)}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors duration-200 rounded-full p-2"
                  >
                    <PauseCircle className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center text-white">
                {!videoPlaying && (
                  <>
                    <h3 className="text-xl font-semibold mb-2">Phaser Tutorial</h3>
                    <p className="text-white/80 text-sm">
                      Learn how to transform your data analysis with natural language
                    </p>
                  </>
                )}
              </div>
            </div>
            <div
              className="w-full h-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20"
              style={{ opacity: videoPlaying ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
            ></div>
          </div>
        )}

        {activeTab === 'guide' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Getting Started with Phaser
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentStep * 100}%)` }}
                  >
                    {steps.map((step, index) => (
                      <div key={index} className="w-full flex-shrink-0 px-4">
                        <div className="h-48 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/20 rounded-lg mb-6">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center mx-auto mb-4">
                              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                {index + 1}
                              </span>
                            </div>
                            <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
                              {step.title}
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300">
                              {step.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                      currentStep === 0
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                    disabled={currentStep === steps.length - 1}
                    className={`px-3 py-1 rounded text-sm font-medium flex items-center transition-colors duration-200 ${
                      currentStep === steps.length - 1
                        ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300'
                    }`}
                  >
                    Next
                    {currentStep !== steps.length - 1 && (
                      <ArrowRight className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 inline-flex items-center">
            <BookOpen className="w-4 h-4 mr-2" />
            View Full Documentation
          </button>
        </div>
      </div>
    </section>
  );
};

export default TutorialSection;