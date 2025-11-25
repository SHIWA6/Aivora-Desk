import { NextResponse } from 'next/server';

declare global {
  var jobStore: any;
}

// Initialization logic added here to prevent 500 error
if (typeof global.jobStore === 'undefined') {
  global.jobStore = {
    lastJobId: 0,
    jobs: {},
    fileStorage: {},
  };
}

// POST /api/job/log
export async function POST(req: Request) {
  const data = await req.json();
  const { jobId, message, level, timestamp } = data;
  const id = parseInt(jobId);

  if (global.jobStore.jobs[id]) {
    global.jobStore.jobs[id].log.push({ message, level, timestamp });
    
    // Update progress counter
    if (level === 'progress') {
        const match = message.match(/Progress: (\d+)\/(\d+)/);
        if (match) {
            global.jobStore.jobs[id].postsCompleted = parseInt(match[1]);
            global.jobStore.jobs[id].totalPosts = parseInt(match[2]);
        }
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // If job is not found, return 404
  return NextResponse.json({ error: 'Job not found' }, { status: 404 });
}