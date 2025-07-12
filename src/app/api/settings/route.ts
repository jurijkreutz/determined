import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/utils/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('determined');

    // We'll use a single document with an ID of 'user' to store all settings
    // This is simpler than creating a separate collection for each setting
    const settings = await db.collection('settings').findOne({ id: 'user' });

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({ startDate: '' });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (data.startDate) {
      // Validate that the date is in the correct format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.startDate)) {
        return NextResponse.json(
          { success: false, error: 'Invalid date format' },
          { status: 400 }
        );
      }

      const client = await clientPromise;
      const db = client.db('determined');

      // Update the settings, using upsert to create if it doesn't exist
      await db.collection('settings').updateOne(
        { id: 'user' },
        {
          $set: {
            id: 'user',
            startDate: data.startDate,
            // Add any other settings here
          }
        },
        { upsert: true }
      );

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: 'Start date is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
