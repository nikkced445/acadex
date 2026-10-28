import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { PersonalEvent, SchoolEvent } from '../../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  GraduationCap,
  List,
  MapPin,
  Tag,
  User,
  X,
} from 'lucide-react';

export const AcademicCalendar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  // View state: month | week | agenda
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 20)); // Oct 2026 anchor
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | 'personal' | 'school'>('all');
  const [selectedEvent, setSelectedEvent] = useState<{
    event: PersonalEvent | SchoolEvent;
    isSchool: boolean;
  } | null>(null);

  // Queries
  const personalEvents = db.getPersonalEvents(user.id);
  const schoolEvents = db.getSchoolEvents(true);

  // Month navigation
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month Grid Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  // Filter combined events
  const getEventsForDate = (dateStr: string) => {
    const list: Array<{ event: PersonalEvent | SchoolEvent; isSchool: boolean }> = [];

    if (eventTypeFilter === 'all' || eventTypeFilter === 'personal') {
      personalEvents.forEach((e) => {
        if (e.startDate === dateStr) {
          list.push({ event: e, isSchool: false });
        }
      });
    }

    if (eventTypeFilter === 'all' || eventTypeFilter === 'school') {
      schoolEvents.forEach((e) => {
        if (e.startDate === dateStr || (e.startDate <= dateStr && e.endDate >= dateStr)) {
          list.push({ event: e, isSchool: true });
        }
      });
    }

    return list;
  };

  // All combined events for agenda view
  const allCombinedEvents = [
    ...(eventTypeFilter !== 'school'
      ? personalEvents.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          startDate: e.startDate,
          startTime: e.startTime,
          endDate: e.endDate,
          endTime: e.endTime,
          location: e.location,
          category: e.category,
          color: e.color,
          isSchool: false,
          original: e,
        }))
      : []),
    ...(eventTypeFilter !== 'personal'
      ? schoolEvents.map((e) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          startDate: e.startDate,
          startTime: e.startTime,
          endDate: e.endDate,
          endTime: e.endTime,
          location: e.location,
          category: e.category,
          color: '#1d4ed8',
          isSchool: true,
          original: e,
        }))
      : []),
  ].sort((a, b) => `${a.startDate} ${a.startTime}`.localeCompare(`${b.startDate} ${b.startTime}`));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Academic Calendar</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Unified view of your personal study deadlines and official university exam & holiday schedules.
          </p>
        </div>

        {/* View Switcher and Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs">
            <button
              onClick={() => setEventTypeFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                eventTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setEventTypeFilter('personal')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                eventTypeFilter === 'personal' ? 'bg-white text-sky-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              My Events
            </button>
            <button
              onClick={() => setEventTypeFilter('school')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                eventTypeFilter === 'school' ? 'bg-white text-blue-800 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              School Events
            </button>
          </div>

          {/* View Mode (Month / Agenda) */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {monthName} {year}
          </h2>
          <button
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 text-center py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Day Cells Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {/* Empty prefix cells */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] bg-slate-50/40 p-2" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const eventsForDay = getEventsForDate(dateStr);
              const isToday =
                new Date().getFullYear() === year &&
                new Date().getMonth() === month &&
                new Date().getDate() === day;

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[110px] p-2 flex flex-col justify-between hover:bg-slate-50/80 transition-colors ${
                    isToday ? 'bg-sky-50/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-sky-600 text-white' : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {eventsForDay.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {eventsForDay.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="space-y-1 overflow-y-auto max-h-24">
                    {eventsForDay.map(({ event, isSchool }, idx) => (
                      <div
                        key={`${event.id}-${idx}`}
                        onClick={() => setSelectedEvent({ event, isSchool })}
                        className={`px-1.5 py-1 rounded-md text-[10px] font-semibold truncate cursor-pointer transition-transform hover:scale-[1.02] ${
                          isSchool
                            ? 'bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-sky-100 text-sky-900 border border-sky-200'
                        }`}
                        title={`${event.title} (${isSchool ? 'Official School Event' : 'My Event'})`}
                      >
                        <span className="font-bold mr-1">{isSchool ? '🏛' : '👤'}</span>
                        <span>{event.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs divide-y divide-slate-100 overflow-hidden">
          {allCombinedEvents.length === 0 ? (
            <div className="py-16 text-center p-6 text-slate-400">
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No events scheduled</p>
            </div>
          ) : (
            allCombinedEvents.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedEvent({ event: item.original, isSchool: item.isSchool })}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      item.isSchool ? 'bg-blue-50 text-blue-700' : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    {item.isSchool ? <GraduationCap className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          item.isSchool ? 'bg-blue-100 text-blue-800' : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {item.isSchool ? 'School Event' : 'My Event'} · {item.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0 sm:text-right">
                  <div>
                    <p className="font-semibold text-slate-800 font-mono">{item.startDate}</p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {item.startTime} - {item.endTime}
                    </p>
                  </div>
                  {item.location && (
                    <div className="hidden md:block max-w-xs truncate text-[11px] text-slate-400">
                      {item.location}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className={`p-5 text-white ${
                selectedEvent.isSchool
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-800'
                  : 'bg-gradient-to-r from-sky-600 to-blue-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  {selectedEvent.isSchool ? 'Official School Event' : 'My Academic Event'}
                </span>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-lg font-bold">{selectedEvent.event.title}</h2>
              <p className="text-xs text-white/80 mt-1 font-mono">
                Category: {selectedEvent.event.category}
              </p>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600">
              {selectedEvent.event.description && (
                <div>
                  <h4 className="font-semibold text-slate-800 mb-1">Details & Agenda</h4>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                    {selectedEvent.event.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block">Date</span>
                  <span className="text-slate-800 font-bold font-mono">
                    {selectedEvent.event.startDate}
                    {selectedEvent.event.endDate !== selectedEvent.event.startDate &&
                      ` to ${selectedEvent.event.endDate}`}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 font-semibold block">Time Window</span>
                  <span className="text-slate-800 font-bold font-mono">
                    {selectedEvent.event.startTime} - {selectedEvent.event.endTime}
                  </span>
                </div>
              </div>

              {selectedEvent.event.location && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <MapPin className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block">Location</span>
                    <span className="text-slate-800 font-medium">{selectedEvent.event.location}</span>
                  </div>
                </div>
              )}

              {selectedEvent.isSchool && (selectedEvent.event as SchoolEvent).registrationLink && (
                <div className="pt-2">
                  <a
                    href={(selectedEvent.event as SchoolEvent).registrationLink!}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition-colors"
                  >
                    <span>Event Registration Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
