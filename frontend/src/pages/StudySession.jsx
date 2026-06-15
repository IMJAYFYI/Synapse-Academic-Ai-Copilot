import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Play, Pause, RotateCcw, Send, CheckCircle2, BookOpen, Brain, Maximize2, Minimize2, Loader2, FileText, GraduationCap, RefreshCw, Lightbulb, ArrowRight, AlarmClock } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function StudySession() {
  return (
    <ErrorBoundary>
      <StudySessionContent />
    </ErrorBoundary>
  );
}

function StudySessionContent() {
  const { user, syllabusData, globalUnitData, globalQuizHistory, setGlobalQuizHistory, globalActiveTopic, setGlobalActiveTopic, authFetch, timerMode, timerTimeLeft, timerIsRunning, toggleTimer, resetTimer, switchTimerMode, globalSystemMessage, isAlarmRinging, stopAlarm } = useStudyContext();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.selectedTopic) {
      setGlobalActiveTopic(location.state.selectedTopic);
      // Clear the state so a page refresh doesn't force the old topic again
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.selectedTopic, setGlobalActiveTopic]);

  const activeTopic = globalActiveTopic || "General Study";
  const setActiveTopic = setGlobalActiveTopic;
  const [fullscreenPanel, setFullscreenPanel] = useState(null);

  const topicQuizHistory = globalQuizHistory?.filter(q => q.topic === activeTopic) || [];


  

  const [isSaving, setIsSaving] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // --- LEFT PANEL STATE ---
  const [activeLeftTab, setActiveLeftTab] = useState("notes");
  
  // Notes state
  const [notes, setNotes] = useState(null);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [messageCountSinceNotes, setMessageCountSinceNotes] = useState(0);
  
  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizDifficulty, setQuizDifficulty] = useState("medium");
  const [quizNumQuestions, setQuizNumQuestions] = useState(5);
  const [quizTargetUnit, setQuizTargetUnit] = useState("Full Topic");

  const chatEndRef = useRef(null);

  // --- DATABASE-BACKED CHAT MEMORY ---
  const defaultMsg = { sender: 'ai', text: "I am ready. Select a topic, start the timer, or click **Start Interactive Lesson** to begin." };
  const [chatMessages, setChatMessages] = useState([defaultMsg]);
  const hasStartedLesson = chatMessages?.length > 1;

  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    if (!scrollTimeoutRef.current) {
      scrollTimeoutRef.current = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        scrollTimeoutRef.current = null;
      }, 100);
    }
    
    // Cleanup on unmount
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, [chatMessages]);

  useEffect(() => {
    if (!user?.id) return; 
    const fetchHistory = async () => {
      try {
        const response = await authFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/history/${user.id}/${encodeURIComponent(activeTopic)}`);
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

  useEffect(() => {
    if (!user?.id) return;
    const fetchNotes = async () => {
      try {
        const response = await authFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/notes/${user.id}/${encodeURIComponent(activeTopic)}`);
        if (response.ok) {
          const data = await response.json();
          setNotes(data.notes);
        } else {
          setNotes(null);
        }
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      }
    };
    fetchNotes();
    setQuiz(null);
    setUserAnswers({});
    setIsQuizSubmitted(false);
    setMessageCountSinceNotes(0);
    setQuizTargetUnit("Full Topic");
  }, [activeTopic, user]);

  useEffect(() => {
    if (globalSystemMessage && globalSystemMessage.topic === activeTopic) {
      updateChatMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.text === globalSystemMessage.text) return prev;
        return [...prev, { sender: 'ai', text: globalSystemMessage.text }];
      });
    }
  }, [globalSystemMessage, activeTopic]);

  const updateChatMessages = (updater) => {
    setChatMessages(updater);
    if (notes && typeof updater === 'function') {
      setMessageCountSinceNotes(prev => prev + 1);
    }
  };



  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };



  const sendChatMessage = async (userText, hiddenSystemPrompt = null) => {
    setChatInput("");
    setIsTyping(true);
    updateChatMessages(prev => [...prev, { sender: 'user', text: userText }]);

    const topicIndex = syllabusData?.topics?.findIndex(t => t.title === activeTopic);
    const specificUnits = globalUnitData?.[topicIndex];

    try {
      const response = await authFetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText, 
          hidden_prompt: hiddenSystemPrompt, 
          history: chatMessages, 
          active_topic: activeTopic,
          user_id: user.id,
          syllabus_context: specificUnits ? JSON.stringify(specificUnits) : null
        }),
      });

      if (!response.ok) throw new Error("Failed to communicate");
      
      updateChatMessages(prev => [...prev, { sender: 'ai', text: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunkString = decoder.decode(value, { stream: true });
        const lines = chunkString.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr.trim()) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                updateChatMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1] = { 
                    ...newMsgs[newMsgs.length - 1], 
                    text: newMsgs[newMsgs.length - 1].text + parsed.chunk 
                  };
                  return newMsgs;
                });
              }
            } catch (e) {
              console.error("Error parsing SSE JSON", e);
            }
          }
        }
      }

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
    const specificUnits = globalUnitData?.[topicIndex];

    let systemPrompt = `Act as an expert tutor. I want to start learning ${activeTopic}. `;
    if (specificUnits) {
      systemPrompt += `Here is my exact syllabus breakdown: ${JSON.stringify(specificUnits)}. Start by teaching me the VERY FIRST concept of Unit 1. Keep it concise, use bullet points, and end your response by asking me a quick question to test my understanding before we move on.`;
    } else {
      systemPrompt += `Start from the absolute basics. Keep it concise, use bullet points, and end your response by asking me a quick question to test my understanding before we move on.`;
    }
    sendChatMessage("Let's start the interactive lesson for this module.", systemPrompt);
  };

  const handleGenerateNotes = async () => {
    if (!user?.id) return;
    setIsGeneratingNotes(true);
    try {
      const response = await authFetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, topic: activeTopic })
      });
      if (!response.ok) throw new Error("Failed to generate notes");
      const data = await response.json();
      setNotes(data.notes);
      setMessageCountSinceNotes(0);
    } catch (error) {
      console.error(error);
      alert("Error generating notes. Make sure you have chatted with the AI first.");
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!user?.id) return;
    setIsGeneratingQuiz(true);
    setQuiz(null);
    setUserAnswers({});
    setIsQuizSubmitted(false);
    try {
      // Modify topic to include unit target if specified
      const finalTopic = quizTargetUnit === "Full Topic" ? activeTopic : `${activeTopic} - ${quizTargetUnit}`;
      const response = await authFetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: user.id, 
          topic: finalTopic,
          difficulty: quizDifficulty,
          num_questions: quizNumQuestions,
          syllabus_id: syllabusData?.id
        })
      });
      if (!response.ok) throw new Error("Failed to generate quiz");
      const data = await response.json();
      setQuiz(data.quiz);
    } catch (error) {
      console.error(error);
      alert("Error generating quiz.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleQuizOptionSelect = (qIdx, optionLabel) => {
    if (isQuizSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [qIdx]: optionLabel }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(userAnswers).length < quiz.questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setIsQuizSubmitted(true);
    
    const score = quiz.questions.reduce((acc, q, idx) => {
      return acc + (userAnswers[idx] === q.correct_answer ? 1 : 0);
    }, 0);

    try {
      await authFetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          topic: activeTopic,
          score: score,
          total: quiz.questions.length,
          quiz_json: JSON.stringify(quiz)
        })
      });
      
      // Update local state instantly so the UI shows the new score
      setGlobalQuizHistory(prev => [...prev, {
        topic: activeTopic,
        score: score,
        total: quiz.questions.length
      }]);
      
    } catch (error) {
      console.error("Failed to submit quiz score", error);
    }
  };

  const getQuizScore = () => {
    if (!quiz || !isQuizSubmitted || !Array.isArray(quiz.questions)) return { score: 0, total: 0 };
    const score = quiz.questions.reduce((acc, q, idx) => {
      return acc + (userAnswers[idx] === q.correct_answer ? 1 : 0);
    }, 0);
    return { score, total: quiz.questions.length };
  };

  return (
    <div className={`flex-1 flex flex-col p-6 relative min-h-0 ${fullscreenPanel ? 'z-[100]' : 'z-10'}`}>
      
      {isAlarmRinging && (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-md w-full mx-4 border border-emerald-500/30">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <AlarmClock size={40} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 text-center font-playfair tracking-tight">Break is Over!</h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-8 font-medium">Time to get back to studying and crush your goals.</p>
            <button 
              onClick={stopAlarm}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-1 text-lg"
            >
              Stop Alarm
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 mb-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white dark:border-slate-700 p-5 shrink-0 transition-colors duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 text-gray-900 dark:text-white flex items-center gap-4 transition-colors duration-300 font-playfair">
              <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-xl">
                <BookOpen className="text-blue-600 dark:text-blue-400" size={28} />
              </div>
              Study Session
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 dark:text-gray-400 font-medium text-sm transition-colors duration-300">Currently studying:</span>
              <select 
                value={activeTopic}
                onChange={(e) => {
                  const newTopic = e.target.value;
                  setActiveTopic(newTopic);
                  if (user?.id) {
                    authFetch((import.meta.env.VITE_API_URL || "http://localhost:8000") + "/api/update-active-topic", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ user_id: user.id, active_topic: newTopic })
                    }).catch(err => console.error("Failed to sync active topic", err));
                  }
                }}
                className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-lg py-1.5 px-3 text-sm font-bold text-emerald-800 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-700 shadow-sm cursor-pointer transition-colors duration-300"
              >
                {Array.isArray(syllabusData?.topics) && syllabusData.topics.map((topic, i) => (
                  <option key={i} value={topic?.title || `Topic ${i}`}>{topic?.title || `Topic ${i}`}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] p-1 gap-1 transition-colors duration-300">
              <button onClick={() => switchTimerMode("work")} className={`px-4 py-2 text-sm font-bold ${timerMode === "work" ? "bg-emerald-800 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222]"}`}>Pomodoro</button>
              <button onClick={() => switchTimerMode("short")} className={`px-4 py-2 text-sm font-bold ${timerMode === "short" ? "bg-emerald-700 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222]"}`}>Short Break</button>
              <button onClick={() => switchTimerMode("long")} className={`px-4 py-2 text-sm font-bold ${timerMode === "long" ? "bg-teal-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222]"}`}>Long Break</button>
              <button onClick={() => switchTimerMode("test")} className={`px-4 py-2 text-sm font-bold ${timerMode === "test" ? "bg-red-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222]"}`}>Test (5s)</button>
              <button onClick={() => switchTimerMode("test_break")} className={`px-4 py-2 text-sm font-bold ${timerMode === "test_break" ? "bg-amber-500 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#222]"}`}>Test Break (5s)</button>
            </div>

            <div className="flex items-center gap-4 bg-transparent px-5 py-2">
              <div className="text-3xl font-playfair font-bold text-gray-900 dark:text-white">
                {formatTime(timerTimeLeft)}
              </div>
              <div className="flex gap-2">
                <button onClick={toggleTimer} className={`p-2 rounded-xl text-white transition-colors hover:opacity-80 ${
                  timerIsRunning ? "bg-red-500 hover:bg-red-600" : 
                  timerMode === "work" ? "bg-gray-900 hover:bg-gray-800" :
                  (timerMode === "short" || timerMode === "long") ? "bg-emerald-700 hover:bg-emerald-800" :
                  "bg-orange-500 hover:bg-orange-600"
                }`}>
                  {timerIsRunning ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>
                <button onClick={resetTimer} className="p-2 rounded-full bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-100 dark:border-slate-700 shadow-sm transition-transform transform hover:scale-105 transition-colors duration-300">
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PanelGroup direction="horizontal" className="flex-1 min-h-0 overflow-hidden px-1">
        
        {fullscreenPanel !== 'right' && (
        <Panel defaultSize={fullscreenPanel === 'left' ? 100 : 50} minSize={30}>
          <div className={`flex flex-col bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] overflow-hidden transition-colors duration-300 ${
            fullscreenPanel === 'left' ? 'fixed inset-0 z-[100] rounded-xl bg-white/95 dark:bg-slate-900/95 shadow-2xl' : 'h-full rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 relative'
          }`}>
            
            {/* Header Tabs */}
            <div className="flex border-b border-gray-100/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 transition-colors duration-300">
              <button 
                onClick={() => setActiveLeftTab("notes")}
                className={`flex-1 font-bold py-4 transition-colors ${activeLeftTab === "notes" ? "text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400 bg-white/60 dark:bg-slate-800/60" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-semibold"}`}
              >
                <span className="flex items-center justify-center gap-2"><FileText size={18} /> Smart Notes</span>
              </button>
              <button 
                onClick={() => setActiveLeftTab("quiz")}
                className={`flex-1 font-bold py-4 transition-colors ${activeLeftTab === "quiz" ? "text-emerald-800 dark:text-emerald-400 border-b-2 border-emerald-800 dark:border-emerald-400 bg-white/60 dark:bg-slate-800/60" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-semibold"}`}
              >
                <span className="flex items-center justify-center gap-2"><GraduationCap size={18} /> Quiz</span>
              </button>
              <button 
                onClick={() => setFullscreenPanel(prev => prev === 'left' ? null : 'left')}
                className="px-5 text-gray-400 hover:text-emerald-800 transition-colors border-l border-gray-100/50"
                title="Toggle Fullscreen"
              >
                {fullscreenPanel === 'left' ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {activeLeftTab === "notes" ? (
                /* ===== SMART NOTES PANEL ===== */
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">{activeTopic}</h2>
                    {notes && (
                      <button
                        onClick={handleGenerateNotes}
                        disabled={isGeneratingNotes}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-400 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-700/30 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isGeneratingNotes ? "animate-spin" : ""} /> Refresh
                      </button>
                    )}
                  </div>

                  {messageCountSinceNotes >= 5 && notes && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center justify-between">
                      <span>💡 {messageCountSinceNotes} new messages since last update.</span>
                      <button onClick={handleGenerateNotes} disabled={isGeneratingNotes} className="font-bold underline hover:no-underline disabled:opacity-50 disabled:no-underline">Refresh</button>
                    </div>
                  )}

                  {isGeneratingNotes && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <Loader2 size={32} className="animate-spin text-emerald-700" />
                      <p className="text-sm text-gray-500 font-medium">Generating notes...</p>
                    </div>
                  )}

                  {!notes && !isGeneratingNotes && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                        <FileText size={28} className="text-emerald-400" />
                      </div>
                      <p className="text-sm text-gray-500 max-w-xs">Chat with the AI coach to generate structured notes.</p>
                      <button
                        onClick={handleGenerateNotes}
                        className="mt-2 px-5 py-2.5 bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] text-sm font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-all flex items-center gap-2"
                      >
                        ✨ Generate Notes
                      </button>
                    </div>
                  )}

                  {notes && !isGeneratingNotes && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 transition-colors duration-300">{notes.title}</h3>
                      <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-5 border border-white dark:border-slate-700 shadow-sm transition-colors duration-300">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📝 Summary</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">{notes.summary}</p>
                      </div>
                      {Array.isArray(notes.key_points) && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🎯 Key Points</h4>
                          <ul className="space-y-2">
                            {notes.key_points.map((pt, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
                                <span className="mt-1.5 w-2 h-2 rounded-full bg-emerald-700 shrink-0"></span>{pt}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(notes.definitions) && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">📖 Definitions</h4>
                          <div className="space-y-3">
                            {notes.definitions.map((def, i) => (
                              <div key={i} className="bg-white/70 dark:bg-slate-800/70 border border-white dark:border-slate-700 rounded-lg p-4 shadow-sm transition-colors duration-300">
                                <dt className="font-bold text-emerald-700 dark:text-emerald-400 text-sm mb-1">{def?.term}</dt>
                                <dd className="text-sm text-gray-600 dark:text-gray-400">{def?.definition}</dd>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* ===== QUIZ PANEL ===== */
                <div>
                  {!quiz && !isGeneratingQuiz && (
                    <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
                      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                        <GraduationCap size={28} className="text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 transition-colors duration-300">Quiz: {activeTopic}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">Test your knowledge with AI-generated questions</p>
                      </div>

                      <div className="w-full">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-left">Target Scope</p>
                        <select 
                          value={quizTargetUnit} 
                          onChange={(e) => setQuizTargetUnit(e.target.value)}
                          className="w-full px-4 py-2 border border-white dark:border-slate-700 shadow-sm rounded-lg text-sm bg-white/50 dark:bg-slate-800/50 outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer text-gray-700 dark:text-gray-300 transition-colors duration-300"
                        >
                          <option value="Full Topic">Full Topic (Comprehensive)</option>
                          {globalUnitData && Array.isArray(globalUnitData[syllabusData?.topics?.findIndex(t => t.title === activeTopic)]) && globalUnitData[syllabusData?.topics?.findIndex(t => t.title === activeTopic)].map((u, i) => (
                            <option key={i} value={`${u?.unit_name}: ${Array.isArray(u?.key_concepts) ? u.key_concepts.join(', ') : ''}`}>
                              {u?.unit_name} Only
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full flex gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-left">Difficulty</p>
                          <div className="flex gap-2">
                            {["easy", "medium", "hard"].map((d) => (
                              <button key={d} onClick={() => setQuizDifficulty(d)} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${quizDifficulty === d ? "bg-emerald-800 text-white shadow-md" : "bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-slate-700 border border-white dark:border-slate-700"}`}>
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-left">Questions</p>
                          <div className="flex gap-2">
                            {[5, 10].map((n) => (
                              <button key={n} onClick={() => setQuizNumQuestions(n)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${quizNumQuestions === n ? "bg-emerald-800 text-white shadow-md" : "bg-white/50 dark:bg-slate-800/50 text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-slate-700 border border-white dark:border-slate-700"}`}>
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Past Quiz Results */}
                      {topicQuizHistory.length > 0 && (
                        <div className="w-full text-left mt-2">
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-700" /> Past Scores
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                            {topicQuizHistory.map((q, idx) => (
                              <div key={idx} className="bg-white/50 dark:bg-slate-800/50 border border-white dark:border-slate-700 p-2.5 rounded-lg flex justify-between items-center shadow-sm transition-colors duration-300">
                                <span className="text-sm text-gray-600 dark:text-gray-400 font-bold">Attempt {topicQuizHistory.length - idx}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded ${q.score / q.total >= 0.8 ? 'bg-emerald-100 text-emerald-700' : q.score / q.total >= 0.6 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                  {q.score} / {q.total}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={handleGenerateQuiz}
                        className="w-full px-6 py-3 bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-all flex items-center justify-center gap-2"
                      >
                        <GraduationCap size={20} /> Generate New Quiz
                      </button>
                    </div>
                  )}

                  {isGeneratingQuiz && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <Loader2 size={32} className="animate-spin text-emerald-700" />
                      <p className="text-sm text-gray-500 font-medium">Crafting your {quizDifficulty} quiz...</p>
                    </div>
                  )}

                  {quiz && !isGeneratingQuiz && (
                    <div>
                      {isQuizSubmitted && (
                        <div className={`mb-6 p-5 rounded-xl text-center shadow-sm ${getQuizScore().score / getQuizScore().total >= 0.8 ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/30" : "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30"}`}>
                          <p className="text-3xl mb-2">{getQuizScore().score / getQuizScore().total >= 0.8 ? "🎉" : "📚"}</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">Score: {getQuizScore().score}/{getQuizScore().total}</p>
                          <button onClick={() => setQuiz(null)} className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm transition-colors duration-300">Back to Options</button>
                        </div>
                      )}

                      <div className="space-y-6">
                        {Array.isArray(quiz.questions) && quiz.questions.map((q, qIdx) => (
                          <div key={qIdx} className={`p-5 rounded-xl border transition-all ${isQuizSubmitted ? (userAnswers[qIdx] === q.correct_answer ? "border-emerald-200 dark:border-emerald-700/30 bg-emerald-50/50 dark:bg-emerald-900/20" : "border-red-200 dark:border-red-500/30 bg-red-50/50 dark:bg-red-900/20") : "border-white dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 shadow-sm"}`}>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm mb-4"><span className="text-emerald-700 mr-2">Q{qIdx + 1}.</span>{q.question}</p>
                            <div className="space-y-2">
                              {Array.isArray(q.options) && q.options.map((opt, oIdx) => {
                                const isSelected = userAnswers[qIdx] === opt.label;
                                const isCorrect = isQuizSubmitted && opt.label === q.correct_answer;
                                const isWrong = isQuizSubmitted && isSelected && opt.label !== q.correct_answer;
                                let optionClass = "border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700";
                                if (isSelected && !isQuizSubmitted) optionClass = "border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-700";
                                else if (isCorrect) optionClass = "border-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
                                else if (isWrong) optionClass = "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400";

                                return (
                                  <button key={oIdx} disabled={isQuizSubmitted} onClick={() => handleQuizOptionSelect(qIdx, opt.label)} className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${optionClass}`}>
                                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${isSelected && !isQuizSubmitted ? "bg-emerald-800 text-white" : isCorrect ? "bg-emerald-700 text-white" : isWrong ? "bg-red-500 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"}`}>{opt.label}</span>
                                    <span className="flex-1">{opt.text}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {isQuizSubmitted && (
                              <div className="mt-4 p-4 bg-white/80 dark:bg-slate-800/80 rounded-lg text-sm border border-gray-100 dark:border-slate-700">
                                <p className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1"><Lightbulb size={16} className="text-amber-500" /> Explanation</p>
                                <p className="text-gray-600 dark:text-gray-400">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {!isQuizSubmitted && (
                        <button onClick={handleSubmitQuiz} className="mt-6 w-full px-6 py-3 bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-all">
                          Submit Answers
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Panel>
        )}

        {fullscreenPanel === null && (
        <PanelResizeHandle className="w-2 mx-1 rounded-full bg-gray-100/50 hover:bg-emerald-400/50 transition-colors cursor-col-resize" />
        )}

        {fullscreenPanel !== 'left' && (
        <Panel defaultSize={fullscreenPanel === 'right' ? 100 : 50} minSize={30}>
          <div className={`flex flex-col bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] overflow-hidden transition-colors duration-300 ${
            fullscreenPanel === 'right' ? 'fixed inset-0 z-[100] rounded-xl bg-white/95 dark:bg-slate-900/95 shadow-2xl' : 'h-full rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 relative'
          }`}>
            <div className="p-5 border-b border-gray-100/50 dark:border-slate-700/50 flex justify-between items-center bg-white/40 dark:bg-slate-800/40 transition-colors duration-300">
              <div className="flex items-center gap-3">
                <Brain className="text-emerald-800 dark:text-emerald-400" size={24} />
                <h2 className="font-bold text-gray-900 dark:text-white tracking-tight transition-colors duration-300 font-playfair text-lg">AI Coach</h2>
              </div>
              <div className="flex items-center gap-3">
                {!hasStartedLesson && (
                  <button onClick={handleAutoTeach} className="text-xs font-bold bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-all">
                    Start Interactive Lesson
                  </button>
                )}
                <button 
                  onClick={() => setFullscreenPanel(prev => prev === 'right' ? null : 'right')}
                  className="text-gray-400 hover:text-emerald-800 transition-colors"
                  title="Toggle Fullscreen"
                >
                  {fullscreenPanel === 'right' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.sender === 'ai' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-700 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-sm"><Brain size={16} /></div>
                  )}
                  <div className={`p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] text-sm leading-relaxed overflow-hidden transition-colors duration-300 ${msg.sender === 'user' ? 'bg-emerald-800 text-white rounded-tr-none' : 'bg-white/80 dark:bg-slate-800/80 border border-white dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-tl-none prose prose-sm dark:prose-invert max-w-none'}`}>
                    {msg.text ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({node, inline, className, children, ...props}) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                                className="rounded-xl my-4 text-sm !bg-slate-900 border border-slate-700 custom-scrollbar"
                              />
                            ) : (
                              <code {...props} className={`${className || ''} bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded text-emerald-800 dark:text-emerald-300 font-mono text-[0.85em] border border-transparent dark:border-slate-700`}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      <div className="flex gap-1.5 items-center h-5 px-1 py-1 mt-0.5">
                        <div className="w-2 h-2 bg-emerald-600/60 dark:bg-emerald-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-emerald-600/60 dark:bg-emerald-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-emerald-600/60 dark:bg-emerald-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white/60 dark:bg-slate-800/60 border-t border-white dark:border-slate-700 backdrop-blur-xl rounded-b-2xl transition-colors duration-300">
              {hasStartedLesson && (
                <div className="flex justify-end mb-3">
                  <button 
                    onClick={() => sendChatMessage("Let's move on to the next topic.", "The user has requested to move on to the next topic in the syllabus for this unit. Consult the provided syllabus breakdown (if any) and your own knowledge to determine the next logical sub-topic. Introduce it briefly, provide key points, and end by asking a question to test their understanding.")}
                    disabled={isTyping}
                    className="text-xs font-bold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 disabled:opacity-50"
                  >
                    Next Topic <ArrowRight size={14} />
                  </button>
                </div>
              )}
              <form onSubmit={handleChatSubmit} className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isTyping}
                  placeholder={isTyping ? "AI is thinking..." : "Ask a doubt or request an explanation..."} 
                  className="w-full bg-white/80 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3.5 text-sm focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-700/30 outline-none shadow-sm transition-all disabled:opacity-80 placeholder-gray-500 dark:placeholder-gray-400 disabled:placeholder-gray-700 disabled:dark:placeholder-gray-300 text-gray-900 dark:text-white"
                />
                <button type="submit" disabled={isTyping} className="absolute right-2 top-2 p-2 bg-gray-100 text-gray-800 dark:bg-[#2C2C2C] dark:text-gray-200 border border-gray-200 dark:border-[#3C3C3C] rounded-lg hover:bg-gray-200 dark:hover:bg-[#333] transition-all disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </Panel>
        )}


      </PanelGroup>
    </div>
  );
}