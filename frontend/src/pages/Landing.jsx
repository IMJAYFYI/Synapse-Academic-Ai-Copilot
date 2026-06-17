import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, BookOpen, Target, Activity, ArrowRight, Zap, Sparkles, X, Layers, Database, Cpu, Code } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [featureIndex, setFeatureIndex] = useState(0);
  const [showTechPanel, setShowTechPanel] = useState(false);
  
  const features = [
    "Turn any Syllabus into a Study Plan",
    "Generate Quizzes from your Notes",
    "1-on-1 Interactive AI Tutoring"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFeatureIndex((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const dynamicWords = [
    "Tutor.",
    "Quizmaster.",
    "Planner.",
    "Companion."
  ];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const word = dynamicWords[currentWordIndex];
    let typingSpeed = isDeleting ? 50 : 120;

    const timeout = setTimeout(() => {
      if (!isDeleting && currentText === word) {
        setIsDeleting(true);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % dynamicWords.length);
      } else {
        setCurrentText(
          isDeleting
            ? word.substring(0, currentText.length - 1)
            : word.substring(0, currentText.length + 1)
        );
      }
    }, !isDeleting && currentText === word ? 2500 : (isDeleting && currentText === "" ? 500 : typingSpeed));

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex]);

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans relative overflow-hidden text-gray-900">
      {/* Background Neural Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="w-full px-8 py-6 flex justify-between items-center z-10">
        <div 
          className="flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity" 
          onClick={() => navigate('/')}
        >
          <div className="text-emerald-700 transition-opacity">
            <BrainCircuit size={28} />
          </div>
          <span className="text-2xl font-bold text-gray-900 tracking-tight font-playfair">
            Synapse.
          </span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={() => setShowTechPanel(true)}
            className="px-5 py-2 text-sm font-bold bg-white border border-gray-200 text-gray-900 rounded-full hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Layers size={16} className="text-indigo-600" />
            How it Works
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 mt-16 mb-32">
        <div className="relative inline-flex items-center justify-center mb-10 cursor-default">
          {/* Colorful orb directly behind the pill so the glassmorphism actually has something to blur! */}
          <div className="absolute w-[140%] h-[180%] bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 rounded-full opacity-50 blur-2xl animate-pulse"></div>
          
          <div className="relative inline-flex items-center gap-2.5 px-6 py-2 rounded-full bg-white/40 backdrop-blur-xl border border-white/80 border-b-white/30 border-r-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:bg-white/50 transition-all">
            <Sparkles size={16} className="text-indigo-600" />
            <span key={featureIndex} className="text-sm font-bold text-gray-800 tracking-wide animate-[fadeIn_0.5s_ease-in-out]">
              {features[featureIndex]}
            </span>
          </div>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight max-w-4xl leading-tight mb-8 font-playfair">
          Your Syllabus. <br />
          Your Personal AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500 border-r-[6px] border-gray-900 pr-1 animate-pulse">{currentText}</span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mb-12 font-medium">
          Upload any PDF syllabus. Synapse instantly generates a structured study plan, quizzes you on core concepts, and provides 1-on-1 interactive tutoring.
        </p>

        <button 
          onClick={() => navigate('/onboarding')}
          className="px-10 py-5 text-lg font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all flex items-center gap-3 shadow-md"
        >
          Start Learning for Free <ArrowRight size={22} />
        </button>
      </main>

      {/* Features Grid */}
      <section className="w-full max-w-7xl mx-auto px-4 pb-32 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600 shadow-inner">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 font-playfair tracking-tight">Smart Notes</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">Never write a summary again. Synapse automatically extracts definitions, key points, and formulas from your chats.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600 shadow-inner">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 font-playfair tracking-tight">Dynamic Quizzes</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">Ensure you actually understand. Generate multiple-choice quizzes ranging from easy to hard based on your exact module.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center mb-6 text-orange-600 shadow-inner">
              <Target size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 font-playfair tracking-tight">Gamified Streaks</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">Stay motivated by maintaining your daily study streak, unlocking badges, and tracking your long-term progress.</p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white border border-gray-100 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 text-orange-600 shadow-inner">
              <Activity size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3 font-playfair tracking-tight">Activity Heatmaps</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">Track your consistency with GitHub-style contribution graphs. Build streaks and watch your productivity heat up over time.</p>
          </div>
        </div>
      </section>
      {/* How It Works - Tech Stack Side Panel */}
      {showTechPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity animate-[fadeIn_0.3s_ease-out]"
            onClick={() => setShowTechPanel(false)}
          ></div>
          
          {/* Panel */}
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto animate-[slideInRight_0.4s_ease-out]">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-extrabold text-gray-900 font-playfair flex items-center gap-2">
                  <BrainCircuit className="text-indigo-600" size={28} />
                  Synapse Architecture
                </h2>
                <button 
                  onClick={() => setShowTechPanel(false)}
                  className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-8 font-medium leading-relaxed">
                Synapse is a modern, full-stack AI web application. Below is the verified technology stack driving the platform.
              </p>

              <div className="space-y-6">
                {/* Frontend */}
                <div className="border border-gray-100 p-5 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Code size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Frontend (Client)</h3>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">React 19 + Vite + Tailwind CSS</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    A lightning-fast Single Page Application (SPA) built with the latest React 19 and Vite 8. Styled purely with Tailwind CSS for dynamic glassmorphism and fully responsive layouts. Uses React Context for global state management and React Router v7 for seamless client-side navigation.
                  </p>
                </div>

                {/* Backend */}
                <div className="border border-gray-100 p-5 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Cpu size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Backend (Server)</h3>
                      <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Python + FastAPI</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    A high-performance asynchronous REST API built with FastAPI. It handles JWT-based user authentication, PDF file processing, and orchestrates the AI logic securely on the server.
                  </p>
                </div>

                {/* Database */}
                <div className="border border-gray-100 p-5 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                      <Database size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Primary Database</h3>
                      <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">PostgreSQL + SQLAlchemy</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    A robust relational cloud database running on Render. It stores user accounts, hashed passwords, OAuth credentials, daily study streaks, and tracks badge unlocks using SQLAlchemy ORM models.
                  </p>
                </div>

                {/* AI & Vector */}
                <div className="border border-gray-100 p-5 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">AI & Vector Search</h3>
                      <p className="text-xs text-violet-600 font-bold uppercase tracking-wider">Google Gemini 1.5 + ChromaDB</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Powered by Google's Gemini 1.5 Flash via LangChain. Syllabuses are chunked, converted to Text Embeddings (text-embedding-004), and stored in an embedded <span className="font-semibold text-gray-900">ChromaDB</span> vector database running directly inside the FastAPI server for sub-millisecond semantic search retrieval (RAG).
                  </p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <button 
                  onClick={() => setShowTechPanel(false)}
                  className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                >
                  Close Panel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
