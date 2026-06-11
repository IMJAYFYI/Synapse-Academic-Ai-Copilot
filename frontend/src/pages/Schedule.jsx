import { useState } from "react";
import { Sparkles, Circle, ArrowRight, Info, AlertCircle, Loader2, ChevronDown, Search, Calendar } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";
import { useNavigate } from "react-router-dom";

export default function Schedule() {
  // 1. Pulling the globalUnitData directly from context
  const { syllabusData, globalUnitData, setGlobalUnitData, authFetch } = useStudyContext();
  const navigate = useNavigate();

  // 2. Local state is NOW ONLY used for the loading spinner, not the data
  const [loadingUnits, setLoadingUnits] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  if (!syllabusData) {
    return (
      <div className="p-8 w-full flex-1 flex flex-col items-center justify-center text-center">
        <AlertCircle size={48} className="text-gray-300 dark:text-slate-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">No Active Study Plan</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 transition-colors duration-300">Upload a syllabus document to generate your AI-optimized schedule.</p>
        <button 
          onClick={() => navigate('/syllabus')}
          className="bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] px-6 py-2 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-[#333] transition-all"
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
      const response = await authFetch("http://localhost:8000/api/extract-subject", {
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
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-4 transition-colors duration-300 font-playfair mb-2">
            <div className="bg-orange-100 dark:bg-orange-500/20 p-2.5 rounded-xl shrink-0">
              <Calendar className="text-orange-600 dark:text-orange-400" size={28} />
            </div>
            {syllabusData.course_name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors duration-300">Dynamically extracted and optimized plan.</p>
        </div>
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search topics or loaded units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
          />
        </div>
      </div>

      <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/30 p-4 rounded-xl mb-8 flex gap-3 text-indigo-800 dark:text-indigo-300 transition-colors duration-300">
        <Sparkles className="shrink-0 mt-0.5 text-indigo-500 dark:text-indigo-400" size={20} />
        <div>
          <h4 className="font-bold text-sm mb-1 text-indigo-900 dark:text-indigo-200">AI Syllabus Extraction Active</h4>
          <p className="text-sm">
            I have extracted the core subjects. Click "Load Detailed Units" to instruct the AI to deeply analyze a specific module.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {syllabusData.topics.map((topic, index) => {
          const query = searchQuery.toLowerCase();
          let isMatch = true;
          if (query) {
             isMatch = topic.title.toLowerCase().includes(query);
             const units = globalUnitData[index];
             if (!isMatch && units) {
                isMatch = units.some(u => 
                  u.unit_name.toLowerCase().includes(query) || 
                  u.key_concepts.some(c => c.toLowerCase().includes(query))
                );
             }
          }
          
          if (!isMatch) return null;
          
          return (
            <div key={index} className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] p-6 rounded-lg flex flex-col md:flex-row gap-5 md:items-start">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                <Circle className="text-indigo-500 dark:text-indigo-400" size={24} />
              </div>
              <div className="flex-1">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-widest uppercase bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">MODULE {index + 1}</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100/80 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-sm">
                  {topic.hours_required} Hours
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-playfair tracking-tight">{topic.title}</h3>
              
              {/* 4. Rendering tied directly to globalUnitData */}
              {!globalUnitData[index] ? (
                <button 
                  onClick={() => fetchSubjectUnits(topic.title, index)}
                  disabled={loadingUnits[index]}
                  className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#333] hover:bg-gray-200 dark:hover:bg-[#444] px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 border border-gray-200 dark:border-[#444]"
                >
                  {loadingUnits[index] ? <Loader2 className="animate-spin" size={18} /> : <ChevronDown size={18} />}
                  {loadingUnits[index] ? "Analyzing PDF..." : "Load Detailed Units"}
                </button>
              ) : (
                <div className="bg-[#F9F8F6] dark:bg-[#222] border border-gray-200 dark:border-[#333] p-5 rounded-2xl mb-6 animate-in fade-in duration-300">
                  <div className="flex gap-2 mb-4">
                    <Info className="text-gray-500 shrink-0 mt-0.5" size={18} />
                    <span className="font-bold text-gray-900 dark:text-white text-sm tracking-wide">Deep Extraction Complete</span>
                  </div>
                  <div className="space-y-5 pl-7">
                    {globalUnitData[index].map((unit, uIndex) => (
                      <div key={uIndex} className="relative">
                        <div className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5">{unit.unit_name}</h4>
                        <ul className="list-none text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
                          {unit.key_concepts.map((concept, cIndex) => (
                            <li key={cIndex} className="flex items-start gap-2">
                              <span className="text-emerald-500 shrink-0 mt-0.5">›</span> {concept}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => navigate('/session', { state: { selectedTopic: topic.title }, replace: true })}
                className="flex items-center gap-2 bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] px-6 py-3 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-[#333] transition-all"
              >
                Start Study Session <ArrowRight size={18} />
              </button>
            </div>
          </div>
          );
        })}
      </div>

    </div>
  );
}