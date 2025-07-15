/**
 * DateSelector Component
 *
 * A reusable component that allows users to select a date with a calendar UI.
 * It displays the current selected date and provides a button to open a date picker.
 *
 * Key features:
 * - Displays selected date in a user-friendly format
 * - Provides intuitive date picker UI
 * - Supports date range limitations (e.g., preventing future dates)
 * - Supports custom date change handlers
 * - Shows visual indicators for the current date
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';

interface DateSelectorProps {
  selectedDate: string; // ISO date string (YYYY-MM-DD)
  onDateChange: (date: string) => void;
  maxDate?: string; // Optional maximum date (default: today)
  minDate?: string; // Optional minimum date
  label?: string; // Optional label for the date selector
}

export default function DateSelector({
  selectedDate,
  onDateChange,
  maxDate = new Date().toISOString().split('T')[0],
  minDate,
  label = 'Date:'
}: DateSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format the date for display
  const formattedDate = selectedDate ?
    format(new Date(selectedDate), 'EEEE, MMMM d, yyyy') :
    'Select date';

  // Handle date change from the date picker
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) {
      onDateChange(newDate);
      setIsCalendarOpen(false);
    }
  };

  // Handle clicks outside the date picker to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Open the date picker when the calendar button is clicked
  const handleCalendarClick = () => {
    setIsCalendarOpen(!isCalendarOpen);
    // Focus the input when opening
    if (!isCalendarOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.showPicker();
      }, 10);
    }
  };

  // Check if the selected date is today
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="relative" ref={datePickerRef}>
      <div className="flex items-center mb-2">
        {label && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
            {label}
          </span>
        )}
        <button
          type="button"
          onClick={handleCalendarClick}
          className={`flex items-center px-3 py-2 text-sm rounded-md border ${
            isToday 
              ? 'border-green-300 bg-green-50 text-green-700 dark:border-green-600 dark:bg-green-900/30 dark:text-green-300' 
              : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
          } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
          aria-label="Select date"
        >
          <span className="mr-2">{formattedDate}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>

        {/* Today button */}
        {!isToday && (
          <button
            type="button"
            onClick={() => onDateChange(new Date().toISOString().split('T')[0])}
            className="ml-2 px-2 py-1 text-xs rounded border border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors"
          >
            Today
          </button>
        )}
      </div>

      {isCalendarOpen && (
        <div className="absolute z-10 mt-1 p-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-300 dark:border-gray-600">
          <input
            ref={inputRef}
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            max={maxDate}
            min={minDate}
            className="form-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )}
    </div>
  );
}
