'use client';

import { useState } from "react";
import ActivityForm from "./components/ActivityForm";
import ActivityList from "./components/ActivityList";
import DailySuggestionSlots from "./components/DailySuggestionSlots";
import MonthCalendar from "./components/MonthCalendar";
import StreakDisplay from "./components/StreakDisplay";
import MysteryQuestCard from "./components/MysteryQuestCard";
import WorkoutNotes from "./components/WorkoutNotes";
import ToDoList from "./components/ToDoList";
import Link from "next/link";
import AboutBox from "./components/AboutBox";

export default function Home() {
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  const handleActivityAdded = () => {
    // Trigger a refresh of the activity list
    setRefreshTrigger(prev => prev + 1);
  };

  const handlePointsUpdate = (points: number) => {
    setTotalPoints(points);
  };

  const handleDateChange = (date: string) => {
    setCurrentDate(date);
  };

  // Handle completed mystery quests
  const handleQuestCompleted = async (points: number, questName: string) => {
    try {
      // Add the quest completion as a custom activity
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customName: `Mystery Quest: ${questName}`,
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

        {/* Today's To-Dos */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">To-Do List</h2>
          <ToDoList onPointsChange={(points, todoTitle) => {
            // Add custom activity for To-Do points with the specific to-do title
            if (points !== 0 && todoTitle) {
              fetch('/api/activities', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customName: points > 0 ? `To-Do: ${todoTitle}` : `Snoozed To-Do: ${todoTitle}`,
                  customPoints: points
                }),
              }).then(() => {
                // Refresh the activity list
                setRefreshTrigger(prev => prev + 1);
              });
            }
          }} />
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
            <ActivityForm
              onActivityAdded={handleActivityAdded}
              date={currentDate}
              onDateChange={handleDateChange}
            />
          </div>

          <div className="w-full md:w-1/2">
            <ActivityList
              date={currentDate}
              refreshTrigger={refreshTrigger}
              onPointsUpdate={handlePointsUpdate}
            />
          </div>
        </div>

        {/* Workout Notes */}
        <div className="mt-8">
          <WorkoutNotes />
        </div>
      </main>
      <AboutBox />
    </div>
  );
}
