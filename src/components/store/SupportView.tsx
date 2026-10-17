import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { SupportTicket, SupportFaq } from '../../types';
import {
  Send,
  Image as ImageIcon,
  Headphones,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  MessageCircle,
  X,
} from 'lucide-react';
import { compressImage, uploadToCloudinary } from '../../utils/imageCompressor';
import { MedicineImageViewerModal } from '../common/MedicineImageViewerModal';

export const SupportView: React.FC = () => {
  const { currentStore, currentUser, platformConfig } = useApp();

  const storeId = currentStore?.id || 'guest_store';
  const phone = platformConfig.supportPhone || '0784524918';
  const whatsappRaw = platformConfig.supportWhatsApp || '0784524918';

  const whatsappClean = whatsappRaw.replace(/[^0-9]/g, '');
  const whatsappInternational = whatsappClean.startsWith('0')
    ? '93' + whatsappClean.slice(1)
    : whatsappClean.startsWith('93')
    ? whatsappClean
    : '93' + whatsappClean;

  const whatsappUrl = `https://wa.me/${whatsappInternational}?text=${encodeURIComponent(
    `سلام، جهت دریافت پشتیبانی تخصصی در سامانه ویزیتور دارو پیام می‌دهم.`
  )}`;

  // Find or create primary ticket for current store
  const getOrCreatePrimaryTicket = (): SupportTicket => {
    const existing = Storage.getSupportTickets().find(
      (t) => t.storeId === storeId || (currentUser?.id && t.id.includes(currentUser.id))
    );
    if (existing) return existing;

    const customWelcome = platformConfig.supportWelcomeMessage?.trim();
    const welcomeText =
      customWelcome ||
      `سلام و وقت بخیر ${
        currentUser?.name ? `جناب ${currentUser.name}` : ''
      }! به واحد پشتیبانی آنلاین سامانه ویزیتور دارو خوش آمدید. کارشناسان ما آماده پاسخگویی به هرگونه سؤال، راهنمایی در بارگذاری روی سرور، تنظیمات انبار و فاکتورها هستند. پیام یا تصویر مشکل خود را ارسال نمایید.`;

    const initial: SupportTicket = {
      id: `support_chat_${storeId}`,
      storeId,
      storeName: currentStore?.name || currentUser?.name || 'کاربر گرامی',
      title: 'گفتگوی زنده با پشتیبانی',
      description: 'کانال گفتگوی مستقیم با تیم فنی و پشتیبانی',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: 'msg_welcome',
          sender: 'maker',
          text: welcomeText,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    const allTickets = Storage.getSupportTickets();
    Storage.saveSupportTickets([...allTickets, initial]);
    return initial;
  };

  const [activeChat, setActiveChat] = useState<SupportTicket>(getOrCreatePrimaryTicket);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [viewingFaq, setViewingFaq] = useState<SupportFaq | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat.messages]);

  // Synchronize support ticket messages in real time between user and creator panel
  useEffect(() => {
    const syncTickets = () => {
      const tickets = Storage.getSupportTickets();
      const updated = tickets.find(
        (t) => t.storeId === storeId || (currentUser?.id && t.id.includes(currentUser.id))
      );
      if (updated) {
        setActiveChat((prev) => {
          if (JSON.stringify(prev.messages) !== JSON.stringify(updated.messages)) {
            return updated;
          }
          return prev;
        });
      }
    };

    window.addEventListener('storage', syncTickets);
    const interval = setInterval(syncTickets, 2500);
    return () => {
      window.removeEventListener('storage', syncTickets);
      clearInterval(interval);
    };
  }, [storeId, currentUser]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorNotice(null);
    setUploadingImage(true);
    try {
      const compResult = await compressImage(file, 300, 1200);
      const cloudUrl = await uploadToCloudinary(compResult.file, 'support');
      setSelectedImage(cloudUrl);
    } catch (err: any) {
      setErrorNotice(err.message || 'خطا در بارگذاری تصویر پشتیبانی');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend || inputText;
    if (!content.trim() && !selectedImage) return;

    setErrorNotice(null);

    const userMessage = {
      id: `msg_${Date.now()}`,
      sender: (currentUser?.role === 'maker_admin' ? 'maker' : 'store') as 'store' | 'maker',
      text: content.trim(),
      imageUrl: selectedImage || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...activeChat.messages, userMessage];

    saveUpdatedChat(updatedMessages);
    setInputText('');
    setSelectedImage(null);
  };

  // Handle FAQ Click with instant authoritative answer from creator configuration
  const handleSelectFaq = (faq: SupportFaq) => {
    const userMessage = {
      id: `msg_${Date.now()}`,
      sender: 'store' as const,
      text: faq.question,
      createdAt: new Date().toISOString(),
    };

    const withUser = [...activeChat.messages, userMessage];
    saveUpdatedChat(withUser);

    setTimeout(() => {
      const botReply = {
        id: `msg_faq_${Date.now()}`,
        sender: 'maker' as const,
        text: faq.answer,
        createdAt: new Date().toISOString(),
      };
      const withBot = [...withUser, botReply];
      saveUpdatedChat(withBot);
    }, 400);
  };

  const saveUpdatedChat = (msgs: typeof activeChat.messages) => {
    const updatedChat: SupportTicket = {
      ...activeChat,
      messages: msgs,
      updatedAt: new Date().toISOString(),
    };

    setActiveChat(updatedChat);

    const all = Storage.getSupportTickets();
    const index = all.findIndex((t) => t.id === updatedChat.id);
    if (index >= 0) {
      all[index] = updatedChat;
    } else {
      all.push(updatedChat);
    }
    Storage.saveSupportTickets(all);
  };

  // Published FAQs configured dynamically in Creator Panel
  const publishedFaqs: SupportFaq[] = (platformConfig.supportFaqs || []).filter(
    (f) => f.isActive
  );

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col h-[700px] max-h-[85vh] transition-colors">
      {/* Support Header */}
      <div className="p-4 md:px-6 bg-gradient-to-l from-sky-700 via-sky-600 to-teal-600 text-white flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Headphones className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-sky-700 rounded-full animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-black text-base md:text-lg">پشتیبانی آنلاین و اختصاصی</h2>
              <span className="bg-emerald-500/20 text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                پاسخگویی سریع
              </span>
            </div>
            <p className="text-xs text-sky-100">
              مشاوره فنی، تنظیمات انبار، سفارشات و راهنمایی سرور
            </p>
          </div>
        </div>

        {/* Contact direct buttons */}
        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
            title="گفتگو در واتساپ"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">واتساپ: {whatsappRaw}</span>
          </a>

          <a
            href={`tel:${phone}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition"
            title="تماس مستقیم تلفنی"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">تماس: {phone}</span>
          </a>
        </div>
      </div>

      {/* Dynamic FAQs Bar (Configured & Published in Creator Panel) */}
      {publishedFaqs.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 flex-shrink-0 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>پرسش‌های پرکاربرد:</span>
          </span>
          {publishedFaqs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => setViewingFaq(faq)}
              className="bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-sky-700 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-500 rounded-xl px-3 py-1 text-[11px] whitespace-nowrap transition cursor-pointer font-medium shadow-2xs"
            >
              {faq.question}
            </button>
          ))}
        </div>
      )}

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
        {activeChat.messages.map((m) => {
          const isUser = m.sender === 'store';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400 dark:text-slate-500">
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {isUser ? currentUser?.name || 'شما' : 'کارشناس پشتیبانی سامانه'}
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
                className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 shadow-2xs text-xs md:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-tl-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 rounded-tr-xs shadow-xs'
                }`}
              >
                {m.text && <p className="whitespace-pre-line">{m.text}</p>}

                {m.imageUrl && (
                  <div
                    onClick={() => setPreviewImage(m.imageUrl || null)}
                    className="mt-2 rounded-xl overflow-hidden cursor-pointer max-w-xs border border-white/20"
                  >
                    <img
                      src={m.imageUrl}
                      alt="پیوست تصویر"
                      className="w-full h-auto object-cover hover:scale-105 transition"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment preview if image is selected */}
      {selectedImage && (
        <div className="bg-slate-100 dark:bg-slate-800 p-2 px-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedImage}
              alt="پیوست"
              className="w-12 h-12 rounded-xl object-cover border border-slate-300 dark:border-slate-600"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              تصویر ضمیمه شد (آماده ارسال)
            </span>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 text-xs px-4 py-2 border-t border-rose-200 dark:border-rose-800">
          {errorNotice}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <label
          className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer flex-shrink-0 ${
            uploadingImage ? 'opacity-50 pointer-events-none' : ''
          }`}
          title="پیوست عکس یا اسکرین‌شات"
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
            disabled={uploadingImage}
          />
          <ImageIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
        </label>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            uploadingImage
              ? 'در حال آماده‌سازی تصویر...'
              : 'پیام خود را جهت گفتگو با پشتیبانی تایپ نمایید...'
          }
          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900 rounded-2xl px-4 py-2.5 text-xs md:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && !selectedImage) || uploadingImage}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-2xl font-bold text-xs md:text-sm flex items-center gap-2 transition cursor-pointer disabled:cursor-not-allowed shadow-md shadow-sky-600/20 active:scale-98"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">ارسال</span>
        </button>
      </form>

      {/* Image preview modal if clicked */}
      <MedicineImageViewerModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
        title="تصویر ارسالی پشتیبانی"
      />

      {/* FAQ Details Interactive Modal */}
      {viewingFaq && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">سوال و پاسخ متداول</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingFaq(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="font-black text-xs md:text-sm text-sky-800 dark:text-sky-300">
                {viewingFaq.question}
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {viewingFaq.answer}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const faqToPost = viewingFaq;
                  setViewingFaq(null);
                  handleSelectFaq(faqToPost);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ارسال به این گفتگو</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingFaq(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                متوجه شدم، تشکر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
