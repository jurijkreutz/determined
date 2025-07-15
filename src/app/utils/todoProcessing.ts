/**
 * Process Missed To-Dos Job
 *
 * This background job runs at 00:05 Vienna time to:
 * 1. Mark any "open" To-Dos from the previous day as "missed"
 * 2. Apply penalties (-20% of task's point value)
 * 3. Recalculate the garden tile for the affected day
 */

import { connectToDatabase } from "@/app/utils/mongodb";

// Check if it's the right time to process missed To-Dos (00:05 Vienna time)
export function isToDoProcessingTime(): boolean {
  const now = new Date();
  // Vienna is UTC+2
  const viennaHour = (now.getUTCHours() + 2) % 24;
  const viennaMinute = now.getUTCMinutes();

  // Return true if it's between 00:05 AM and 00:10 AM Vienna time
  return viennaHour === 0 && viennaMinute >= 5 && viennaMinute < 10;
}

// Process missed To-Dos from the previous day
export async function processMissedToDos() {
  try {
    const { db } = await connectToDatabase();

    // Get yesterday's date in YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Find all open To-Dos from yesterday
    const missedToDos = await db
      .collection('todos')
      .find({ date: yesterdayStr, status: 'open' })
      .toArray();

    if (missedToDos.length === 0) {
      return { processed: 0 };
    }

    // Calculate total penalty points
    let totalPenalty = 0;

    // Process each missed To-Do
    for (const todo of missedToDos) {
      // Calculate penalty (-20% of the task's point value)
      const penalty = Math.ceil(todo.points * 0.2);
      totalPenalty += penalty;

      // Update the To-Do status to 'missed'
      await db.collection('todos').updateOne(
        { id: todo.id },
        { $set: { status: 'missed' } }
      );
    }

    // Apply penalty to the garden data for yesterday
    if (totalPenalty > 0) {
      const gardenData = await db
        .collection('garden')
        .findOne({ date: yesterdayStr });

      if (gardenData) {
        // Calculate new points (don't go below 0)
        const newPoints = Math.max(0, gardenData.points - totalPenalty);

        // Update garden data with new points and recalculated emoji
        await db.collection('garden').updateOne(
          { date: yesterdayStr },
          {
            $set: {
              points: newPoints,
              // Note: The garden API endpoint will recalculate the emoji when it next syncs
            }
          }
        );
      }
    }

    return {
      processed: missedToDos.length,
      penaltyApplied: totalPenalty
    };
  } catch (error) {
    console.error('Error processing missed To-Dos:', error);
    return { error: 'Failed to process missed To-Dos' };
  }
}
