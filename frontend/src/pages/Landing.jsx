import { useNavigate } from "react-router-dom";
import { BrainCircuit, BookOpen, Target, Activity, ArrowRight, Zap } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative overflow-hidden">
      {/* Background Neural Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      {/* Navigation */}
      <nav className="w-full px-8 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
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
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 mt-12 mb-24">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-md border border-indigo-100 text-indigo-700 text-xs font-bold mb-8 shadow-sm">
          <Zap size={14} className="fill-indigo-500" /> Version 2.0 is Live
        </div>
        
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight max-w-3xl leading-tight mb-6">
          Your Syllabus. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">
            Your Personal AI Tutor.
          </span>
        </h1>
        
        <p className="text-lg text-gray-500 max-w-xl mb-10">
          Upload any PDF syllabus. Synapse instantly generates a structured study plan, quizzes you on core concepts, and provides 1-on-1 interactive tutoring.
        </p>

        <button 
          onClick={() => navigate('/onboarding')}
          className="px-8 py-4 text-base font-bold bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1 flex items-center gap-3"
        >
          Start Learning for Free <ArrowRight size={20} />
        </button>
      </main>

      {/* Features Grid - Neural Glass Effect */}
      <section className="w-full max-w-6xl mx-auto px-4 pb-24 z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1 */}
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] transition-all">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Smart Notes</h3>
            <p className="text-sm text-gray-500">Never write a summary again. Synapse automatically extracts definitions, key points, and formulas from your chats.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] transition-all">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 text-emerald-600">
              <Target size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Adaptive Quizzes</h3>
            <p className="text-sm text-gray-500">Test your mastery. Generate perfectly tailored multiple-choice quizzes targeting specific units and difficulty levels.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] transition-all">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 text-blue-600">
              <BrainCircuit size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Auto-Planning</h3>
            <p className="text-sm text-gray-500">Upload a raw syllabus PDF. Synapse maps out the entire curriculum, breaking it down into bite-sized daily modules.</p>
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
