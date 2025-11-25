import { NextResponse } from 'next/server';

declare global {
  var jobStore: any;
}

if (typeof global.jobStore === 'undefined') {
  global.jobStore = { lastJobId: 0, jobs: {}, fileStorage: {} };
}

// FIX: Next.js 15+ ke liye 'params' ab Promise hai
export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobid: string }> }
) {
  // 1. Yahan hum Promise ko 'await' karke resolve karte hain
  const resolvedParams = await params;
  
  // 2. Ab jobid access karte hain
  const jobId = parseInt(resolvedParams.jobid);

  // 3. Check karo job exist karta hai ya nahi
  if (isNaN(jobId) || !global.jobStore.jobs[jobId]) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // 4. Job return karo
  return NextResponse.json(global.jobStore.jobs[jobId], { status: 200 });
}