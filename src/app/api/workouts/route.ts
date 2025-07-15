import { NextRequest, NextResponse } from 'next/server';
import { WorkoutEntry } from '@/app/types/workouts';
import clientPromise from '@/app/utils/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('determined');
    const workouts = await db.collection('workouts').find({}).toArray();

    return NextResponse.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts from MongoDB:', error);
    return NextResponse.json({ error: 'Failed to fetch workouts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const workout: WorkoutEntry = await request.json();

    // Validate required fields
    if (!workout.date || !workout.title) {
      return NextResponse.json(
        { error: 'Date and title are required' },
        { status: 400 }
      );
    }

    // Generate ID if not provided
    if (!workout.id) {
      workout.id = crypto.randomUUID();
    }

    // Set lastUpdated if not provided
    if (!workout.lastUpdated) {
      workout.lastUpdated = Date.now();
    }

    const client = await clientPromise;
    const db = client.db('determined');
    const collection = db.collection('workouts');

    // Check if this is an update to an existing workout
    const existingWorkout = await collection.findOne({ id: workout.id });

    if (existingWorkout) {
      // Update existing workout
      await collection.updateOne(
        { id: workout.id },
        { $set: workout }
      );
    } else {
      // Insert new workout
      await collection.insertOne(workout);
    }

    return NextResponse.json(workout, { status: existingWorkout ? 200 : 201 });
  } catch (error) {
    console.error('Error saving workout to MongoDB:', error);
    return NextResponse.json({ error: 'Failed to save workout' }, { status: 500 });
  }
}
