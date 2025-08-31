import React from 'react';

export const Spinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-700 border-t-pink-500 rounded-full animate-spin"></div>
      <p className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 font-semibold">
        AI is styling your new look...
      </p>
    </div>
  );
};