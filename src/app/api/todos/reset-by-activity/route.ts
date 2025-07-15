import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';

/**
 * API handler to reset a To-Do task status when the corresponding activity is deleted
 *
 * This endpoint is called when a user deletes an activity that was created from completing a To-Do
 * It finds the corresponding To-Do by its title and resets its status to "open"
 */
export async function POST(request: NextRequest) {
  try {
    const { title, date } = await request.json();

    if (!title || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Find the To-Do by title and date, and reset its status to "open"
    // We only reset To-Dos that were marked as "done"
    const result = await db.collection('todos').updateOne(
      {
        title,
        date,
        status: 'done'
      },
      {
        $set: {
          status: 'open'
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'No matching To-Do found or it was not marked as done'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'To-Do reset successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error resetting To-Do status:', error);
    return NextResponse.json({ error: 'Failed to reset To-Do status' }, { status: 500 });
  }
}
