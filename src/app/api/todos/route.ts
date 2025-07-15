import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/utils/mongodb';
import { getViennaDate } from '@/app/utils/gardenUtils';
import { ToDo } from '@/app/types/todos';

// GET /api/todos - Get all todos for a date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || getViennaDate();

    const { db } = await connectToDatabase();
    const todos = await db.collection('todos').find({ date }).sort({ createdAt: 1 }).toArray();

    return NextResponse.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
  try {
    const todo: ToDo = await request.json();
    const { db } = await connectToDatabase();

    // Check if we already have 5 todos for this date
    const existingTodos = await db.collection('todos').find({ date: todo.date }).toArray();
    if (existingTodos.length >= 5) {
      return NextResponse.json({ error: 'Maximum 5 todos per day' }, { status: 400 });
    }

    // Insert the new todo
    await db.collection('todos').insertOne(todo);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
