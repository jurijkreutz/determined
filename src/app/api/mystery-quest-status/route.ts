import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../utils/mongodb';

export interface MysteryQuestStatus {
  date: string;
  completed: boolean;
  skipped: boolean;
}

// GET route to fetch the mystery quest status for a specific date
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db('determined');

    const mysteryQuestStatus = await db
      .collection('mysteryQuestStatus')
      .findOne({ date });

    return NextResponse.json(mysteryQuestStatus || { date, completed: false, skipped: false });
  } catch (error) {
    console.error('Error fetching mystery quest status:', error);
    return NextResponse.json({ error: 'Failed to fetch mystery quest status' }, { status: 500 });
  }
}

// POST route to update the mystery quest status for a specific date
export async function POST(request: NextRequest) {
  try {
    const { date, completed, skipped } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('determined');

    // Upsert the mystery quest status
    const result = await db
      .collection('mysteryQuestStatus')
      .updateOne(
        { date },
        { $set: { completed, skipped } },
        { upsert: true }
      );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error updating mystery quest status:', error);
    return NextResponse.json({ error: 'Failed to update mystery quest status' }, { status: 500 });
  }
}
