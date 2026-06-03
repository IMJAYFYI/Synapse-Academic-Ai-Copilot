import { NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, Calendar, Activity, LogOut, BrainCircuit } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";

export default function Dock() {
  const { logout, isAuthenticated } = useStudyContext();

  if (!isAuthenticated) return null;

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={22} strokeWidth={2.5} /> },
    { name: "Syllabus", path: "/syllabus", icon: <BookOpen size={22} strokeWidth={2.5} /> },
    { name: "Schedule", path: "/schedule", icon: <Calendar size={22} strokeWidth={2.5} /> },
    { name: "Activity", path: "/activity", icon: <Activity size={22} strokeWidth={2.5} /> },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-500">
      <div className="flex items-center gap-2 px-4 py-3 bg-white/70 dark:bg-black/50 backdrop-blur-3xl border border-white/40 dark:border-white/10 rounded-[2rem] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
        
        {/* Brand Icon in Dock */}
        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-inner mr-2">
          <BrainCircuit className="text-white" size={24} />
        </div>
        
        <div className="w-px h-8 bg-gray-300/50 dark:bg-white/10 mx-1" />

        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={item.name}
            className={({ isActive }) =>
              `relative group w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ease-out hover:bg-white/50 dark:hover:bg-white/10 ${
                isActive ? "bg-white/80 dark:bg-white/15 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-600 dark:text-gray-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`transition-transform duration-300 group-hover:scale-110 group-active:scale-95 ${isActive ? 'scale-110 drop-shadow-md' : ''}`}>
                  {item.icon}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}
                
                {/* Tooltip */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-md shadow-xl whitespace-nowrap">
                  {item.name}
                </div>
              </>
            )}
          </NavLink>
        ))}

        <div className="w-px h-8 bg-gray-300/50 dark:bg-white/10 mx-1" />

        <button 
          onClick={logout}
          title="Logout"
          className="w-14 h-14 flex items-center justify-center rounded-2xl text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group relative"
        >
          <span className="transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
            <LogOut size={22} strokeWidth={2.5} />
          </span>
          {/* Tooltip */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 text-xs font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-md shadow-xl whitespace-nowrap">
            Logout
          </div>
        </button>

      </div>
    </div>
  );
}
