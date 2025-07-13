import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/utils/mongodb';
import Papa from 'papaparse';

// Helper to deeply stringify objects/arrays in a document
function stringifyDocumentFields(doc: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const key in doc) {
    if (!Object.prototype.hasOwnProperty.call(doc, key)) continue;
    const value = doc[key];
    if (value && typeof value === 'object') {
      result[key] = JSON.stringify(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Helper to parse JSON fields for specific collections
function parseJsonFields(collectionName: string, doc: Record<string, unknown>) {
  // Define which fields need to be parsed for each collection
  const jsonFields: Record<string, string[]> = {
    activities: ['activities', 'activityCounts'],
    // Add more collections/fields here if needed
  };
  const fields = jsonFields[collectionName] || [];
  const result: Record<string, unknown> = { ...doc };
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      try {
        result[field] = JSON.parse(result[field] as string);
      } catch {
        // Leave as string if parsing fails
      }
    }
  }
  return result;
}

// Function to convert MongoDB collection to CSV
async function collectionToCsv(collectionName: string) {
  try {
    const client = await clientPromise;
    const db = client.db('determined');
    const data = await db.collection(collectionName).find({}).toArray();

    // Handle empty collection
    if (data.length === 0) {
      return `# Empty collection: ${collectionName}\n`;
    }

    // Convert to CSV format using papaparse, stringifying objects/arrays
    const csv = Papa.unparse(
      data.map(item => {
        // Remove _id as it's not used
        const rest = { ...item };
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        delete rest._id;
        return stringifyDocumentFields(rest);
      })
    );

    return csv;
  } catch (error) {
    console.error(`Error exporting ${collectionName}:`, error);
    return `# Error exporting ${collectionName}: ${error}\n`;
  }
}

// GET endpoint to download all data as CSV
export async function GET() {
  try {
    // List of collections to backup
    const collections = ['activities', 'weeklyActivityCounts', 'garden', 'settings'];

    // Create a single CSV file with sections for each collection
    let fullBackup = '';

    for (const collection of collections) {
      fullBackup += `# COLLECTION: ${collection}\n`;
      fullBackup += await collectionToCsv(collection);
      fullBackup += '\n\n';
    }

    // Set headers for file download
    const headers = {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="determined_backup_${new Date().toISOString().split('T')[0]}.csv"`
    };

    return new NextResponse(fullBackup, { headers });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 });
  }
}

// POST endpoint to restore data from CSV
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('backupFile') as File;

    if (!file) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 });
    }

    const fileContent = await file.text();

    // Parse the CSV file and extract collections
    const sections = fileContent.split('# COLLECTION:').filter(Boolean);

    const client = await clientPromise;
    const db = client.db('determined');

    // Process each collection section
    for (const section of sections) {
      const lines = section.trim().split('\n');
      const collectionName = lines[0].trim();

      // Skip empty collections or sections
      if (lines.length <= 1 || lines[1].startsWith('# Empty collection')) {
        continue;
      }

      const csvContent = lines.slice(1).join('\n');

      // Parse CSV back to JSON
      const { data } = Papa.parse<Record<string, unknown>>(csvContent, { header: true, dynamicTyping: true });

      if (data.length > 0) {
        // Clear existing collection data
        await db.collection(collectionName).deleteMany({});

        // Insert new data, parsing JSON fields if needed
        const parsedData = data.map((doc) => parseJsonFields(collectionName, doc));
        await db.collection(collectionName).insertMany(parsedData);
      }
    }

    return NextResponse.json({ success: true, message: 'Data restored successfully' });
  } catch (error) {
    console.error('Error restoring backup:', error);
    return NextResponse.json({ error: 'Failed to restore backup' }, { status: 500 });
  }
}
