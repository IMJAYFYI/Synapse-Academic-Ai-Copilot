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
          main_goal: formData.main_goal,
          reminder_time: formData.reminder_time
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
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      {/* Top Bar Minimal */}
      <div className="absolute top-8 left-8 flex items-center gap-3 cursor-pointer z-10 group hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
        <div className="text-emerald-700 transition-opacity">
          <BrainCircuit size={28} />
        </div>
        <span className="text-2xl font-bold text-gray-900 font-playfair tracking-tight">
          Synapse.
        </span>
      </div>

      <div className="w-full max-w-xl bg-white border border-gray-200 p-8 sm:p-12 rounded-2xl shadow-sm">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100/50">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out" 
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {step <= 4 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-white/60">
                {steps[step - 1].icon}
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-3 font-playfair tracking-tight">{steps[step - 1].title}</h2>
            <p className="text-center text-gray-500 mb-10 font-medium text-lg">{steps[step - 1].subtitle}</p>

            <div className="space-y-4">
              {steps[step - 1].options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(steps[step - 1].field, opt.value)}
                  className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                    formData[steps[step - 1].field] === opt.value 
                    ? "border-indigo-500 bg-indigo-50/50 shadow-sm" 
                    : "border-gray-200/60 hover:border-indigo-300 hover:bg-white/90 shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                  }`}
                >
                  <div>
                    <div className={`font-bold text-lg mb-1 ${formData[steps[step - 1].field] === opt.value ? "text-indigo-900" : "text-gray-800"}`}>
                      {opt.label}
                    </div>
                    <div className={`text-sm font-medium ${formData[steps[step - 1].field] === opt.value ? "text-indigo-600/80" : "text-gray-500"}`}>
                      {opt.desc}
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${formData[steps[step - 1].field] === opt.value ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                    {formData[steps[step - 1].field] === opt.value && <div className="w-2.5 h-2.5 bg-white rounded-full animate-in zoom-in" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : step === 5 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-[1.5rem] flex items-center justify-center shadow-inner border border-white/60">
                <BellRing className="text-indigo-500" size={36} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-3 font-playfair tracking-tight">Set Your Study Reminder</h2>
            <p className="text-center text-gray-500 mb-10 font-medium text-lg">Choose the exact time you want Synapse to notify you.</p>

            <div className="flex flex-col items-center justify-center space-y-8">
              <input 
                type="time" 
                name="reminder_time"
                value={formData.reminder_time}
                onChange={handleChange}
                className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 bg-white/50 border-2 border-indigo-100 rounded-3xl p-8 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 transition-all text-center w-full shadow-inner"
              />
              <button 
                onClick={() => {
                  if ("Notification" in window) {
                    Notification.requestPermission().then(permission => {
                      setStep(6);
                    });
                  } else {
                    setStep(6);
                  }
                }}
                className="w-full py-4 bg-gray-100 text-gray-800 border border-gray-200 font-bold text-lg rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
              >
                Continue <ArrowRight size={22} />
              </button>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500 mt-4">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_8px_30px_rgb(79,70,229,0.3)]">
                <User className="text-white" size={36} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-3 font-playfair tracking-tight">Create your account</h2>
            <p className="text-center text-gray-500 mb-10 font-medium text-lg">Your AI Tutor is perfectly calibrated and ready.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50/80 text-red-700 rounded-xl text-sm font-bold text-center border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-white/50 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all font-medium text-gray-900"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-white/50 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all font-medium text-gray-900"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 bg-white/50 border border-gray-200/80 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all font-medium text-gray-900"
                  placeholder="••••••••"
                />
              </div>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-8 py-4 bg-gray-100 text-gray-800 border border-gray-200 font-bold text-lg rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
              >
                {isSubmitting ? "Generating AI Profile..." : "Start Learning"} <ArrowRight size={22} />
              </button>
            </form>
          </div>
        )}
        
        {/* Back Button */}
        {step > 1 && step <= 6 && (
          <button 
            onClick={() => setStep(prev => prev - 1)}
            className="absolute top-8 right-8 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors bg-white/50 px-4 py-2 rounded-full border border-gray-100"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}
