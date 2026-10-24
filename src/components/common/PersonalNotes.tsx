import React, { useState, useMemo } from 'react';
import { Storage } from '../../utils/storage';
import { PersonalNote } from '../../types';
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Tag,
  Check,
  X,
  Sparkles,
  Calendar,
  Lock,
  ListTodo,
  Lightbulb,
  Building2,
  BookOpen,
} from 'lucide-react';

interface Props {
  userId: string;
  userRole: string;
  storeId?: string;
  userName?: string;
}

const CATEGORIES = [
  { id: 'all', label: 'همه یادداشت‌ها', icon: BookOpen },
  { id: 'general', label: 'عمومی و کاری', icon: FileText, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' },
  { id: 'client_followup', label: 'پیگیری مشتریان', icon: Building2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
  { id: 'checklist', label: 'چک‌لیست و وظایف', icon: ListTodo, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
  { id: 'idea', label: 'ایده‌ها و استراتژی', icon: Lightbulb, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
  { id: 'private', label: 'شخصی و محرمانه', icon: Lock, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
];

const COLOR_TAGS = [
  { id: 'slate', bg: 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800' },
  { id: 'emerald', bg: 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' },
  { id: 'sky', bg: 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800' },
  { id: 'amber', bg: 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' },
  { id: 'purple', bg: 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800' },
  { id: 'rose', bg: 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' },
];

export const PersonalNotes: React.FC<Props> = ({ userId, userRole, storeId, userName }) => {
  const [notes, setNotes] = useState<PersonalNote[]>(() => Storage.getNotes(userId));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PersonalNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PersonalNote['category']>('general');
  const [colorTag, setColorTag] = useState<string>('slate');
  const [isPinned, setIsPinned] = useState(false);

  const reloadNotes = () => {
    setNotes(Storage.getNotes(userId));
  };

  const handleOpenNew = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setCategory('general');
    setColorTag('slate');
    setIsPinned(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: PersonalNote) => {
    setEditingNote(n);
    setTitle(n.title);
    setContent(n.content);
    setCategory(n.category);
    setColorTag(n.colorTag || 'slate');
    setIsPinned(Boolean(n.isPinned));
    setIsModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const all = Storage.getNotes();
    const nowIso = new Date().toISOString();

    if (editingNote) {
      const updated = all.map((n) =>
        n.id === editingNote.id
          ? {
              ...n,
              title: title.trim() || 'بدون عنوان',
              content: content.trim(),
              category,
              colorTag,
              isPinned,
              updatedAt: nowIso,
            }
          : n
      );
      Storage.saveNotes(updated);
    } else {
      const newNote: PersonalNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        storeId,
        title: title.trim() || 'یادداشت جدید',
        content: content.trim(),
        category,
        colorTag,
        isPinned,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      all.unshift(newNote);
      Storage.saveNotes(all);
    }

    setIsModalOpen(false);
    reloadNotes();
  };

  const handleDelete = (noteId: string) => {
    Storage.deleteNote(noteId);
    reloadNotes();
  };

  const handleTogglePin = (note: PersonalNote) => {
    const all = Storage.getNotes();
    const updated = all.map((n) => (n.id === note.id ? { ...n, isPinned: !n.isPinned } : n));
    Storage.saveNotes(updated);
    reloadNotes();
  };

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notes
      .filter((n) => {
        if (activeCategory !== 'all' && n.category !== activeCategory) return false;
        if (q) {
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchContent = n.content.toLowerCase().includes(q);
          return matchTitle || matchContent;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, searchQuery, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm md:text-base">
              دفترچه یادداشت اختصاصی {userName ? `(${userName})` : ''}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200">
              {notes.length} یادداشت
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ثبت یادداشت‌های روزانه، نکات مذاکره با داروخانه‌ها، هماهنگی‌های شخصی و چک‌لیست کاری
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative w-full sm:w-56">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در یادداشت‌ها..."
              className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>یادداشت جدید</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => {
          const count = cat.id === 'all' ? notes.length : notes.filter((n) => n.category === cat.id).length;
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h4 className="font-black text-sm text-slate-700 dark:text-slate-200">
            هنوز یادداشتی در این دسته ثبت نشده است
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            برای ثبت اولین یادداشت کاری، نکات مشتریان یا چک‌لیست شخصی، روی دکمه «یادداشت جدید» کلیک کنید.
          </p>
          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
          >
            ایجاد اولین یادداشت
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => {
            const catObj = CATEGORIES.find((c) => c.id === note.category) || CATEGORIES[1];
            const CatIcon = catObj.icon;
            const colorObj = COLOR_TAGS.find((c) => c.id === note.colorTag) || COLOR_TAGS[0];

            return (
              <div
                key={note.id}
                className={`p-4 rounded-3xl border transition shadow-2xs hover:shadow-md flex flex-col justify-between space-y-3 relative overflow-hidden ${colorObj.bg}`}
              >
                {note.isPinned && (
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-400/20 text-amber-600 flex items-center justify-center">
                    <Pin className="w-3.5 h-3.5 rotate-45" />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${catObj.color || 'bg-slate-100 text-slate-600'}`}
                    >
                      <CatIcon className="w-3 h-3" />
                      <span>{catObj.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(note.updatedAt).toLocaleDateString('fa-AF')}
                    </span>
                  </div>

                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 mb-1.5">
                    {note.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-6 leading-relaxed">
                    {note.content}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {note.content.split(/\s+/).filter(Boolean).length} کلمه
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(note)}
                      className={`p-1.5 rounded-lg transition cursor-pointer ${
                        note.isPinned
                          ? 'text-amber-500 bg-amber-100 dark:bg-amber-950/80'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title={note.isPinned ? 'برداشتن سنجاق' : 'سنجاق به بالا'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(note)}
                      className="p-1.5 text-slate-500 hover:text-sky-600 rounded-lg transition cursor-pointer"
                      title="ویرایش"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(note.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Edit / Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>{editingNote ? 'ویرایش یادداشت' : 'ثبت یادداشت جدید'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  عنوان یادداشت *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: توافق تخفیف دواخانه رازی، اقلام پرمصرف..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    دسته‌بندی موضوعی
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="general">عمومی و کاری</option>
                    <option value="client_followup">پیگیری مشتریان</option>
                    <option value="checklist">چک‌لیست و وظایف</option>
                    <option value="idea">ایده‌ها و استراتژی</option>
                    <option value="private">شخصی و محرمانه</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رنگ برچسب
                  </label>
                  <select
                    value={colorTag}
                    onChange={(e) => setColorTag(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  >
                    <option value="slate">ساده (کلاسیک)</option>
                    <option value="emerald">سبز (موفقیت/تسویه)</option>
                    <option value="sky">آبی (هماهنگی)</option>
                    <option value="amber">طلایی/زرد (هشدار/مهم)</option>
                    <option value="purple">بنفش (استراتژیک)</option>
                    <option value="rose">قرمز (فوری)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  متن یادداشت *
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="جزییات مذاکره، نیازهای دارویی، تاریخ‌های مهم و نکات لازم..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded-md text-amber-500 focus:ring-amber-400"
                />
                <label htmlFor="pinCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  سنجاق کردن این یادداشت در بالای لیست (مهم)
                </label>
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
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  ذخیره یادداشت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
