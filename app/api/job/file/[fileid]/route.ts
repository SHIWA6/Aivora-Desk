import { NextResponse } from 'next/server';

declare global {
  var jobStore: any;
}

// Initialization added to be safe
if (typeof global.jobStore === 'undefined') {
  global.jobStore = {
    lastJobId: 0,
    jobs: {},
    fileStorage: {},
  };
}

// GET /api/job/file/[fileid]
// Worker uses this to download the uploaded Excel/CSV file bytes.
export async function GET(req: Request, { params }: { params: { fileid: string } }) {
  // --- FIX: Await the parameter access to prevent Promise error ---
  const fileId = await params.fileid; 
  // ---------------------------------------
  
  const fileDataUrl = global.jobStore.fileStorage[fileId];

  if (fileDataUrl) {
    // fileDataUrl is a Data URI (e.g., "data:mime/type;base64,DATA")
    
    // Extract only the Base64 data part (remove the data URI prefix)
    const base64Data = fileDataUrl.split(',')[1];
    
    return NextResponse.json({ 
        base64Data: base64Data 
    }, { status: 200 });
  }

  // If file is not found, return 404
  return NextResponse.json({ error: 'File not found' }, { status: 404 });
}