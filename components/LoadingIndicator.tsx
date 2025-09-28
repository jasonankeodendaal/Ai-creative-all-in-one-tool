
import React, { useState, useEffect } from 'react';
import SparklesIcon from './icons/SparklesIcon';

const loadingMessages = [
  'Warming up the pixels...',
  'Choreographing the animation...',
  'Mixing a vibrant color palette...',
  'Adding the "wow" factor...',
  'Rendering the pop-up effects...',
  'Syncing the visual rhythm...',
  'Almost there, preparing the final cut...',
  'Finalizing your masterpiece...',
];

const LoadingIndicator: React.FC = () => {
  const [message, setMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessage((prevMessage) => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800 bg-opacity-50 rounded-lg">
      <div className="relative w-20 h-20">
        <SparklesIcon className="absolute inset-0 w-full h-full text-purple-400 animate-spin-slow" />
        <div className="absolute inset-2 w-16 h-16 border-4 border-t-pink-500 border-r-pink-500 border-b-cyan-500 border-l-cyan-500 rounded-full animate-spin"></div>
      </div>
      <h3 className="mt-6 text-xl font-semibold text-gray-200">Generating Your Video Ad</h3>
      <p className="mt-2 text-gray-400 transition-opacity duration-500">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
