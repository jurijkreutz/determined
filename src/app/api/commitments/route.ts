import { NextRequest, NextResponse } from 'next/server';
import { Commitment } from '@/app/types/commitments';
import { v4 as uuidv4 } from 'uuid';
import clientPromise from '@/app/utils/mongodb';

// GET all commitments
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db('determined');

    const commitments = await db.collection('commitments').find({}).toArray();
    return NextResponse.json(commitments);
  } catch (error) {
    console.error('Error fetching commitments:', error);
    return NextResponse.json({ error: 'Failed to fetch commitments' }, { status: 500 });
  }
}

// POST a new commitment
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.goal || !data.endDate || !data.amount) {
      return NextResponse.json(
        { error: 'Goal, end date, and amount are required' },
        { status: 400 }
      );
    }

    const newCommitment: Commitment = {
      id: uuidv4(), // Generate a unique ID
      goal: data.goal,
      startDate: data.startDate || new Date().toISOString().split('T')[0], // Default to today
      endDate: data.endDate,
      amount: Number(data.amount),
      metric: data.metric || 'points',
      progress: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const client = await clientPromise;
    const db = client.db('determined');

    await db.collection('commitments').insertOne(newCommitment);

    return NextResponse.json(newCommitment);
  } catch (error) {
    console.error('Error creating commitment:', error);
    return NextResponse.json({ error: 'Failed to create commitment' }, { status: 500 });
  }
}

// PUT to update a commitment
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json({ error: 'Commitment ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('determined');

    // Find the commitment to update
    const existingCommitment = await db.collection('commitments').findOne({ id: data.id });

    if (!existingCommitment) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 });
    }

    // Update fields
    const updatedCommitment = {
      ...existingCommitment,
      ...data,
      amount: Number(data.amount) || existingCommitment.amount,
      progress: Number(data.progress) || existingCommitment.progress
    };

    // Save the updated commitment
    await db.collection('commitments').updateOne(
      { id: data.id },
      { $set: updatedCommitment }
    );

    return NextResponse.json(updatedCommitment);
  } catch (error) {
    console.error('Error updating commitment:', error);
    return NextResponse.json({ error: 'Failed to update commitment' }, { status: 500 });
  }
}

// DELETE a commitment
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Commitment ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('determined');

    // Delete the commitment
    const result = await db.collection('commitments').deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting commitment:', error);
    return NextResponse.json({ error: 'Failed to delete commitment' }, { status: 500 });
  }
}
