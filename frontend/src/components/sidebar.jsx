import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, Calendar, Paperclip, Activity, BrainCircuit, Quote } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Study Session", path: "/session", icon: <BookOpen size={20} /> },
    { name: "Schedule & Plan", path: "/schedule", icon: <Calendar size={20} /> },
    { name: "Syllabus", path: "/syllabus", icon: <Paperclip size={20} /> },
    { name: "Activity Chart", path: "/activity", icon: <Activity size={20} /> },
  ];

  const quotes = [
    { text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
    { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
    { text: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" }
  ];
  
  // Pick a quote based on the current day of the year so it changes daily
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const dailyQuote = quotes[dayOfYear % quotes.length];

  return (
    <div className="w-64 h-full bg-[#F9F8F6] dark:bg-[#191919] border-r border-gray-200 dark:border-[#2C2C2C] flex flex-col py-8 transition-colors duration-300 z-20">
      
      <Link to="/" className="px-8 mb-12 flex items-center gap-3 group">
        <div className="text-emerald-700 dark:text-emerald-400 group-hover:opacity-80 transition-opacity">
          <BrainCircuit size={28} />
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white font-playfair tracking-tight">
          Synapse.
        </span>
      </Link>
      
      <nav className="flex-1 px-4 space-y-1 relative z-10">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            replace
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 transition-all duration-200 font-medium ${
                isActive 
                  ? "bg-gray-100 dark:bg-[#2C2C2C] text-emerald-800 dark:text-emerald-400 rounded-lg" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222] rounded-lg"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Daily Study Quote */}
      <div className="px-6 mt-auto">
        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 relative overflow-hidden transition-colors duration-300">
          <Quote size={40} className="absolute -top-2 -right-2 text-emerald-200 dark:text-emerald-800/40 rotate-12" />
          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium italic leading-relaxed relative z-10 font-playfair">
            "{dailyQuote.text}"
          </p>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-3 text-right uppercase tracking-wider relative z-10">
            — {dailyQuote.author}
          </p>
        </div>
      </div>
    </div>
  );
}