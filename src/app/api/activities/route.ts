import { NextRequest, NextResponse } from 'next/server';
import { UserActivity } from '@/app/types/activities';
import { getActivityById, calculateDiminishedPoints } from '@/app/data/predefinedActivities';
import clientPromise from '@/app/utils/mongodb';

// Helper function to get the start of the current week (Monday)
function getStartOfWeek(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Helper function to check if an activity has reached its daily or weekly cap
async function hasReachedCap(activityId: string, date: string): Promise<{ reached: boolean; reason?: string }> {
  const predefinedActivity = getActivityById(activityId);
  if (!predefinedActivity) {
    return { reached: false };
  }

  try {
    const client = await clientPromise;
    const db = client.db('determined');

    // Check daily cap
    if (predefinedActivity.dailyCap !== undefined) {
      const dailyData = await db.collection('activities').findOne({ date });
      const dailyCount = dailyData?.activityCounts?.[activityId] || 0;

      if (dailyCount >= predefinedActivity.dailyCap) {
        return {
          reached: true,
          reason: `You've reached the daily limit of ${predefinedActivity.dailyCap}× for this activity.`
        };
      }
    }

    // Check weekly cap
    if (predefinedActivity.weeklyCap !== undefined) {
      const weekStart = getStartOfWeek(new Date(date));
      const weeklyData = await db.collection('weeklyActivityCounts').findOne({ weekStart });
      const weeklyCount = weeklyData?.[activityId] || 0;

      if (weeklyCount >= predefinedActivity.weeklyCap) {
        return {
          reached: true,
          reason: `You've reached the weekly limit of ${predefinedActivity.weeklyCap}× for this activity.`
        };
      }
    }

    return { reached: false };
  } catch (error) {
    console.error('Error checking activity caps:', error);
    return { reached: false };
  }
}

// Helper function to sync garden data after activity changes
async function syncGardenData(date: string, origin: string) {
  try {
    // Call the garden sync endpoint
    const response = await fetch(`${origin}/api/garden/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ date }),
    });

    if (!response.ok) {
      console.error('Failed to sync garden data:', await response.text());
    }
  } catch (error) {
    console.error('Error syncing garden data:', error);
  }
}

// Get activities for a specific date
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  try {
    const client = await clientPromise;
    const db = client.db('determined');

    // Find or create date data
    const existingData = await db.collection('activities').findOne({ date });

    const dateData = existingData || {
      date,
      activities: [],
      activityCounts: {}
    };

    // If we needed to create a new record, insert it
    if (!existingData) {
      await db.collection('activities').insertOne(dateData);
    }

    return NextResponse.json({
      activities: dateData.activities || [],
      activityCounts: dateData.activityCounts || {}
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// Add a new activity
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { activityId, customName, customPoints } = data;
  const date = new Date().toISOString().split('T')[0];
  const weekStart = getStartOfWeek(new Date(date));

  try {
    const client = await clientPromise;
    const db = client.db('determined');

    // Get current data for this date
    const existingData = await db.collection('activities').findOne({ date });

    const dateData = existingData || {
      date,
      activities: [],
      activityCounts: {}
    };

    // If we needed to create a new record, insert it
    if (!existingData) {
      await db.collection('activities').insertOne(dateData);
    }

    let result;
    // Handle either predefined or custom activity
    if (activityId) {
      // This is a predefined activity
      const predefinedActivity = getActivityById(activityId);

      if (!predefinedActivity) {
        return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 400 });
      }

      // Check if the activity has reached its daily or weekly cap
      const capCheck = await hasReachedCap(activityId, date);
      if (capCheck.reached) {
        return NextResponse.json({
          success: false,
          error: capCheck.reason
        }, { status: 400 });
      }

      // Update the activity count for diminishing returns calculation
      const currentCount = dateData.activityCounts[activityId] || 0;

      // Calculate points with diminishing returns if applicable
      const { points, factor } = calculateDiminishedPoints(predefinedActivity, currentCount);

      const newActivity: UserActivity = {
        id: Date.now().toString(),
        activityId: predefinedActivity.id,
        name: predefinedActivity.name,
        category: predefinedActivity.category,
        points: points,
        originalPoints: predefinedActivity.points,
        timestamp: Date.now(),
        diminishingFactor: factor
      };

      // Update daily activities
      await db.collection('activities').updateOne(
        { date },
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          $push: { "activities": newActivity },
          $inc: { [`activityCounts.${activityId}`]: 1 }
        }
      );

      // Update weekly count if needed
      if (predefinedActivity.weeklyCap !== undefined) {
        await db.collection('weeklyActivityCounts').updateOne(
          { weekStart },
          { $inc: { [activityId]: 1 } },
          { upsert: true }
        );
      }

      result = { success: true, activity: newActivity };
    } else {
      // This is a custom activity
      const newActivity: UserActivity = {
        id: Date.now().toString(),
        activityId: 'custom',
        name: customName,
        category: 'Custom',
        points: Number(customPoints),
        originalPoints: Number(customPoints),
        timestamp: Date.now()
      };

      // Update daily activities
      await db.collection('activities').updateOne(
        { date },
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
        { $push: { "activities": newActivity } }
      );

      result = { success: true, activity: newActivity };
    }

    // Sync garden data after adding the activity
    await syncGardenData(date, request.nextUrl.origin);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding activity:', error);
    return NextResponse.json({ error: 'Failed to add activity' }, { status: 500 });
  }
}

// Delete an activity
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const activityId = searchParams.get('id');
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

  if (!activityId) {
    return NextResponse.json({ success: false, error: 'Activity ID is required' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('determined');

    // Get current activities for this date
    const existingData = await db.collection('activities').findOne({ date });

    if (!existingData || !existingData.activities || existingData.activities.length === 0) {
      return NextResponse.json({ success: false, error: 'No activities found for this date' }, { status: 404 });
    }

    // Find the activity to delete
    const activityToDelete = existingData.activities.find((a: UserActivity) => a.id === activityId);

    if (!activityToDelete) {
      return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 });
    }

    // Remove the activity from the array
    const updatedActivities = existingData.activities.filter((a: UserActivity) => a.id !== activityId);

    // Update activity counts if it's a predefined activity
    const updates: Record<string, unknown> = { $set: { activities: updatedActivities } };

    if (activityToDelete.activityId && activityToDelete.activityId !== 'custom') {
      updates.$inc = { [`activityCounts.${activityToDelete.activityId}`]: -1 };
    }

    // Update the database
    await db.collection('activities').updateOne({ date }, updates);

    // If it's a predefined activity with a weekly cap, update the weekly count
    if (activityToDelete.activityId && activityToDelete.activityId !== 'custom') {
      const predefinedActivity = getActivityById(activityToDelete.activityId);

      if (predefinedActivity?.weeklyCap !== undefined) {
        const weekStart = getStartOfWeek(new Date(date));
        await db.collection('weeklyActivityCounts').updateOne(
          { weekStart },
          { $inc: { [activityToDelete.activityId]: -1 } }
        );
      }
    }

    // Sync garden data after deleting the activity
    await syncGardenData(date, request.nextUrl.origin);

    return NextResponse.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}
