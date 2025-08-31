import React, { useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave }) => {
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) {
    return null;
  }
  
  const handleSave = () => {
    if(apiKey.trim()) {
      onSave(apiKey);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" aria-modal="true" role="dialog">
      <div className="w-full max-w-md p-6 sm:p-8 bg-gray-800/80 border border-gray-700 rounded-3xl shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Enter Your API Key</h2>
        <p className="text-gray-400 mb-6 text-sm">
          To use this app, please provide your own Google AI API key. Your key is stored only in your browser.
        </p>
        <div className="mb-4">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Paste your Gemini API key here"
            className="block w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
            aria-label="Gemini API Key Input"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!apiKey.trim()}
          className="w-full px-8 py-3 text-base font-bold text-white rounded-full transition-all duration-300 ease-in-out bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save and Continue
        </button>
        <div className="mt-6">
            <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline"
            >
                Don't have a key? Get one from Google AI Studio
            </a>
        </div>
      </div>
    </div>
  );
};
