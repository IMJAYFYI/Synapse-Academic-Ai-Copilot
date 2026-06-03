import { NavLink, Link } from "react-router-dom";
import { LayoutDashboard, BookOpen, Calendar, Paperclip, Activity, BrainCircuit } from "lucide-react";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Study Session", path: "/session", icon: <BookOpen size={20} /> },
    { name: "Schedule & Plan", path: "/schedule", icon: <Calendar size={20} /> },
    { name: "Syllabus", path: "/syllabus", icon: <Paperclip size={20} /> },
    { name: "Activity Chart", path: "/activity", icon: <Activity size={20} /> },
  ];

  return (
    <div className="w-64 h-[calc(100vh-32px)] my-4 ml-4 rounded-[2rem] bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex flex-col py-6 transition-all duration-300 z-20 relative overflow-hidden">
      {/* Decorative gradient orb inside sidebar */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />

      <Link to="/" className="px-8 mb-10 flex items-center gap-3 hover:opacity-80 transition-opacity relative z-10">
        <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2 rounded-xl shadow-md">
          <BrainCircuit className="text-white" size={24} />
        </div>
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 font-outfit tracking-tight">
          Synapse
        </span>
      </Link>
      
      <nav className="flex-1 px-4 space-y-1.5 relative z-10">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            replace
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 font-medium ${
                isActive 
                  ? "bg-indigo-600 shadow-md shadow-indigo-500/20 text-white translate-x-1" 
                  : "text-gray-600 dark:text-slate-400 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-white"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Optional: User miniature profile or settings link at bottom */}
      <div className="px-6 mt-auto">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-slate-700 to-transparent mb-4" />
        <p className="text-xs text-center text-gray-400 dark:text-slate-500 font-medium">AI Study Coach v2.0</p>
      </div>
    </div>
  );
}