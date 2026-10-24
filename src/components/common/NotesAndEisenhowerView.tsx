import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PersonalNotes } from './PersonalNotes';
import { EisenhowerMatrix } from './EisenhowerMatrix';
import { Grid, BookOpen, Sparkles } from 'lucide-react';

interface Props {
  initialTab?: 'eisenhower' | 'notes';
}

export const NotesAndEisenhowerView: React.FC<Props> = ({ initialTab = 'eisenhower' }) => {
  const { currentUser, currentStore } = useApp();
  const [activeTab, setActiveTab] = useState<'eisenhower' | 'notes'>(initialTab);

  const userId = currentUser?.id || 'guest_user';
  const userName = currentUser?.name || 'کاربر';
  const storeId = currentStore?.id || currentUser?.storeId;

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('eisenhower')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeTab === 'eisenhower'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>ماتریس آیزنهاور (برنامه‌ریزی و اولویت‌بندی)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
            activeTab === 'notes'
              ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>دفترچه یادداشت شخصی و چک‌لیست</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'eisenhower' ? (
        <EisenhowerMatrix userId={userId} storeId={storeId} userName={userName} />
      ) : (
        <PersonalNotes
          userId={userId}
          userRole={currentUser?.role || 'visitor'}
          storeId={storeId}
          userName={userName}
        />
      )}
    </div>
  );
};
