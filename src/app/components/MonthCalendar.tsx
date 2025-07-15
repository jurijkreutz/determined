/**
 * MonthCalendar Component
 *
 * This component displays a calendar view showing daily productivity levels using garden emojis.
 * It can display in either week or month view, allowing users to navigate through time and
 * see their productivity history.
 *
 * Key features:
 * - Displays garden emojis for each day representing productivity levels
 * - Supports both week view and month view with easy toggling
 * - Allows navigation between months/weeks with previous/next buttons
 * - Shows the current month/year and updates the display accordingly
 * - Enables clicking on days to view detailed information via popup
 * - Updates in real-time as new activities are added to the current day
 */

'use client';

import { useState, useEffect } from 'react';
import { GardenDayData } from '../utils/gardenUtils';
import GardenEmoji from './GardenEmoji';
import DayDetailsPopup from './DayDetailsPopup';

interface MonthCalendarProps {
  month?: number; // 0-11, defaults to current month
  year?: number;  // defaults to current year
  currentDayPoints?: number; // Current day's points for live updates
  refreshTrigger?: number; // Trigger refresh when points change
  viewMode?: 'week' | 'month'; // Allow switching between week and month view
  selectedDate?: string; // ISO date string for the currently selected date
}

export default function MonthCalendar({
  month,
  year,
  currentDayPoints = 0,
  refreshTrigger = 0,
  viewMode: initialViewMode = 'week',
  selectedDate: initialSelectedDate
}: MonthCalendarProps) {
  // Use current month/year if not specified
  const now = new Date();

  // State for the currently displayed month and year (for navigation)
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<number>(month !== undefined ? month : now.getMonth());
  const [currentDisplayYear, setCurrentDisplayYear] = useState<number>(year !== undefined ? year : now.getFullYear());

  const [gardenData, setGardenData] = useState<Record<string, GardenDayData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [journeyStartDate, setJourneyStartDate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'week' | 'month'>(initialViewMode);

  // State for the day details popup
  const [selectedDateState, setSelectedDateState] = useState<string | null>(initialSelectedDate || null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Open day details popup
  const openDayDetails = (date: string) => {
    setSelectedDateState(date);
    setIsPopupOpen(true);
  };

  // Close day details popup
  const closeDayDetails = () => {
    setIsPopupOpen(false);
    // Wait for animation to complete before clearing the selected date
    setTimeout(() => {
      setSelectedDateState(null);
    }, 300);
  };

  // Current actual month/year (not for display)
  const currentMonth = month !== undefined ? month : now.getMonth();
  const currentYear = year !== undefined ? year : now.getFullYear();

  // Calculate the first and last day of the month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  // Get today's date to highlight the current day and use live points
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get today's day of week (0-6, where 0 is Sunday)
  const todayDayOfWeek = now.getDay();

  // Calculate the first day of the current week (Sunday)
  const firstDayOfWeek = new Date(now);
  firstDayOfWeek.setDate(now.getDate() - todayDayOfWeek);

  // Calculate the last day of the current week (Saturday)
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

  useEffect(() => {
    const fetchMonthData = async () => {
      setIsLoading(true);
      try {
        // Format the month as a 2-digit string (01-12)
        const monthString = String(currentDisplayMonth + 1).padStart(2, '0');

        // Include year and month parameters in the request
        const response = await fetch(`/api/garden?range=month&year=${currentDisplayYear}&month=${monthString}`);

        if (!response.ok) {
          throw new Error('Failed to fetch garden data');
        }

        const data = await response.json();
        setGardenData(data || {});
      } catch (error) {
        console.error('Error fetching garden data:', error);
        // Even if there's an error, we'll continue with empty data
        // instead of showing an error message
        setGardenData({});
        setError(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonthData();
  }, [currentDisplayMonth, currentDisplayYear, refreshTrigger]);

  // Fetch journey start date from settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.startDate) {
            setJourneyStartDate(data.startDate);
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Generate days of the week (Sunday to Saturday)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar grid data for month view
  const generateMonthCalendarDays = () => {
    const calendarDays = [];

    // Add empty cells for days before the first day of the month
    const firstDayOfMonth = firstDay.getDay();
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      calendarDays.push({
        day,
        date: dateString,
        gardenData: gardenData[dateString]
      });
    }

    return calendarDays;
  };

  // Generate calendar grid data for week view
  const generateWeekCalendarDays = () => {
    const calendarDays = [];

    // Use the selected date if provided, otherwise use today
    const centerDate = selectedDateState ? new Date(selectedDateState) : now;
    const dayOfWeek = centerDate.getDay(); // 0-6, where 0 is Sunday

    // Calculate the first day of the week (Sunday) based on the selected date
    const weekStartDate = new Date(centerDate);
    weekStartDate.setDate(centerDate.getDate() - dayOfWeek);

    // Generate 7 days starting from the calculated Sunday
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);

      const day = date.getDate();
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      calendarDays.push({
        day,
        date: dateString,
        gardenData: gardenData[dateString]
      });
    }

    return calendarDays;
  };

  // Choose the correct calendar days based on view mode
  const calendarDays = viewMode === 'month'
    ? generateMonthCalendarDays()
    : generateWeekCalendarDays();

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: viewMode === 'month' ? 35 : 7 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === 'month' ? 'week' : 'month');
  };

  // Change month by the given offset (positive or negative)
  const changeMonth = (offset: number) => {
    setCurrentDisplayMonth(prevMonth => {
      const newMonth = prevMonth + offset;

      // Wrap around the year if necessary
      if (newMonth < 0) {
        setCurrentDisplayYear(prevYear => prevYear - 1);
        return 11;
      } else if (newMonth > 11) {
        setCurrentDisplayYear(prevYear => prevYear + 1);
        return 0;
      }

      return newMonth;
    });
  };

  // Go to the previous month
  const goToPreviousMonth = () => {
    changeMonth(-1);
  };

  // Go to the next month
  const goToNextMonth = () => {
    changeMonth(1);
  };

  // Calculate the first and last day of the week for the selected date (for display in week view)
  const getWeekRangeForSelectedDate = () => {
    // Use the selected date if provided, otherwise use today
    const centerDate = selectedDateState ? new Date(selectedDateState) : now;
    const dayOfWeek = centerDate.getDay(); // 0-6, where 0 is Sunday

    // Calculate the first day of the week (Sunday)
    const weekStart = new Date(centerDate);
    weekStart.setDate(centerDate.getDate() - dayOfWeek);

    // Calculate the last day of the week (Saturday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return { weekStart, weekEnd };
  };

  // Get the week range based on the selected date
  const { weekStart, weekEnd } = getWeekRangeForSelectedDate();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        {viewMode === 'month' && (
          <button
            onClick={goToPreviousMonth}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            aria-label="Previous month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {viewMode === 'month'
            ? `${new Date(currentDisplayYear, currentDisplayMonth).toLocaleString('default', { month: 'long' })} ${currentDisplayYear}`
            : `Week of ${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`}
        </h2>
        {viewMode === 'month' && (
          <button
            onClick={goToNextMonth}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            aria-label="Next month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <button
          onClick={toggleViewMode}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          {viewMode === 'month' ? 'Week View' : 'Month View'}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Days of the week headers */}
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-medium text-gray-600 dark:text-gray-400 text-sm py-1">
            {day}
          </div>
        ))}

        {/* Calendar cells */}
        {calendarDays.map((dayData, index) => {
          // Skip dates before the journey start date but INCLUDE the start date itself
          if (dayData && journeyStartDate && dayData.date < journeyStartDate) {
            return (
              <div
                key={index}
                className="h-20 p-2 border border-gray-100 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900 opacity-30"
              >
                <div className="text-xs text-gray-400 dark:text-gray-500 absolute top-1 left-2">
                  {dayData.day}
                </div>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={`${viewMode === 'month' ? 'h-20' : 'h-24'} p-2 border border-gray-200 dark:border-gray-700 rounded-md ${
                dayData ? 'bg-gray-50 dark:bg-gray-900' : 'bg-gray-100 dark:bg-gray-800'
              } ${dayData && dayData.date === todayString ? 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700' : ''}
              relative`}
            >
              {dayData && (
                <>
                  <div className="text-xs text-gray-500 dark:text-gray-400 absolute top-1 left-2">
                    {dayData.day}
                  </div>

                  {dayData.gardenData ? (
                    <div className="flex items-center justify-center h-full">
                      <GardenEmoji
                        date={dayData.date}
                        points={dayData.date === todayString ? currentDayPoints : dayData.gardenData.points}
                        className="text-2xl"
                        showPoints={true}
                        onClick={() => openDayDetails(dayData.date)} // Open details on click
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      {/* For today, use current points to determine the emoji */}
                      {dayData.date === todayString ? (
                        <GardenEmoji
                          date={dayData.date}
                          points={currentDayPoints}
                          className="text-2xl"
                          showPoints={true}
                          onClick={() => openDayDetails(dayData.date)} // Open details on click
                        />
                      ) : (
                        <GardenEmoji
                          date={dayData.date}
                          className="text-2xl opacity-70"
                          showPoints={true}
                          onClick={() => openDayDetails(dayData.date)} // Open details on click
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Day details popup */}
      {selectedDateState && (
        <DayDetailsPopup
          date={selectedDateState}
          onClose={closeDayDetails}
          isOpen={isPopupOpen}
        />
      )}
    </div>
  );
}
