import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { EventCategory, PersonalEvent } from '../../types';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Edit2,
  Filter,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

const CATEGORIES: EventCategory[] = ['Assignment', 'Examination', 'Project', 'Meeting', 'Personal'];
const EVENT_COLORS = ['#0284c7', '#ea580c', '#7c3aed', '#059669', '#e11d48', '#475569'];

export const EventsManager: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PersonalEvent | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<EventCategory>('Assignment');
  const [reminder, setReminder] = useState(true);
  const [color, setColor] = useState(EVENT_COLORS[0]);

  // Load events
  const allEvents = db.getPersonalEvents(user.id);

  const filteredEvents = allEvents.filter((ev) => {
    if (selectedCategory !== 'all' && ev.category !== selectedCategory) return false;
    if (viewFilter === 'pending' && ev.isCompleted) return false;
    if (viewFilter === 'completed' && !ev.isCompleted) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return ev.title.toLowerCase().includes(q) || ev.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    const todayStr = new Date().toISOString().split('T')[0];
    setStartDate(todayStr);
    setEndDate(todayStr);
    setStartTime('10:00');
    setEndTime('11:30');
    setLocation('');
    setCategory('Assignment');
    setReminder(true);
    setColor(EVENT_COLORS[0]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ev: PersonalEvent) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setStartDate(ev.startDate);
    setEndDate(ev.endDate);
    setStartTime(ev.startTime);
    setEndTime(ev.endTime);
    setLocation(ev.location || '');
    setCategory(ev.category);
    setReminder(ev.reminder);
    setColor(ev.color || EVENT_COLORS[0]);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) return;

    if (editingEvent) {
      db.updatePersonalEvent(editingEvent.id, {
        title: title.trim(),
        description: description.trim(),
        startDate,
        startTime,
        endDate: endDate || startDate,
        endTime,
        location: location.trim(),
        category,
        reminder,
        color,
      });
    } else {
      db.addPersonalEvent({
        ownerUserId: user.id,
        title: title.trim(),
        description: description.trim(),
        startDate,
        startTime,
        endDate: endDate || startDate,
        endTime,
        location: location.trim(),
        category,
        reminder,
        color,
        isCompleted: false,
      });
    }

    setIsModalOpen(false);
  };

  const handleToggleComplete = (ev: PersonalEvent) => {
    db.updatePersonalEvent(ev.id, { isCompleted: !ev.isCompleted });
    setTitle(''); // trigger re-render
  };

  const handleDelete = (id: string, evTitle: string) => {
    if (confirm(`Delete event "${evTitle}"?`)) {
      db.deletePersonalEvent(id);
      setTitle('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">My Academic Events</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your personal study sessions, assignment deadlines, exams, and team meetings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search & Pending/Completed Status */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden"
            >
              <option value="all">All Status</option>
              <option value="pending">Upcoming / Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-8">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-800 mb-1">No Events Found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
            Schedule your assignment deadlines, exam preparations, and project meetings to stay on track.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Event</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className={`bg-white rounded-2xl p-5 border shadow-2xs transition-all flex flex-col justify-between group ${
                ev.isCompleted ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-slate-200/80 hover:border-sky-300'
              }`}
            >
              <div>
                {/* Header Strip with Color Marker & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ev.color || '#0284c7' }}
                    />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {ev.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleComplete(ev)}
                    className="text-xs font-medium text-slate-400 hover:text-sky-600 transition-colors flex items-center gap-1"
                    title={ev.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {ev.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 hover:text-sky-500" />
                    )}
                  </button>
                </div>

                {/* Event Title & Description */}
                <h3
                  className={`text-sm font-bold text-slate-900 mb-1.5 leading-snug ${
                    ev.isCompleted ? 'line-through text-slate-500' : ''
                  }`}
                >
                  {ev.title}
                </h3>
                {ev.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">{ev.description}</p>
                )}
              </div>

              {/* Time, Location & Actions */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {ev.startDate} · {ev.startTime} - {ev.endTime}
                    </span>
                  </div>

                  {ev.location && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{ev.location}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  {ev.reminder ? (
                    <span className="flex items-center gap-1 text-[10px] text-sky-600 font-medium">
                      <Bell className="w-3 h-3" /> Reminder active
                    </span>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(ev)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit event"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ev.id, ev.title)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingEvent ? 'Edit Academic Event' : 'Create Personal Academic Event'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics Midterm Exam Preparation"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Study Goals</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes, key chapters to review, assignment criteria..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!endDate) setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Link</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Science Library Room 402 or Zoom"
                  className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Event Color & Reminder */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">Color Tag</label>
                  <div className="flex items-center gap-1.5">
                    {EVENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          color === c ? 'scale-110 ring-2 ring-offset-2 ring-sky-500' : 'opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer pt-3 sm:pt-0">
                  <input
                    type="checkbox"
                    checked={reminder}
                    onChange={(e) => setReminder(e.target.checked)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span>Enable notification reminder</span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !startDate}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
