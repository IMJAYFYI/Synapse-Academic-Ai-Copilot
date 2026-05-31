import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Play, Pause, RotateCcw, Send, CheckCircle2, Brain, Coffee, MoreVertical, Maximize2, Minimize2, Zap, Loader2, FileText, GraduationCap, RefreshCw, CheckCircle, XCircle, Lightbulb, BookOpen, ArrowRight } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function StudySession() {
  return (
    <ErrorBoundary>
      <StudySessionContent />
    </ErrorBoundary>
  );
}

function StudySessionContent() {
  const { user, syllabusData, globalUnitData, globalQuizHistory } = useStudyContext();
  const location = useLocation();

  const [activeTopic, setActiveTopic] = useState(() => {
    return location.state?.selectedTopic 
      || localStorage.getItem("synapse_active_topic")
      || syllabusData?.topics?.[0]?.title 
      || "General Study";
  });
  const [fullscreenPanel, setFullscreenPanel] = useState(null);

  const topicQuizHistory = globalQuizHistory?.filter(q => q.topic === activeTopic) || [];
  const durations = { work: 25 * 60, short: 5 * 60, long: 15 * 60, test: 5 };

  useEffect(() => {
    localStorage.setItem("synapse_active_topic", activeTopic);
    if (user?.id) {
      fetch("http://localhost:8000/api/update-active-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, active_topic: activeTopic })
      }).catch(err => console.error("Failed to sync active topic", err));
    }
  }, [activeTopic, user]);
  
  const [mode, setMode] = useState("work");
  const [timeLeft, setTimeLeft] = useState(durations.work);
  const [isRunning, setIsRunning] = useState(false);
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

  const expectedEndTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const chatEndRef = useRef(null);

  // --- DATABASE-BACKED CHAT MEMORY ---
  const defaultMsg = { sender: 'ai', text: "I am ready. Select a topic, start the timer, or click **Start Interactive Lesson** to begin." };
  const [chatMessages, setChatMessages] = useState([defaultMsg]);
  const hasStartedLesson = chatMessages?.length > 1;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (!user?.id) return; 
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

  useEffect(() => {
    if (!user?.id) return;
    const fetchNotes = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/notes/${user.id}/${encodeURIComponent(activeTopic)}`);
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

  const updateChatMessages = (updater) => {
    setChatMessages(updater);
    if (notes && typeof updater === 'function') {
      setMessageCountSinceNotes(prev => prev + 1);
    }
  };

  const saveSessionToDatabase = async () => {
    setIsSaving(true);
    // If it was a 'test', we still log 25 minutes as per user request
    const minutesToLog = mode === "test" ? 25 : durations.work / 60;
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
          if (mode === "work" || mode === "test") saveSessionToDatabase();
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
          message: userText, 
          hidden_prompt: hiddenSystemPrompt, 
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
      const response = await fetch("http://localhost:8000/api/notes/generate", {
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
      const response = await fetch("http://localhost:8000/api/quiz/generate", {
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
      await fetch("http://localhost:8000/api/quiz/submit", {
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
      <div className="flex flex-col gap-5 mb-6 bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-5 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-gray-900">Study Session</h1>
            <div className="flex items-center gap-3">
              <span className="text-gray-500 font-medium text-sm">Currently studying:</span>
              <select 
                value={activeTopic}
                onChange={(e) => setActiveTopic(e.target.value)}
                className="bg-white border border-gray-100 rounded-lg py-1.5 px-3 text-sm font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm cursor-pointer"
              >
                {Array.isArray(syllabusData?.topics) && syllabusData.topics.map((topic, i) => (
                  <option key={i} value={topic?.title || `Topic ${i}`}>{topic?.title || `Topic ${i}`}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-white/50 rounded-xl p-1 shadow-sm border border-white gap-1">
              <button onClick={() => switchMode("work")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === "work" ? "bg-indigo-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"}`}>Pomodoro</button>
              <button onClick={() => switchMode("short")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === "short" ? "bg-emerald-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"}`}>Short Break</button>
              <button onClick={() => switchMode("long")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === "long" ? "bg-violet-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"}`}>Long Break</button>
              <button onClick={() => switchMode("test")} className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${mode === "test" ? "bg-red-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-50"}`}>Test (5s)</button>
            </div>

            <div className="flex items-center gap-4 bg-white/50 px-5 py-2 rounded-xl shadow-sm border border-white">
              <div className={`text-3xl font-extrabold tracking-tighter bg-clip-text text-transparent transition-all duration-500 ${
                mode === "work" ? "bg-gradient-to-r from-indigo-600 to-violet-600" :
                (mode === "short" || mode === "long") ? "bg-gradient-to-r from-emerald-500 to-teal-500" :
                "bg-gradient-to-r from-red-500 to-orange-500"
              }`}>
                {formatTime(timeLeft)}
              </div>
              <div className="flex gap-2">
                <button onClick={toggleTimer} className={`p-2 rounded-full text-white shadow-md transition-transform transform hover:scale-105 ${
                  isRunning ? "bg-red-500 hover:bg-red-600" : 
                  mode === "work" ? "bg-indigo-600 hover:bg-indigo-700" :
                  (mode === "short" || mode === "long") ? "bg-emerald-500 hover:bg-emerald-600" :
                  "bg-orange-500 hover:bg-orange-600"
                }`}>
                  {isRunning ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                </button>
                <button onClick={resetTimer} className="p-2 rounded-full bg-white text-gray-600 hover:bg-gray-50 border border-gray-100 shadow-sm transition-transform transform hover:scale-105">
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PanelGroup direction="horizontal" className="flex-1 min-h-0 overflow-hidden">
        
        {fullscreenPanel !== 'right' && (
        <Panel defaultSize={fullscreenPanel === 'left' ? 100 : 50} minSize={30}>
          <div className={`flex flex-col bg-white/70 backdrop-blur-xl border border-white overflow-hidden ${
            fullscreenPanel === 'left' ? 'fixed inset-0 z-[100] rounded-none bg-white/95 shadow-2xl' : 'h-full rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative'
          }`}>
            
            {/* Header Tabs */}
            <div className="flex border-b border-gray-100/50 bg-white/40">
              <button 
                onClick={() => setActiveLeftTab("notes")}
                className={`flex-1 font-semibold py-4 transition-colors ${activeLeftTab === "notes" ? "text-indigo-600 border-b-2 border-indigo-600 bg-white/50" : "text-gray-400 hover:text-gray-600"}`}
              >
                <span className="flex items-center justify-center gap-2"><FileText size={16} /> Smart Notes</span>
              </button>
              <button 
                onClick={() => setActiveLeftTab("quiz")}
                className={`flex-1 font-semibold py-4 transition-colors ${activeLeftTab === "quiz" ? "text-indigo-600 border-b-2 border-indigo-600 bg-white/50" : "text-gray-400 hover:text-gray-600"}`}
              >
                <span className="flex items-center justify-center gap-2"><GraduationCap size={16} /> Quiz</span>
              </button>
              <button 
                onClick={() => setFullscreenPanel(prev => prev === 'left' ? null : 'left')}
                className="px-4 text-gray-400 hover:text-indigo-600 transition-colors border-l border-gray-100/50"
                title="Toggle Fullscreen"
              >
                {fullscreenPanel === 'left' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeLeftTab === "notes" ? (
                /* ===== SMART NOTES PANEL ===== */
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{activeTopic}</h2>
                    {notes && (
                      <button
                        onClick={handleGenerateNotes}
                        disabled={isGeneratingNotes}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={isGeneratingNotes ? "animate-spin" : ""} /> Refresh
                      </button>
                    )}
                  </div>

                  {messageCountSinceNotes >= 5 && notes && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center justify-between">
                      <span>💡 {messageCountSinceNotes} new messages since last update.</span>
                      <button onClick={handleGenerateNotes} className="font-bold underline hover:no-underline">Refresh</button>
                    </div>
                  )}

                  {isGeneratingNotes && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <Loader2 size={32} className="animate-spin text-indigo-500" />
                      <p className="text-sm text-gray-500 font-medium">Generating notes...</p>
                    </div>
                  )}

                  {!notes && !isGeneratingNotes && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                        <FileText size={28} className="text-indigo-400" />
                      </div>
                      <p className="text-sm text-gray-500 max-w-xs">Chat with the AI coach to generate structured notes.</p>
                      <button
                        onClick={handleGenerateNotes}
                        className="mt-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                      >
                        ✨ Generate Notes
                      </button>
                    </div>
                  )}

                  {notes && !isGeneratingNotes && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold text-indigo-700">{notes.title}</h3>
                      <div className="bg-white/50 rounded-xl p-5 border border-white shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📝 Summary</h4>
                        <p className="text-sm text-gray-700 leading-relaxed">{notes.summary}</p>
                      </div>
                      {Array.isArray(notes.key_points) && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🎯 Key Points</h4>
                          <ul className="space-y-2">
                            {notes.key_points.map((pt, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                <span className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 shrink-0"></span>{pt}
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
                              <div key={i} className="bg-white/70 border border-white rounded-lg p-4 shadow-sm">
                                <dt className="font-bold text-indigo-700 text-sm mb-1">{def?.term}</dt>
                                <dd className="text-sm text-gray-600">{def?.definition}</dd>
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
                      <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                        <GraduationCap size={28} className="text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1">Quiz: {activeTopic}</h3>
                        <p className="text-sm text-gray-500">Test your knowledge with AI-generated questions</p>
                      </div>

                      <div className="w-full">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-left">Target Scope</p>
                        <select 
                          value={quizTargetUnit} 
                          onChange={(e) => setQuizTargetUnit(e.target.value)}
                          className="w-full px-4 py-2 border border-white shadow-sm rounded-lg text-sm bg-white/50 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-gray-700"
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
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-left">Difficulty</p>
                          <div className="flex gap-2">
                            {["easy", "medium", "hard"].map((d) => (
                              <button key={d} onClick={() => setQuizDifficulty(d)} className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${quizDifficulty === d ? "bg-indigo-600 text-white shadow-md" : "bg-white/50 text-gray-600 hover:bg-white/80 border border-white"}`}>
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-left">Questions</p>
                          <div className="flex gap-2">
                            {[5, 10].map((n) => (
                              <button key={n} onClick={() => setQuizNumQuestions(n)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${quizNumQuestions === n ? "bg-indigo-600 text-white shadow-md" : "bg-white/50 text-gray-600 hover:bg-white/80 border border-white"}`}>
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Past Quiz Results */}
                      {topicQuizHistory.length > 0 && (
                        <div className="w-full text-left mt-2">
                          <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-500" /> Past Scores
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {topicQuizHistory.map((q, idx) => (
                              <div key={idx} className="bg-white/50 border border-white p-2.5 rounded-lg flex justify-between items-center shadow-sm">
                                <span className="text-sm text-gray-600 font-bold">Attempt {topicQuizHistory.length - idx}</span>
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
                        className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <GraduationCap size={20} /> Generate New Quiz
                      </button>
                    </div>
                  )}

                  {isGeneratingQuiz && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                      <Loader2 size={32} className="animate-spin text-indigo-500" />
                      <p className="text-sm text-gray-500 font-medium">Crafting your {quizDifficulty} quiz...</p>
                    </div>
                  )}

                  {quiz && !isGeneratingQuiz && (
                    <div>
                      {isQuizSubmitted && (
                        <div className={`mb-6 p-5 rounded-xl text-center shadow-sm ${getQuizScore().score / getQuizScore().total >= 0.8 ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"}`}>
                          <p className="text-3xl mb-2">{getQuizScore().score / getQuizScore().total >= 0.8 ? "🎉" : "📚"}</p>
                          <p className="text-xl font-bold text-gray-900">Score: {getQuizScore().score}/{getQuizScore().total}</p>
                          <button onClick={() => setQuiz(null)} className="mt-4 px-4 py-2 bg-white text-gray-700 text-sm font-bold rounded-lg border border-gray-200 hover:bg-gray-50 shadow-sm">Back to Options</button>
                        </div>
                      )}

                      <div className="space-y-6">
                        {Array.isArray(quiz.questions) && quiz.questions.map((q, qIdx) => (
                          <div key={qIdx} className={`p-5 rounded-xl border transition-all ${isQuizSubmitted ? (userAnswers[qIdx] === q.correct_answer ? "border-emerald-200 bg-emerald-50/50" : "border-red-200 bg-red-50/50") : "border-white bg-white/60 shadow-sm"}`}>
                            <p className="font-semibold text-gray-900 text-sm mb-4"><span className="text-indigo-500 mr-2">Q{qIdx + 1}.</span>{q.question}</p>
                            <div className="space-y-2">
                              {Array.isArray(q.options) && q.options.map((opt, oIdx) => {
                                const isSelected = userAnswers[qIdx] === opt.label;
                                const isCorrect = isQuizSubmitted && opt.label === q.correct_answer;
                                const isWrong = isQuizSubmitted && isSelected && opt.label !== q.correct_answer;
                                let optionClass = "border-gray-100 bg-white hover:border-indigo-300";
                                if (isSelected && !isQuizSubmitted) optionClass = "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500";
                                else if (isCorrect) optionClass = "border-emerald-500 bg-emerald-50 text-emerald-700";
                                else if (isWrong) optionClass = "border-red-500 bg-red-50 text-red-700";

                                return (
                                  <button key={oIdx} disabled={isQuizSubmitted} onClick={() => handleQuizOptionSelect(qIdx, opt.label)} className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left text-sm transition-all ${optionClass}`}>
                                    <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${isSelected && !isQuizSubmitted ? "bg-indigo-600 text-white" : isCorrect ? "bg-emerald-500 text-white" : isWrong ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500"}`}>{opt.label}</span>
                                    <span className="flex-1">{opt.text}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {isQuizSubmitted && (
                              <div className="mt-4 p-4 bg-white/80 rounded-lg text-sm border border-gray-100">
                                <p className="font-bold text-gray-900 mb-1 flex items-center gap-1"><Lightbulb size={16} className="text-amber-500" /> Explanation</p>
                                <p className="text-gray-600">{q.explanation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {!isQuizSubmitted && (
                        <button onClick={handleSubmitQuiz} className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-opacity">
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
        <PanelResizeHandle className="w-2 mx-1 rounded-full bg-gray-100/50 hover:bg-indigo-400/50 transition-colors cursor-col-resize" />
        )}

        {fullscreenPanel !== 'left' && (
        <Panel defaultSize={fullscreenPanel === 'right' ? 100 : 50} minSize={30}>
          <div className={`flex flex-col bg-white/70 backdrop-blur-xl border border-white overflow-hidden ${
            fullscreenPanel === 'right' ? 'fixed inset-0 z-[100] rounded-none bg-white/95 shadow-2xl' : 'h-full rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative'
          }`}>
            <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-white/40">
              <div className="flex items-center gap-2">
                <Brain className="text-indigo-600" size={20} />
                <h2 className="font-bold text-gray-900 tracking-tight">AI Coach</h2>
              </div>
              <div className="flex items-center gap-3">
                {!hasStartedLesson && (
                  <button onClick={handleAutoTeach} className="text-xs font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                    Start Interactive Lesson
                  </button>
                )}
                <button 
                  onClick={() => setFullscreenPanel(prev => prev === 'right' ? null : 'right')}
                  className="text-gray-400 hover:text-indigo-600 transition-colors"
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0 shadow-sm"><Brain size={16} /></div>
                  )}
                  <div className={`p-4 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] text-sm leading-relaxed overflow-hidden ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/80 border border-white text-gray-700 rounded-tl-none prose prose-sm max-w-none'}`}>
                    <ReactMarkdown>{msg.text || "..."}</ReactMarkdown>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white/60 border-t border-white backdrop-blur-xl rounded-b-2xl">
              <form onSubmit={handleChatSubmit} className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isTyping}
                  placeholder={isTyping ? "AI is thinking..." : "Ask a doubt or request an explanation..."} 
                  className="w-full bg-white/80 border border-gray-100 rounded-xl pl-4 pr-12 py-3.5 text-sm focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none shadow-sm transition-all disabled:opacity-50"
                />
                <button type="submit" disabled={isTyping} className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
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