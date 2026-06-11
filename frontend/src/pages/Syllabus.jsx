import { useStudyContext } from "../context/StudyContext";
import { useState, useRef } from "react";
import { CloudUpload, CheckCircle, Loader2, ArrowRight, Paperclip } from "lucide-react";
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
        <h1 className="text-4xl md:text-5xl font-extrabold flex items-center justify-center md:justify-start gap-4 mb-4 tracking-tight text-gray-900 dark:text-white transition-colors duration-300 font-playfair">
          <div className="bg-emerald-100 dark:bg-emerald-500/20 p-3 rounded-2xl">
            <Paperclip className="text-emerald-600 dark:text-emerald-400" size={32} />
          </div>
          Syllabus Analysis
        </h1>
        <p className="text-gray-500 dark:text-slate-400 text-lg font-medium transition-colors duration-300">
          Upload your course syllabus. Our AI will analyze the topics, deadlines, and structure to generate a personalized study plan and session outlines.
        </p>
      </div>

      <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] p-16 flex flex-col items-center justify-center text-center transition-all">
        
        {!file ? (
          <>
            <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 border border-white/60 dark:border-slate-600/50 shadow-inner rounded-full mb-8 flex items-center justify-center transition-colors duration-300">
              <CloudUpload size={48} className="text-emerald-700 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 transition-colors duration-300 font-playfair">Drag and drop your syllabus here</h3>
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
              className="bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] px-10 py-4 rounded-lg text-lg font-bold hover:bg-gray-200 dark:hover:bg-[#333] transition-all"
            >
              Browse Files
            </button>
          </>
        ) : !analysisResult ? (
          <>
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-white/60 dark:border-slate-600/50 shadow-inner rounded-full mb-8 flex items-center justify-center transition-colors duration-300">
              <CheckCircle size={48} className="text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300 font-playfair">{file.name}</h3>
            <p className="text-emerald-600 dark:text-emerald-400 mb-10 text-base font-bold transition-colors duration-300">Ready for AI Processing</p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setFile(null)}
                disabled={isProcessing}
                className="text-gray-700 dark:text-gray-300 font-bold bg-white dark:bg-[#191919] border border-gray-300 dark:border-gray-600 px-8 py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={processSyllabus}
                disabled={isProcessing}
                className="bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] px-10 py-4 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-[#333] transition-all flex items-center gap-3 disabled:opacity-75"
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
            <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] p-8 rounded-2xl shadow-sm">
              <h3 className="text-gray-900 dark:text-white font-bold text-2xl mb-4 flex items-center gap-3 font-playfair"><CheckCircle size={28} className="text-emerald-500 dark:text-emerald-400" /> Extraction Complete</h3>
              <p className="text-gray-500 dark:text-slate-400 font-medium text-lg mb-2">Identified Degree/Course: <span className="font-bold text-emerald-800 dark:text-emerald-400">{analysisResult.course_name}</span></p>
              <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">Total Subjects Found: <span className="font-bold text-emerald-800 dark:text-emerald-400">{analysisResult.topics.length}</span></p>
            </div>
            <button 
              onClick={() => navigate('/schedule')}
              className="w-full bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] px-8 py-5 rounded-lg text-lg font-bold hover:bg-gray-200 dark:hover:bg-[#333] transition-all flex justify-center items-center gap-3"
            >
              View Generated Schedule <ArrowRight size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}