/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Upload, ShieldCheck, Activity, CheckCircle, AlertCircle, FileText } from 'lucide-react';

const EvaluationDashboard = () => {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [reports, setReports] = useState<any[]>([]);

  // Simulation of starting the AI agent via the FastAPI backend
  const handleStartEvaluation = async () => {
    setStatus('processing');
    const response = await fetch('http://localhost:8000/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tender_text: "Minimum 5Cr turnover required. ISO 9001 mandatory.",
        bidders: [
          { name: "Secure Systems", content: "Turnover 12Cr. ISO attached." },
          { name: "Small Ventures", content: "Turnover 2Cr. No ISO." }
        ]
      })
    });
    const data = await response.json();
    setJobId(data.job_id);
  };

  // Polling for status
  useEffect(() => {
    if (!jobId || status === 'completed') return;

    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:8000/status/${jobId}`);
      const data = await res.json();
      if (data.status === 'completed') {
        console.log(data);
        setReports(data.reports);
        setStatus('completed');
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      {/* Header */}
      <header className="mb-10 flex justify-between items-center border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="text-blue-600 w-8 h-8" /> 
            CRPF AI Tender Auditor
          </h1>
          <p className="text-slate-500 mt-1">Immutable AI-Based Eligibility Verification</p>
        </div>
        <div className="flex gap-3">
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${
            status === 'processing' ? 'bg-amber-100 text-amber-700 animate-pulse' : 
            status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {status === 'processing' && <Activity size={16} />}
            {status.toUpperCase()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Upload Column */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-500" /> Upload Documents
            </h3>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
              <Upload className="mx-auto text-slate-400 mb-3" />
              <p className="text-sm text-slate-600">Drag & drop Tender PDF</p>
            </div>
            <button 
              onClick={handleStartEvaluation}
              disabled={status === 'processing'}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg shadow-blue-200"
            >
              Analyze & Evaluate
            </button>
          </div>
        </div>

        {/* Results Column */}
        <div className="md:col-span-2 space-y-4">
          {status === 'idle' && (
            <div className="bg-white p-12 rounded-xl text-center border border-slate-200 opacity-50">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Upload documents to begin AI analysis</p>
            </div>
          )}

          {status === 'processing' && (
            <div className="bg-white p-12 rounded-xl text-center border border-slate-200">
              <div className="flex justify-center mb-6">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Agent is Thinking...</h3>
              <p className="text-slate-500 mt-2">Parsing tender criteria and verifying bidder evidence on blockchain.</p>
            </div>
          )}

          {status === 'completed' && reports.map((report, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className={`p-4 flex justify-between items-center ${
                report.overall_status.includes('Eligible') ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <h4 className="font-bold text-slate-800">{report.bidder_name}</h4>
                <div className="flex items-center gap-2">
                   <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
                     TX: {report.blockchain_hash.substring(0, 10)}...
                   </span>
                   {report.overall_status.includes('Eligible') ? 
                     <CheckCircle className="text-green-600" /> : <AlertCircle className="text-red-600" />}
                </div>
              </div>
              <div className="p-4">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 border-b">
                      <th className="pb-2 font-medium">Criterion</th>
                      <th className="pb-2 font-medium">Value Found</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.results.map((res: any, j: number) => (
                      <tr key={j}>
                        <td className="py-3 text-slate-700 font-medium">{res.criterion_key}</td>
                        <td className="py-3 text-slate-600">{res.extracted_value}</td>
                        <td className="py-3 font-semibold text-xs">
                           <span className={res.verdict === 'Eligible' ? 'text-green-600' : 'text-red-600'}>
                             {res.verdict.toUpperCase()}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default EvaluationDashboard;