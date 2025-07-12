'use client';

import { useState, useEffect } from 'react';
import { Commitment } from '../types/commitments';

interface CommitmentCheckerProps {
  onCommitmentExpired: (commitment: Commitment) => void;
  refreshTrigger: number;
}

export default function CommitmentChecker({ onCommitmentExpired, refreshTrigger }: CommitmentCheckerProps) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load already checked IDs from localStorage
    const loadCheckedIds = () => {
      const savedIds = localStorage.getItem('checked_commitment_ids');
      if (savedIds) {
        setCheckedIds(new Set(JSON.parse(savedIds)));
      }
    };

    loadCheckedIds();
  }, []);

  useEffect(() => {
    const checkExpiredCommitments = async () => {
      try {
        const response = await fetch('/api/commitments');

        if (!response.ok) {
          console.error('Failed to fetch commitments for checking');
          return;
        }

        const commitments: Commitment[] = await response.json();
        const now = new Date();

        // Check for expired active commitments that haven't been checked yet
        for (const commitment of commitments) {
          if (
            commitment.isActive &&
            new Date(commitment.endDate) < now &&
            !checkedIds.has(commitment.id)
          ) {
            // Notify about expired commitment
            onCommitmentExpired(commitment);

            // Add to checked set
            const newCheckedIds = new Set(checkedIds);
            newCheckedIds.add(commitment.id);
            setCheckedIds(newCheckedIds);

            // Save to localStorage
            localStorage.setItem('checked_commitment_ids', JSON.stringify([...newCheckedIds]));
          }
        }
      } catch (err) {
        console.error('Error checking expired commitments:', err);
      }
    };

    // Check on initial load and when refresh is triggered
    checkExpiredCommitments();

    // Also set up an interval to check periodically (every hour)
    const intervalId = setInterval(checkExpiredCommitments, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [refreshTrigger, checkedIds, onCommitmentExpired]);

  // This is a utility component that doesn't render anything
  return null;
}
