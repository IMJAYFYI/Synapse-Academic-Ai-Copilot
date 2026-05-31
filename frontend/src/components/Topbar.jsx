import { useState, useEffect } from "react";
import { User, LogOut, Settings, Bell, X, Check } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // FIX 1: Pull 'user' and the master 'logout' function from context
  const { user, logout } = useStudyContext(); 
  const navigate = useNavigate();

  const handleLogout = () => {
    // FIX 2: Call the master logout to wipe everything securely
    logout(); 
    // Redirect to login wall
    navigate("/login");
  };

  // Calculate reminder text based on user preference
  const getReminderText = () => {
    if (!user?.study_time) return "No reminders set yet.";
    return `Your AI coach has scheduled a study block for your preferred time: ${user.study_time}.`;
  };

  return (
    <div className="w-full flex justify-end px-8 py-4 bg-white/40 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="flex items-center gap-4 relative">
        
        {/* Reminders Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowReminders(!showReminders);
              if (isOpen) setIsOpen(false);
            }}
            className="p-2.5 rounded-full hover:bg-white/60 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 relative"
          >
            <Bell size={20} className="text-gray-600" />
            {user?.study_time && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {/* Reminders Dropdown */}
          {showReminders && (
            <div className="absolute right-0 mt-2 w-72 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white py-3 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-2 border-b border-gray-100 mb-2">
                <p className="text-sm font-bold text-gray-900">Study Reminders</p>
              </div>
              <div className="px-4 py-3">
                <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
                  <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                    {getReminderText()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar Button */}
        <div className="relative">
          <button
            onClick={() => {
              setIsOpen(!isOpen);
              if (showReminders) setShowReminders(false);
            }}
            className="bg-gradient-to-r from-indigo-100 to-violet-100 p-2.5 rounded-full hover:shadow-md transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-white"
          >
            <User size={20} className="text-indigo-700" />
          </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            
            <div className="px-4 py-3 border-b border-gray-50 mb-1">
              {/* FIX 3: Display dynamic user data instead of hardcoded text */}
              <p className="text-sm font-bold text-gray-900">{user?.name || "Student"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || "No email"}</p>
            </div>
            
            <button 
              onClick={() => {
                setShowSettings(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Settings size={16} /> Account Settings
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors mt-1 font-medium"
            >
              <LogOut size={16} /> Log Out
            </button>
            
          </div>
        )}
        </div>
      </div>

      {/* Account Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          
          {/* Modal Content */}
          <div className="relative bg-white/90 backdrop-blur-xl border border-white rounded-3xl p-8 w-full max-w-md shadow-[0_20px_60px_rgb(0,0,0,0.1)] animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="text-indigo-600" /> Account Settings
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <div className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                  {user?.name || "Student"}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <div className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                  {user?.email || "No email"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Main Study Goal</label>
                <div className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-indigo-900 font-medium flex items-center gap-2">
                  <Check size={16} className="text-indigo-600" /> {user?.main_goal || "General Learning"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Daily Reminder Time</label>
                <div className="flex gap-2">
                  <input 
                    type="time" 
                    defaultValue={localStorage.getItem("synapse_reminder_time") || "18:00"}
                    onChange={(e) => {
                      localStorage.setItem("synapse_reminder_time", e.target.value);
                      if ("Notification" in window && Notification.permission !== "granted") {
                        Notification.requestPermission();
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-bold text-indigo-900"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Changes are saved automatically.</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}