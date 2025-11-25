import { NextResponse } from 'next/server';

declare global {
  var jobStore: any;
}

// Initialization logic added for safety
if (typeof global.jobStore === 'undefined') {
  global.jobStore = {
    lastJobId: 0,
    jobs: {},
    fileStorage: {},
  };
}

// POST /api/job/create
// Frontend uses this to initiate a new job, passing file data (Base64) and params.
export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { fileId, fileName, delay, fileContent } = data; // fileContent is Data URL (Base64)

    // 1. Generate new Job ID
    const jobId = ++global.jobStore.lastJobId;

    // 2. Store file (Data URI)
    global.jobStore.fileStorage[fileId] = fileContent;

    // 3. Create the Job record with PENDING status
    const newJob = {
      id: jobId,
      fileId: fileId,
      fileName: fileName,
      delay: delay,
      status: 'PENDING',
      log: [{ message: `Job ${jobId} created. Waiting for local worker to connect...`, level: 'info', timestamp: new Date().toISOString() }],
      summary: 'Awaiting worker execution.',
      updatedFileBase64: null,
      totalPosts: 0,
      postsCompleted: 0,
    };
    
    global.jobStore.jobs[jobId] = newJob;

    // 4. Respond with the new job object
    return NextResponse.json(newJob, { status: 200 });
  
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: 'Internal Server Error during job creation.' }, { status: 500 });
  }
}