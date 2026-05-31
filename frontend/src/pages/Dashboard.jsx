import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, TrendingUp, Book, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStudyContext } from "../context/StudyContext";

export default function Dashboard() {
  const { user } = useStudyContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const res = await fetch(`http://localhost:8000/api/dashboard-stats/${user.id}`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats:", err);
        setStats({
          user_name: user?.name || "Learner",
          study_time_today_minutes: 0,
          current_streak: 0,
          personal_best_streak: 0,
          topics_covered: 0,
          last_studied_topic: null,
          weekly_hours: [],
        });
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchDashboardStats();
    }
  }, [user?.id]);

  function formatMinutes(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  if (loading) {
    return (
      <div className="p-8 w-full min-h-full flex flex-col">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 w-72 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-96 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-7 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-28 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-72 w-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-emerald-500">{stats.user_name}</span>!
          </h1>
          <p className="text-gray-500 font-medium">
            Your AI coach has optimized your learning path for <span className="text-indigo-600 font-bold">{user?.main_goal || "your exams"}</span>.
          </p>
        </div>
        <button
          onClick={() =>
            navigate("/session", { state: { selectedTopic: stats.last_studied_topic }, replace: true })
          }
          className="px-6 py-3 text-sm font-bold bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-[0_8px_30px_rgb(79,70,229,0.2)] transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          ▶ {stats.last_studied_topic ? `Continue "${stats.last_studied_topic}"` : "Start Studying"}
        </button>
      </div>

      {/* Stats Cards Grid - Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
        {/* Card 1 - Study Time */}
        <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Study Time Today</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                {formatMinutes(stats.study_time_today_minutes || 0)}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 2 - Streak */}
        <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Current Streak</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{stats.current_streak || 0} Days</h3>
              <p className="text-xs text-gray-500 mt-0.5">Personal best: {stats.personal_best_streak || 0}</p>
            </div>
          </div>
        </div>

        {/* Card 3 - Topics */}
        <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
              <Book size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Topics Covered</p>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{stats.topics_covered || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Study Hours Progress</h2>
          <select className="text-sm border border-gray-200 rounded-full px-4 py-1.5 text-gray-600 bg-white/50 backdrop-blur-sm outline-none focus:border-indigo-500 shadow-sm font-medium">
            <option>This Week</option>
            <option>Last Week</option>
          </select>
        </div>
        <div className="w-full h-80 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.weekly_hours || []}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} dx={-10} />
              <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', fontWeight: 600 }} />
              <Bar dataKey="hours" fill="url(#colorIndigo)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#818CF8" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}