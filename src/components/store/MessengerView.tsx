import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage, getEffectiveStoreId } from '../../utils/storage';
import { Conversation, Message, UserProfile } from '../../types';
import { compressImage, uploadToCloudinary } from '../../utils/imageCompressor';
import { SupabaseSync } from '../../utils/supabaseSync';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';
import {
  MessageSquare,
  Users,
  Send,
  Image as ImageIcon,
  CheckCheck,
  Check,
  Shield,
  FileText,
  AlertCircle,
  Lock,
  User,
  Store as StoreIcon,
  X,
  Trash2,
  Smile,
  Search,
  ArrowRight,
  Copy,
  CheckCircle2,
  RotateCcw,
  Star,
  Pin,
  Filter,
  Phone,
  Clock,
  Ban,
  Heart,
  ThumbsUp,
  Flame,
  Paperclip,
} from 'lucide-react';
import { MedicineImageViewerModal } from '../common/MedicineImageViewerModal';

interface Props {
  initialSharedOrder?: any;
}

// Categorized Emojis for professional pharmaceutical and business chat
const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'لبخند و چهره‌ها',
    icon: '😊',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋',
      '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
      '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
      '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
      '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
      '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
      '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
      '😩', '😫', '🥱', '😤', '😡', '😠', '🤬',
    ],
  },
  {
    id: 'hands',
    name: 'دست و اشاره',
    icon: '👍',
    emojis: [
      '👍', '👎', '👏', '🙌', '🤝', '🤲', '🙏', '✌️', '🤞', '🤟',
      '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️',
      '🖖', '✍️', '🤳', '💪', '🤛', '🤜', '👊', '👋', '🤝', '👌',
    ],
  },
  {
    id: 'medical',
    name: 'دوا و سلامت',
    icon: '💊',
    emojis: [
      '💊', '💉', '🩺', '🩹', '🧬', '🔬', '🌡️', '🏥', '🚑', '🧑‍⚕️',
      '👩‍⚕️', '👨‍⚕️', '🦷', '🫀', '🫁', '🧪', '🧼', '🧴', '📦', '📋',
      '📑', '⚕️', '🧴', '🧤', '😷',
    ],
  },
  {
    id: 'business',
    name: 'فروش و امور مالی',
    icon: '💼',
    emojis: [
      '💰', '💵', '💸', '💳', '🧾', '📊', '📈', '📉', '💼', '📁',
      '📂', '📅', '📆', '⏱️', '⏰', '⏳', '📝', '✏️', '🖊️', '🔍',
      '🔎', '📌', '📍', '🏷️', '📦', '🚚', '🚛', '🏪', '🛒', '🏢',
    ],
  },
  {
    id: 'symbols',
    name: 'قلب و نشانه‌ها',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '✨', '🌟',
      '⭐', '💫', '🔥', '💥', '⚡', '💯', '✅', '❌', '⚠️', 'ℹ️',
      '🔔', '📢', '🎯', '🏆', '💡', '🔒', '🔑', '🆗', '🆙', '🟢',
    ],
  },
];

// Quick business response templates
const QUICK_TEMPLATES = [
  'سلام، سفارش شما دریافت و بررسی شد ✅',
  'دواهای درخواستی موجود در انبار است 💊',
  'لطفاً مانده حساب فاکتور را تسویه فرمایید 🧾',
  'فاکتور جدید صادر و آماده تحویل است 📦',
  'ویزیتور محترم، لطفاً به دواخانه مراجعه فرمایید 📍',
  'مبلغ وصولی دریافت و در سیستم ثبت شد 💵',
];

