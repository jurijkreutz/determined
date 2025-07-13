import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/utils/mongodb';
import {
  GardenDayData,
  getGardenEmoji,
  hasStreakProtection,
  hasRecoveryBonus,
  RECOVERY_TASK_IDS,
  calculateStreakStatus,
  getViennaDate,
  isMorning
} from '@/app/utils/gardenUtils';
import { UserActivity } from '@/app/types/activities';

// Endpoint to synchronize activity data with garden data
export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('determined');

    // Get activities for the specified date
    const activitiesData = await db.collection('activities').findOne({ date });

    // For today with 0 points, handle differently
    const isToday = date === getViennaDate();
    const isMorningTime = isMorning();

    // Special handling for today with no activities but it's morning
    if (isToday && isMorningTime && (!activitiesData || !activitiesData.activities || activitiesData.activities.length === 0)) {
      // Get previous day's data to calculate streak
      const previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() - 1);
      const prevDateStr = previousDate.toISOString().split('T')[0];
      const previousDay = await db.collection('garden').findOne({ date: prevDateStr });

      // Create current day data object with 0 points
      const currentData: GardenDayData = {
        date,
        points: 0,
        emoji: getGardenEmoji(0),
        recoveryTaskCount: 0,
        hasStreakProtection: false,
        hasBonus: false
      };

      // Create a garden store with previous days' data
      const gardenStore: Record<string, GardenDayData> = {};
      if (previousDay) {
        gardenStore[prevDateStr] = previousDay as unknown as GardenDayData;
      }

      // Calculate streak status with morning awareness
      const { streakCount, streakStatus, lowPointDaysInARow, streakMessage } = calculateStreakStatus(
        currentData,
        gardenStore
      );

      // Create morning garden data
      const gardenData: GardenDayData = {
        date,
        points: 0,
        emoji: getGardenEmoji(0),
        recoveryTaskCount: 0,
        streakCount,
        streakStatus,
        lowPointDaysInARow,
        streakMessage,
        hasStreakProtection: false,
        hasBonus: false
      };

      // Save to database
      const existingGardenDay = await db.collection('garden').findOne({ date });

      if (existingGardenDay) {
        // Update existing record
        await db.collection('garden').updateOne(
          { date },
          { $set: gardenData }
        );
      } else {
        // Create new record
        await db.collection('garden').insertOne(gardenData);
      }

      return NextResponse.json(gardenData);
    }

    // Regular flow for dates with activities
    if (!activitiesData || !activitiesData.activities || activitiesData.activities.length === 0) {
      return NextResponse.json({ error: 'No activities found for this date' }, { status: 404 });
    }

    // Calculate total points
    const totalPoints = activitiesData.activities.reduce(
      (sum: number, activity: UserActivity) => sum + (activity.points || 0),
      0
    );

    // Count recovery tasks
    const recoveryTaskCount = activitiesData.activities.filter(
      (a: UserActivity) => a.activityId && RECOVERY_TASK_IDS.includes(a.activityId)
    ).length;

    // Get the emoji for the day based on points
    const dayEmoji = getGardenEmoji(totalPoints);

    const hasProtection = hasStreakProtection(dayEmoji, recoveryTaskCount);
    const hasBonus = hasRecoveryBonus(dayEmoji, recoveryTaskCount);

    // Get previous day's data to calculate streak
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);
    const prevDateStr = previousDate.toISOString().split('T')[0];

    const previousDay = await db.collection('garden').findOne({ date: prevDateStr });

    // Create current day data object
    const currentData: GardenDayData = {
      date,
      points: totalPoints,
      emoji: dayEmoji,
      recoveryTaskCount,
      hasStreakProtection: hasProtection,
      hasBonus
    };

    // Create a garden store with previous days' data
    const gardenStore: Record<string, GardenDayData> = {};
    if (previousDay) {
      gardenStore[prevDateStr] = previousDay as unknown as GardenDayData;
    }

    // Calculate streak status
    const { streakCount, streakStatus, lowPointDaysInARow, streakMessage } = calculateStreakStatus(
      currentData,
      gardenStore
    );

    // Create or update garden data
    const gardenData: GardenDayData = {
      date,
      points: totalPoints,
      emoji: dayEmoji,
      recoveryTaskCount,
      streakCount,
      streakStatus,
      lowPointDaysInARow,
      streakMessage,
      hasStreakProtection: hasProtection,
      hasBonus: hasBonus
    };

    // Save to database
    const existingGardenDay = await db.collection('garden').findOne({ date });

    if (existingGardenDay) {
      // Update existing record
      await db.collection('garden').updateOne(
        { date },
        { $set: gardenData }
      );
    } else {
      // Create new record
      await db.collection('garden').insertOne(gardenData);
    }

    return NextResponse.json(gardenData);
  } catch (error) {
    console.error('Error syncing garden data:', error);
    return NextResponse.json({ error: 'Failed to sync garden data' }, { status: 500 });
  }
}

// Endpoint to regenerate all garden data from activities
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('determined');

    // Get all activity dates
    const activityDates = await db.collection('activities').find({}, { projection: { date: 1 } }).toArray();

    if (!activityDates || activityDates.length === 0) {
      return NextResponse.json({ message: 'No activities found to sync' });
    }

    const results = [];

    // Process each date sequentially
    for (const dateDoc of activityDates) {
      const date = dateDoc.date;

      // Call the sync logic for each date
      const response = await fetch(`${request.nextUrl.origin}/api/garden/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });

      if (response.ok) {
        const result = await response.json();
        results.push({ date, success: true, data: result });
      } else {
        results.push({ date, success: false });
      }
    }

    return NextResponse.json({
      message: `Synced ${results.filter(r => r.success).length} of ${results.length} days`,
      results
    });
  } catch (error) {
    console.error('Error syncing all garden data:', error);
    return NextResponse.json({ error: 'Failed to sync garden data' }, { status: 500 });
  }
}
