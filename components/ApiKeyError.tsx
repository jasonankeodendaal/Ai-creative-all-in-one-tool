import React from 'react';
import WarningIcon from './icons/WarningIcon.tsx';

const ApiKeyError: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
    <div className="max-w-2xl w-full text-center p-8 bg-gray-800 rounded-lg shadow-2xl border border-red-500/50">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-900">
        <WarningIcon className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="mt-6 text-2xl font-extrabold text-red-400">Configuration Error</h2>
      <p className="mt-4 text-lg text-gray-300">
        The application cannot connect to the AI service.
      </p>
      <div className="mt-6 text-left bg-gray-900 p-4 rounded-md border border-gray-700">
        <p className="text-md font-semibold text-gray-200">Action Required:</p>
        <p className="mt-2 text-gray-400">
          The <code className="bg-gray-700 text-yellow-400 px-1 py-0.5 rounded-sm text-sm font-mono">API_KEY</code> environment variable has not been set for this deployment.
        </p>
        <p className="mt-3 text-gray-400">
          Please go to your <strong>deployment project settings</strong>, navigate to the <strong>Environment Variables</strong> section, and add a variable named <code className="bg-gray-700 text-yellow-400 px-1 py-0.5 rounded-sm text-sm font-mono">API_KEY</code> with your valid Google Gemini API key.
        </p>
      </div>
       <p className="mt-6 text-sm text-gray-500">
        After adding the key, you must create a new deployment for the changes to take effect.
      </p>
    </div>
  </div>
);

export default ApiKeyError;