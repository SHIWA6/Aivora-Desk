"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Download, FileText, Send, Lock, Zap, RefreshCw, X, LogOut } from 'lucide-react';

// --- SIMULATED BACKEND/DATABASE & FILE STORAGE (NOW GLOBALIZED) ---
// By attaching jobStore to the global object, we ensure the API routes
// (which run in the same Next.js server environment) can access the data.

declare global {
  var jobStore: any; // Declaring jobStore globally
}

// **[FIXED BLOCK START]**
// HMR-Safe Initialization using Next.js global object checking
// We strictly guard 'global' access using 'typeof window === 'undefined''
// This resolves the ReferenceError: global is not defined on the client.
if (typeof window === 'undefined') {
  if (typeof global.jobStore === 'undefined') {
    // This runs ONLY on the server side once (or on first HMR)
    global.jobStore = {
      lastJobId: 0,
      jobs: {},
      fileStorage: {},
    };
  }
}
// Client side (window is defined) should not attempt to access or set Node.js's 'global'.
// The problematic client-side logic referencing 'global' has been removed.
// **[FIXED BLOCK END]**

const API_SIMULATION_DELAY = 500;
// Note: 'jobStore' is now referenced as 'global.jobStore' inside the functions below.


// Function to simulate saving the file and creating a job
const simulateCreateJob = async (file: File, delay: number) => {
  const fileId = `file-${Date.now()}`;
  
  // NOTE: This part MUST execute on the server. Since we cannot rely on 
  // global manipulation in a Client Component, we must switch to an API call 
  // to ensure server-side state modification.

  const fileContent = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
  
  // New API call for job creation
  const response = await fetch('/api/job/create', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ fileId, fileName: file.name, delay, fileContent })
  });
  
  if (!response.ok) {
      throw new Error("Failed to create job via API.");
  }
  
  return await response.json();
};

// Function to simulate the worker polling the API
// This is actually a client-side fetch, but we keep the name for consistency.
const simulateFetchPendingJob = async () => {
    // This is now redundant as the worker polls the API directly
    const pendingJob = Object.values(global.jobStore.jobs).find((job:any) => job.status === 'PENDING');
    return new Promise(resolve => {
        setTimeout(() => resolve(pendingJob ? { job: pendingJob } : { job: null }), 1000);
    });
};

// Function to simulate the worker uploading status and logs
const simulateUpdateJobStatus = async (jobId: number, data: any) => {
    // Redundant for client, worker uses API directly
    return new Promise(resolve => {
        setTimeout(() => {
            if (global.jobStore.jobs[jobId]) {
                const job = global.jobStore.jobs[jobId];
                job.status = data.status || job.status;
                job.summary = data.summary || job.summary;
                job.updatedFileBase64 = data.updatedFileBase64 || job.updatedFileBase64;
            }
            resolve({ success: true });
        }, API_SIMULATION_DELAY);
    });
};

// Function to simulate the worker streaming logs
const simulateStreamLog = async (data: any) => {
    // Redundant for client, worker uses API directly
    const { jobId, message, level, timestamp } = data;
    return new Promise(resolve => {
        setTimeout(() => {
            if (global.jobStore.jobs[jobId]) {
                global.jobStore.jobs[jobId].log.push({ message, level, timestamp });
                
                // Update progress if level is 'progress'
                if (level === 'progress') {
                    const match = message.match(/Progress: (\d+)\/(\d+)/);
                    if (match) {
                        global.jobStore.jobs[jobId].postsCompleted = parseInt(match[1]);
                        global.jobStore.jobs[jobId].totalPosts = parseInt(match[2]);
                    }
                }
            }
            resolve({ success: true });
        }, 50); // very short delay for streaming effect
    });
};

// Function to fetch the current job status for the frontend
const simulateFetchJob = async (jobId: number) => {
    // This function will now fetch the data from the server's API route /api/job/[jobId]
    // which handles the global.jobStore access.

    const response = await fetch(`/api/job/${jobId}`);
    if (!response.ok) {
        throw new Error("Failed to fetch job status.");
    }
    return await response.json();
};

// --- END SIMULATED BACKEND ---

// --- COMPONENT LOGIC ---

type LogEntry = {
  message: string;
  level: 'info' | 'warning' | 'error' | 'progress' | 'summary';
  timestamp: string;
};

type Job = {
    id: number;
    fileName: string;
    delay: number;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
    log: LogEntry[];
    summary: string;
    updatedFileBase64: string | null;
    totalPosts: number;
    postsCompleted: number;
};

