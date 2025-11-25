import { NextResponse } from 'next/server';

declare global {
  var jobStore: any;
}

// Ensure jobStore is initialized before accessing it, in case the API endpoint
// is hit before the main React component initializes the global state.
if (typeof global.jobStore === 'undefined') {
  global.jobStore = {
    lastJobId: 0,
    jobs: {},
    fileStorage: {},
  };
}

// GET /api/job/pending
// Worker uses this to check for a new job.
export async function GET() {
  
  // Access global.jobStore to get the shared state
  const jobState = global.jobStore.jobs;

  // Use safer array conversion in case jobState is unexpectedly null/undefined
  const pendingJob = Object.values(jobState || {}).find(
    (job: any) => job.status === 'PENDING'
  );

  if (pendingJob) {
    // Job found, send it to the worker
    return NextResponse.json({ job: pendingJob }, { status: 200 });
  } else {
    // No job found, send null response
    return NextResponse.json({ job: null }, { status: 200 });
  }
}