import { useStudyContext } from "../context/StudyContext";
import { useState, useRef } from "react";
import { CloudUpload, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Syllabus() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const { user, setSyllabusData, authFetch } = useStudyContext();
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Reset previous results if user selects a new file
      setAnalysisResult(null); 
    }
  };

  const processSyllabus = async () => {
    if (!file) return;

    setIsProcessing(true);
    
    // 1. Package the file for HTTP transmission
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", user.id);

    try {
      // 2. Send POST request to our FastAPI backend
      const response = await authFetch("http://localhost:8000/api/upload-syllabus", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // 3. Parse the JSON response ONCE
      const data = await response.json();
      
      // 4. Update both local UI state and global Context memory
      setAnalysisResult(data.analysis);
      setSyllabusData({ 
        id: data.syllabus_id, 
        ...data.analysis 
      });
      
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to process syllabus. Ensure backend server is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto z-10 relative">
      
      <div className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-extrabold flex items-center justify-center md:justify-start gap-3 mb-4 tracking-tight text-gray-900 dark:text-white transition-colors duration-300 font-outfit">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400 drop-shadow-sm">Syllabus Analysis</span> <span className="text-4xl">✨</span>
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-lg font-medium transition-colors duration-300">
          Upload your course syllabus. Our AI will analyze the topics, deadlines, and structure to generate a personalized study plan and session outlines.
        </p>
      </div>

      <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl border-[3px] border-dashed border-indigo-100 dark:border-slate-700/50 rounded-[3rem] p-16 flex flex-col items-center justify-center text-center hover:bg-white/90 dark:hover:bg-slate-800/90 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        
        {!file ? (
          <>
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 border border-white/60 dark:border-slate-600/50 shadow-inner rounded-full mb-8 flex items-center justify-center transition-colors duration-300">
              <CloudUpload size={48} className="text-indigo-500 dark:text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300 font-outfit">Drag and drop your syllabus here</h3>
            <p className="text-gray-500 dark:text-slate-400 mb-10 text-base leading-relaxed font-medium transition-colors duration-300">
              Supports PDF files up to 10MB.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white px-10 py-4 rounded-full text-lg font-bold shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:opacity-90 transition-all transform hover:-translate-y-1"
            >
              Browse Files
            </button>
          </>
        ) : !analysisResult ? (
          <>
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-white/60 dark:border-slate-600/50 shadow-inner rounded-full mb-8 flex items-center justify-center transition-colors duration-300">
              <CheckCircle size={48} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300 font-outfit">{file.name}</h3>
            <p className="text-emerald-600 dark:text-emerald-400 mb-10 text-base font-bold transition-colors duration-300">Ready for AI Processing</p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setFile(null)}
                disabled={isProcessing}
                className="text-gray-600 dark:text-gray-300 font-bold bg-white dark:bg-slate-800 border border-gray-200/50 dark:border-slate-700/50 shadow-sm px-8 py-4 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={processSyllabus}
                disabled={isProcessing}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white px-10 py-4 rounded-full font-bold shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:opacity-90 transition-all flex items-center gap-3 disabled:opacity-75 transform hover:-translate-y-1"
              >
                {isProcessing ? (
                  <><Loader2 className="animate-spin" size={24} /> Extracting Data...</>
                ) : (
                  <><CloudUpload size={24} /> Generate Study Plan</>
                )}
              </button>
            </div>
          </>
        ) : (
          // Success Screen displaying the AI extracted Course Name
          <div className="w-full text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 rounded-[2rem] mb-8 transition-colors duration-300">
              <h3 className="text-gray-900 dark:text-white font-bold text-2xl mb-4 flex items-center gap-3 font-outfit"><CheckCircle size={28} className="text-emerald-500 dark:text-emerald-400" /> Extraction Complete</h3>
              <p className="text-gray-500 dark:text-slate-400 font-medium text-lg mb-2">Identified Degree/Course: <span className="font-bold text-indigo-600 dark:text-indigo-400">{analysisResult.course_name}</span></p>
              <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">Total Subjects Found: <span className="font-bold text-indigo-600 dark:text-indigo-400">{analysisResult.topics.length}</span></p>
            </div>
            <button 
              onClick={() => navigate('/schedule')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-5 rounded-full text-lg font-bold shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:opacity-90 transition-all transform hover:-translate-y-1 flex justify-center items-center gap-3"
            >
              View Generated Schedule <ArrowRight size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}