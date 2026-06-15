import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, BookOpen, Target, Activity, ArrowRight, Zap, Sparkles } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const [featureIndex, setFeatureIndex] = useState(0);
  
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
            onClick={() => navigate('/onboarding')}
            className="px-5 py-2 text-sm font-bold bg-white border border-gray-200 text-gray-900 rounded-full hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            Start Free <ArrowRight size={16} />
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
    </div>
  );
}
