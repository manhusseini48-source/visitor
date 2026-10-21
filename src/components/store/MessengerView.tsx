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
  Shield,
  FileText,
  AlertCircle,
  Lock,
  User,
  Store as StoreIcon,
  X,
} from 'lucide-react';
import { MedicineImageViewerModal } from '../common/MedicineImageViewerModal';

interface Props {
  initialSharedOrder?: any;
}

export const MessengerView: React.FC<Props> = ({ initialSharedOrder }) => {
  const { currentStore, currentUser } = useApp();
  const storeId = getEffectiveStoreId(currentUser, currentStore);

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
          lastMessageText: 'شروع گفتگوی خصوصی و کاری',
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

  // Business Rule:
  // - Public group: All visitors & store owner can chat together.
  // - Private chat: Visitor <-> Store only! Visitors CANNOT chat privately with other visitors.
  const visibleConversations = useMemo(() => {
    if (currentUser?.role === 'visitor') {
      return allConversations.filter(
        (c) =>
          c.type === 'store_group' ||
          (c.type === 'private' && c.visitorId === currentUser.id)
      );
    }
    // Store owner / maker sees public group and private chat with all visitors
    return allConversations;
  }, [allConversations, currentUser]);

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

  // Sync messages in real-time from Supabase and localStorage
  useEffect(() => {
    const reloadMessages = () => {
      if (activeConvId) {
        setMessages(Storage.getMessages(activeConvId));
      }
    };

    reloadMessages();
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);

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
    const interval = setInterval(pullLiveMessages, 3000);
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);

    if (!inputText.trim() && !selectedImage) return;

    if (activeConversation?.type === 'store_group' && !groupEnabled) {
      setErrorNotice('این گروه توسط مدیریت فروشگاه موقتاً غیرفعال شده است.');
      return;
    }

    const newMsg: Message = {
      id: `msg_${Date.now()}`,
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

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden h-[640px] flex flex-col md:flex-row">
      {/* Conversations Sidebar */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-l border-slate-200 flex flex-col bg-slate-50/80">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">پیام‌رسان کاری</h3>
              <p className="text-[10px] text-slate-500">
                {currentUser?.role === 'visitor' ? 'گروه و گفتگوی خصوصی با فروشگاه' : 'گروه عمومی و گفتگو با ویزیتورها'}
              </p>
            </div>
          </div>

          {currentUser?.role === 'store_owner' && (
            <button
              onClick={handleToggleGroupChat}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                groupEnabled ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' : 'text-slate-600 bg-slate-200 hover:bg-slate-300'
              }`}
              title="فعال یا غیرفعال کردن گروه عمومی فروشگاه"
            >
              <span>گروه: {groupEnabled ? 'باز' : 'بسته'}</span>
            </button>
          )}
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {visibleConversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              هنوز گفتگویی ایجاد نشده است
            </div>
          ) : (
            visibleConversations.map((c) => {
              const isActive = c.id === activeConvId;
              const isGroup = c.type === 'store_group';

              let title = '';
              let subtitle = '';
              if (isGroup) {
                title = 'گروه عمومی فروشگاه';
                subtitle = 'گپ و تبادل نظر همه ویزیتورها و مدیریت';
              } else if (currentUser?.role === 'visitor') {
                title = 'گفتگوی خصوصی با مدیریت فروشگاه';
                subtitle = 'پیام مستقیم با صاحب فروشگاه / انبار';
              } else {
                title = c.visitorName ? `ویزیتور: ${c.visitorName}` : 'گفتگوی ویزیتور';
                subtitle = 'گفتگوی خصوصی ۱ به ۱';
              }

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`w-full p-3.5 text-right flex items-center gap-3 transition cursor-pointer ${
                    isActive ? 'bg-sky-100/80 border-r-4 border-sky-600' : 'hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white flex-shrink-0 shadow-xs ${
                      isGroup
                        ? 'bg-gradient-to-tr from-indigo-600 to-sky-600'
                        : currentUser?.role === 'visitor'
                        ? 'bg-gradient-to-tr from-teal-600 to-sky-600'
                        : 'bg-gradient-to-tr from-sky-600 to-blue-700'
                    }`}
                  >
                    {isGroup ? (
                      <Users className="w-5 h-5" />
                    ) : currentUser?.role === 'visitor' ? (
                      <StoreIcon className="w-5 h-5" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-xs text-slate-800 truncate">
                        {title}
                      </span>
                      {c.lastMessageTime && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.lastMessageTime).toLocaleTimeString('fa-AF', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {c.lastMessageText || subtitle}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Security Rule Note */}
        <div className="p-3 bg-slate-100/70 border-t border-slate-200 text-[10px] text-slate-500 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>ویزیتورها تنها با مدیریت گفتگوی خصوصی دارند و امکان ارتباط خصوصی بین ویزیتورها مسدود است.</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-100/50">
        {/* Chat Header */}
        <div className="p-3.5 px-5 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
                activeConversation?.type === 'store_group'
                  ? 'bg-indigo-600'
                  : 'bg-sky-600'
              }`}
            >
              {activeConversation?.type === 'store_group' ? (
                <Users className="w-4 h-4" />
              ) : currentUser?.role === 'visitor' ? (
                <StoreIcon className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800">
                  {activeConversation?.type === 'store_group'
                    ? 'گروه عمومی فروشگاه'
                    : currentUser?.role === 'visitor'
                    ? 'گفتگوی خصوصی با مدیریت فروشگاه'
                    : `گفتگوی خصوصی: ${activeConversation?.visitorName || 'ویزیتور'}`}
                </span>
                <span className="bg-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {activeConversation?.type === 'store_group' ? 'عمومی' : 'خصوصی و محرمانه'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {activeConversation?.type === 'store_group'
                  ? 'تمامی همکاران فروش و مدیریت'
                  : 'ارتباط مستقیم ویزیتور و مدیریت'}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
              <span>هنوز پیامی در این گفتگو ارسال نشده است.</span>
              <span className="text-[11px] mt-1 text-slate-400">پیامی بنویسید یا عکسی ارسال کنید.</span>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === currentUser?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-600">
                      {isMine ? 'شما' : m.senderName}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(m.createdAt).toLocaleTimeString('fa-AF', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 shadow-2xs text-xs md:text-sm leading-relaxed ${
                      isMine
                        ? 'bg-sky-600 text-white rounded-tl-xs'
                        : 'bg-white text-slate-800 border border-slate-200/90 rounded-tr-xs shadow-xs'
                    }`}
                  >
                    {m.text && <p className="whitespace-pre-line">{m.text}</p>}

                    {/* Order attachment card if any */}
                    {m.orderDocAttachment && (
                      <div className="mt-2 p-2.5 rounded-xl bg-black/10 border border-white/20 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <FileText className="w-4 h-4" />
                          <span>فاکتور {m.orderDocAttachment.orderNumber}</span>
                        </div>
                        <div>دواخانه: {m.orderDocAttachment.customerName}</div>
                        <div>مبلغ: {m.orderDocAttachment.totalAFN.toLocaleString()} افغانی</div>
                      </div>
                    )}

                    {/* Image Attachment */}
                    {m.imageUrl && (
                      <div
                        onClick={() => setPreviewImage(m.imageUrl || null)}
                        className="mt-2 rounded-xl overflow-hidden cursor-pointer max-w-xs border border-white/20"
                      >
                        <img
                          src={m.imageUrl}
                          alt="پیوست چت"
                          className="w-full h-auto object-cover hover:scale-105 transition"
                        />
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
          <div className="bg-slate-200 p-2 px-4 flex items-center justify-between border-t border-slate-300">
            <div className="flex items-center gap-3">
              <img
                src={selectedImage}
                alt="پیوست"
                className="w-10 h-10 rounded-xl object-cover"
              />
              <span className="text-xs text-slate-700 font-medium">تصویر آماده ارسال</span>
            </div>
            <button
              onClick={() => setSelectedImage(null)}
              className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorNotice && (
          <div className="bg-rose-50 text-rose-700 text-xs px-4 py-2 border-t border-rose-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Chat Input */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 md:p-4 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <label
            className={`p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer flex-shrink-0 ${
              uploadingImage ? 'opacity-50 pointer-events-none' : ''
            }`}
            title="پیوست تصویر به پیام"
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
              disabled={uploadingImage}
            />
            <ImageIcon className="w-5 h-5 text-slate-500" />
          </label>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              uploadingImage
                ? 'در حال پردازش تصویر...'
                : 'پیام کاری خود را تایپ نمایید...'
            }
            className="flex-1 bg-white border-2 border-slate-300 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 rounded-2xl px-4 py-2.5 text-xs md:text-sm text-slate-900 font-medium outline-none transition shadow-2xs"
          />

          <button
            type="submit"
            disabled={(!inputText.trim() && !selectedImage) || uploadingImage}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer disabled:cursor-not-allowed shadow-md shadow-sky-600/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">ارسال</span>
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
