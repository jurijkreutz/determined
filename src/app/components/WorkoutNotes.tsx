'use client';

import { useState, useEffect, useRef } from 'react';
import { WorkoutEntry } from '../types/workouts';

export default function WorkoutNotes() {
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([]);
  const [newWorkoutTitle, setNewWorkoutTitle] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch workouts from MongoDB on component mount
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const response = await fetch('/api/workouts');
        if (response.ok) {
          const data = await response.json();
          // Sort by date (newest first)
          const sortedWorkouts = data.sort((a: WorkoutEntry, b: WorkoutEntry) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setWorkouts(sortedWorkouts);

          // Select the most recent workout if available
          if (sortedWorkouts.length > 0 && !selectedWorkout) {
            setSelectedWorkout(sortedWorkouts[0]);
          }
        } else {
          console.error('Failed to fetch workouts:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching workouts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkouts();
  }, [selectedWorkout]);

  // Handle content changes with debounced auto-save
  const handleContentChange = (content: string) => {
    if (!selectedWorkout) return;

    // Update the selected workout locally for immediate feedback
    const updatedWorkout = { ...selectedWorkout, content, lastUpdated: Date.now() };
    setSelectedWorkout(updatedWorkout);

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout to save after 1 second of inactivity
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);

      try {
        // Update in state
        setWorkouts(prevWorkouts =>
          prevWorkouts.map(w => w.id === updatedWorkout.id ? updatedWorkout : w)
        );

        // Save to MongoDB through API
        const response = await fetch('/api/workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedWorkout),
        });

        if (!response.ok) {
          console.error('Failed to save workout:', await response.text());
        }
      } catch (error) {
        console.error('Error saving workout:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
  };

  // Add a new workout
  const addNewWorkout = async () => {
    if (!newWorkoutTitle.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const newWorkout: WorkoutEntry = {
      id: crypto.randomUUID(),
      date: today,
      title: newWorkoutTitle.trim(),
      content: '',
      lastUpdated: Date.now()
    };

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWorkout),
      });

      if (response.ok) {
        // Add to local state and select it
        setWorkouts([newWorkout, ...workouts]);
        setSelectedWorkout(newWorkout);
        setNewWorkoutTitle('');

        // Focus the content textarea
        setTimeout(() => {
          if (contentRef.current) {
            contentRef.current.focus();
          }
        }, 100);
      } else {
        console.error('Failed to create workout:', await response.text());
      }
    } catch (error) {
      console.error('Error creating workout:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for last updated display
  const formatLastUpdated = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Workout Notes</h2>

        {/* Add new workout form */}
        <div className="flex mb-6">
          <input
            type="text"
            value={newWorkoutTitle}
            onChange={(e) => setNewWorkoutTitle(e.target.value)}
            placeholder="New workout title..."
            className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={addNewWorkout}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r-lg transition duration-200"
          >
            Add
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400">Loading workouts...</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:space-x-4 h-[500px]">
            {/* Workout list */}
            <div className="w-full md:w-1/3 mb-4 md:mb-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 md:pr-4 overflow-y-auto">
              {workouts.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 py-4">No workouts yet. Create your first one!</p>
              ) : (
                <ul className="space-y-2">
                  {workouts.map((workout) => (
                    <li
                      key={workout.id}
                      onClick={() => setSelectedWorkout(workout)}
                      className={`p-3 rounded-lg cursor-pointer ${
                        selectedWorkout?.id === workout.id
                          ? 'bg-blue-100 dark:bg-blue-900'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{workout.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{formatDate(workout.date)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatLastUpdated(workout.lastUpdated)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Workout content */}
            <div className="w-full md:w-2/3 md:pl-4 flex flex-col h-full">
              {selectedWorkout ? (
                <>
                  <div className="mb-2 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedWorkout.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(selectedWorkout.date)}
                      </p>
                    </div>
                    {isSaving && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Saving...</span>
                    )}
                  </div>
                  <textarea
                    ref={contentRef}
                    value={selectedWorkout.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="flex-grow p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white font-mono text-sm resize-none"
                    placeholder="Enter your workout details here..."
                  />
                </>
              ) : (
                <div className="flex-grow flex items-center justify-center text-gray-500 dark:text-gray-400">
                  Select a workout or create a new one to get started
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
