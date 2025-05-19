import React from 'react';
import { LineChart, Moon, Sun, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = ({loading}) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const onInstantAnalysis = () => {
    if (location.pathname === "/instant-analysis") {
      navigate("/");
    } else {
      navigate("/instant-analysis");
    }
  };

  return (
    <header className="w-full py-4 px-6 transition-colors duration-300 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <LineChart className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            Phaser
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
        <button
  className={`flex items-center space-x-2 py-2 px-4 rounded-md transition-colors duration-200 ${
    loading
      ? "bg-indigo-400 cursor-not-allowed" // Disabled state
      : "bg-indigo-600 hover:bg-indigo-700 text-white" // Normal state
  }`}
  onClick={onInstantAnalysis}
  disabled={loading} // This actually disables the button functionality
>
  <Zap className="w-4 h-4" />
  {location.pathname === "/instant-analysis" ? (
    <span>Normal Analysis</span>
  ) : (
    <span>Instant Analysis</span>
  )}
</button>
          
          <button
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-700" />
            ) : (
              <Sun className="w-5 h-5 text-gray-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;