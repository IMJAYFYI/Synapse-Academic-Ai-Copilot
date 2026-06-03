import { useState, useEffect } from "react";
import { Target, Flame, Trophy, Activity as ActivityIcon } from "lucide-react";
import { useStudyContext } from "../context/StudyContext";

// Map intensity levels to Tailwind colors (Retained your exact Emerald styling)
const getSquareColor = (level) => {
  switch (level) {
    case 1: return "bg-emerald-200";
    case 2: return "bg-emerald-400";
    case 3: return "bg-emerald-600";
    case 4: return "bg-emerald-800";
    default: return "bg-gray-100 dark:bg-slate-700"; // Level 0 (Empty)
  }
};

// We don't need staticMonths here anymore since we moved it into the process data function

const BADGE_DICTIONARY = [
  { name: "First Steps", description: "Completed your very first study session!", icon: "🎯" },
  { name: "Night Owl", description: "Studied late into the night (between 9 PM and 4 AM).", icon: "🦉" },
  { name: "Marathon", description: "Studied for over 60 minutes in one continuous session.", icon: "🏃‍♂️" }
];

export default function Activity() {
  const { user, authFetch } = useStudyContext();
  const [activityMap, setActivityMap] = useState({});
  const [stats, setStats] = useState({ total_minutes: 0, total_days: 0 });
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch data from the FastAPI backend
  useEffect(() => {
    if (!user?.id) return;
    const fetchActivity = async () => {
      try {
        const response = await authFetch(`http://localhost:8000/api/activity-data/${user.id}`);
        if (response.ok) {
          const result = await response.json();
          setActivityMap(result.data);
          setStats(result.stats);
        }
        
        try {
          const badgesRes = await authFetch(`http://localhost:8000/api/badges/${user.id}`);
          if (badgesRes.ok) {
            setBadges(await badgesRes.json());
          }
        } catch(e) { console.error(e); }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchActivity();
  }, [user]);

  // 2. Map backend data to an accurate 52-week calendar grid
  const processHeatmapData = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentYear = today.getFullYear();
    const startDate = new Date(currentYear, 0, 1); // Jan 1st
    const endDate = new Date(currentYear, 11, 31); // Dec 31st

    // Align the start date to Sunday for the grid
    const startDayOfWeek = startDate.getDay();
    const gridStartDate = new Date(startDate);
    gridStartDate.setDate(startDate.getDate() - startDayOfWeek);

    const days = [];
    const monthLabels = [];
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Calculate streaks over the exact 365 days window (looping backwards) so they don't break on Jan 1
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const minutes = activityMap[dateString] || 0;
      
      let level = 0;
      if (minutes > 0 && minutes < 30) level = 1;
      else if (minutes >= 30 && minutes < 60) level = 2;
      else if (minutes >= 60 && minutes < 120) level = 3;
      else if (minutes >= 120) level = 4;

      if (level > 0) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak (looping backwards from today)
    for (let i = 0; i <= 364; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const minutes = activityMap[dateString] || 0;
      if (minutes > 0) {
        currentStreak++;
      } else if (i !== 0) {
        break; // Break if missed a day, unless it's today (allow them to study later today)
      }
    }

    // End grid on the Saturday after Dec 31
    const gridEndDate = new Date(endDate);
    const endDayOfWeek = gridEndDate.getDay();
    gridEndDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

    let currentDate = new Date(gridStartDate);
    let colIndex = 0;
    let daysAdded = 0;

    const staticMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Generate grid data and month labels
    while (currentDate <= gridEndDate) {
      // Add month label on the first Sunday of the month to perfectly align with the column
      if (currentDate.getDate() <= 7 && currentDate.getDay() === 0 && currentDate.getFullYear() === currentYear) {
        monthLabels.push({ index: colIndex, label: staticMonthNames[currentDate.getMonth()] });
      }

      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      let level = 0;

      // Mark dates outside the exact Jan 1 - Dec 31 range as invisible placeholders (-1)
      if (currentDate < startDate || currentDate > endDate) {
        level = -1;
      } else {
        const minutes = activityMap[dateString] || 0;
        if (minutes > 0 && minutes < 30) level = 1;
        else if (minutes >= 30 && minutes < 60) level = 2;
        else if (minutes >= 60 && minutes < 120) level = 3;
        else if (minutes >= 120) level = 4;
      }

      days.push({ date: dateString, level });

      currentDate.setDate(currentDate.getDate() + 1);
      daysAdded++;
      if (daysAdded % 7 === 0) colIndex++;
    }

    // Slice days array into column arrays of 7
    const columns = [];
    for (let i = 0; i < days.length; i += 7) {
      columns.push(days.slice(i, i + 7));
    }

    return { columns, monthLabels, currentStreak, maxStreak };
  };

  const { columns, monthLabels, currentStreak, maxStreak } = processHeatmapData();

  if (loading) {
    return <div className="p-8 flex justify-center text-gray-500 font-medium">Loading activity data...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto relative z-10">
      
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center gap-4 transition-colors duration-300 font-outfit">
          <div className="bg-indigo-100 dark:bg-indigo-500/20 p-3 rounded-2xl">
            <ActivityIcon className="text-indigo-600 dark:text-indigo-400" size={32} />
          </div>
          Study Activity
        </h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 mt-3 transition-colors duration-300 font-medium">Track your daily study sessions, completed modules, and learning streaks.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(16,185,129,0.12)] flex items-center gap-5 transition-all duration-300 hover:-translate-y-1">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <Target size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Total Study Time</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-outfit tracking-tight">
              {Math.floor(stats.total_minutes / 60)}h {stats.total_minutes % 60}m
            </h3>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(249,115,22,0.12)] flex items-center gap-5 transition-all duration-300 hover:-translate-y-1">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-500/20 dark:to-amber-500/20 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
            <Flame size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Current Streak</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-outfit tracking-tight">{currentStreak} days</h3>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.12)] flex items-center gap-5 transition-all duration-300 hover:-translate-y-1">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-500/20 dark:to-violet-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-slate-400 font-medium mb-1">Longest Streak</p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white font-outfit tracking-tight">{maxStreak} days</h3>
          </div>
        </div>
      </div>

      {/* Custom Heatmap Section */}
      <div className="bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/60 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-10 transition-colors duration-300">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-2 font-outfit tracking-wide">
          Activity in {new Date().getFullYear()}
        </h2>
        
        {/* Scrollable Container for the Grid */}
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[800px]">
            
            {/* Month Labels (X-Axis) positioned absolutely to align with columns */}
            <div className="relative h-6 mb-2 ml-8 text-xs text-gray-400 font-medium">
              {monthLabels.map((ml, idx) => (
                <span 
                  key={idx} 
                  className="absolute" 
                  style={{ left: `${ml.index * 1.25}rem` }} // 1.25rem = w-3.5 (0.875rem) + gap-1.5 (0.375rem)
                >
                  {ml.label}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              {/* Day Labels (Y-Axis) */}
              <div className="grid grid-rows-7 gap-1.5 text-[10px] text-gray-400 font-medium h-fit pr-1">
                <div className="h-3.5"></div> {/* Sun (Hidden) */}
                <div className="h-3.5 flex items-center">Mon</div>
                <div className="h-3.5"></div> {/* Tue */}
                <div className="h-3.5 flex items-center">Wed</div>
                <div className="h-3.5"></div> {/* Thu */}
                <div className="h-3.5 flex items-center">Fri</div>
                <div className="h-3.5"></div> {/* Sat */}
              </div>

              {/* Grid Data */}
              <div className="flex gap-1.5">
                {columns.map((col, colIdx) => (
                  <div key={colIdx} className="grid grid-rows-7 gap-1.5">
                    {col.map((day, dayIdx) => (
                      <div 
                        key={dayIdx} 
                        className={`w-3.5 h-3.5 rounded-sm ${day.level === -1 ? 'bg-transparent' : getSquareColor(day.level)} ${day.level !== -1 ? 'transition-colors hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 cursor-pointer' : ''}`}
                        title={day.level !== -1 ? `Date: ${day.date} | Intensity: ${day.level}` : ''}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Legend / Gradient Representation */}
        <div className="flex justify-end items-center gap-2 mt-4 text-xs text-gray-500 dark:text-gray-400 font-medium">
          <span>Less</span>
          <div className="flex gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-gray-100 dark:bg-slate-700"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-800"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">Recent Activity</h2>
      <div className="space-y-4">
        {Object.entries(activityMap)
          .filter(([_, minutes]) => minutes > 0)
          .sort((a, b) => new Date(b[0]) - new Date(a[0]))
          .slice(0, 3)
          .map(([dateStr, minutes], idx) => {
            const dateObj = new Date(dateStr);
            const isToday = new Date().toDateString() === dateObj.toDateString();
            
            return (
              <div key={idx} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex justify-between items-center border-l-4 border-l-emerald-500 hover:shadow-md transition-all duration-300">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Completed Study Session</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    You studied for {Math.floor(minutes / 60) > 0 ? `${Math.floor(minutes / 60)}h ` : ""}{minutes % 60}m
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {isToday ? "Today" : dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            );
          })}
          
          {Object.keys(activityMap).length === 0 && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex justify-center items-center text-gray-500 dark:text-gray-400">
              No recent activity yet. Start studying to build your streak!
            </div>
          )}
        </div>

      {/* Badge Dictionary */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Badge Dictionary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BADGE_DICTIONARY.map((badgeDef, idx) => {
            const owned = badges.some(b => b.name === badgeDef.name);
            return (
              <div 
                key={idx} 
                className={`p-5 rounded-xl border flex flex-col items-center text-center transition-all ${
                  owned 
                    ? "bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 border-indigo-200 dark:border-indigo-500/30 shadow-[0_8px_30px_rgb(79,70,229,0.1)]" 
                    : "bg-gray-50/50 dark:bg-slate-800/30 border-gray-200 dark:border-slate-700 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                }`}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-sm border ${
                  owned ? "bg-white dark:bg-slate-800 border-indigo-100 dark:border-slate-600" : "bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600"
                }`}>
                  {badgeDef.icon}
                </div>
                <h4 className={`font-bold mb-1 ${owned ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300"}`}>
                  {badgeDef.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-3">
                  {badgeDef.description}
                </p>
                {owned ? (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-3 py-1 rounded-full mt-auto">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-slate-700 px-3 py-1 rounded-full mt-auto flex items-center gap-1">
                    🔒 Locked
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}