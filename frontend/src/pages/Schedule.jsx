import { useState } from "react";
import { Calendar, Sparkles, Circle, ArrowRight, Info, AlertCircle, Loader2, ChevronDown, X } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";
import { useNavigate } from "react-router-dom";

export default function Schedule() {
  // 1. Pulling the globalUnitData directly from context
  const { syllabusData, globalUnitData, setGlobalUnitData } = useStudyContext();
  const navigate = useNavigate();

  // 2. Local state is NOW ONLY used for the loading spinner, not the data
  const [loadingUnits, setLoadingUnits] = useState({});
  const [showTimeline, setShowTimeline] = useState(false);

  if (!syllabusData) {
    return (
      <div className="p-8 w-full flex-1 flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Study Plan</h2>
        <p className="text-gray-500 mb-6">Upload a syllabus document to generate your AI-optimized schedule.</p>
        <button 
          onClick={() => navigate('/syllabus')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Go to Syllabus Upload
        </button>
      </div>
    );
  }

  // 3. JIT Fetching Function wired to Global Context
  const fetchSubjectUnits = async (subjectName, index) => {
    // Safety guard: If we already have this data globally, do not fetch again
    if (globalUnitData[index]) return;

    setLoadingUnits(prev => ({ ...prev, [index]: true }));
    
    try {
      const response = await fetch("http://localhost:8000/api/extract-subject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syllabus_id: syllabusData.id,
          subject_name: subjectName,
          topic_index: index
        })
      });

      if (!response.ok) throw new Error("Failed to fetch units");
      
      const result = await response.json();
      
      // Save directly to the Global Context so it survives tab changes
      setGlobalUnitData(prev => ({ ...prev, [index]: result.data.units }));
      
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setLoadingUnits(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto flex-1">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{syllabusData.course_name}</h1>
          <p className="text-gray-500 mt-1">Dynamically extracted and optimized plan.</p>
        </div>
        <button 
          onClick={() => setShowTimeline(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Calendar size={18} /> View Full Timeline
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-8 flex gap-3 text-indigo-800">
        <Sparkles className="shrink-0 mt-0.5 text-indigo-500" size={20} />
        <div>
          <h4 className="font-bold text-sm mb-1">AI Syllabus Extraction Active</h4>
          <p className="text-sm">
            I have extracted the core subjects. Click "Load Detailed Units" to instruct the AI to deeply analyze a specific module.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {syllabusData.topics.map((topic, index) => (
          <div key={index} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex gap-4">
            <Circle className="text-indigo-400 shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-indigo-600 tracking-wider">MODULE {index + 1}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-700">
                  {topic.hours_required} Hours
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{topic.title}</h3>
              
              {/* 4. Rendering tied directly to globalUnitData */}
              {!globalUnitData[index] ? (
                <button 
                  onClick={() => fetchSubjectUnits(topic.title, index)}
                  disabled={loadingUnits[index]}
                  className="mb-4 flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingUnits[index] ? <Loader2 className="animate-spin" size={16} /> : <ChevronDown size={16} />}
                  {loadingUnits[index] ? "Analyzing PDF..." : "Load Detailed Units"}
                </button>
              ) : (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4 animate-in fade-in duration-300">
                  <div className="flex gap-2 mb-3">
                    <Info className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                    <span className="font-semibold text-gray-800 text-sm">Deep Extraction Complete:</span>
                  </div>
                  <div className="space-y-4 pl-6">
                    {globalUnitData[index].map((unit, uIndex) => (
                      <div key={uIndex}>
                        <h4 className="text-sm font-bold text-gray-900">{unit.unit_name}</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-1 space-y-1">
                          {unit.key_concepts.map((concept, cIndex) => (
                            <li key={cIndex}>{concept}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => navigate('/session', { state: { selectedTopic: topic.title }, replace: true })}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Start Study Session <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showTimeline && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowTimeline(false)}></div>
          
          <div className="relative bg-white/90 backdrop-blur-xl border border-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgb(0,0,0,0.1)] animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="text-indigo-600" /> Full Study Timeline
              </h2>
              <button 
                onClick={() => setShowTimeline(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="relative border-l-2 border-indigo-100 ml-4 space-y-8">
                {syllabusData.topics.map((topic, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full border-4 border-white bg-indigo-500 shadow-sm"></div>
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-indigo-600">Module {idx + 1}</span>
                        <span className="text-xs font-bold px-2 py-1 bg-white rounded-md text-gray-500 border border-gray-200">{topic.hours_required} hrs</span>
                      </div>
                      <h4 className="font-bold text-gray-900">{topic.title}</h4>
                      {globalUnitData[idx] && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-500 font-semibold mb-2">EXTRACTED UNITS:</p>
                          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                            {globalUnitData[idx].map((u, i) => <li key={i}>{u.unit_name}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}