/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, ShieldCheck, Activity, CheckCircle, 
  AlertCircle, FileText, Search, Clock, ChevronRight, HardDrive
} from 'lucide-react';

interface Evidence {
  criterion_key: string;
  verdict: string;
  extracted_value: string;
  justification: string;
  source_context: string;
}

interface BidderReport {
  bidder_name: string;
  results: Evidence[];
  overall_status: string;
  blockchain_hash: string;
}

const TenderAuditor: React.FC = () => {
  // File State
  const [tenderFile, setTenderFile] = useState<File | null>(null);
  const [bidderFiles, setBidderFiles] = useState<File[]>([]);
  
  // App State
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'completed' | 'error'>('idle');
  const [reports, setReports] = useState<BidderReport[]>([]);
  const [logs, setLogs] = useState<string[]>(["System initialized..."]);

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Polling for status
  useEffect(() => {
    if (!jobId || status !== 'processing') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:8000/status/${jobId}`);
        const data = await res.json();
        
        if (data.status === 'completed') {
          setReports(data.reports);
          setStatus('completed');
          setLogs(prev => [...prev, "Audit complete. Results secured on blockchain."]);
          clearInterval(interval);
        } else {
          setLogs(prev => [...prev, "Agent analyzing bidder documents..."]);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  const handleStartAnalysis = async () => {
    if (!tenderFile || bidderFiles.length === 0) {
      alert("Please upload both tender and bidder documents.");
      return;
    }

    setStatus('processing');
    setLogs(["Parsing PDF files...", "Extracting Tender Criteria..."]);

    const formData = new FormData();
    formData.append("tender_file", tenderFile);
    bidderFiles.forEach((file) => {
      formData.append("bidder_files", file);
    });

    try {
      const response = await fetch('http://localhost:8000/evaluate-files', {
        method: 'POST',
        body: formData, // No headers needed, browser sets multipart/form-data
      });
      const data = await response.json();
      setJobId(data.job_id);
      setLogs(prev => [...prev, `Job created: ${data.job_id}`, "Initializing LangGraph Agent..."]);
    } catch (err) {
      setStatus('error');
      setLogs(prev => [...prev, "Error: Connection to backend failed."]);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 text-slate-900 font-sans">
      {/* Navbar */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-blue-600 p-2 rounded-lg">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">CRPF Audit Engine</h1>
          </div>
          <p className="text-slate-500 text-sm">Automated Procurement Verification System v1.0</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-400 uppercase">System Status</p>
            <p className="text-sm font-medium flex items-center gap-2 justify-end">
              <span className={`w-2 h-2 rounded-full ${status === 'processing' ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
              Blockchain: Connected (Ganache)
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Input & Console */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Upload Section */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Upload size={18} className="text-blue-600" /> Document Ingestion
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tender Document (PDF)</label>
                <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${tenderFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400'}`}>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => setTenderFile(e.target.files?.[0] || null)}
                    accept=".pdf"
                  />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                      <FileText size={20} />
                    </div>
                    <p className="text-sm font-medium truncate">
                      {tenderFile ? tenderFile.name : "Select Tender PDF"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Bidder Documents (Multiple)</label>
                <div className={`relative border-2 border-dashed rounded-xl p-4 transition-all ${bidderFiles.length > 0 ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-400'}`}>
                  <input 
                    type="file" 
                    multiple 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => setBidderFiles(Array.from(e.target.files || []))}
                    accept=".pdf"
                  />
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                      <HardDrive size={20} />
                    </div>
                    <p className="text-sm font-medium">
                      {bidderFiles.length > 0 ? `${bidderFiles.length} Bidders selected` : "Select Bidder Files"}
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleStartAnalysis}
                disabled={status === 'processing'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-200 transition-all disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {status === 'processing' ? <Activity className="animate-spin" /> : <Search size={20} />}
                {status === 'processing' ? "Analyzing..." : "Run AI Audit"}
              </button>
            </div>
          </section>

          {/* Console / Log Section */}
          <section className="bg-[#1E293B] rounded-2xl shadow-xl p-5 overflow-hidden">
             <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Agent Console</h3>
                <div className="flex gap-1.5">
                   <div className="w-2 h-2 rounded-full bg-red-500" />
                   <div className="w-2 h-2 rounded-full bg-amber-500" />
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
             </div>
             <div className="h-48 overflow-y-auto font-mono text-[11px] space-y-1 text-blue-300 custom-scrollbar">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-slate-600">[{new Date().toLocaleTimeString([], {hour12: false})}]</span>
                    <span className={log.includes('Error') ? 'text-red-400' : ''}>{'>'} {log}</span>
                  </div>
                ))}
                <div ref={logEndRef} />
             </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Results Section */}
        <div className="lg:col-span-8">
          {status === 'idle' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 p-6 rounded-full mb-4 text-slate-300">
                <FileText size={64} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">No Analysis Pending</h2>
              <p className="text-slate-500 max-w-xs mt-2">Upload the tender requirements and bidder PDFs to begin the AI-driven eligibility audit.</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
              <div className="relative mb-8">
                <div className="w-24 h-24 border-4 border-blue-100 rounded-full border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="text-blue-600 animate-pulse" size={32} />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Processing Audit</h2>
              <p className="text-slate-500 mt-2">Gemini Flash 1.5 is cross-referencing documents...</p>
            </div>
          )}

          {status === 'completed' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {reports.map((report, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${report.overall_status.includes('Eligible') ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${report.overall_status.includes('Eligible') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         <CheckCircle size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{report.bidder_name}</h4>
                        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> VERIFIED BY AI AGENT
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className={`px-4 py-1 rounded-full text-xs font-bold ${report.overall_status.includes('Eligible') ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                         {report.overall_status.toUpperCase()}
                       </span>
                       <span className="text-[10px] font-mono text-slate-400 mt-2 flex items-center gap-1">
                         <ShieldCheck size={10} /> {report.blockchain_hash}
                       </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {report.results.map((res, j) => (
                        <div key={j} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                          <div className="flex justify-between items-start mb-2">
                             <h5 className="font-bold text-sm text-slate-700">{res.criterion_key}</h5>
                             <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${res.verdict === 'Eligible' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {res.verdict}
                             </span>
                          </div>
                          <p className="text-xs text-slate-600 mb-2 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                            "{res.extracted_value}"
                          </p>
                          <p className="text-[11px] text-slate-500">
                            <span className="font-bold text-slate-700">Reasoning:</span> {res.justification}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TenderAuditor;