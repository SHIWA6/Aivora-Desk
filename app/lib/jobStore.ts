// global singleton safe store (Next 15 compatible)
class JobStore {
  fileStorage: Record<string, string> = {};
  jobs: Record<string, any> = {};
}

const globalForJobStore = globalThis as unknown as {
  jobStore?: JobStore;
};

export const jobStore =
  globalForJobStore.jobStore ?? (globalForJobStore.jobStore = new JobStore());
