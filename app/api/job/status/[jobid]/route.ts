import { NextResponse } from 'next/server';

declare global {
  var jobStore: any;
}

// **--- Initialization added for stability ---**
if (typeof global.jobStore === 'undefined') {
  global.jobStore = {
    lastJobId: 0,
    jobs: {},
    fileStorage: {},
  };
}
// **---------------------------------------------**

// POST /api/job/status/[jobid]
// Worker uses this to mark the job as RUNNING/COMPLETED/FAILED
export async function POST(req: Request, { params }: { params: { jobid: string } }) {
  // --- FIX: Await the parameter access ---
  const jobid_param = await params.jobid;
  const jobId = parseInt(jobid_param); 
  // ---------------------------------------

  if (isNaN(jobId)) {
      return NextResponse.json({ error: 'Invalid Job ID format.' }, { status: 400 });
  }

  const data = await req.json();

  if (global.jobStore.jobs[jobId]) {
    const job = global.jobStore.jobs[jobId];
    
    // Update fields received from the worker
    job.status = data.status || job.status;
    job.summary = data.summary || job.summary;
    job.updatedFileBase64 = data.updatedFileBase64 || data.updatedFileBase64;

    return NextResponse.json({ success: true }, { status: 200 });
  }

  return NextResponse.json({ error: 'Job not found' }, { status: 404 });
}