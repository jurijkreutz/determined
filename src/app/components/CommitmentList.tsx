/**
 * CommitmentList Component
 *
 * This component displays a list of the user's active and completed commitments.
 * It allows users to mark commitments as completed or failed, and tracks their progress.
 *
 * Key features:
 * - Fetches and displays all commitments from the database
 * - Groups commitments by status (active vs. completed)
 * - Provides UI for marking commitments as completed or failed
 * - Shows deadline information and countdown for active commitments
 * - Refreshes automatically when commitments are added/updated
 * - Provides feedback via Snackbar component for status changes
 */

'use client';

import { useState, useEffect } from 'react';
import { Commitment } from '../types/commitments';
import Snackbar from './Snackbar';

interface CommitmentListProps {
  refreshTrigger: number;
  onStatusChange: () => void;
}

export default function CommitmentList({ refreshTrigger, onStatusChange }: CommitmentListProps) {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarType, setSnackbarType] = useState<'success' | 'error' | 'info'>('info');

  // Get all active commitments
  useEffect(() => {
    const fetchCommitments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/commitments');

        if (!response.ok) {
          throw new Error('Failed to fetch commitments');
        }

        const data = await response.json();
        // Sort by end date (closest deadline first)
        const sortedCommitments = data.sort((a: Commitment, b: Commitment) =>
          new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
        );

        setCommitments(sortedCommitments);
        setError(null);
      } catch (err) {
        setError('Failed to load commitments. Please try again.');
        console.error('Error fetching commitments:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommitments();
  }, [refreshTrigger]);

  // Format date to display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if commitment is expired (past end date)
  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Due today';
    return diffDays === 1 ? '1 day left' : `${diffDays} days left`;
  };

  // Handle marking a commitment as completed
  const handleComplete = async (id: string) => {
    try {
      const response = await fetch('/api/commitments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isCompleted: true,
          isActive: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update commitment');
      }

      setSnackbarMessage('Commitment completed! Well done!');
      setSnackbarType('success');
      setSnackbarOpen(true);
      onStatusChange();
    } catch (err) {
      setSnackbarMessage('Failed to update commitment. Please try again.');
      setSnackbarType('error');
      setSnackbarOpen(true);
      console.error('Error updating commitment:', err);
    }
  };

  // Handle marking a commitment as failed
  const handleFail = async (id: string) => {
    try {
      const response = await fetch('/api/commitments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          isCompleted: false,
          isActive: false
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update commitment');
      }

      setSnackbarMessage('Commitment marked as failed. Remember to donate the amount to charity.');
      setSnackbarType('info');
      setSnackbarOpen(true);
      onStatusChange();
    } catch (err) {
      setSnackbarMessage('Failed to update commitment. Please try again.');
      setSnackbarType('error');
      setSnackbarOpen(true);
      console.error('Error updating commitment:', err);
    }
  };

  // Filter active commitments
  const activeCommitments = commitments.filter(commitment => commitment.isActive);

  if (loading) {
    return <div className="py-4 text-center text-gray-500 dark:text-gray-400">Loading commitments...</div>;
  }

  if (error) {
    return <div className="py-4 text-center text-red-500">{error}</div>;
  }

  if (activeCommitments.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <p className="text-gray-600 dark:text-gray-400">No active commitments. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeCommitments.map((commitment) => {
        const expired = isExpired(commitment.endDate);
        const daysRemaining = getDaysRemaining(commitment.endDate);

        return (
          <div
            key={commitment.id}
            className={`p-4 rounded-lg shadow-sm border ${
              expired 
                ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800/30' 
                : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'
            }`}
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-white">{commitment.goal}</h3>
                <div className="mt-1 flex flex-col sm:flex-row sm:gap-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Due:</span> {formatDate(commitment.endDate)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium">Amount:</span> €{commitment.amount}
                  </p>
                </div>
                <div className={`text-sm mt-1 font-medium ${
                  expired ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {daysRemaining}
                </div>
              </div>

              <div className="flex gap-2 self-end md:self-center mt-2 md:mt-0">
                <button
                  onClick={() => handleComplete(commitment.id)}
                  className="px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-800/40 rounded-md transition duration-200"
                >
                  Completed
                </button>
                <button
                  onClick={() => handleFail(commitment.id)}
                  className="px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40 rounded-md transition duration-200"
                >
                  Failed
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        message={snackbarMessage}
        type={snackbarType}
        onClose={() => setSnackbarOpen(false)}
      />
    </div>
  );
}
