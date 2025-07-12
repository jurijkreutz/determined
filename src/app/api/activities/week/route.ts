import { NextResponse } from 'next/server';
import clientPromise from '@/app/utils/mongodb';

// Get activities for the past 7 days directly from MongoDB
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('determined');

    const today = new Date();
    const weekActivities: Record<string, Record<string, unknown>> = {};

    // Get activities for the past 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      // Fetch directly from MongoDB
      const dateData = await db.collection('activities').findOne({ date: dateString });

      if (dateData && dateData.activities) {
        weekActivities[dateString] = dateData.activities;
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        weekActivities[dateString] = [];
      }
    }

    return NextResponse.json({ activities: weekActivities });
  } catch (error) {
    console.error('Error fetching weekly activities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch weekly activities' },
      { status: 500 }
    );
  }
}
