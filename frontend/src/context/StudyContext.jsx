import { createContext, useState, useContext, useEffect, useRef } from 'react';

export const TIMER_DURATIONS = { work: 25 * 60, short: 5 * 60, long: 15 * 60, test: 5, test_break: 5 };

const StudyContext = createContext();

export function StudyProvider({ children }) {
  // User auth uses sessionStorage so logins expire on browser close
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('synapse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [token, setToken] = useState(() => sessionStorage.getItem('synapse_token') || null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!user && !!token);
  
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${sessionStorage.getItem('synapse_token')}`
    };
    try {
      const response = await fetch(url, { ...options, headers });
      if (response.status === 401) {
        logout();
        window.location.href = '/login';
      }
      return response;
    } catch (error) {
      throw error;
    }
  };
  
  const [syllabusData, setSyllabusData] = useState(null);
  
  const [globalUnitData, setGlobalUnitData] = useState({});
  
  const [globalChatHistory, setGlobalChatHistory] = useState({});

  const [globalQuizHistory, setGlobalQuizHistory] = useState([]);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('synapse_theme') || 'dark');
  const [reminderTime, setReminderTime] = useState('18:00');
  const [globalActiveTopic, setGlobalActiveTopic] = useState("General Study");
  const [globalSystemMessage, setGlobalSystemMessage] = useState(null);

  // --- GLOBAL TIMER STATE ---
  const [timerMode, setTimerMode] = useState("work");
  const [timerTimeLeft, setTimerTimeLeft] = useState(TIMER_DURATIONS.work);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const expectedEndTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const audioCtxRef = useRef(null);
  
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const alarmIntervalRef = useRef(null);

  const stopAlarm = () => {
    setIsAlarmRinging(false);
    clearInterval(alarmIntervalRef.current);
  };

  const saveSessionToDatabaseGlobal = async () => {
    if (!user?.id || !globalActiveTopic) return;
    const minutesToLog = timerMode === "test" ? 25 : TIMER_DURATIONS.work / 60;
    try {
      const response = await authFetch("http://localhost:8000/api/record-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, topic_title: globalActiveTopic, duration_minutes: minutesToLog }),
      });
      const data = await response.json();
      let alertMsg = `✅ Session complete! Logged ${minutesToLog} minutes of **${globalActiveTopic}**.`;
      let bodyText = `Great job! You logged ${minutesToLog} minutes of ${globalActiveTopic}.`;
      
      if (data.new_badges && data.new_badges.length > 0) {
        alertMsg += `\n\n🏆 **Congratulations!** You just unlocked new badges: ${data.new_badges.join(", ")}`;
        bodyText += `\n🏆 You unlocked new badges: ${data.new_badges.join(", ")}`;
      }
      
      setGlobalSystemMessage({ topic: globalActiveTopic, text: alertMsg, timestamp: Date.now() });
      
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Pomodoro Complete!", { body: bodyText });
      }
    } catch (error) {
      console.error("Failed to save session globally", error);
    }
  };

  const toggleTimer = () => {
    if (timerIsRunning) {
      setTimerIsRunning(false);
      clearInterval(intervalRef.current);
    } else {
      // Initialize and unlock Web Audio API context safely on user click
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      
      setTimerIsRunning(true);
      expectedEndTimeRef.current = Date.now() + timerTimeLeft * 1000;
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remainingSeconds = Math.round((expectedEndTimeRef.current - now) / 1000);
        if (remainingSeconds <= 0) {
          clearInterval(intervalRef.current);
          setTimerTimeLeft(0);
          setTimerIsRunning(false);
          if (timerMode === "work" || timerMode === "test") {
            saveSessionToDatabaseGlobal();
          } else {
             if ("Notification" in window && Notification.permission === "granted") {
               new Notification("Break Over!", { body: `Time to get back to studying!` });
             }
             
             // Synthesize a foolproof digital alarm sound using Web Audio API
             const playBeep = () => {
               if (!audioCtxRef.current) return;
               const ctx = audioCtxRef.current;
               const osc = ctx.createOscillator();
               const gain = ctx.createGain();
               osc.type = 'square';
               osc.frequency.setValueAtTime(880, ctx.currentTime);
               
               gain.gain.setValueAtTime(0, ctx.currentTime);
               gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
               gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
               gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.25);
               gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
               
               osc.connect(gain);
               gain.connect(ctx.destination);
               osc.start(ctx.currentTime);
               osc.stop(ctx.currentTime + 0.4);
             };
             
             playBeep();
             alarmIntervalRef.current = setInterval(playBeep, 1000);
             setIsAlarmRinging(true);
          }
        } else {
          setTimerTimeLeft(remainingSeconds);
        }
      }, 100);
    }
  };

  const resetTimer = () => {
    setTimerIsRunning(false);
    clearInterval(intervalRef.current);
    setTimerTimeLeft(TIMER_DURATIONS[timerMode]);
  };

  const switchTimerMode = (newMode) => {
    setTimerMode(newMode);
    setTimerIsRunning(false);
    clearInterval(intervalRef.current);
    setTimerTimeLeft(TIMER_DURATIONS[newMode]);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('synapse_theme', theme);
  }, [theme]);

  // FIX 2: Sync to localStorage
  useEffect(() => {
    if (user && token) {
      sessionStorage.setItem('synapse_user', JSON.stringify(user));
      sessionStorage.setItem('synapse_token', token);
      setIsAuthenticated(true);
      
      // Sync state from backend
      const syncState = async () => {
        try {
          const response = await authFetch(`http://localhost:8000/api/sync-user-state/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.syllabus_data) {
              setSyllabusData({ id: data.syllabus_id, ...data.syllabus_data });
            }
            if (data.units_data && Object.keys(data.units_data).length > 0) {
              setGlobalUnitData(data.units_data);
            }
            if (data.quiz_results) {
              setGlobalQuizHistory(data.quiz_results);
            }
            if (data.theme) {
              setTheme(data.theme);
            }
            if (data.reminder_time) {
              setReminderTime(data.reminder_time);
            }
            if (data.last_active_topic) {
              setGlobalActiveTopic(data.last_active_topic);
            }
          }
        } catch (error) {
          console.error("Failed to sync user state:", error);
        }
      };
      syncState();
    } else {
      sessionStorage.removeItem('synapse_user');
      setIsAuthenticated(false);
    }
  }, [user]);

  // Removed localStorage sync effects

  // FIX 3: Master logout function that completely destroys the session
  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('synapse_user');
    sessionStorage.removeItem('synapse_token');
    
    // Clear global state
    setSyllabusData(null);
    setGlobalUnitData({});
    setGlobalChatHistory({});
    setGlobalQuizHistory([]);
    setTheme('dark');
  };

  return (
    <StudyContext.Provider value={{ 
      user, 
      setUser,
      token,
      setToken,
      isAuthenticated,
      authFetch,
      logout,
      syllabusData, setSyllabusData,
      globalUnitData, setGlobalUnitData,
      globalChatHistory, setGlobalChatHistory,
      globalQuizHistory, setGlobalQuizHistory,
      theme, setTheme,
      reminderTime, setReminderTime,
      globalActiveTopic, setGlobalActiveTopic,
      timerMode, setTimerMode,
      timerTimeLeft, setTimerTimeLeft,
      timerIsRunning, setTimerIsRunning,
      toggleTimer, resetTimer, switchTimerMode,
      globalSystemMessage,
      isAlarmRinging, stopAlarm
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudyContext() {
  return useContext(StudyContext);
}