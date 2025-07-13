/**
 * BackupRestore Component
 *
 * Provides functionality for users to backup their data as CSV and restore from CSV.
 *
 * Key features:
 * - Download all data as a CSV file
 * - Restore data from a previously created CSV backup
 * - Shows status notifications for backup/restore operations
 */
import { useState } from 'react';

const BackupRestore = () => {
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle downloading backup
  const handleDownloadBackup = async () => {
    try {
      setIsProcessing(true);
      setStatus(null);

      // Call the backup API endpoint
      const response = await fetch('/api/backup', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to generate backup');
      }

      // Get the CSV content
      const csvContent = await response.text();

      // Create a download link
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `determined_backup_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({ message: 'Backup downloaded successfully!', isError: false });
    } catch (error) {
      console.error('Error downloading backup:', error);
      setStatus({ message: 'Failed to download backup. Please try again.', isError: true });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRestoreFile(e.target.files[0]);
      setStatus(null);
    }
  };

  // Handle restore from backup
  const handleRestore = async () => {
    if (!restoreFile) {
      setStatus({ message: 'Please select a backup file first', isError: true });
      return;
    }

    try {
      setIsProcessing(true);
      setStatus(null);

      // Create FormData and append the file
      const formData = new FormData();
      formData.append('backupFile', restoreFile);

      // Call the restore API endpoint
      const response = await fetch('/api/backup', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to restore data');
      }

      setStatus({ message: 'Data restored successfully!', isError: false });
      setRestoreFile(null);

      // Reset the file input
      const fileInput = document.getElementById('backup-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      setStatus({
        message: error instanceof Error ? error.message : 'Failed to restore backup. Please try again.',
        isError: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Backup & Restore</h2>

      {/* Backup Section */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">Backup Your Data</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-3">
          Download all your data as a CSV file. Keep this file safe for future restoration if needed.
        </p>
        <button
          onClick={handleDownloadBackup}
          disabled={isProcessing}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 dark:disabled:bg-gray-700"
        >
          {isProcessing ? 'Processing...' : 'Download Backup'}
        </button>
      </div>

      {/* Restore Section */}
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2 text-gray-800 dark:text-white">Restore From Backup</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-3">
          Restore your data from a previously created backup file. This will replace all current data.
        </p>
        <div className="mb-3">
          <input
            type="file"
            id="backup-file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-300
                      file:mr-4 file:py-2 file:px-4
                      file:rounded file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      dark:file:bg-blue-900 dark:file:text-blue-200
                      hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
          />
        </div>
        <button
          onClick={handleRestore}
          disabled={!restoreFile || isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-700"
        >
          {isProcessing ? 'Restoring...' : 'Restore Backup'}
        </button>
      </div>

      {/* Status Message */}
      {status && (
        <div className={`mt-4 p-3 rounded ${status.isError ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'}`}>
          {status.message}
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-600 dark:text-yellow-200">
        <p className="font-medium">Important:</p>
        <p>Restoring from a backup will replace all your current data. This action cannot be undone.</p>
      </div>
    </div>
  );
};

export default BackupRestore;
