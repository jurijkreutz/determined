/**
 * Process Missed To-Dos Job
 *
 * This background job runs at 00:05 Vienna time to:
 * 1. Mark any "open" To-Dos from the previous day as "missed"
 * 2. Apply penalties (-20% of task's point value)
 * 3. Recalculate the garden tile for the affected day
 */

import { connectToDatabase } from "@/app/utils/mongodb";
import { getViennaDate } from "@/app/utils/gardenUtils";

// Check if it's the right time to process missed To-Dos
export function isToDoProcessingTime(): boolean {
  const now = new Date();
  // Vienna is UTC+2
  const viennaHour = (now.getUTCHours() + 2) % 24;
  const viennaMinute = now.getUTCMinutes();

  // Return true if it's between 00:00 AM and 00:30 AM Vienna time
  // Extended window to increase chance of execution
  return viennaHour === 0 && viennaMinute >= 0 && viennaMinute < 30;
}

// Get yesterday's date in YYYY-MM-DD format, using Vienna timezone
function getYesterdayDateString(): string {
  const viennaDate = getViennaDate();
  const yesterday = new Date(viennaDate);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

// Process missed To-Dos from the previous day
export async function processMissedToDos() {
  try {
    const { db } = await connectToDatabase();

    // Get yesterday's date in YYYY-MM-DD format
    const yesterdayStr = getYesterdayDateString();

    console.log(`Processing missed todos for: ${yesterdayStr}`);

    // Find all open To-Dos from yesterday
    const missedToDos = await db
      .collection('todos')
      .find({ date: yesterdayStr, status: 'open' })
      .toArray();

    console.log(`Found ${missedToDos.length} open todos to process`);

    if (missedToDos.length === 0) {
      return { processed: 0, date: yesterdayStr };
    }

    // Calculate total penalty points
    let totalPenalty = 0;
    const missedTodoDetails = [];

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

      missedTodoDetails.push({
        title: todo.title,
        points: todo.points,
        penalty: penalty
      });

      console.log(`Marked todo "${todo.title}" as missed, penalty: ${penalty} points`);
    }

    // Apply penalty to the garden data for yesterday
    if (totalPenalty > 0) {
      const gardenData = await db
        .collection('garden')
        .findOne({ date: yesterdayStr });

      if (gardenData) {
        // Calculate new points (don't go below 0)
        const newPoints = Math.max(0, gardenData.points - totalPenalty);

        console.log(`Applying penalty to garden: ${gardenData.points} -> ${newPoints} points`);

        // Update garden data with new points and recalculated emoji
        await db.collection('garden').updateOne(
          { date: yesterdayStr },
          {
            $set: {
              points: newPoints,
              missedTodos: missedTodoDetails, // Store missed todo details for notification
              hasPenalty: true // Flag to show notification
            }
          }
        );
      } else {
        console.log(`No garden data found for ${yesterdayStr}`);
      }
    }

    return {
      processed: missedToDos.length,
      penaltyApplied: totalPenalty,
      date: yesterdayStr,
      missedTodos: missedTodoDetails
    };
  } catch (error) {
    console.error('Error processing missed To-Dos:', error);
    return { error: 'Failed to process missed To-Dos', details: error };
  }
}
