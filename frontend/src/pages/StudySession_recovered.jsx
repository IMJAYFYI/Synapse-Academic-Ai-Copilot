import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Play, Pause, RotateCcw, Send, CheckCircle2, Brain, Coffee, MoreVertical, Maximize2, Zap } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";

export default function StudySession() {
  // Removed globalChatHistory - we are strictly using PostgreSQL now!
  const { user, syllabusData, globalUnitData } = useStudyContext();
  const location = useLocation();

  const durations = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };

  const [activeTopic, setActiveTopic] = useState(
    location.state?.selectedTopic || syllabusData?.topics?.[0]?.title || "General Study"
  );
  
  const [mode, setMode] = useState("work");
  const [timeLeft, setTimeLeft] = useState(durations.work);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const expectedEndTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const chatEndRef = useRef(null);

  // --- DATABASE-BACKED CHAT MEMORY ---
  const defaultMsg = { sender: 'ai', text: "I am ready. Select a topic, start the timer, or click **Start Interactive Lesson** to begin." };
  const [chatMessages, setChatMessages] = useState([defaultMsg]);

  // 1. The Auto-Scroller
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 2. Fetch history from PostgreSQL whenever the active subject changes
  useEffect(() => {
    if (!user?.id) return; // Guard clause to ensure user is logged in
    
    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/chat/history/${user.id}/${encodeURIComponent(activeTopic)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.history && data.history.length > 0) {
            setChatMessages(data.history);
          } else {
            setChatMessages([defaultMsg]);
          }
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
      }
    };
    
    fetchHistory();
  }, [activeTopic, user]);

  const updateChatMessages = (updater) => {
    setChatMessages(updater);
  };

  const saveSessionToDatabase = async () => {
    setIsSaving(true);
    const minutesToLog = durations.work / 60;
    try {
      const response = await fetch("http://localhost:8000/api/record-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, topic_title: activeTopic, duration_minutes: minutesToLog }),
      });
      if (!response.ok) throw new Error("Failed to save");
      
      updateChatMessages(prev => [...prev, { sender: 'ai', text: `✅ Session complete! Logged ${minutesToLog} minutes of **${activeTopic}**.` }]);
    } catch (error) {
      updateChatMessages(prev => [...prev, { sender: 'ai', text: `❌ Error: Failed to save session.` }]);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleTimer = () => {
    if (isRunning) {
      setIsRunning(false);
      clearInterval(intervalRef.current);
    } else {
      setIsRunning(true);
      expectedEndTimeRef.current = Date.now() + timeLeft * 1000;
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const remainingSeconds = Math.round((expectedEndTimeRef.current - now) / 1000);
        if (remainingSeconds <= 0) {
          clearInterval(intervalRef.current);
          setTimeLeft(0);
          setIsRunning(false);
          if (mode === "work") saveSessionToDatabase();
        } else {
          setTimeLeft(remainingSeconds);
        }
      }, 100);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(durations[mode]);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(durations[newMode]);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  const sendChatMessage = async (userText, hiddenSystemPrompt = null) => {
    setChatInput("");
    setIsTyping(true);

    updateChatMessages(prev => [...prev, { sender: 'user', text: userText }]);

    try {
      const response = await fetch(`http://localhost:8000/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText, // The clean text ("Let's start the interactive lesson...")
          hidden_prompt: hiddenSystemPrompt, // The massive syllabus text
          history: chatMessages, 
          active_topic: activeTopic,
          user_id: user.id
        }),
      });

      if (!response.ok) throw new Error("Failed to communicate");
      const data = await response.json();
      
      updateChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      
    } catch (error) {
      updateChatMessages(prev => [...prev, { sender: 'ai', text: "❌ Connection error." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;
    sendChatMessage(chatInput);
  };

  const handleAutoTeach = () => {
    if (isTyping) return;
    
    const topicIndex = syllabusData?.topics?.findIndex(t => t.title === activeTopic);
    const specificUnits = globalUnitData[topicIndex];

    let systemPrompt = `Act as an expert tutor. I want to start learning ${activeTopic}. `;
    
    if (specificUnits) {
      systemPrompt += `Here is my exact syllabus breakdown: ${JSON.stringify(specificUnits)}. Start by teaching me the VERY FIRST concept of Unit 1. Keep it concise, use bullet points, and end your response by asking me a quick question to test my understanding before we move on.`;
    } else {
      systemPrompt += `Start from the absolute basics. Keep it concise, use bullet points, and end your response by asking me a quick question to test my understanding before we move on.`;
    }

    sendChatMessage("Let's start the interactive lesson for this module.", systemPrompt);
  };

  return (
    <div className="h-[calc(100vh-2rem)] p-4 md:p-8 max-w-[1600px] mx-auto flex flex-col">
      
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
        <div className="flex items-center gap-4">
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-green-500 animate-pulse" : "bg-indigo-500"}`}></span> 
            {isSaving ? "Saving..." : "Active Session"}
          </span>
          
          <select 
            value={activeTopic}
            onChange={(e) => setActiveTopic(e.target.value)}
            disabled={isRunning}
            className="text-lg font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 cursor-pointer hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            {syllabusData?.topics ? (
              syllabusData.topics.map((topic, i) => (
                <option key={i} value={topic.title}>{topic.title}</option>
              ))
            ) : (
              <option value="General Study">General Study</option>
            )}
          </select>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button onClick={() => switchMode("work")} className={`px-4 py-1.5 font-medium rounded-md text-sm flex items-center gap-2 transition-all ${mode === "work" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}><Brain size={16} /> Work</button>
            <button onClick={() => switchMode("short")} className={`px-4 py-1.5 font-medium rounded-md text-sm flex items-center gap-2 transition-all ${mode === "short" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}><Coffee size={16} /> Short Break</button>
            <button onClick={() => switchMode("long")} className={`px-4 py-1.5 font-medium rounded-md text-sm flex items-center gap-2 transition-all ${mode === "long" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}><Coffee size={16} /> Long Break</button>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-gray-900 tracking-tight min-w-[90px] text-center">{formatTime(timeLeft)}</span>
            <div className="flex gap-2">
              <button onClick={toggleTimer} className={`p-2 rounded-full transition-colors ${isRunning ? "bg-amber-100 text-amber-600 hover:bg-amber-200" : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"}`}>
                {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button onClick={resetTimer} className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                <RotateCcw size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <PanelGroup direction="horizontal" className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        
        <Panel defaultSize={65} minSize={40} className="flex flex-col">
          <div className="flex justify-between items-center border-b border-gray-100 px-6 py-3">
            <div className="flex gap-6">
              <button className="text-indigo-600 font-semibold border-b-2 border-indigo-600 pb-3 -mb-3">Smart Notes</button>
              <button className="text-gray-400 font-medium pb-3 -mb-3 hover:text-gray-600">Quiz</button>
            </div>
            <button className="text-gray-400 hover:text-gray-600"><Maximize2 size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{activeTopic}</h2>
            <p className="text-gray-700 mb-8 leading-relaxed">Dynamic AI notes will populate here based on your conversation.</p>
          </div>
        </Panel>

        <PanelResizeHandle className="w-1 bg-gray-100 hover:bg-indigo-400 transition-colors cursor-col-resize active:bg-indigo-600" />

        <Panel defaultSize={35} minSize={25} className="flex flex-col bg-gray-50/50 relative">
          <div className="flex justify-between items-center border-b border-gray-100 px-6 py-4 bg-white">
            <div className="flex items-center gap-2 text-indigo-700 font-bold">
              <span className="text-xl">✨</span> AI Study Coach
            </div>
            <button className="text-gray-400 hover:text-gray-600"><MoreVertical size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                    <Brain size={16} />
                  </div>
                )}
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed overflow-hidden ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-700 rounded-tl-none prose prose-sm max-w-none'
                }`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-200">
            <button 
              onClick={handleAutoTeach}
              disabled={isTyping}
              className="w-full mb-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Zap size={14} fill="currentColor" /> Start Interactive Lesson
            </button>

            <form onSubmit={handleChatSubmit} className="relative">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isTyping}
                placeholder={isTyping ? "AI is thinking..." : "Ask a doubt or request an explanation..."} 
                className="w-full bg-gray-100 border-transparent rounded-xl pl-4 pr-12 py-3.5 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all disabled:opacity-50"
              />
              <button type="submit" disabled={isTyping} className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                <Send size={16} />
              </button>
            </form>
          </div>
        </Panel>

      </PanelGroup>
    </div>
  );
}