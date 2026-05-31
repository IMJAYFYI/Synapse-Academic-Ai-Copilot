import { createContext, useState, useContext, useEffect } from 'react';

const StudyContext = createContext();

export function StudyProvider({ children }) {
  // User auth uses sessionStorage so logins expire on browser close
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('synapse_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  
  const [syllabusData, setSyllabusData] = useState(() => {
    const saved = localStorage.getItem('synapse_syllabus');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [globalUnitData, setGlobalUnitData] = useState(() => {
    const saved = localStorage.getItem('synapse_units');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [globalChatHistory, setGlobalChatHistory] = useState(() => {
    const saved = localStorage.getItem('synapse_chats');
    return saved ? JSON.parse(saved) : {};
  });

  const [globalQuizHistory, setGlobalQuizHistory] = useState([]);

  // FIX 2: Sync to localStorage
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('synapse_user', JSON.stringify(user));
      setIsAuthenticated(true);
      
      // Sync state from backend
      const syncState = async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/sync-user-state/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.syllabus_data) {
              setSyllabusData({ id: data.syllabus_id, ...data.syllabus_data });
            }
            if (data.units_data && Object.keys(data.units_data).length > 0) {
              setGlobalUnitData(data.units_data);
            }
            if (data.last_active_topic) {
              localStorage.setItem("synapse_active_topic", data.last_active_topic);
            }
            if (data.quiz_results) {
              setGlobalQuizHistory(data.quiz_results);
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

  useEffect(() => {
    if (syllabusData) localStorage.setItem('synapse_syllabus', JSON.stringify(syllabusData));
    else localStorage.removeItem('synapse_syllabus');
  }, [syllabusData]);

  useEffect(() => {
    localStorage.setItem('synapse_units', JSON.stringify(globalUnitData));
  }, [globalUnitData]);

  useEffect(() => {
    localStorage.setItem('synapse_chats', JSON.stringify(globalChatHistory));
  }, [globalChatHistory]);

  // FIX 3: Master logout function that completely destroys the session
  const logout = () => {
    setUser(null);
    setSyllabusData(null);
    setGlobalUnitData({});
    setGlobalChatHistory({});
    sessionStorage.removeItem('synapse_user'); // Hard wipe auth
    localStorage.removeItem('synapse_syllabus');
    localStorage.removeItem('synapse_units');
    localStorage.removeItem('synapse_chats');
    localStorage.removeItem('synapse_active_topic');
    setGlobalQuizHistory([]);
  };

  return (
    <StudyContext.Provider value={{ 
      user, setUser, 
      isAuthenticated, setIsAuthenticated,
      logout,
      syllabusData, setSyllabusData,
      globalUnitData, setGlobalUnitData,
      globalChatHistory, setGlobalChatHistory,
      globalQuizHistory, setGlobalQuizHistory
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudyContext() {
  return useContext(StudyContext);
}