import { NextRequest, NextResponse } from 'next/server';
import {
  GardenDayData,
  getGardenEmoji,
  hasStreakProtection,
  hasRecoveryBonus,
  calculateStreakStatus,
  isProductiveDay,
  RECOVERY_TASK_IDS
} from '@/app/utils/gardenUtils';
import clientPromise from '@/app/utils/mongodb';

// Get garden data for a specific date or range
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('determined');

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');
    const range = searchParams.get('range');

    if (date) {
      // Return data for a single date
      const gardenData = await db.collection('garden').findOne({ date });
      return NextResponse.json(gardenData || null);
    } else if (range === 'month') {
      // Get the year and month from the query
      const year = searchParams.get('year');
      const month = searchParams.get('month');

      if (!year || !month) {
        return NextResponse.json({ error: 'Year and month are required for month range' }, { status: 400 });
      }

      // Create date range for the month
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;

      // Find all garden data for the month
      const monthData = await db.collection('garden')
        .find({
          date: {
            $gte: startDate,
            $lte: endDate
          }
        })
        .toArray();

      // Convert array to object with dates as keys
      const monthObject: Record<string, GardenDayData> = {};
      monthData.forEach(item => {
        monthObject[item.date] = item as unknown as GardenDayData;
      });

      return NextResponse.json(monthObject);
    }

    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching garden data:', error);
    return NextResponse.json({ error: 'Failed to fetch garden data' }, { status: 500 });
  }
}

// Update garden data for a specific date
export async function POST(request: NextRequest) {
  try {
    const { date, activities, points, emoji, streakProtection, recoveryBonus } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('determined');

    // Check if we already have data for this date
    const gardenDay = await db.collection('garden').findOne({ date });

    // Process activities to determine garden status
    const totalPoints = points || 0;

    // Count recovery tasks in activities
    const recoveryTaskCount = Array.isArray(activities) ?
      activities.filter(a => a.activityId && RECOVERY_TASK_IDS.includes(a.activityId)).length : 0;

    // Get emoji for the day based on points
    const dayEmoji = emoji || getGardenEmoji(totalPoints);

    const hasProtection = streakProtection || hasStreakProtection(dayEmoji, recoveryTaskCount);
    const hasBonus = recoveryBonus || hasRecoveryBonus(dayEmoji, recoveryTaskCount);
    isProductiveDay(totalPoints);
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
    const { streakCount: streakDays, streakStatus: streakActive, streakMessage } = calculateStreakStatus(
      currentData,
      gardenStore
    );

    // Create or update garden data
    const gardenData: GardenDayData = {
      date,
      points: totalPoints,
      emoji: dayEmoji,
      recoveryTaskCount,
      streakCount: streakDays,
      streakStatus: streakActive,
      streakMessage, // Include the streak message
      hasStreakProtection: hasProtection,
      hasBonus: hasBonus
    };

    // Save to database
    if (gardenDay) {
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
    console.error('Error updating garden data:', error);
    return NextResponse.json({ error: 'Failed to update garden data' }, { status: 500 });
  }
}
