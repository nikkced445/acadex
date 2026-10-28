import React from 'react';
import { db } from '../../services/db';
import { NotificationItem } from '../../types';
import { AlertCircle, Bell, Calendar, CheckCheck, FileText, Info, Trash2, X } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onNavigateToItem?: (type: string, id: string) => void;
  onRefresh?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  userId,
  onNavigateToItem,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const notifications = db.getNotifications(userId);
  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkAsRead = (id: string) => {
    db.markNotificationAsRead(id);
    onRefresh?.();
  };

  const handleMarkAllAsRead = () => {
    db.markAllNotificationsAsRead(userId);
    onRefresh?.();
  };

  const handleClearAll = () => {
    db.clearNotifications(userId);
    onRefresh?.();
  };

  const getIcon = (item: NotificationItem) => {
    if (item.priority === 'urgent') {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    switch (item.type) {
      case 'announcement':
        return <Info className="w-4 h-4 text-sky-500" />;
      case 'event':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'storage':
        return <FileText className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm sm:max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
              <p className="text-[11px] text-slate-400">
                {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                title="Mark all as read"
                className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-colors text-xs flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark read</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                title="Clear all notifications"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Bell className="w-10 h-10 text-slate-300 stroke-1 mb-3" />
              <p className="text-sm font-medium text-slate-600">No Notifications</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                You will be notified about official school announcements, upcoming exam deadlines, and cloud storage events.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (!item.readAt) handleMarkAsRead(item.id);
                  if (item.relatedEntityType && item.relatedEntityId) {
                    onNavigateToItem?.(item.relatedEntityType, item.relatedEntityId);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  !item.readAt
                    ? 'bg-sky-50/60 border-sky-200/80 hover:bg-sky-50'
                    : 'bg-white border-slate-150 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/60 shadow-xs shrink-0 mt-0.5">
                    {getIcon(item)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={`text-xs truncate ${
                          !item.readAt ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      {!item.readAt && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(item.id);
                          }}
                          className="text-[10px] text-sky-600 font-medium hover:underline"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
