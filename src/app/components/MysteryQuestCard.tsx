/**
 * MysteryQuestCard Component
 *
 * This component displays a daily mystery quest card that presents users with
 * a randomly selected challenge that changes each day. Completing these quests
 * awards bonus points.
 *
 * Key features:
 * - Displays a daily random quest based on the current date
 * - Shows difficulty level indicator (🟢, 🟡, 🔴)
 * - Allows users to mark quests as completed to earn points
 * - Features fun animation effects when claiming rewards
 * - Persists completion status in localStorage
 * - Provides option to skip quests that don't interest the user
 */

'use client';

import { useState, useEffect } from 'react';
import { MysteryQuest, getDailyQuest } from '../data/mysteryQuests';
import { useRef } from 'react';

interface MysteryQuestCardProps {
  date: string;
  onQuestCompleted: (points: number) => void;
}

export default function MysteryQuestCard({ date, onQuestCompleted }: MysteryQuestCardProps) {
  const [quest, setQuest] = useState<MysteryQuest | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showQuest, setShowQuest] = useState<boolean>(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get the daily quest on component mount or date change
  useEffect(() => {
    // Check if the quest was already completed today
    const completedStatus = localStorage.getItem(`quest_completed_${date}`);
    if (completedStatus === 'true') {
      setIsCompleted(true);
    } else {
      setIsCompleted(false);
    }

    // Check if the quest was skipped today
    const skippedStatus = localStorage.getItem(`quest_skipped_${date}`);
    if (skippedStatus === 'true') {
      setShowQuest(false);
    } else {
      setShowQuest(true);
      // Set the daily quest
      setQuest(getDailyQuest(date));
    }
  }, [date]);

  // Handle claiming the quest reward
  const handleClaimReward = () => {
    if (quest && !isCompleted && !isAnimating) {
      setIsAnimating(true);

      // Add success animation to the card
      if (cardRef.current) {
        cardRef.current.classList.add('animate-success');
      }

      // After animation completes
      setTimeout(() => {
        // Award points
        onQuestCompleted(quest.points);

        // Mark as completed in local storage
        localStorage.setItem(`quest_completed_${date}`, 'true');

        // Update state
        setIsCompleted(true);
        setIsAnimating(false);
      }, 1500); // Animation duration
    }
  };

  // Handle skipping the quest
  const handleSkipQuest = () => {
    localStorage.setItem(`quest_skipped_${date}`, 'true');
    setShowQuest(false);
  };

  // Don't show anything if no quest or if it was skipped
  if (!quest || !showQuest) {
    return null;
  }

  return (
    <div
      ref={cardRef}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6 relative overflow-hidden
        ${isAnimating ? 'transform transition-transform duration-1000' : ''}
        ${isCompleted ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : ''}
      `}
    >
      {/* Quest Badge */}
      <div className="absolute top-3 right-3 flex items-center">
        <span className="text-xs font-medium mr-1 text-gray-500 dark:text-gray-400">
          +{quest.points}
        </span>
        <span className="text-sm" title={`Difficulty: ${quest.difficulty === '🟢' ? 'Easy' : quest.difficulty === '🟡' ? 'Medium' : 'Hard'}`}>
          {quest.difficulty}
        </span>
      </div>

      <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white pr-14">
        Mystery Quest
      </h3>

      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {quest.text}
      </p>

      {/* Success confetti overlay for animation */}
      {isAnimating && (
        <div className="absolute inset-0 bg-green-100/30 dark:bg-green-900/30 flex items-center justify-center">
          <div className="text-4xl">✨</div>
        </div>
      )}

      <div className="flex justify-between">
        {!isCompleted ? (
          <>
            <button
              onClick={handleClaimReward}
              disabled={isAnimating}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex-grow mr-2 transition
                ${isAnimating ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Claim Reward
            </button>
            <button
              onClick={handleSkipQuest}
              disabled={isAnimating}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Skip
            </button>
          </>
        ) : (
          <div className="text-green-600 dark:text-green-400 font-medium flex items-center">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Completed! (+{quest.points} points)
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes success-animation {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-success {
          animation: success-animation 1.5s ease;
        }
      `}</style>
    </div>
  );
}
