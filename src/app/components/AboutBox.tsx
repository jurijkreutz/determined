// filepath: /Users/jkreutz/determined/src/app/components/AboutBox.tsx
import React from 'react';

export default function AboutBox() {
  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-8 mb-0 text-center">
      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">About determined</h2>
      <p className="text-gray-700 dark:text-gray-300">
        determined is Jurijs' personal goal tracker and supporter. It helps you manage your activities, commitments, and progress, providing a supportive environment for personal growth and achievement.
      </p>
    </div>
  );
}

