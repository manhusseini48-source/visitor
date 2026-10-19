import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Storage } from '../../utils/storage';
import { Customer, UserProfile } from '../../types';
import { exportCustomersToExcel, exportCustomersToPDF } from '../../utils/exportDocs';
import {
  Users,
  Search,
  Plus,
  Filter,
  FileSpreadsheet,
  FileText,
  MapPin,
  Phone,
  Edit2,
  Trash2,
  UserCheck,
  Share2,
  ExternalLink,
  AlertTriangle,
  X,
  Compass,
} from 'lucide-react';

export const CustomersManager: React.FC = () => {
  const { currentStore, currentUser } = useApp();
  const storeId = currentStore?.id || '';

  const [customers, setCustomers] = useState<Customer[]>(() =>
    Storage.getCustomers(storeId)
  );

  const visitors = useMemo(
    () => Storage.getProfiles().filter((p) => p.storeId === storeId && p.role === 'visitor'),
    [storeId]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [visitorFilter, setVisitorFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [city, setCity] = useState('کابل');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [primaryVisitorId, setPrimaryVisitorId] = useState<string>('');
  const [sharedVisitorIds, setSharedVisitorIds] = useState<string[]>([]);

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const reloadData = () => {
    const list = Storage.getCustomers(storeId);
    setCustomers(list);
  };

  const openModal = (cust?: Customer) => {
    setFormError(null);
    setDuplicateWarning(null);
    if (cust) {
      setEditingCustomer(cust);
      setName(cust.name);
      setManagerName(cust.managerName);
      setPhone(cust.phone);
      setAltPhone(cust.altPhone || '');
      setTradeName(cust.tradeName || '');
      setCity(cust.city);
      setArea(cust.area);
      setAddress(cust.address);
      setLatitude(cust.latitude);
      setLongitude(cust.longitude);
      setNotes(cust.notes || '');
      setPrimaryVisitorId(cust.primaryVisitorId || '');
      setSharedVisitorIds(cust.sharedVisitorIds || []);
    } else {
      setEditingCustomer(null);
      setName('');
      setManagerName('');
      setPhone('');
      setAltPhone('');
      setTradeName('');
      setCity('کابل');
      setArea('کارته ۳');
      setAddress('');
      setLatitude(undefined);
      setLongitude(undefined);
      setNotes('');
      setPrimaryVisitorId(visitors[0]?.id || '');
      setSharedVisitorIds([]);
    }
    setIsModalOpen(true);
  };

  // Check deduplication on phone input
  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const clean = val.trim();
    if (clean.length > 5) {
      const match = customers.find(
        (c) =>
          c.id !== editingCustomer?.id &&
          (c.phone === clean || (c.altPhone && c.altPhone === clean))
      );
      if (match) {
        setDuplicateWarning(
          `توجه: مشتری با شماره مشابه قبلاً ثبت شده است (${match.name} - مسئول: ${match.managerName}).`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  // Get current device GPS with user consent
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
      (err) => {
        setLocating(false);
        setFormError('دسترسی به موقعیت مکانی داده نشد یا GPS غیرفعال است.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !managerName.trim()) {
      setFormError('نام دواخانه، نام مسئول و شماره تماس الزامی هستند.');
      return;
    }

    const all = Storage.getCustomers(storeId);

    // Prevent duplicate customer phone number
    const duplicatePhone = all.find(
      (c) =>
        c.id !== editingCustomer?.id &&
        c.phone.trim() === phone.trim()
    );
    if (duplicatePhone) {
      setFormError(`مشتری با شماره تماس «${phone}» قبلاً در سامانه ثبت شده است (${duplicatePhone.name}).`);
      return;
    }

    if (editingCustomer) {
      const updated = all.map((c) =>
        c.id === editingCustomer.id
          ? {
              ...c,
              name,
              managerName,
              phone,
              altPhone,
              tradeName,
              city,
              area,
              address,
              latitude,
              longitude,
              notes,
              primaryVisitorId,
              sharedVisitorIds,
            }
          : c
      );
      Storage.saveCustomers(updated);
    } else {
      const newCust: Customer = {
        id: `cust_${Date.now()}`,
        storeId,
        name,
        managerName,
        phone,
        altPhone,
        tradeName,
        city,
        area,
        address,
        latitude,
        longitude,
        notes,
        createdBy: currentUser?.id || 'owner',
        primaryVisitorId,
        sharedVisitorIds,
        status: 'active',
        createdAt: new Date().toISOString(),
        totalOrdersCount: 0,
        totalOrderAmount: 0,
      };
      all.unshift(newCust);
      Storage.saveCustomers(all);
    }

    reloadData();
    setIsModalOpen(false);
  };

  const handleDeleteCustomer = (id: string) => {
    if (confirm('آیا از آرشیو کردن این مشتری اطمینان دارید؟')) {
      const all = Storage.getCustomers(storeId).filter((c) => c.id !== id);
      Storage.saveCustomers(all);
      reloadData();
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.managerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery) ||
        c.area.toLowerCase().includes(searchQuery.toLowerCase());

      const matchVisitor =
        visitorFilter === 'all' ||
        c.primaryVisitorId === visitorFilter ||
        (c.sharedVisitorIds || []).includes(visitorFilter);

      return matchSearch && matchVisitor;
    });
  }, [customers, searchQuery, visitorFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <span>مدیریت مشتریان و دواخانه‌ها ({customers.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت پرونده مشتری، واگذاری مأموریت به ویزیتورها و ثبت موقعیت GPS
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCustomersToExcel(customers)}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>خروجی اکسل مشتریان</span>
          </button>

          <button
            onClick={() => exportCustomersToPDF(customers, currentStore?.name || 'فروشگاه دارویی')}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileText className="w-4 h-4" />
            <span>خروجی PDF مشتریان</span>
          </button>

          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن مشتری جدید</span>
          </button>
        </div>
      </div>

      {/* Search and Visitor Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام دواخانه، مدیر، تلفن یا منطقه..."
            className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            نمای مأموریت:
          </span>
          <select
            value={visitorFilter}
            onChange={(e) => setVisitorFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
          >
            <option value="all">همه مشتریان فروشگاه</option>
            {visitors.map((v) => (
              <option key={v.id} value={v.id}>
                مشتریان ویزیتور: {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers List Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            مشتری با این مشخصات یافت نشد.
          </div>
        ) : (
          filteredCustomers.map((c) => {
            const primaryVisitor = visitors.find((v) => v.id === c.primaryVisitorId);

            return (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">{c.name}</h3>
                      <div className="text-[11px] text-slate-500">مسئول: {c.managerName}</div>
                    </div>
                    <span className="bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded text-[10px]">
                      {c.city} • {c.area}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 my-3">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono">{c.phone}</span>
                      {c.altPhone && <span className="text-slate-400 text-[10px]">({c.altPhone})</span>}
                    </div>

                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-500 line-clamp-1">{c.address}</span>
                    </div>

                    {/* Assigned Visitor Badge */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] text-slate-700 font-medium">
                        مسئول اصلی:{' '}
                        <strong className="text-emerald-800">
                          {primaryVisitor ? primaryVisitor.name : 'نامشخص'}
                        </strong>
                      </span>
                    </div>

                    {(c.sharedVisitorIds || []).length > 0 && (
                      <div className="text-[10px] text-slate-400">
                        به اشتراک با {(c.sharedVisitorIds || []).length} ویزیتور همکار
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="text-[11px] text-slate-500">
                    خرید: <strong>{c.totalOrderAmount.toLocaleString()}</strong> AFN
                  </div>

                  <div className="flex items-center gap-1">
                    {c.latitude && c.longitude && (
                      <a
                        href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg"
                        title="مشاهده لوکیشن در نقشه"
                      >
                        <MapPin className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={() => openModal(c)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="ویرایش مشتری"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="حذف / آرشیو"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-sky-600" />
                <span>{editingCustomer ? 'ویرایش مشخصات مشتری' : 'افزودن مشتری یا دواخانه جدید'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateWarning && (
              <div className="mb-4 bg-amber-50 text-amber-800 border border-amber-200 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {formError && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    نام دواخانه / مشتری *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="دواخانه شفا"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    نام مسئول / صاحب دواخانه *
                  </label>
                  <input
                    type="text"
                    required
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    placeholder="دکتر صبور"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    شماره تماس اصلی *
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    شماره جایگزین (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={altPhone}
                    onChange={(e) => setAltPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">شهر</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="کابل"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    منطقه / ناحیه
                  </label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="کارته ۳ یا دشت برچی"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  نشانی کامل دواخانه
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="کابل، کارته ۳، روبروی شفاخانه..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* GPS Capture with consent */}
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-sky-900 flex items-center gap-1">
                    <Compass className="w-4 h-4 text-sky-600" />
                    <span>موقعیت مکانی دقیق (GPS)</span>
                  </div>
                  <div className="text-[10px] text-sky-700 mt-0.5 font-mono">
                    {latitude && longitude
                      ? `Lat: ${latitude}, Long: ${longitude}`
                      : 'موقعیتی ثبت نشده است'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCaptureGPS}
                  disabled={locating}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow cursor-pointer disabled:opacity-50"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{locating ? 'دریافت GPS...' : 'ثبت موقعیت فعلی'}</span>
                </button>
              </div>

              {/* Assignment to Visitor */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  واگذاری مأموریت به ویزیتور مسئول اصلی:
                </label>
                <select
                  value={primaryVisitorId}
                  onChange={(e) => setPrimaryVisitorId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">بدون ویزیتور اختصاصی (در اختیار فروشگاه)</option>
                  {visitors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.phone})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500">
                  این دواخانه در پنل اختصاصی ویزیتور انتخابی جهت سفارش‌گیری و ثبت ویزیت ظاهر خواهد شد.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20"
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
