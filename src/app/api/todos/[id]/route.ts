import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';

/**
 * PUT handler for updating a specific To-Do by ID
 *
 * This route handles updating a To-Do task, including changing its status (open, done, snoozed, missed)
 */
export async function PUT(request: NextRequest) {
  try {
    // Extract ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const updatedTodo = await request.json();

    console.log('Updating todo:', id, updatedTodo);

    const { db } = await connectToDatabase();

    // Update the todo
    const result = await db.collection('todos').updateOne(
      { id },
      { $set: updatedTodo }
    );

    console.log('Update result:', result);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

/**
 * DELETE handler for removing a specific To-Do by ID
 *
 * This route handles deleting a To-Do task from the database
 */
export async function DELETE(request: NextRequest) {
  try {
    // Extract ID from the URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    const { db } = await connectToDatabase();

    // Delete the todo
    await db.collection('todos').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
