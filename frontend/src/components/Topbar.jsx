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
    <div className="w-full flex justify-end px-8 py-4 bg-[#F9F8F6] dark:bg-[#191919] sticky top-0 z-50 border-b border-gray-200 dark:border-[#2C2C2C] transition-colors duration-300">
      <div className="flex items-center gap-6 relative">
        
        {/* Theme Toggle Switch */}
        <button
          onClick={async () => {
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            if (user?.id) {
              try {
                authFetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/settings/update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ user_id: user.id, theme: newTheme })
                });
              } catch (err) {
                console.error("Failed to update theme", err);
              }
            }
          }}
          className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {/* Reminders Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowReminders(!showReminders);
              if (isOpen) setIsOpen(false);
            }}
            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors relative"
          >
            <Bell size={20} />
            {reminderTime && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-600 rounded-full"></span>
            )}
          </button>

          {/* Reminders Dropdown */}
          {showReminders && (
            <div className="absolute right-0 mt-4 w-72 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-[#333]">
                <p className="text-sm font-bold font-playfair">Study Reminders</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {getReminderText()}
                </p>
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
            className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-sm font-medium hover:bg-emerald-800 transition-colors"
          >
            {user?.name?.charAt(0) || 'U'}
          </button>

        {/* Profile Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-4 w-56 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 z-50">
            
            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#333]">
              <p className="text-sm font-bold font-playfair truncate">{user?.name || 'Student'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || 'student@synapse.ai'}</p>
            </div>
            
            <button 
              onClick={() => {
                setShowSettings(true);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2C2C2C] flex items-center gap-3 transition-colors"
            >
              <Settings size={16} /> Account Settings
            </button>
            
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2C2C2C] transition-colors text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2 font-playfair tracking-tight">
              <Settings className="text-gray-900 dark:text-white" /> Account Settings
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl text-gray-900 dark:text-white font-medium">
                  {user?.name || "Student"}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <div className="w-full px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl text-gray-900 dark:text-white font-medium">
                  {user?.email || "No email"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Main Study Goal</label>
                <div className="w-full px-4 py-3 bg-gray-100 dark:bg-[#222222] border border-gray-300 dark:border-[#333333] rounded-xl text-gray-900 dark:text-white font-medium flex items-center gap-2">
                  <Check size={16} className="text-emerald-600 dark:text-emerald-400" /> {user?.main_goal || "General Learning"}
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
                          authFetch((import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/settings/update', {
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
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all font-bold text-gray-900 dark:text-white"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Changes are saved automatically.</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-black dark:hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}