import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';

type Params = { params: { id: string } }

// Handle individual todo operations by ID
export async function PUT(
  request: NextRequest,
  params: Params
) {
  try {
    const id = params.params.id;
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

// DELETE - Delete a todo
export async function DELETE(
  request: NextRequest,
  params: Params
) {
  try {
    const id = params.params.id;

    const { db } = await connectToDatabase();

    // Delete the todo
    await db.collection('todos').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
