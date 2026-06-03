import { createContext, useState, useContext, useEffect } from 'react';

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
  
  const [theme, setTheme] = useState('dark');
  const [reminderTime, setReminderTime] = useState('18:00');
  const [globalActiveTopic, setGlobalActiveTopic] = useState("General Study");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    // Theme is saved to DB via API calls in Topbar, not here.
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
      globalActiveTopic, setGlobalActiveTopic
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudyContext() {
  return useContext(StudyContext);
}