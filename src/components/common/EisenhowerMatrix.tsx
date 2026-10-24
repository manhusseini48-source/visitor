import React, { useState, useMemo } from 'react';
import { Storage } from '../../utils/storage';
import { EisenhowerTask, EisenhowerQuadrant } from '../../types';
import {
  Grid,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Calendar,
  Trash2,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Flame,
  Target,
  Zap,
  Coffee,
  Check,
  X,
} from 'lucide-react';

interface Props {
  userId: string;
  storeId?: string;
  userName?: string;
  onTasksCountChange?: (total: number, pending: number, urgentImportant: number) => void;
}

interface QuadrantInfo {
  id: EisenhowerQuadrant;
  title: string;
  subtitle: string;
  actionGuide: string;
  icon: React.ElementType;
  headerBg: string;
  headerText: string;
  borderColor: string;
  badgeBg: string;
}

const QUADRANTS: QuadrantInfo[] = [
  {
    id: 'q1_urgent_important',
    title: 'فوری و مهم (انجام فوری)',
    subtitle: 'بحران‌ها و پیگیری‌های حیاتی امروز',
    actionGuide: 'همین الان شخصاً انجام دهید',
    icon: Flame,
    headerBg: 'bg-rose-500 text-white',
    headerText: 'text-rose-700 dark:text-rose-400',
    borderColor: 'border-rose-300 dark:border-rose-800/80',
    badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
  {
    id: 'q2_important_not_urgent',
    title: 'مهم و غیرفوری (برنامه‌ریزی)',
    subtitle: 'اهداف رشد فروش، جذب مشتری و استراتژی',
    actionGuide: 'زمان مشخص برای اجرا در تقویم رزرو کنید',
    icon: Target,
    headerBg: 'bg-sky-600 text-white',
    headerText: 'text-sky-700 dark:text-sky-400',
    borderColor: 'border-sky-300 dark:border-sky-800/80',
    badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  },
  {
    id: 'q3_urgent_not_important',
    title: 'فوری و غیرمهم (تفویض یا سریع)',
    subtitle: 'هماهنگی‌های تلفنی، پاسخ‌های فوری و تسریع کارها',
    actionGuide: 'سریع تمام کنید یا واگذار نمایید',
    icon: Zap,
    headerBg: 'bg-amber-500 text-white',
    headerText: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-800/80',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    id: 'q4_not_urgent_not_important',
    title: 'غیرفوری و غیرمهم (حذف / فراغت)',
    subtitle: 'امور فرعی، بررسی‌های جانبی و ایده‌های آتی',
    actionGuide: 'در زمان اضافه یا حذف از اولویت',
    icon: Coffee,
    headerBg: 'bg-slate-600 text-white',
    headerText: 'text-slate-700 dark:text-slate-400',
    borderColor: 'border-slate-300 dark:border-slate-700/80',
    badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
];

export const EisenhowerMatrix: React.FC<Props> = ({
  userId,
  storeId,
  userName,
  onTasksCountChange,
}) => {
  const [tasks, setTasks] = useState<EisenhowerTask[]>(() =>
    Storage.getEisenhowerTasks(userId)
  );

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetQuadrant, setTargetQuadrant] = useState<EisenhowerQuadrant>('q1_urgent_important');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [taskDueDate, setTaskDueDate] = useState('');

  const reloadTasks = () => {
    const list = Storage.getEisenhowerTasks(userId);
    setTasks(list);
    if (onTasksCountChange) {
      const pending = list.filter((t) => !t.isCompleted).length;
      const q1Pending = list.filter((t) => !t.isCompleted && t.quadrant === 'q1_urgent_important').length;
      onTasksCountChange(list.length, pending, q1Pending);
    }
  };

  const handleOpenAdd = (quadrant: EisenhowerQuadrant) => {
    setTargetQuadrant(quadrant);
    setTaskTitle('');
    setTaskDesc('');
    setTaskPriority('high');
    setTaskDueDate('');
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const all = Storage.getEisenhowerTasks();
    const newTask: EisenhowerTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      storeId,
      title: taskTitle.trim(),
      description: taskDesc.trim() || undefined,
      quadrant: targetQuadrant,
      priority: taskPriority,
      isCompleted: false,
      dueDate: taskDueDate.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    all.unshift(newTask);
    Storage.saveEisenhowerTasks(all);
    setIsModalOpen(false);
    reloadTasks();
  };

  const handleToggleCompleted = (task: EisenhowerTask) => {
    const all = Storage.getEisenhowerTasks();
    const updated = all.map((t) =>
      t.id === task.id
        ? {
            ...t,
            isCompleted: !t.isCompleted,
            completedAt: !t.isCompleted ? new Date().toISOString() : undefined,
          }
        : t
    );
    Storage.saveEisenhowerTasks(updated);
    reloadTasks();
  };

  const handleDeleteTask = (taskId: string) => {
    const all = Storage.getEisenhowerTasks();
    const remaining = all.filter((t) => t.id !== taskId);
    Storage.saveEisenhowerTasks(remaining);
    reloadTasks();
  };

  const handleMoveQuadrant = (task: EisenhowerTask, newQuadrant: EisenhowerQuadrant) => {
    const all = Storage.getEisenhowerTasks();
    const updated = all.map((t) => (t.id === task.id ? { ...t, quadrant: newQuadrant } : t));
    Storage.saveEisenhowerTasks(updated);
    reloadTasks();
  };

  // Metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const q1Pending = tasks.filter((t) => !t.isCompleted && t.quadrant === 'q1_urgent_important').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 flex items-center justify-center font-bold">
              <Grid className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base">
              ماتریس آیزنهاور برای برنامه‌ریزی و اولویت‌بندی وظایف {userName ? `(${userName})` : ''}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تفکیک کارها بر مبنای اهمیت و فوریت جهت تمرکز حداکثری بر تارگت فروش و کارهای کلیدی
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-center">
            <div className="text-[10px] text-slate-400 font-bold">کل وظایف</div>
            <div className="text-sm font-mono font-black text-slate-800 dark:text-slate-100">
              {totalTasks}
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-center">
            <div className="text-[10px] text-rose-500 font-bold">فوری و مهم</div>
            <div className="text-sm font-mono font-black text-rose-700 dark:text-rose-400">
              {q1Pending}
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-center">
            <div className="text-[10px] text-emerald-500 font-bold">انجام شده</div>
            <div className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-400">
              {completedTasks}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Quadrants Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {QUADRANTS.map((quad) => {
          const quadTasks = tasks.filter((t) => t.quadrant === quad.id);
          const Icon = quad.icon;
          const pendingCount = quadTasks.filter((t) => !t.isCompleted).length;

          return (
            <div
              key={quad.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border-2 ${quad.borderColor} shadow-xs overflow-hidden flex flex-col justify-between`}
            >
              {/* Quadrant Header */}
              <div className={`p-4 ${quad.headerBg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs md:text-sm text-white">{quad.title}</h4>
                    <p className="text-[10px] text-white/80">{quad.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white text-slate-900">
                    {pendingCount} مانده
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAdd(quad.id)}
                    className="w-7 h-7 rounded-lg bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
                    title="افزودن وظیفه به این بخش"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Task Items */}
              <div className="p-4 flex-1 overflow-y-auto max-h-72 space-y-2">
                {quadTasks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    هیچ وظیفه‌ای در این ربع ثبت نشده است.
                  </div>
                ) : (
                  quadTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-2xl border transition flex items-start justify-between gap-3 ${
                        task.isCompleted
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 opacity-60'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleted(task)}
                          className="mt-0.5 text-slate-400 hover:text-emerald-600 cursor-pointer flex-shrink-0"
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold text-slate-800 dark:text-slate-100 ${
                              task.isCompleted ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 font-mono">
                              <Calendar className="w-3 h-3" />
                              <span>سررسید: {task.dueDate}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Quick move selector */}
                        <select
                          value={task.quadrant}
                          onChange={(e) => handleMoveQuadrant(task, e.target.value as any)}
                          className="text-[10px] bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-1.5 py-0.5 font-bold cursor-pointer text-slate-600 dark:text-slate-300"
                          title="انتقال به ربع دیگر"
                        >
                          <option value="q1_urgent_important">Q1 - فوری/مهم</option>
                          <option value="q2_important_not_urgent">Q2 - برنامه‌ریزی</option>
                          <option value="q3_urgent_not_important">Q3 - تفویض</option>
                          <option value="q4_not_urgent_not_important">Q4 - فرعی</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Action Guide Footer */}
              <div className="p-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  دستورالعمل: <strong>{quad.actionGuide}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenAdd(quad.id)}
                  className="font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ثبت وظیفه</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Grid className="w-4 h-4 text-indigo-600" />
                <span>ثبت وظیفه در ماتریس آیزنهاور</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  موقعیت در ماتریس (ربع هدف) *
                </label>
                <select
                  value={targetQuadrant}
                  onChange={(e) => setTargetQuadrant(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                >
                  <option value="q1_urgent_important">۱. فوری و مهم (اقدام آنی امروز)</option>
                  <option value="q2_important_not_urgent">۲. مهم و غیرفوری (برنامه‌ریزی استراتژیک)</option>
                  <option value="q3_urgent_not_important">۳. فوری و غیرمهم (اقدام سریع / هماهنگی)</option>
                  <option value="q4_not_urgent_not_important">۴. غیرفوری و غیرمهم (کارهای جانبی)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان وظیفه *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="مثال: پیگیری فاکتور دواخانه رازی، تسویه بیعانه‌ها..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و بابت (اختیاری)
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="نکات تکمیلی برای انجام کار..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    سطح اولویت
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="high">بالا (High)</option>
                    <option value="medium">متوسط (Medium)</option>
                    <option value="low">پایین (Low)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ سررسید (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    placeholder="مثال: امروز عصر / فردا"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  ثبت وظیفه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
