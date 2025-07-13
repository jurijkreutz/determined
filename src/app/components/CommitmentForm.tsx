/**
 * CommitmentForm Component
 *
 * This component provides a form interface for users to create new commitments/goals.
 * It allows setting a goal description, target end date, and point value for completing
 * the commitment.
 *
 * Key features:
 * - Form for creating goal-based commitments with deadlines
 * - Date validation to ensure end dates are in the future
 * - Input validation for required fields
 * - Feedback via Snackbar component for success/error states
 * - Notifies parent component when a commitment is added via onCommitmentAdded callback
 */

'use client';

import { useState } from 'react';
import Snackbar from './Snackbar';

interface CommitmentFormProps {
  onCommitmentAdded: () => void;
}

export default function CommitmentForm({ onCommitmentAdded }: CommitmentFormProps) {
  const [goal, setGoal] = useState('');
  const [endDate, setEndDate] = useState('');
  const [amount, setAmount] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');

  // Calculate minimum date (today)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Validate inputs
      if (!goal.trim()) {
        setSnackbarMessage('Please enter a goal');
        setSnackbarType('error');
        setSnackbarOpen(true);
        setIsSubmitting(false);
        return;
      }

      if (!endDate) {
        setSnackbarMessage('Please select an end date');
        setSnackbarType('error');
        setSnackbarOpen(true);
        setIsSubmitting(false);
        return;
      }

      // Create commitment data
      const commitmentData = {
        goal,
        endDate: new Date(endDate).toISOString(),
        amount: Number(amount),
      };

      // Send to API
      const response = await fetch('/api/commitments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitmentData),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message
        setSnackbarMessage('Commitment added successfully!');
        setSnackbarType('success');
        setSnackbarOpen(true);

        // Reset the form
        setGoal('');
        setEndDate('');
        setAmount(5);
        onCommitmentAdded();
      } else {
        // Show error message from the server
        setSnackbarMessage(data.error || 'Failed to add commitment');
        setSnackbarType('error');
        setSnackbarOpen(true);
        console.error('Failed to add commitment:', data.error);
      }
    } catch (error) {
      setSnackbarMessage('An error occurred. Please try again.');
      setSnackbarType('error');
      setSnackbarOpen(true);
      console.error('Error adding commitment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Add New Commitment</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Goal
          </label>
          <input
            type="text"
            id="goal"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
            placeholder="E.g., Finish 3 articles, Complete project, etc."
          />
        </div>

        <div className="mb-4">
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deadline
          </label>
          <input
            type="date"
            id="endDate"
            min={minDate}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount (€)
          </label>
          <div className="flex items-center">
            <input
              type="number"
              id="amount"
              min="1"
              max="100"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
          </div>
          <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
            If you don&apos;t complete this commitment by the deadline, you&apos;ll need to donate this amount to charity.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50"
        >
          {isSubmitting ? 'Adding...' : 'Make Commitment'}
        </button>
      </form>

      {/* Add the Snackbar component */}
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        type={snackbarType}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
}
