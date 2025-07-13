'use client';

import { useState } from "react";
import ActivityForm from "./components/ActivityForm";
import ActivityList from "./components/ActivityList";
import DailySuggestionSlots from "./components/DailySuggestionSlots";
import MonthCalendar from "./components/MonthCalendar";
import StreakDisplay from "./components/StreakDisplay";
import MysteryQuestCard from "./components/MysteryQuestCard";
import Link from "next/link";
import CommitmentForm from "./components/CommitmentForm";
import CommitmentList from "./components/CommitmentList";
import CommitmentChecker from "./components/CommitmentChecker";
import { Commitment } from "./types/commitments";
import AboutBox from "./components/AboutBox";

export default function Home() {
  const [currentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [commitmentRefreshTrigger, setCommitmentRefreshTrigger] = useState<number>(0);
  const [expiredCommitment, setExpiredCommitment] = useState<Commitment | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);

  const handleActivityAdded = () => {
    // Trigger a refresh of the activity list
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePointsUpdate = (points: number) => {
    setTotalPoints(points);
  };

  // Handle completed mystery quests
  const handleQuestCompleted = async (points: number) => {
    try {
      // Add the quest completion as a custom activity
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customName: 'Mystery Quest Completed',
          customPoints: points
        }),
      });

      if (response.ok) {
        // Refresh the activity list to include the new points
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to add quest points:', error);
    }
  };

  // Handle commitment added
  const handleCommitmentAdded = () => {
    setCommitmentRefreshTrigger(prev => prev + 1);
  };

  // Handle commitment status change
  const handleCommitmentStatusChange = () => {
    setCommitmentRefreshTrigger(prev => prev + 1);
  };

  // Handle expired commitment notification
  const handleExpiredCommitment = (commitment: Commitment) => {
    setExpiredCommitment(commitment);
    setShowExpiredModal(true);
  };

  // Handle marking an expired commitment as complete
  const handleExpiredCommitmentComplete = async () => {
    if (!expiredCommitment) return;

    try {
      const response = await fetch('/api/commitments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: expiredCommitment.id,
          isCompleted: true,
          isActive: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update commitment');
      }

      setShowExpiredModal(false);
      setCommitmentRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to update expired commitment:', error);
    }
  };

  // Handle marking an expired commitment as failed
  const handleExpiredCommitmentFailed = async () => {
    if (!expiredCommitment) return;

    try {
      const response = await fetch('/api/commitments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: expiredCommitment.id,
          isCompleted: false,
          isActive: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update commitment');
      }

      setShowExpiredModal(false);
      setCommitmentRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to update expired commitment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">determined</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {new Date(currentDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              <Link
                href="/settings"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mystery Quest */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Daily Quest</h2>
          <MysteryQuestCard date={currentDate} onQuestCompleted={handleQuestCompleted} />
        </div>

        {/* Daily Suggestion Slots */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Today&apos;s Priorities</h2>
          <DailySuggestionSlots onActivityAdded={handleActivityAdded} />
        </div>

        {/* Month Calendar with Garden Progress */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Your Garden Progress</h2>
          {/* Display streak information */}
          <StreakDisplay date={currentDate} refreshTrigger={refreshTrigger} />
          <MonthCalendar
            currentDayPoints={totalPoints}
            refreshTrigger={refreshTrigger}
          />
        </div>

        <div className="flex flex-col md:flex-row md:space-x-8 space-y-6 md:space-y-0">
          <div className="w-full md:w-1/2">
            <ActivityForm onActivityAdded={handleActivityAdded} />
          </div>

          <div className="w-full md:w-1/2">
            <ActivityList
              date={currentDate}
              refreshTrigger={refreshTrigger}
              onPointsUpdate={handlePointsUpdate}
            />
          </div>
        </div>

        {/* Commitments Section */}
        <div className="mt-12 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">My Commitments</h2>

          <div className="flex flex-col md:flex-row md:space-x-4 space-y-3 md:space-y-0">
            <div className="w-full md:w-1/2">
              <CommitmentForm onCommitmentAdded={handleCommitmentAdded} />
            </div>

            <div className="w-full md:w-1/2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 w-full">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Active Commitments</h3>
                <CommitmentList
                  refreshTrigger={commitmentRefreshTrigger}
                  onStatusChange={handleCommitmentStatusChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Commitment Checker - Invisible component that checks for expired commitments */}
        <CommitmentChecker
          onCommitmentExpired={handleExpiredCommitment}
          refreshTrigger={commitmentRefreshTrigger}
        />

        {/* Expired Commitment Modal */}
        {showExpiredModal && expiredCommitment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 mx-auto">
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Commitment Deadline Reached</h3>

              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                <p className="text-gray-800 dark:text-gray-200 mb-2">
                  Your commitment has reached its deadline:
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {expiredCommitment.goal}
                </p>
                <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                  Amount: €{expiredCommitment.amount}
                </p>
              </div>

              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Did you complete this commitment?
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExpiredCommitmentComplete}
                  className="w-full sm:w-1/2 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Yes, I did it!
                </button>
                <button
                  onClick={handleExpiredCommitmentFailed}
                  className="w-full sm:w-1/2 py-2 px-4 border border-red-300 text-red-600 dark:text-red-400 dark:border-red-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  No, I&apos;ll donate €{expiredCommitment.amount}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mystery Quest Card - Uncomment when ready to use */}
        {/* <div className="mt-8">
          <MysteryQuestCard />
        </div> */}
      </main>
      <AboutBox />
    </div>
  );
}
