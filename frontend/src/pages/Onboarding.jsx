import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BrainCircuit, Clock, GraduationCap, Lightbulb, Target, ArrowRight, User, BellRing } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    study_time: "",
    academic_level: "",
    learning_style: "",
    main_goal: "",
    reminder_time: "18:00",
    name: "",
    email: "",
    password: ""
  });

  const handleSelect = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Auto-advance slightly delayed for smooth feel
    setTimeout(() => {
      setStep(prev => prev + 1);
    }, 400);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          study_time: formData.study_time,
          academic_level: formData.academic_level,
          learning_style: formData.learning_style,
          main_goal: formData.main_goal
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        navigate('/login', { state: { message: "Account created! Please log in to start learning." }, replace: true });
      } else {
        setError(data.detail || "Signup failed");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // The Steps
  const steps = [
    {
      id: 1,
      title: "When do you usually study?",
      subtitle: "We'll optimize your schedule and reminders around this time.",
      icon: <Clock className="text-indigo-500" size={32} />,
      field: "study_time",
      options: [
        { label: "Early Bird", desc: "5AM - 11AM", value: "Early Morning" },
        { label: "Afternoon Hustle", desc: "12PM - 5PM", value: "Afternoon" },
        { label: "Night Owl", desc: "7PM - 2AM", value: "Late Night" }
      ]
    },
    {
      id: 2,
      title: "Where are you in your journey?",
      subtitle: "This helps Synapse adjust its vocabulary and depth.",
      icon: <GraduationCap className="text-indigo-500" size={32} />,
      field: "academic_level",
      options: [
        { label: "High School", desc: "Core subjects & APs", value: "High School" },
        { label: "Undergrad", desc: "College courses", value: "Undergrad" },
        { label: "Grad/Professional", desc: "Deep specializations", value: "Professional" }
      ]
    },
    {
      id: 3,
      title: "How do you learn best?",
      subtitle: "Your AI tutor will adopt this teaching style.",
      icon: <Lightbulb className="text-indigo-500" size={32} />,
      field: "learning_style",
      options: [
        { label: "Simplify It", desc: "Explain it like I'm 5", value: "Explain it simply" },
        { label: "Test Me", desc: "Lots of practice questions", value: "Give me practice questions" },
        { label: "Storyteller", desc: "Use real-world analogies", value: "Use analogies" }
      ]
    },
    {
      id: 4,
      title: "What is your main objective?",
      subtitle: "We'll pace your syllabus accordingly.",
      icon: <Target className="text-indigo-500" size={32} />,
      field: "main_goal",
      options: [
        { label: "Cramming", desc: "Exam is coming up fast", value: "Cramming for an exam" },
        { label: "Deep Mastery", desc: "Long-term understanding", value: "Deep understanding" },
        { label: "Catching Up", desc: "Fell behind in class", value: "Catching up" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Top Bar Minimal */}
      <div className="absolute top-6 left-8 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <BrainCircuit className="text-indigo-600" size={24} />
        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
          Synapse
        </span>
      </div>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12 relative overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {step <= 4 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                {steps[step - 1].icon}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{steps[step - 1].title}</h2>
            <p className="text-center text-gray-500 mb-8">{steps[step - 1].subtitle}</p>

            <div className="space-y-3">
              {steps[step - 1].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(steps[step - 1].field, opt.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                    formData[steps[step - 1].field] === opt.value 
                    ? "border-indigo-500 bg-indigo-50" 
                    : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <div className={`font-bold text-lg ${formData[steps[step - 1].field] === opt.value ? "text-indigo-900" : "text-gray-800"}`}>
                      {opt.label}
                    </div>
                    <div className={`text-sm ${formData[steps[step - 1].field] === opt.value ? "text-indigo-600" : "text-gray-500"}`}>
                      {opt.desc}
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData[steps[step - 1].field] === opt.value ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                    {formData[steps[step - 1].field] === opt.value && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : step === 5 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center">
                <BellRing className="text-indigo-500" size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Set Your Study Reminder</h2>
            <p className="text-center text-gray-500 mb-8">Choose the exact time you want Synapse to notify you.</p>

            <div className="flex flex-col items-center justify-center space-y-6">
              <input 
                type="time" 
                name="reminder_time"
                value={formData.reminder_time}
                onChange={handleChange}
                className="text-4xl font-bold text-indigo-900 bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6 outline-none focus:border-indigo-500 transition-all text-center w-full"
              />
              <button 
                onClick={() => {
                  if ("Notification" in window) {
                    Notification.requestPermission().then(permission => {
                      if (permission === "granted") {
                        localStorage.setItem("synapse_reminder_time", formData.reminder_time);
                      }
                      setStep(6);
                    });
                  } else {
                    localStorage.setItem("synapse_reminder_time", formData.reminder_time);
                    setStep(6);
                  }
                }}
                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-200">
                <User className="text-white" size={32} />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Create your account</h2>
            <p className="text-center text-gray-500 mb-8">Your AI Tutor is perfectly calibrated and ready.</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-4 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? "Generating AI Profile..." : "Start Learning"} <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}
        
        {/* Back Button */}
        {step > 1 && step <= 6 && (
          <button 
            onClick={() => setStep(prev => prev - 1)}
            className="absolute top-6 right-6 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}
