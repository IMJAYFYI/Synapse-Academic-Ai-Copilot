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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden">
      {/* Background Neural Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="w-full px-8 py-6 flex justify-between items-center z-10">
        <div 
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
          onClick={() => navigate('/')}
        >
          <BrainCircuit className="text-indigo-600" size={28} />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
            Synapse
          </span>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/onboarding')}
            className="px-5 py-2 text-sm font-semibold bg-white border border-gray-200 text-indigo-600 rounded-full hover:shadow-md hover:border-indigo-100 transition-all flex items-center gap-2"
          >
            Start Free <ArrowRight size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 mt-16 mb-32">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 backdrop-blur-md border border-indigo-100 text-sm font-bold mb-10 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group cursor-default min-w-[280px] justify-center">
          <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
          <Sparkles size={16} className="text-emerald-500" />
          <span key={featureIndex} className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-wide animate-[fadeIn_0.5s_ease-in-out]">
            {features[featureIndex]}
          </span>
        </div>
        
        <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight max-w-4xl leading-tight mb-8 font-outfit">
          Your Syllabus. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500 drop-shadow-sm">
            Your Personal AI Tutor.
          </span>
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mb-12 font-medium">
          Upload any PDF syllabus. Synapse instantly generates a structured study plan, quizzes you on core concepts, and provides 1-on-1 interactive tutoring.
        </p>

        <button 
          onClick={() => navigate('/onboarding')}
          className="px-10 py-5 text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:opacity-90 transition-all transform hover:-translate-y-1 flex items-center gap-3"
        >
          Start Learning for Free <ArrowRight size={22} />
        </button>
      </main>

      {/* Features Grid - Neural Glass Effect */}
      <section className="w-full max-w-7xl mx-auto px-4 pb-32 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Feature 1 */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.12)] transition-all hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mb-6 text-indigo-600 shadow-inner">
              <BookOpen size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 font-outfit tracking-tight">Smart Notes</h3>
            <p className="text-base text-gray-500 font-medium leading-relaxed">Never write a summary again. Synapse automatically extracts definitions, key points, and formulas from your chats.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] transition-all hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mb-6 text-emerald-600 shadow-inner">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 font-outfit tracking-tight">Dynamic Quizzes</h3>
            <p className="text-base text-gray-500 font-medium leading-relaxed">Ensure you actually understand. Generate multiple-choice quizzes ranging from easy to hard based on your exact module.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/80 backdrop-blur-2xl border border-white/60 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.12)] transition-all hover:-translate-y-1">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl flex items-center justify-center mb-6 text-orange-600 shadow-inner">
              <Target size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 font-outfit tracking-tight">Gamified Streaks</h3>
            <p className="text-base text-gray-500 font-medium leading-relaxed">Stay motivated by maintaining your daily study streak, unlocking badges, and tracking your long-term progress.</p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] transition-all">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 text-orange-600">
              <Activity size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Activity Heatmaps</h3>
            <p className="text-sm text-gray-500">Track your consistency with GitHub-style contribution graphs. Build streaks and watch your productivity heat up over time.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
