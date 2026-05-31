import { NavLink } from "react-router-dom";
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
    <div className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col pt-6">
      <div className="px-6 mb-8 flex items-center gap-2">
        <BrainCircuit className="text-indigo-600" size={28} />
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
          Synapse
        </span>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            replace
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? "bg-indigo-50 text-indigo-600 font-medium border border-indigo-100" 
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}