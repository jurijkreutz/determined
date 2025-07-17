import { NextResponse } from 'next/server';
import { processMissedToDos, isToDoProcessingTime } from '@/app/utils/todoProcessing';

// Process missed todos route - this can be called by a background job or manually
export async function GET(request: Request) {
  try {
    // Check for force parameter to bypass time restrictions (for manual processing)
    const url = new URL(request.url);
    const forceProcess = url.searchParams.get('force') === 'true';

    // Only allow processing at the designated time unless forced
    if (!forceProcess && !isToDoProcessingTime()) {
      return NextResponse.json({
        error: 'Not processing time',
        message: 'Add ?force=true to the URL to process missed todos outside the scheduled window'
      }, { status: 400 });
    }

    // Process missed todos, passing the force parameter
    const result = await processMissedToDos(forceProcess);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing missed todos:', error);
    return NextResponse.json({
      error: 'Failed to process missed todos',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
