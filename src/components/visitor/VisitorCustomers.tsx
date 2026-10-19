import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { Customer } from '../../types';
import { exportCustomersToExcel, exportCustomersToPDF } from '../../utils/exportDocs';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Compass,
  AlertTriangle,
  X,
  ExternalLink,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';

export const VisitorCustomers: React.FC = () => {
  const { currentUser, currentStore } = useApp();
  const visitorId = currentUser?.id || '';
  const storeId = currentStore?.id || '';

  const [customers, setCustomers] = useState<Customer[]>(() =>
    Storage.getCustomers(storeId).filter(
      (c) => c.primaryVisitorId === visitorId || (c.sharedVisitorIds || []).includes(visitorId)
    )
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [locating, setLocating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const reloadData = () => {
    setCustomers(
      Storage.getCustomers(storeId).filter(
        (c) => c.primaryVisitorId === visitorId || (c.sharedVisitorIds || []).includes(visitorId)
      )
    );
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (val.trim().length > 6) {
      const allStoreCustomers = Storage.getCustomers(storeId);
      const match = allStoreCustomers.find((c) => c.phone === val.trim());
      if (match) {
        setDuplicateWarning(
          `هشدار: مشتری با این شماره در فروشگاه قبلاً ثبت شده است (${match.name} - مسئول: ${match.managerName}).`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setFormError('دستگاه شما از GPS پشتیبانی نمی‌کند.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setFormError('دریافت موقعیت مکانی ناموفق بود یا مجوز دسترسی داده نشد.');
      },
      { timeout: 8000 }
    );
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !managerName.trim()) {
      setFormError('نام دواخانه، مسئول و شماره تماس الزامی هستند.');
      return;
    }

    const all = Storage.getCustomers(storeId);

    // Prevent duplicate phone number
    const duplicatePhone = all.find((c) => c.phone.trim() === phone.trim());
    if (duplicatePhone) {
      setFormError(`مشتری یا دواخانه‌ای با شماره «${phone}» قبلاً ثبت شده است (${duplicatePhone.name} - ${duplicatePhone.managerName}).`);
      return;
    }

    // Prevent duplicate name in the same area
    const duplicateName = all.find(
      (c) => c.name.trim().toLowerCase() === name.trim().toLowerCase() && (area ? c.area.trim().toLowerCase() === area.trim().toLowerCase() : true)
    );
    if (duplicateName) {
      setFormError(`دواخانه‌ای با نام «${name}» قبلاً در سامانه ثبت شده است.`);
      return;
    }

    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      storeId,
      name,
      managerName,
      phone,
      city: 'کابل',
      area: area || 'کابل',
      address,
      latitude,
      longitude,
      createdBy: visitorId,
      primaryVisitorId: visitorId,
      sharedVisitorIds: [],
      status: 'active',
      createdAt: new Date().toISOString(),
      totalOrdersCount: 0,
      totalOrderAmount: 0,
    };

    all.unshift(newCust);
    Storage.saveCustomers(all);

    reloadData();
    setIsModalOpen(false);
    setName('');
    setManagerName('');
    setPhone('');
    setAddress('');
  };

  const filtered = useMemo(() => {
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>مشتریان و دواخانه‌های من ({customers.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            دواخانه‌های واگذار شده به شما یا ثبت‌شده توسط خودتان
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCustomersToExcel(customers)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="دانلود اکسل دواخانه‌ها"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>اکسل</span>
          </button>

          <button
            onClick={() => exportCustomersToPDF(customers, currentStore?.name || 'فروشگاه')}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="دانلود PDF دواخانه‌ها"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => {
              setFormError(null);
              setDuplicateWarning(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت دواخانه جدید</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام دواخانه، نام دکتر یا تلفن..."
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                  {c.area}
                </span>
              </div>
              <div className="text-xs text-slate-600 mb-3">مسئول: {c.managerName}</div>

              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${c.phone}`} className="font-mono text-sky-700 font-bold hover:underline">
                    {c.phone}
                  </a>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{c.address}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400">
                سفارشات: {c.totalOrdersCount} فاکتور
              </span>

              {c.latitude && c.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 text-sky-600 hover:bg-sky-50 rounded flex items-center gap-1 text-[11px]"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>لوکیشن</span>
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm mb-3">ثبت دواخانه جدید</h3>

            {duplicateWarning && (
              <div className="mb-3 bg-amber-50 text-amber-800 border border-amber-200 p-2.5 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {formError && (
              <div className="mb-3 bg-red-50 text-red-700 p-2.5 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نام دواخانه *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: دواخانه امید"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نام مسئول / داروساز *
                </label>
                <input
                  type="text"
                  required
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  placeholder="مثال: دکتر حسینی"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  شماره تماس *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="07XXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">منطقه</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="مثال: کارته ۴"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نشانی</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="آدرس دقیق..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* GPS Capture */}
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs text-sky-900 font-bold">
                  {latitude ? `ثبت شد (${latitude})` : 'موقعیت GPS دواخانه'}
                </span>
                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={locating}
                  className="px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold"
                >
                  {locating ? 'در حال ثبت...' : 'ثبت موقعیت فعلی'}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                >
                  ذخیره مشتری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