// UI Component for the entire application
const AivoraDesk = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [delay, setDelay] = useState(5);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const logPanelRef = useRef<HTMLDivElement>(null);

  const correctPassword = 'aivora2025';

  // Authentication Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === correctPassword) {
      setIsAuthenticated(true);
    } else {
      alert('Invalid Password. Try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  // File Upload Handlers
  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }, []);

  // Job Initiation
  const handleLaunchSniper = async () => {
    if (!file) {
      alert('Please upload an Excel or CSV file first.');
      return;
    }

    setIsLaunching(true);
    try {
      // Create a job on the server via API call
      const newJob = await simulateCreateJob(file, delay);
      setCurrentJob(newJob as Job);
      alert('Job Initiated! Now, please run the "aivora_worker.py" script on your laptop to start processing. If it is already running, wait for it to pick up the job.');
    } catch (error) {
      console.error('Job initiation failed:', error);
      alert('Failed to initiate job. See console for details.');
    } finally {
      setIsLaunching(false);
    }
  };

  // Real-time Log Polling (Frontend)
  useEffect(() => {
    if (!currentJob || currentJob.status === 'COMPLETED' || currentJob.status === 'FAILED') return;

    // Use polling to fetch job status and logs from the simulated server
    const interval = setInterval(async () => {
      try {
        const updatedJob = await simulateFetchJob(currentJob.id);
        if (updatedJob) {
          setCurrentJob(updatedJob as Job);
        }
      } catch (e) {
        console.error("Polling failed:", e);
      }
    }, 1500); // Poll every 1.5 seconds

    return () => clearInterval(interval);
  }, [currentJob]);


  // Auto-scroll log panel
  useEffect(() => {
    if (logPanelRef.current) {
      logPanelRef.current.scrollTop = logPanelRef.current.scrollHeight;
    }
  }, [currentJob?.log.length]);

  // Download Handler
  const handleDownload = () => {
    if (!currentJob || !currentJob.updatedFileBase64) return;
    
    // Decode base64 to Blob
    const mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'; // Assuming .xlsx output from Python bot
    const byteCharacters = atob(currentJob.updatedFileBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    // Create link and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `updated_${currentJob.fileName.replace(/\.(xlsx|csv)$/i, '')}_${new Date().toISOString().substring(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const progressPercentage = useMemo(() => {
    if (!currentJob || currentJob.totalPosts === 0) return 0;
    return Math.round((currentJob.postsCompleted / currentJob.totalPosts) * 100);
  }, [currentJob]);

  // --- UI COMPONENTS ---

  const AuthScreen = (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-8 bg-gray-900 border border-purple-800 rounded-xl shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Aivora Desk</h2>
        <p className="text-purple-400 mb-6 text-center flex items-center justify-center">
            <Lock className="w-5 h-5 mr-2" /> Access Required
        </p>
        <div className="mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter Password"
            className="w-full px-4 py-3 bg-gray-800 text-white border border-purple-600 rounded-lg focus:ring-purple-500 focus:border-purple-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition duration-200"
        >
          Login
        </button>
      </form>
    </div>
  );

  const StatusPill = ({ status }: { status: Job['status'] }) => {
    const statusMap = {
      'PENDING': 'bg-yellow-600',
      'RUNNING': 'bg-purple-600 animate-pulse',
      'COMPLETED': 'bg-green-600',
      'FAILED': 'bg-red-600',
    };
    const statusText = status.charAt(0) + status.slice(1).toLowerCase();

    return (
      <span className={`px-3 py-1 text-sm font-semibold rounded-full text-white ${statusMap[status]}`}>
        {status === 'RUNNING' && <Zap className="w-4 h-4 inline mr-1 -mt-0.5" />}
        {statusText}
      </span>
    );
  };
  
  const FileDropZone = (
    <div 
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('border-purple-400', 'bg-gray-800'); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('border-purple-400', 'bg-gray-800'); }}
      onDrop={handleFileDrop}
      className={`relative p-8 border-4 border-dashed rounded-xl transition duration-300 ${file ? 'border-purple-600 bg-gray-900' : 'border-gray-700 bg-gray-900 hover:border-purple-500'}`}
    >
      <input 
        type="file" 
        accept=".xlsx,.csv"
        onChange={handleFileChange}
        className="absolute inset-0 opacity-0 cursor-pointer" 
      />
      <div className="text-center text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-2 text-purple-400" />
        {file ? (
          <>
            <p className="text-lg text-white font-medium">{file.name}</p>
            <p className="text-sm text-purple-300">File loaded. Drag here to change.</p>
          </>
        ) : (
          <>
            <p className="text-lg">Drag & Drop or Click to Upload</p>
            <p className="text-sm">(.xlsx or .csv file)</p>
          </>
        )}
      </div>
      {file && (
        <button
          onClick={(e) => { e.stopPropagation(); setFile(null); }}
          className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-1 rounded-full bg-gray-900"
          aria-label="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const LogMessage = ({ log }: { log: LogEntry }) => {
    let colorClass = 'text-gray-300';
    if (log.level === 'warning') colorClass = 'text-yellow-400';
    if (log.level === 'error') colorClass = 'text-red-400';
    if (log.level === 'progress') colorClass = 'text-purple-400 font-bold';
    if (log.level === 'summary') colorClass = 'text-green-400 font-bold bg-gray-800 p-2 block';

    const time = new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false });
    
    // For summary, render a pre-formatted block
    if (log.level === 'summary') {
        return (
            <pre className="text-xs mt-4 whitespace-pre-wrap font-mono p-4 border border-green-600 rounded-lg overflow-x-auto">
                {log.message}
            </pre>
        );
    }
    
    return (
      <p className={`text-xs ${colorClass}`}>
        <span className="text-gray-500 mr-2">[{time}]</span>
        {log.message}
      </p>
    );
  };
  
  // --- MAIN DASHBOARD RENDER ---

  if (!isAuthenticated) {
    return AuthScreen;
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 font-inter">
      <header className="flex justify-between items-center pb-6 border-b border-gray-800">
        <h1 className="text-4xl font-extrabold text-purple-400">
          Aivora Desk <span className="text-sm text-gray-500">v1.0</span>
        </h1>
        <button 
          onClick={handleLogout}
          className="flex items-center text-sm text-gray-400 hover:text-red-400 transition"
        >
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </button>
      </header>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- CONTROL PANEL (Col 1) --- */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">1. Upload Data File</h2>
            {FileDropZone}
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">2. Configuration</h2>
            
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comment Delay: {delay} seconds
            </label>
            <input
              type="range"
              min="2"
              max="10"
              step="0.5"
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              disabled={!!currentJob && currentJob.status === 'RUNNING'}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-purple-500 accent-purple-600"
            />
          </div>
          
          <button
            onClick={handleLaunchSniper}
            disabled={!file || isLaunching || (!!currentJob && currentJob.status === 'RUNNING')}
            className={`w-full py-4 px-6 text-xl font-bold rounded-xl transition duration-300 shadow-lg 
              ${!file || isLaunching || (!!currentJob && currentJob.status === 'RUNNING')
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-purple-700 text-white hover:bg-purple-600 shadow-purple-500/50 hover:shadow-purple-400/70'
              }`}
          >
            {isLaunching ? (
              <RefreshCw className="w-6 h-6 inline mr-2 animate-spin" />
            ) : (
              <Send className="w-6 h-6 inline mr-2" />
            )}
            {currentJob?.status === 'RUNNING' ? 'BOT IS ACTIVE...' : 'LAUNCH SNIPER'}
          </button>
        </div>

        {/* --- STATUS & LOGS PANEL (Col 2 & 3) --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">3. Job Status</h2>
            
            {currentJob ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <p>File: <span className="text-white font-mono">{currentJob.fileName}</span></p>
                  <StatusPill status={currentJob.status} />
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-4 mb-1">
                  <div 
                    className="bg-purple-600 h-4 rounded-full transition-all duration-700" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-400">
                  <p>Progress: <span className="text-purple-400">{currentJob.postsCompleted}/{currentJob.totalPosts}</span> posts done</p>
                  <p>Completion: <span className="text-purple-400">{progressPercentage}%</span></p>
                </div>
                
                {/* Actions */}
                <div className="flex justify-start pt-4 border-t border-gray-800">
                  {currentJob.status === 'COMPLETED' && currentJob.updatedFileBase64 && (
                    <button
                      onClick={handleDownload}
                      className="flex items-center px-4 py-2 bg-green-700 hover:bg-green-600 text-white font-semibold rounded-lg transition duration-200"
                    >
                      <Download className="w-5 h-5 mr-2" /> Download Updated File
                    </button>
                  )}
                  {currentJob.status === 'FAILED' && (
                    <p className="text-red-500 font-semibold">Job Failed. Check Logs for Details.</p>
                  )}
                  {currentJob.status !== 'RUNNING' && (
                      <p className="text-sm text-gray-500 ml-4 self-center">
                          {currentJob.status === 'PENDING' && "Worker is idle. Run aivora_worker.py now."}
                          {currentJob.status !== 'PENDING' && "Launch Sniper for a new job."}
                      </p>
                  )}
                </div>

              </div>
            ) : (
              <p className="text-gray-500">No active job. Upload a file and launch the sniper.</p>
            )}
          </div>

          {/* Logs Panel */}
          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-purple-400">4. Real-time Logs</h2>
            <div 
              ref={logPanelRef}
              className="h-96 bg-black p-4 rounded-lg overflow-y-scroll border border-gray-700 font-mono text-xs"
            >
              {!currentJob ? (
                <p className="text-gray-600">Logs will appear here when a job is running.</p>
              ) : (
                currentJob.log.map((log, index) => (
                  <LogMessage key={index} log={log} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AivoraDesk;