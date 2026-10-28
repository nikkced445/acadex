import React, { useState } from 'react';
import { Folder } from '../../types';
import { Folder as FolderIcon, X } from 'lucide-react';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderToEdit?: Folder | null;
  onSubmit: (name: string, color?: string) => void;
}

const FOLDER_COLORS = ['#0284c7', '#059669', '#7c3aed', '#ea580c', '#e11d48', '#475569'];

export const FolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, folderToEdit, onSubmit }) => {
  const [folderName, setFolderName] = useState(folderToEdit?.name || '');
  const [selectedColor, setSelectedColor] = useState(folderToEdit?.color || FOLDER_COLORS[0]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    onSubmit(folderName.trim(), selectedColor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <FolderIcon className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">
              {folderToEdit ? 'Rename Folder' : 'Create New Subject Folder'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Folder Name</label>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Physics 101 - Lab Reports"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Folder Accent Color</label>
            <div className="flex items-center gap-2">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-110 ring-2 ring-offset-2 ring-sky-500' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
            >
              {folderToEdit ? 'Save Changes' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
