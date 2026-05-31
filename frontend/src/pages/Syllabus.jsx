import { useStudyContext } from "../context/StudyContext";
import { useState, useRef } from "react";
import { CloudUpload, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Syllabus() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  
  const { user, setSyllabusData } = useStudyContext();
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
      const response = await fetch("http://localhost:8000/api/upload-syllabus", {
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
      
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold flex items-center justify-center md:justify-start gap-2 mb-3 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">Syllabus Analysis</span> <span className="text-3xl">✨</span>
        </h1>
        <p className="text-gray-500 text-lg font-medium">
          Upload your course syllabus. Our AI will analyze the topics, deadlines, and structure to generate a personalized study plan and session outlines.
        </p>
      </div>

      <div className="bg-white/70 backdrop-blur-xl border-2 border-dashed border-white rounded-2xl p-16 flex flex-col items-center justify-center text-center hover:bg-white/80 hover:border-indigo-400 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        {!file ? (
          <>
            <div className="bg-white/50 border border-white shadow-sm p-5 rounded-full mb-6">
              <CloudUpload size={48} className="text-indigo-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Drag and drop your syllabus here</h3>
            <p className="text-gray-500 mb-8 text-sm leading-relaxed font-medium">
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
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-xl font-bold shadow-[0_8px_30px_rgb(79,70,229,0.2)] hover:opacity-90 transition-all transform hover:-translate-y-0.5"
            >
              Browse Files
            </button>
          </>
        ) : !analysisResult ? (
          <>
            <div className="bg-white/50 border border-white shadow-sm p-5 rounded-full mb-6">
              <CheckCircle size={48} className="text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{file.name}</h3>
            <p className="text-emerald-600 mb-8 text-sm font-bold">Ready for AI Processing</p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setFile(null)}
                disabled={isProcessing}
                className="text-gray-600 font-bold bg-white border border-gray-200 shadow-sm px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={processSyllabus}
                disabled={isProcessing}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-xl font-bold shadow-[0_8px_30px_rgb(79,70,229,0.2)] hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-75 transform hover:-translate-y-0.5"
              >
                {isProcessing ? (
                  <><Loader2 className="animate-spin" size={20} /> Extracting Data...</>
                ) : (
                  <><CloudUpload size={20} /> Generate Study Plan</>
                )}
              </button>
            </div>
          </>
        ) : (
          // Success Screen displaying the AI extracted Course Name
          <div className="w-full text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/60 border border-white shadow-sm p-6 rounded-2xl mb-6">
              <h3 className="text-gray-900 font-bold text-xl mb-3 flex items-center gap-2"><CheckCircle size={20} className="text-emerald-500" /> Extraction Complete</h3>
              <p className="text-gray-600 font-medium">Identified Degree/Course: <span className="font-bold text-indigo-700">{analysisResult.course_name}</span></p>
              <p className="text-gray-600 font-medium">Total Subjects Found: <span className="font-bold text-indigo-700">{analysisResult.topics.length}</span></p>
            </div>
            <button 
              onClick={() => navigate('/schedule')}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-8 py-4 rounded-xl font-bold shadow-[0_8px_30px_rgb(16,185,129,0.2)] hover:opacity-90 transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2"
            >
              View Generated Schedule <ArrowRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}