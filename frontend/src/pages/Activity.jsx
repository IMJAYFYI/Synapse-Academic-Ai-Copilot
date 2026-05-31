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
    default: return "bg-gray-100"; // Level 0 (Empty)
  }
};

// We don't need staticMonths here anymore since we moved it into the process data function

export default function Activity() {
  const { user } = useStudyContext();
  const [activityMap, setActivityMap] = useState({});
  const [stats, setStats] = useState({ total_minutes: 0, total_days: 0 });
  const [loading, setLoading] = useState(true);

  // 1. Fetch data from the FastAPI backend
  useEffect(() => {
    if (!user?.id) return;
    const fetchActivity = async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/activity-data/${user.id}`);
        if (response.ok) {
          const result = await response.json();
          setActivityMap(result.data);
          setStats(result.stats);
        }
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

    // Get the start date: 365 days ago
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364);

    // Align the start date to Sunday for the grid
    const startDayOfWeek = startDate.getDay();
    const gridStartDate = new Date(startDate);
    gridStartDate.setDate(startDate.getDate() - startDayOfWeek);

    const days = [];
    const monthLabels = [];
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    // Calculate streaks over the exact 365 days window (looping backwards)
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

    // End grid on the Saturday of the current week
    const gridEndDate = new Date(today);
    const endDayOfWeek = gridEndDate.getDay();
    gridEndDate.setDate(today.getDate() + (6 - endDayOfWeek));

    let currentDate = new Date(gridStartDate);
    let colIndex = 0;
    let daysAdded = 0;

    const staticMonthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Generate grid data and month labels
    while (currentDate <= gridEndDate) {
      if (currentDate.getDate() === 1 && colIndex > 1) {
        monthLabels.push({ index: colIndex, label: staticMonthNames[currentDate.getMonth()] });
      }

      const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
      let level = 0;

      // Mark dates outside the exact 365-day range as invisible placeholders (-1)
      if (currentDate < startDate || currentDate > today) {
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
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ActivityIcon className="text-indigo-600" size={32} /> Study Activity
        </h1>
        <p className="text-gray-500 mt-2">Track your daily study sessions, completed modules, and learning streaks.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 p-4 rounded-full text-emerald-600">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Study Time</p>
            <h3 className="text-3xl font-bold text-gray-900">
              {Math.floor(stats.total_minutes / 60)}h {stats.total_minutes % 60}m
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 p-4 rounded-full text-orange-600">
            <Flame size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Current Streak</p>
            <h3 className="text-3xl font-bold text-gray-900">{currentStreak} days</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-full text-indigo-600">
            <Trophy size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Longest Streak</p>
            <h3 className="text-3xl font-bold text-gray-900">{maxStreak} days</h3>
          </div>
        </div>
      </div>

      {/* Custom Heatmap Section */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          Activity in the last year
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
        <div className="flex justify-end items-center gap-2 mt-4 text-xs text-gray-500 font-medium">
          <span>Less</span>
          <div className="flex gap-1.5">
            <div className="w-3.5 h-3.5 rounded-sm bg-gray-100"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600"></div>
            <div className="w-3.5 h-3.5 rounded-sm bg-emerald-800"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {Object.entries(activityMap)
          .filter(([_, minutes]) => minutes > 0)
          .sort((a, b) => new Date(b[0]) - new Date(a[0]))
          .slice(0, 3)
          .map(([dateStr, minutes], idx) => {
            const dateObj = new Date(dateStr);
            const isToday = new Date().toDateString() === dateObj.toDateString();
            
            return (
              <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                <div>
                  <h4 className="font-bold text-gray-900">Completed Study Session</h4>
                  <p className="text-sm text-gray-500">
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
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-center items-center text-gray-500">
            No recent activity yet. Start studying to build your streak!
          </div>
        )}
      </div>

    </div>
  );
}