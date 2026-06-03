import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, TrendingUp, Book, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStudyContext } from "../context/StudyContext";

export default function Dashboard() {
  const { user, authFetch } = useStudyContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("This Week");

  const mockLastWeek = [
    { name: 'Mon', hours: 1.5 },
    { name: 'Tue', hours: 2 },
    { name: 'Wed', hours: 0.5 },
    { name: 'Thu', hours: 3 },
    { name: 'Fri', hours: 1 },
    { name: 'Sat', hours: 4 },
    { name: 'Sun', hours: 2.5 }
  ];

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const res = await authFetch(`http://localhost:8000/api/dashboard-stats/${user.id}`);
        const data = await res.json();
        setStats(data);
        
        try {
          const badgesRes = await authFetch(`http://localhost:8000/api/badges/${user.id}`);
          if (badgesRes.ok) {
            setBadges(await badgesRes.json());
          }
        } catch (e) {
          console.error("Failed to fetch badges");
        }
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
    <div className="p-8 w-full max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-gray-900 dark:text-white transition-colors duration-300 font-outfit">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400 drop-shadow-sm">{stats.user_name}</span>!
          </h1>
          <p className="text-lg text-gray-500 dark:text-slate-400 font-medium transition-colors duration-300">
            Your AI coach has optimized your learning path for <span className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full">{user?.main_goal || "your exams"}</span>.
          </p>
        </div>
        <button
          onClick={() =>
            navigate("/session", { state: { selectedTopic: stats.last_studied_topic }, replace: true })
          }
          className="px-8 py-4 text-base font-bold bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-500 dark:to-violet-500 text-white rounded-full hover:opacity-90 shadow-[0_8px_30px_rgb(79,70,229,0.3)] dark:shadow-[0_8px_30px_rgb(79,70,229,0.5)] transition-all transform hover:-translate-y-1 flex items-center gap-3"
        >
          ▶ {stats.last_studied_topic ? `Continue "${stats.last_studied_topic}"` : "Start Studying"}
        </button>
      </div>

      {/* Stats Cards Grid - Glassmorphism */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0 relative z-10">
        {/* Card 1 - Study Time */}
        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.12)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Study Time Today</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-outfit">
                {formatMinutes(stats.study_time_today_minutes || 0)}
              </h3>
            </div>
          </div>
        </div>

        {/* Card 2 - Streak */}
        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Current Streak</p>
              <div className="flex items-end gap-3">
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-outfit">{stats.current_streak || 0}</h3>
                <span className="text-sm font-medium text-emerald-500 mb-1 tracking-wide">DAYS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 - Topics */}
        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.12)] transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-500/20 dark:to-amber-500/20 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
              <Book size={28} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Topics Covered</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight font-outfit">{stats.topics_covered || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors duration-300">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-outfit tracking-wide">Study Hours Progress</h2>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="text-sm border border-gray-200/50 dark:border-slate-600/50 rounded-full px-5 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-800 shadow-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all cursor-pointer"
            >
              <option value="This Week">This Week</option>
              <option value="Last Week">Last Week</option>
            </select>
          </div>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart data={timeframe === "This Week" ? (stats.weekly_hours || []) : (stats.last_week_hours || mockLastWeek)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} dx={-10} />
                <Tooltip cursor={{ fill: 'rgba(79, 70, 229, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'rgba(30,41,59,0.9)', color: 'white', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', fontWeight: 600 }} />
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

        {/* Achievements Section */}
        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl border border-white/60 dark:border-slate-700/50 p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors duration-300">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-outfit tracking-wide">Achievements</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Your unlocked badges</p>
          </div>
          <div className="space-y-4">
            {badges.length > 0 ? (
              badges.map(badge => (
                <div key={badge.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-black/20 border border-white/60 dark:border-white/10 shadow-sm transition-all hover:bg-white/60 dark:hover:bg-black/30 hover:-translate-y-0.5">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/60 dark:border-white/10">
                    {badge.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">{badge.name}</h4>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{badge.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 bg-white/20 dark:bg-black/10 rounded-2xl border border-dashed border-gray-300 dark:border-white/10">
                <div className="w-16 h-16 bg-white/50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-gray-400 dark:text-gray-500 mx-auto mb-4 shadow-sm border border-white/60 dark:border-white/5">
                  <span className="text-2xl">🔒</span>
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-300">No badges yet</p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-500 mt-1.5 px-4">Start a study session to earn your first badge!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}