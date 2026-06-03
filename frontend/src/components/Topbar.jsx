import { useState, useEffect } from "react";
import { User, LogOut, Settings, Bell, X, Check, Moon, Sun } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showReminders, setShowReminders] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  // FIX 1: Pull 'user', 'theme', 'setTheme' and the master 'logout' function from context
  const { user, logout, theme, setTheme, reminderTime, setReminderTime, authFetch } = useStudyContext(); 
  const navigate = useNavigate();

  const handleLogout = () => {
    // FIX 2: Call the master logout to wipe everything securely
    logout(); 
    // Redirect to login wall
    navigate("/login");
  };

  // Calculate reminder text based on user preference
  const getReminderText = () => {
    if (!reminderTime) return "No reminders set yet.";
    return `Your AI coach has scheduled a study block for your preferred time: ${reminderTime}.`;
  };

  return (
    <div className="w-full flex justify-end px-8 py-6 bg-transparent sticky top-0 z-50 transition-colors duration-300 pointer-events-none">
      <div className="flex items-center gap-4 relative bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-xl px-6 py-2.5 rounded-[2rem] border border-white/40 dark:border-slate-700/50 shadow-[0_4px_20px_rgb(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgb(0,0,0,0.2)] pointer-events-auto">
        
        {/* Theme Toggle Switch */}
        <div className="flex items-center gap-2 mr-2">
          <Sun size={16} className="text-gray-500 dark:text-gray-400" />
          <button
            onClick={async () => {
              const newTheme = theme === 'dark' ? 'light' : 'dark';
              setTheme(newTheme);
              if (user?.id) {
                try {
                  authFetch('http://localhost:8000/api/settings/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id, theme: newTheme })
                  });
                } catch (err) {
                  console.error("Failed to update theme", err);
                }
              }
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
              theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <Moon size={16} className="text-gray-400 dark:text-gray-300" />
        </div>
        
        {/* Reminders Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowReminders(!showReminders);
              if (isOpen) setIsOpen(false);
            }}
            className="p-2.5 rounded-full hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500 relative"
          >
            <Bell size={20} className="text-gray-600 dark:text-gray-300" />
            {reminderTime && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-800"></span>
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
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
          >
            <User size={20} />
          </button>

        {/* Profile Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-white dark:border-slate-700 py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            
            <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name || 'Student'}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email || 'student@synapse.ai'}</p>
            </div>
            
            <button 
              onClick={() => {
                setShowSettings(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors"
            >
              <Settings size={16} /> Account Settings
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2 transition-colors mt-1 font-medium"
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
          <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white dark:border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-[0_20px_60px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_60px_rgb(0,0,0,0.5)] animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Settings className="text-indigo-600 dark:text-indigo-400" /> Account Settings
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <div className="w-full px-4 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-medium">
                  {user?.name || "Student"}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <div className="w-full px-4 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white font-medium">
                  {user?.email || "No email"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Main Study Goal</label>
                <div className="w-full px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/30 rounded-xl text-indigo-900 dark:text-indigo-300 font-medium flex items-center gap-2">
                  <Check size={16} className="text-indigo-600 dark:text-indigo-400" /> {user?.main_goal || "General Learning"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Daily Reminder Time</label>
                <div className="flex gap-2">
                  <input 
                    type="time" 
                    value={reminderTime}
                    onChange={(e) => {
                      setReminderTime(e.target.value);
                      if (user?.id) {
                        try {
                          authFetch('http://localhost:8000/api/settings/update', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: user.id, reminder_time: e.target.value })
                          });
                        } catch (err) {
                          console.error("Failed to update reminder", err);
                        }
                      }
                      if ("Notification" in window && Notification.permission !== "granted") {
                        Notification.requestPermission();
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-bold text-indigo-900 dark:text-indigo-300"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Changes are saved automatically.</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-8 py-3 bg-gray-900 dark:bg-indigo-600 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}