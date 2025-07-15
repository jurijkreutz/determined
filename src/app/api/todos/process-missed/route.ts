import { NextResponse } from 'next/server';
import { processMissedToDos, isToDoProcessingTime } from '@/app/utils/todoProcessing';

// Process missed todos route - this would be called by a background job or scheduler
export async function GET() {
  try {
    // Only allow processing at the designated time
    if (!isToDoProcessingTime()) {
      return NextResponse.json({ error: 'Not processing time' }, { status: 400 });
    }

    const result = await processMissedToDos();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing missed todos:', error);
    return NextResponse.json({ error: 'Failed to process missed todos' }, { status: 500 });
  }
}