export const MessengerView: React.FC<Props> = ({ initialSharedOrder }) => {
  const { currentStore, currentUser, checkGuestAndPrompt } = useApp();
  const storeId = getEffectiveStoreId(currentUser, currentStore);

  // Mobile view toggle (show list vs active chat on small screens)
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Emoji picker state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState('smileys');
  const [emojiSearch, setEmojiSearch] = useState('');

  // Quick templates dropdown
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);

  // Search in conversation list & messages
  const [conversationSearch, setConversationSearch] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [showMessageSearch, setShowMessageSearch] = useState(false);

  // Delete message confirmation modal state
  const [deleteConfirmMsgId, setDeleteConfirmMsgId] = useState<string | null>(null);

  // Copy toast
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Input ref for cursor positioning
  const inputRef = useRef<HTMLInputElement>(null);

  // Ensure public group and appropriate private chats exist
  const initConversations = (): Conversation[] => {
    if (!storeId) return [];

    let convs = Storage.getConversations(storeId);
    let updated = false;

    // 1. Ensure public group chat exists
    const groupChatId = `conv_group_${storeId}`;
    let publicGroup = convs.find((c) => c.type === 'store_group');
    if (!publicGroup) {
      publicGroup = {
        id: groupChatId,
        storeId,
        type: 'store_group',
        unreadCount: 0,
        lastMessageText: 'گروه عمومی فروشگاه و ویزیتورها ایجاد شد',
        lastMessageTime: new Date().toISOString(),
      };
      convs.unshift(publicGroup);
      updated = true;
    }

    // 2. Ensure each registered visitor has a private chat with the store
    const visitors = Storage.getProfiles().filter(
      (p) => p.role === 'visitor' && (!p.storeId || p.storeId === storeId || storeId === 'store_main')
    );
    visitors.forEach((vis) => {
      const exists = convs.find(
        (c) => c.type === 'private' && c.visitorId === vis.id
      );
      if (!exists) {
        convs.push({
          id: `conv_private_${storeId}_${vis.id}`,
          storeId,
          type: 'private',
          visitorId: vis.id,
          visitorName: vis.name,
          unreadCount: 0,
          lastMessageText: 'شروع گفتگوی اختصاصی و کاری',
          lastMessageTime: new Date().toISOString(),
        });
        updated = true;
      }
    });

    if (updated) {
      Storage.saveConversations(convs);
    }

    return convs;
  };

  const [allConversations, setAllConversations] = useState<Conversation[]>(initConversations);

  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'groups' | 'private'>('all');

  // Business Rule:
  // - Public group: All visitors & store owner can chat together.
  // - Private chat: Visitor <-> Store only! Visitors CANNOT chat privately with other visitors.
  const visibleConversations = useMemo(() => {
    let list = allConversations;
    if (currentUser?.role === 'visitor') {
      list = allConversations.filter(
        (c) =>
          c.type === 'store_group' ||
          (c.type === 'private' && c.visitorId === currentUser.id)
      );
    }

    // Apply WhatsApp filter tab
    if (conversationFilter === 'unread') {
      list = list.filter((c) => c.unreadCount > 0);
    } else if (conversationFilter === 'groups') {
      list = list.filter((c) => c.type === 'store_group');
    } else if (conversationFilter === 'private') {
      list = list.filter((c) => c.type === 'private');
    }

    if (conversationSearch.trim()) {
      const q = conversationSearch.toLowerCase().trim();
      list = list.filter((c) => {
        const title = c.type === 'store_group' ? 'گروه عمومی فروشگاه' : (c.visitorName || '');
        const lastMsg = c.lastMessageText || '';
        return title.toLowerCase().includes(q) || lastMsg.toLowerCase().includes(q);
      });
    }

    return list;
  }, [allConversations, currentUser, conversationFilter, conversationSearch]);

  const [activeConvId, setActiveConvId] = useState<string>(() => {
    const list = visibleConversations;
    return list[0]?.id || '';
  });

  // Keep activeConvId valid if list updates
  useEffect(() => {
    if (!visibleConversations.some((c) => c.id === activeConvId)) {
      if (visibleConversations[0]) {
        setActiveConvId(visibleConversations[0].id);
      }
    }
  }, [visibleConversations, activeConvId]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [groupEnabled, setGroupEnabled] = useState(
    currentStore?.groupChatEnabled ?? true
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Sync messages in real-time from Supabase and localStorage
  useEffect(() => {
    const reloadMessages = () => {
      if (activeConvId) {
        setMessages(Storage.getMessages(activeConvId));
      }
      setAllConversations(Storage.getConversations(storeId));
    };

    reloadMessages();
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);

    const pullLiveMessages = async () => {
      if (!storeId) return;
      try {
        const cloudMsgs = await SupabaseSync.pullStoreMessages(storeId);
        if (cloudMsgs && cloudMsgs.length > 0) {
          Storage.mergeCloudMessages(cloudMsgs, storeId);
          reloadMessages();
        }
      } catch {}
    };

    pullLiveMessages();
    const interval = setInterval(pullLiveMessages, 3500);
    window.addEventListener('storage', reloadMessages);

    // Supabase Realtime Channel for instant messaging
    let channel: any = null;
    if (supabase && isSupabaseConfigured) {
      try {
        channel = supabase
          .channel(`rt-messenger-${storeId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'messages' },
            () => {
              pullLiveMessages();
            }
          )
          .subscribe();
      } catch {}
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', reloadMessages);
      if (channel) {
        try {
          channel.unsubscribe();
        } catch {}
      }
    };
  }, [activeConvId, storeId]);

  // Handle shared order doc if passed from orders tab
  useEffect(() => {
    if (initialSharedOrder && activeConvId) {
      const newMsg: Message = {
        id: `msg_${Date.now()}`,
        conversationId: activeConvId,
        senderId: currentUser?.id || 'owner',
        senderName: currentUser?.name || 'مدیر فروشگاه',
        senderRole: currentUser?.role || 'store_owner',
        text: `سند فاکتور ${initialSharedOrder.orderNumber} به اشتراک گذاشته شد.`,
        orderDocAttachment: {
          orderId: initialSharedOrder.id,
          orderNumber: initialSharedOrder.orderNumber,
          customerName: initialSharedOrder.customerName,
          totalAFN: initialSharedOrder.totalAFN,
        },
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      Storage.addMessage(newMsg);
      setMessages(Storage.getMessages(activeConvId));
      setMobileChatOpen(true);
    }
  }, [initialSharedOrder]);

  const activeConversation = visibleConversations.find((c) => c.id === activeConvId);

  // Toggle store general group chat
  const handleToggleGroupChat = () => {
    if (!currentStore) return;
    const newStatus = !groupEnabled;
    const updatedStore = { ...currentStore, groupChatEnabled: newStatus };
    Storage.updateStore(updatedStore);
    setGroupEnabled(newStatus);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorNotice(null);
    setUploadingImage(true);
    try {
      const compResult = await compressImage(file, 200, 1200);
      if (compResult.sizeKB > 200) {
        throw new Error('حجم تصویر بیش از حد مجاز است. لطفاً تصویر سبک‌تری انتخاب نمایید.');
      }
      const cloudUrl = await uploadToCloudinary(compResult.file, 'chat');
      setSelectedImage(cloudUrl);
    } catch (err: any) {
      setErrorNotice(err.message || 'خطا در بارگذاری تصویر چت');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (checkGuestAndPrompt('ارسال پیام در پیام‌رسان')) return;
    setErrorNotice(null);

    if (!inputText.trim() && !selectedImage) return;

    if (activeConversation?.type === 'store_group' && !groupEnabled) {
      setErrorNotice('این گروه توسط مدیریت فروشگاه موقتاً غیرفعال شده است.');
      return;
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: activeConvId,
      senderId: currentUser?.id || 'user',
      senderName: currentUser?.name || 'کاربر',
      senderRole: currentUser?.role || 'store_owner',
      text: inputText.trim() || undefined,
      imageUrl: selectedImage || undefined,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    Storage.addMessage(newMsg, storeId);

    // Update conversation preview
    const convs = Storage.getConversations(storeId).map((c) =>
      c.id === activeConvId
        ? {
            ...c,
            lastMessageText: newMsg.text || 'تصویر پیوست شده',
            lastMessageTime: newMsg.createdAt,
          }
        : c
    );
    Storage.saveConversations(convs);
    setAllConversations(convs);

    setMessages([...messages, newMsg]);
    setInputText('');
    setSelectedImage(null);
    setShowEmojiPicker(false);
    setShowQuickTemplates(false);

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Insert emoji at cursor position
  const handleInsertEmoji = (emoji: string) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || inputText.length;
      const end = inputRef.current.selectionEnd || inputText.length;
      const updated = inputText.substring(0, start) + emoji + inputText.substring(end);
      setInputText(updated);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.selectionStart = start + emoji.length;
          inputRef.current.selectionEnd = start + emoji.length;
        }
      }, 10);
    } else {
      setInputText((prev) => prev + emoji);
    }
  };

  // Soft Delete a message (shows "این پیام حذف شده است")
  const handleDeleteMessage = (msgId: string) => {
    if (checkGuestAndPrompt('حذف پیام')) return;
    Storage.softDeleteMessage(msgId, storeId);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId
          ? {
              ...m,
              isDeleted: true,
              deletedAt: new Date().toISOString(),
              text: 'این پیام حذف شده است',
              imageUrl: undefined,
              orderDocAttachment: undefined,
            }
          : m
      )
    );
    setDeleteConfirmMsgId(null);
  };

  // Copy message text to clipboard
  const handleCopyMessage = (text?: string, msgId?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (msgId) {
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    }
  };

  // Switch conversation with auto mobile drawer handling
  const handleSelectConversation = (convId: string) => {
    setActiveConvId(convId);
    setMobileChatOpen(true);
    setMessageSearchQuery('');
    setShowMessageSearch(false);
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  // Filter messages in current chat if user searched
  const filteredMessages = useMemo(() => {
    if (!messageSearchQuery.trim()) return messages;
    const q = messageSearchQuery.toLowerCase().trim();
    return messages.filter((m) => m.text?.toLowerCase().includes(q));
  }, [messages, messageSearchQuery]);

  // Filtered emojis for search inside emoji picker
  const filteredEmojis = useMemo(() => {
    const curCat = EMOJI_CATEGORIES.find((c) => c.id === activeEmojiTab) || EMOJI_CATEGORIES[0];
    if (!emojiSearch.trim()) return curCat.emojis;
    // Flatten search
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return all.filter((e) => e.includes(emojiSearch));
  }, [activeEmojiTab, emojiSearch]);

  return (
    <div className="bg-[#ffffff] dark:bg-[#111b21] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden h-[760px] max-h-[88dvh] flex flex-col md:flex-row transition-colors">
      {/* ========================================================= */}
      {/* 1. WHATSAPP CONVERSATIONS SIDEBAR */}
      {/* ========================================================= */}
      <div
        className={`w-full md:w-84 lg:w-96 border-b md:border-b-0 md:border-l border-slate-200 dark:border-slate-800 flex flex-col bg-[#f0f2f5] dark:bg-[#111b21] ${
          mobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* WhatsApp Sidebar Header */}
        <div className="p-3 px-4 bg-[#008069] dark:bg-[#202c33] text-white flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-black text-sm shadow-inner flex-shrink-0">
              {currentUser?.name ? currentUser.name.slice(0, 2) : <MessageSquare className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-white text-sm sm:text-base truncate flex items-center gap-1.5">
                <span>پیام‌رسان کاری</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">واتساپ</span>
              </h3>
              <p className="text-[11px] text-emerald-100 dark:text-slate-300 truncate">
                {currentUser?.role === 'visitor' ? 'ارتباط مستقیم با انبار و مدیریت' : 'گفتگو با ویزیتورها و مشتریان'}
              </p>
            </div>
          </div>

          {currentUser?.role === 'store_owner' && (
            <button
              onClick={handleToggleGroupChat}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                groupEnabled
                  ? 'text-[#008069] bg-white hover:bg-slate-100'
                  : 'text-white/80 bg-black/20 hover:bg-black/30'
              }`}
              title="فعال یا معلق‌سازی گروه عمومی"
            >
              <span className={`w-2 h-2 rounded-full ${groupEnabled ? 'bg-[#25d366] animate-pulse' : 'bg-slate-400'}`} />
              <span>گروه: {groupEnabled ? 'فعال' : 'بسته'}</span>
            </button>
          )}
        </div>

        {/* WhatsApp Search & Filter Tabs */}
        <div className="p-2.5 bg-white dark:bg-[#111b21] border-b border-slate-200/60 dark:border-slate-800 space-y-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#54656f] dark:text-[#8696a0] absolute right-3 top-2.5" />
            <input
              type="text"
              value={conversationSearch}
              onChange={(e) => setConversationSearch(e.target.value)}
              placeholder="جستجو در گفتگوها یا پیام‌ها..."
              className="w-full bg-[#f0f2f5] dark:bg-[#202c33] border-none rounded-xl pr-9 pl-8 py-2 text-xs text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] outline-none focus:ring-2 focus:ring-[#00a884] transition"
            />
            {conversationSearch && (
              <button
                onClick={() => setConversationSearch('')}
                className="absolute left-2.5 top-2 text-[#54656f] hover:text-[#111b21] dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* WhatsApp Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {[
              { id: 'all', label: 'همه' },
              { id: 'unread', label: 'خوانده نشده' },
              { id: 'groups', label: 'گروه‌ها' },
              { id: 'private', label: 'خصوصی' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setConversationFilter(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  conversationFilter === tab.id
                    ? 'bg-[#008069] text-white dark:bg-[#00a884] shadow-xs'
                    : 'bg-[#f0f2f5] dark:bg-[#202c33] text-[#54656f] dark:text-[#8696a0] hover:bg-slate-200 dark:hover:bg-[#2a3942]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#111b21]">
          {visibleConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#54656f] dark:text-[#8696a0] space-y-2">
              <MessageSquare className="w-9 h-9 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="font-bold">گفتگویی مطابق فیلتر یافت نشد</p>
            </div>
          ) : (
            visibleConversations.map((c) => {
              const isActive = c.id === activeConvId;
              const isGroup = c.type === 'store_group';

              let title = '';
              let subtitle = '';
              if (isGroup) {
                title = 'گروه عمومی فروشگاه';
                subtitle = 'تبادل نظر همه ویزیتورها و مدیریت';
              } else if (currentUser?.role === 'visitor') {
                title = 'گفتگوی خصوصی با مدیریت';
                subtitle = 'پیام مستقیم با صاحب فروشگاه / انبار';
              } else {
                title = c.visitorName ? `ویزیتور: ${c.visitorName}` : 'گفتگوی اختصاصی';
                subtitle = 'گفتگوی خصوصی ۱ به ۱';
              }

              return (
                <button
                  key={c.id}
                  onClick={() => handleSelectConversation(c.id)}
                  className={`w-full p-3 px-3.5 text-right flex items-center gap-3 transition cursor-pointer relative ${
                    isActive
                      ? 'bg-[#f0f2f5] dark:bg-[#2a3942] border-r-4 border-[#008069] dark:border-[#00a884]'
                      : 'hover:bg-[#f5f6f6] dark:hover:bg-[#182229] border-r-4 border-transparent'
                  }`}
                >
                  {/* WhatsApp Circular 48px Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-xs ${
                        isGroup
                          ? 'bg-gradient-to-tr from-[#008069] to-[#00a884]'
                          : currentUser?.role === 'visitor'
                          ? 'bg-gradient-to-tr from-teal-600 to-emerald-600'
                          : 'bg-gradient-to-tr from-sky-600 to-indigo-600'
                      }`}
                    >
                      {isGroup ? (
                        <Users className="w-6 h-6" />
                      ) : currentUser?.role === 'visitor' ? (
                        <StoreIcon className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>

                    {/* WhatsApp Online Green Dot Badge */}
                    <span className="w-3.5 h-3.5 rounded-full bg-[#25d366] border-2 border-white dark:border-[#111b21] absolute bottom-0 right-0 shadow-xs" />
                  </div>

                  {/* Title & Preview */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs sm:text-sm truncate font-bold ${
                        isActive
                          ? 'text-[#008069] dark:text-[#00a884] font-black'
                          : 'text-[#111b21] dark:text-[#e9edef]'
                      }`}>
                        {title}
                      </span>
                      {c.lastMessageTime && (
                        <span className="text-[11px] text-[#667781] dark:text-[#8696a0] font-mono flex-shrink-0 mr-1">
                          {new Date(c.lastMessageTime).toLocaleTimeString('fa-AF', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] text-[#667781] dark:text-[#8696a0] truncate flex items-center gap-1 max-w-[200px]">
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] flex-shrink-0" />
                        <span>{c.lastMessageText || subtitle}</span>
                      </p>

                      {/* WhatsApp Green Unread Badge */}
                      {c.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 rounded-full bg-[#25d366] text-white font-bold text-[10px] px-1.5 flex items-center justify-center flex-shrink-0 shadow-xs">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* WhatsApp Privacy & Security Footer */}
        <div className="p-2.5 px-3 bg-[#f0f2f5] dark:bg-[#111b21] border-t border-slate-200 dark:border-slate-800 text-[11px] text-[#54656f] dark:text-[#8696a0] flex items-center gap-1.5 justify-center">
          <Lock className="w-3.5 h-3.5 text-[#008069] dark:text-[#00a884] flex-shrink-0" />
          <span>پیام‌ها سرتاسر رمزنگاری شده و محفوظ هستند.</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. WHATSAPP MAIN CHAT AREA */}
      {/* ========================================================= */}
      <div
        className={`flex-1 flex flex-col relative min-w-0 bg-[#efeae2] dark:bg-[#0b141a] ${
          !mobileChatOpen ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* WhatsApp Fast Switcher Ribbon (جابجایی سریع بین گفتگوها با ۱ لمس) */}
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 p-2 px-3 overflow-x-auto flex items-center gap-2 scrollbar-none flex-shrink-0">
          <span className="text-[10px] font-bold text-[#54656f] dark:text-[#8696a0] whitespace-nowrap pl-1">
            جابجایی سریع:
          </span>
          {visibleConversations.map((c) => {
            const isActive = c.id === activeConvId;
            const isGroup = c.type === 'store_group';
            const shortName = isGroup ? 'گروه عمومی' : (c.visitorName || 'ویزیتور');
            return (
              <button
                key={c.id}
                onClick={() => handleSelectConversation(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs ${
                  isActive
                    ? 'bg-[#008069] text-white shadow-sm ring-2 ring-emerald-300 dark:ring-emerald-700'
                    : 'bg-white dark:bg-[#111b21] text-[#111b21] dark:text-[#e9edef] hover:bg-slate-200/80 dark:hover:bg-[#2a3942] border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                {isGroup ? (
                  <Users className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5" />
                )}
                <span>{shortName}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse" />}
              </button>
            );
          })}
        </div>

        {/* WhatsApp Active Chat Header */}
        <div className="p-2.5 px-3.5 sm:px-4 bg-[#008069] dark:bg-[#202c33] text-white flex items-center justify-between gap-3 shadow-sm z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile back to conversations list button */}
            <button
              onClick={() => setMobileChatOpen(false)}
              className="md:hidden p-2 rounded-full hover:bg-white/10 text-white flex items-center justify-center cursor-pointer transition"
              title="بازگشت به لیست گفتگوها"
            >
              <ArrowRight className="w-5 h-5 text-white" />
            </button>

            {/* WhatsApp Avatar */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs flex-shrink-0 ${
                activeConversation?.type === 'store_group'
                  ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                  : 'bg-gradient-to-tr from-sky-600 to-indigo-600'
              }`}
            >
              {activeConversation?.type === 'store_group' ? (
                <Users className="w-5 h-5" />
              ) : currentUser?.role === 'visitor' ? (
                <StoreIcon className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-white truncate">
                  {activeConversation?.type === 'store_group'
                    ? 'گروه عمومی فروشگاه و همکاران'
                    : currentUser?.role === 'visitor'
                    ? 'گفتگوی اختصاصی با مدیریت فروشگاه'
                    : `گفتگوی کاری: ${activeConversation?.visitorName || 'ویزیتور'}`}
                </span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  {activeConversation?.type === 'store_group' ? 'گروه' : 'شخصی'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse" />
                <span>آنلاین</span>
              </p>
            </div>
          </div>

          {/* WhatsApp Header Actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setShowMessageSearch(!showMessageSearch)}
              className={`p-2 rounded-full transition cursor-pointer hover:bg-white/10 text-white ${
                showMessageSearch ? 'bg-white/20' : ''
              }`}
              title="جستجو در پیام‌ها"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowQuickTemplates(!showQuickTemplates)}
              className="px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="پاسخ‌های آماده کاری"
            >
              <Pin className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">پاسخ آماده</span>
            </button>
          </div>
        </div>

        {/* Message Search Bar dropdown */}
        {showMessageSearch && (
          <div className="p-2.5 px-4 bg-white dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 animate-in slide-in-from-top-2">
            <Search className="w-4 h-4 text-[#008069] dark:text-[#00a884] flex-shrink-0" />
            <input
              type="text"
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="جستجوی کلمه در این مکالمه..."
              className="flex-1 bg-[#f0f2f5] dark:bg-[#111b21] border-none rounded-xl px-3 py-1.5 text-xs text-[#111b21] dark:text-[#e9edef] outline-none"
              autoFocus
            />
            {messageSearchQuery && (
              <button
                onClick={() => setMessageSearchQuery('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <span className="text-[11px] text-[#008069] dark:text-[#00a884] font-bold">
              {filteredMessages.length} مورد
            </span>
          </div>
        )}

        {/* Quick Response Templates Dropdown */}
        {showQuickTemplates && (
          <div className="p-3 bg-white dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 shadow-md animate-in slide-in-from-top-2 z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span>پاسخ‌های آماده کاری واتساپ:</span>
              </span>
              <button
                onClick={() => setShowQuickTemplates(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {QUICK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputText(tmpl);
                    setShowQuickTemplates(false);
                    inputRef.current?.focus();
                  }}
                  className="p-2 rounded-xl bg-[#f0f2f5] dark:bg-[#111b21] hover:bg-emerald-50 dark:hover:bg-[#2a3942] text-right text-xs text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition cursor-pointer"
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp Chat Messages Canvas */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#54656f] dark:text-[#8696a0] text-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-xs">
                <MessageSquare className="w-8 h-8 text-[#008069] dark:text-[#00a884]" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                هنوز پیامی در این گفتگو ارسال نشده است.
              </p>
              <p className="text-[#54656f] dark:text-[#8696a0] text-xs">
                پیام بنویسید، تصویر پیوست نمایید یا از ایموجی‌های واتساپ استفاده فرمایید.
              </p>
            </div>
          ) : (
            filteredMessages.map((m) => {
              const isMine = m.senderId === currentUser?.id;
              const canDelete = isMine || currentUser?.role === 'store_owner' || currentUser?.role === 'maker_admin';
              const isDeleted = Boolean(m.isDeleted);

              return (
                <div
                  key={m.id}
                  className={`flex flex-col group ${isMine ? 'items-end' : 'items-start'}`}
                >
                  {/* WhatsApp Message Bubble Box */}
                  <div className="relative flex items-center gap-1.5 max-w-[90%] sm:max-w-[78%] md:max-w-[72%]">
                    {/* Hover actions for My Message */}
                    {isMine && !isDeleted && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-[#202c33] p-1 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m.text, m.id)}
                          className="p-1 text-[#54656f] hover:text-[#008069] transition"
                          title="کپی متن"
                        >
                          {copiedMsgId === m.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmMsgId(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="حذف این پیام"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {/* WhatsApp Bubble Design */}
                    <div
                      className={`rounded-2xl p-3 px-3.5 shadow-2xs text-xs sm:text-sm leading-relaxed transition ${
                        isDeleted
                          ? 'bg-slate-100/90 dark:bg-[#182229] border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 italic flex items-center gap-2 rounded-xl'
                          : isMine
                          ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tl-xs shadow-xs'
                          : 'bg-[#ffffff] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] border border-slate-200/50 dark:border-transparent rounded-tr-xs shadow-xs'
                      }`}
                    >
                      {/* Sender name for received messages in group chats */}
                      {!isMine && !isDeleted && activeConversation?.type === 'store_group' && (
                        <div className="text-[11px] font-bold text-[#008069] dark:text-[#00a884] mb-1">
                          {m.senderName}
                        </div>
                      )}

                      {isDeleted ? (
                        <div className="flex items-center gap-2">
                          <Ban className="w-4 h-4 text-slate-400" />
                          <span>این پیام حذف شده است</span>
                        </div>
                      ) : (
                        <>
                          {m.text && <p className="whitespace-pre-line select-text font-normal">{m.text}</p>}

                          {/* Order Attachment Card */}
                          {m.orderDocAttachment && (
                            <div className="mt-2.5 p-3 rounded-xl bg-black/10 dark:bg-black/30 border border-black/10 dark:border-white/10 text-xs space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-[#008069] dark:text-[#25d366]">
                                <FileText className="w-4 h-4" />
                                <span>سند فاکتور رسمی #{m.orderDocAttachment.orderNumber}</span>
                              </div>
                              <div className="text-slate-700 dark:text-slate-300">دواخانه: {m.orderDocAttachment.customerName}</div>
                              <div className="font-bold text-[#111b21] dark:text-white">
                                مبلغ کل: {m.orderDocAttachment.totalAFN.toLocaleString()} افغانی
                              </div>
                            </div>
                          )}

                          {/* Image Attachment */}
                          {m.imageUrl && (
                            <div
                              onClick={() => setPreviewImage(m.imageUrl || null)}
                              className="mt-2.5 rounded-xl overflow-hidden cursor-pointer max-w-xs border border-black/10 dark:border-white/10 shadow-xs group-hover:scale-[1.01] transition"
                            >
                              <img
                                src={m.imageUrl}
                                alt="پیوست پیام"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}

                          {/* WhatsApp Bubble Footer: Time + Blue Double Ticks */}
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isMine ? 'text-[#667781] dark:text-[#8696a0]' : 'text-[#667781] dark:text-[#8696a0]'
                            }`}
                          >
                            <span className="font-mono">
                              {new Date(m.createdAt).toLocaleTimeString('fa-AF', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMine && <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Hover actions for Received Message */}
                    {!isMine && !isDeleted && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 dark:bg-[#202c33] p-1 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(m.text, m.id)}
                          className="p-1 text-[#54656f] hover:text-[#008069] transition"
                          title="کپی متن"
                        >
                          {copiedMsgId === m.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmMsgId(m.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="حذف پیام توسط مدیریت"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected image preview before send */}
        {selectedImage && (
          <div className="bg-[#f0f2f5] dark:bg-[#202c33] p-2.5 px-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage}
                alt="پیوست چت"
                className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-600"
              />
              <div>
                <span className="text-xs text-[#111b21] dark:text-[#e9edef] font-bold block">تصویر ضمیمه شد</span>
                <span className="text-[10px] text-[#667781]">آماده ارسال در چت واتساپ</span>
              </div>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorNotice && (
          <div className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs px-4 py-2 border-t border-rose-200 dark:border-rose-800 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* WhatsApp Categorized Emoji Picker Popover */}
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-20 right-4 z-40 bg-white dark:bg-[#202c33] border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-3 w-80 sm:w-96 max-w-[92vw] animate-in slide-in-from-bottom-2 flex flex-col"
          >
            {/* Emoji Header & Search */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                <input
                  type="text"
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  placeholder="جستجوی ایموجی واتساپ..."
                  className="w-full bg-[#f0f2f5] dark:bg-[#111b21] border-none rounded-xl pr-8 pl-3 py-1.5 text-xs text-[#111b21] dark:text-[#e9edef] outline-none"
                />
              </div>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category Switcher Tabs */}
            <div className="flex items-center gap-1 py-2 overflow-x-auto border-b border-slate-100 dark:border-slate-800 scrollbar-none">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveEmojiTab(cat.id);
                    setEmojiSearch('');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer whitespace-nowrap ${
                    activeEmojiTab === cat.id
                      ? 'bg-[#008069] text-white font-bold'
                      : 'bg-[#f0f2f5] dark:bg-[#111b21] text-[#54656f] dark:text-[#8696a0] hover:bg-slate-200'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-[11px]">{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Emojis Grid */}
            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 p-2 max-h-48 overflow-y-auto">
              {filteredEmojis.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  className="w-9 h-9 rounded-xl hover:bg-emerald-100 dark:hover:bg-slate-800 flex items-center justify-center text-xl transition transform active:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Delete Message Confirmation Modal */}
        {deleteConfirmMsgId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#202c33] rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 space-y-4">
              <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">حذف پیام</h4>
                  <p className="text-xs text-slate-500">متن حذف شده با عنوان «این پیام حذف شده است» ثبت می‌شود.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                آیا از حذف این پیام اطمینان دارید؟ به جای پیام شما، نشانگر «این پیام حذف شده است» برای سایرین نمایش داده خواهد شد.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setDeleteConfirmMsgId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={() => handleDeleteMessage(deleteConfirmMsgId)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  تایید و حذف پیام
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp Chat Input Dock */}
        <form
          onSubmit={handleSendMessage}
          className="p-2 sm:p-3 px-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 relative shadow-xs"
        >
          {/* WhatsApp Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2.5 rounded-full text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex-shrink-0 ${
              showEmojiPicker ? 'text-[#008069] dark:text-[#00a884]' : ''
            }`}
            title="ایموجی"
          >
            <Smile className="w-5 h-5 text-amber-500" />
          </button>

          {/* WhatsApp Paperclip attachment button */}
          <label
            className={`p-2.5 rounded-full text-[#54656f] dark:text-[#aebac1] hover:text-[#111b21] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer flex-shrink-0 ${
              uploadingImage ? 'opacity-50 pointer-events-none' : ''
            }`}
            title="پیوست عکس"
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
              disabled={uploadingImage}
            />
            <Paperclip className="w-5 h-5" />
          </label>

          {/* WhatsApp Text Input Pill */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              uploadingImage
                ? 'در حال فشرده‌سازی و بارگذاری تصویر...'
                : 'پیام خود را در واتساپ بنویسید...'
            }
            className="flex-1 bg-white dark:bg-[#2a3942] border-none rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-[#111b21] dark:text-[#e9edef] placeholder-[#8696a0] outline-none shadow-2xs focus:ring-1 focus:ring-[#00a884]"
          />

          {/* WhatsApp Circular FAB Send Button */}
          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || uploadingImage}
            className="w-11 h-11 rounded-full bg-[#00a884] hover:bg-[#02906f] active:scale-95 disabled:opacity-40 text-white flex items-center justify-center shadow-md shadow-[#00a884]/30 cursor-pointer disabled:cursor-not-allowed transition flex-shrink-0"
            title="ارسال پیام"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Full-view image modal */}
      <MedicineImageViewerModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
        title="تصویر ارسالی پیام‌رسان"
      />
    </div>
  );
};
