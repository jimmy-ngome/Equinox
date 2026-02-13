import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import "./CalendarOverview.css";

const DAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"
];

const CalendarOverview = ({ compact = false, habits = [] }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [completions, setCompletions] = useState([]);

  const monthStr = `${currentDate.year}-${String(currentDate.month + 1).padStart(2, "0")}`;

  useEffect(() => {
    const fetchCompletions = async () => {
      try {
        const res = await fetch(`/api/habits/completions?month=${monthStr}`);
        if (res.ok) {
          const data = await res.json();
          setCompletions(data);
        }
      } catch (err) {
        console.error("Erreur chargement completions:", err);
      }
    };
    fetchCompletions();
  }, [monthStr]);

  // Map: dateStr -> Set of completed habitIds
  const completionsByDay = useMemo(() => {
    const map = {};
    for (const c of completions) {
      const day = c.completedDate.split("T")[0] || c.completedDate;
      if (!map[day]) map[day] = new Set();
      map[day].add(c.habitId);
    }
    return map;
  }, [completions]);

  const getColor = (h) => h.color || "#22d3ee";

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentDate.year, currentDate.month, 1);
    const lastDay = new Date(currentDate.year, currentDate.month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const days = [];
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentDate.year}-${String(currentDate.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const completedIds = completionsByDay[dateStr] || new Set();
      days.push({ day: d, dateStr, completedIds });
    }

    return days;
  }, [currentDate, completionsByDay]);

  const today = new Date().toISOString().split("T")[0];

  const prevMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrentDate(prev => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: prev.month + 1 };
    });
  };

  return (
    <div className={`calendar-overview ${compact ? "compact" : ""}`}>
      <div className="calendar-header">
        <button className="calendar-nav" onClick={prevMonth}><ChevronLeft size={16} /></button>
        <span className="calendar-title">
          {MONTHS[currentDate.month]} {currentDate.year}
        </span>
        <button className="calendar-nav" onClick={nextMonth}><ChevronRight size={16} /></button>
      </div>

      {/* Legend */}
      {!compact && habits.length > 0 && (
        <div className="calendar-legend">
          {habits.map(h => (
            <div key={h.id} className="legend-item">
              <span
                className="legend-dot"
                style={{ background: getColor(h) }}
              />
              <span className="legend-label">{h.icon} {h.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="calendar-grid">
        {DAYS.map(d => (
          <div key={d} className="calendar-day-label">{d}</div>
        ))}
        {calendarDays.map((cell, i) => {
          if (!cell) return <div key={`empty-${i}`} className="calendar-cell empty" />;

          const isToday = cell.dateStr === today;
          const allDone = habits.length > 0 && cell.completedIds.size >= habits.length;

          let cellClass = "calendar-cell";
          if (isToday) cellClass += " today";
          if (allDone) cellClass += " full";

          return (
            <div key={cell.dateStr} className={cellClass}>
              <span className="calendar-day-number">{cell.day}</span>
              {habits.length > 0 && (
                <div className="calendar-dots">
                  {habits.map(h => (
                    <span
                      key={h.id}
                      className={`calendar-habit-dot ${cell.completedIds.has(h.id) ? "done" : ""}`}
                      style={cell.completedIds.has(h.id) ? { background: getColor(h) } : undefined}
                      title={h.name}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarOverview;
