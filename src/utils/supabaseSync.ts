/**
 * Supabase Cloud Database Synchronization Service
 * Provides real-time synchronization between local app state and Supabase tables.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Store, UserProfile, Medicine, Customer, Order, VisitRecord, Message } from '../types';

export const SupabaseSync = {
  /**
   * Sync a Store record to Supabase
   */
  async syncStore(store: Store): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('stores').upsert({
        id: store.id,
        name: store.name,
        owner_name: store.name,
        phone: store.phone,
        address: store.address || '',
        province: '',
        subscription_plan: store.subscription?.planName || 'trial',
        subscription_expires_at: store.subscription?.endDate || null,
        is_active: store.subscription?.status !== 'suspended',
        created_at: store.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase store sync warning:', err);
    }
  },

  /**
   * Sync a UserProfile to Supabase
   */
  async syncProfile(profile: UserProfile): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('profiles').upsert({
        id: profile.id,
        store_id: profile.storeId || null,
        name: profile.name,
        phone: profile.phone,
        username: profile.username,
        password_hash: profile.password || '123456',
        role: profile.role,
        avatar_url: profile.avatarUrl || null,
        city: profile.city || '',
        is_active: profile.isActive ?? true,
        created_at: profile.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase profile sync warning:', err);
    }
  },

  /**
   * Sync a Medicine item to Supabase
   */
  async syncMedicine(medicine: Medicine): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('medicines').upsert({
        id: medicine.id,
        store_id: medicine.storeId,
        code: medicine.code,
        name: medicine.name,
        generic_name: medicine.brand || medicine.name,
        company: medicine.brand || '',
        country: '',
        category: medicine.category || '',
        form: medicine.dosageForm || '',
        strength: medicine.strength || '',
        batch_number: medicine.batchNumber || '',
        expire_date: medicine.expiryDate || '',
        stock_quantity: medicine.stock || 0,
        buy_price: medicine.purchasePrice || 0,
        sale_price: medicine.salePrice || 0,
        currency: 'AFN',
        image_url: Array.isArray(medicine.images) && medicine.images.length > 0 ? medicine.images[0] : null,
        description: medicine.fullDescription || medicine.shortDescription || '',
        created_at: medicine.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase medicine sync warning:', err);
    }
  },

  /**
   * Sync a Customer to Supabase
   */
  async syncCustomer(customer: Customer): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('customers').upsert({
        id: customer.id,
        store_id: customer.storeId,
        visitor_id: customer.primaryVisitorId || null,
        name: customer.name,
        manager_name: customer.managerName || '',
        phone: customer.phone,
        province: customer.area || '',
        city: customer.city || '',
        address: customer.address || '',
        balance: 0,
        created_at: customer.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase customer sync warning:', err);
    }
  },

  /**
   * Sync an Order to Supabase
   */
  async syncOrder(order: Order): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('orders').upsert({
        id: order.id,
        store_id: order.storeId,
        visitor_id: order.visitorId,
        customer_id: order.customerId,
        customer_name: order.customerName,
        items: order.items || [],
        total_amount: order.totalAFN || order.subtotalAFN || 0,
        status: order.status || 'pending',
        notes: order.notes || '',
        created_at: order.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase order sync warning:', err);
    }
  },

  /**
   * Sync a Visit record to Supabase
   */
  async syncVisit(visit: VisitRecord): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('visits').upsert({
        id: visit.id,
        store_id: visit.storeId,
        visitor_id: visit.visitorId,
        customer_id: visit.customerId,
        customer_name: visit.customerName,
        notes: visit.notes || '',
        latitude: null,
        longitude: null,
        created_at: visit.scheduledTime || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase visit sync warning:', err);
    }
  },

  /**
   * Sync a Chat Message to Supabase
   */
  async syncMessage(message: Message, storeId: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('messages').upsert({
        id: message.id,
        store_id: storeId,
        conversation_id: message.conversationId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        sender_role: message.senderRole,
        recipient_id: null,
        text: message.text || '',
        image_url: message.imageUrl || null,
        is_read: message.isRead ?? false,
        created_at: message.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase message sync warning:', err);
    }
  },

  /**
   * Pull all cloud records for a store to ensure multi-device synchronization
   */
  async pullStoreCloudData(storeId: string): Promise<{
    medicines?: Medicine[];
    customers?: Customer[];
    orders?: Order[];
  }> {
    if (!supabase || !isSupabaseConfigured || !storeId) return {};

    try {
      const [medsRes, custsRes, ordersRes] = await Promise.all([
        supabase.from('medicines').select('*').eq('store_id', storeId),
        supabase.from('customers').select('*').eq('store_id', storeId),
        supabase.from('orders').select('*').eq('store_id', storeId),
      ]);

      const result: {
        medicines?: Medicine[];
        customers?: Customer[];
        orders?: Order[];
      } = {};

      if (medsRes.data && medsRes.data.length > 0) {
        result.medicines = medsRes.data.map((m: any) => ({
          id: m.id,
          storeId: m.store_id,
          code: m.code,
          name: m.name,
          brand: m.company || m.generic_name || '',
          dosageForm: m.form || 'بسته',
          strength: m.strength || '',
          unit: 'بسته',
          purchasePrice: Number(m.buy_price) || 0,
          salePrice: Number(m.sale_price) || 0,
          stock: Number(m.stock_quantity) || 0,
          minStockAlert: 5,
          category: m.category || 'عمومی',
          expiryDate: m.expire_date || '',
          batchNumber: m.batch_number || '',
          shortDescription: m.description || '',
          fullDescription: m.description || '',
          images: m.image_url ? [m.image_url] : [],
          status: 'active',
          createdAt: m.created_at || new Date().toISOString(),
          updatedAt: m.created_at || new Date().toISOString(),
        }));
      }

      if (custsRes.data && custsRes.data.length > 0) {
        result.customers = custsRes.data.map((c: any) => ({
          id: c.id,
          storeId: c.store_id,
          name: c.name,
          managerName: c.manager_name || '',
          phone: c.phone || '',
          address: c.address || '',
          city: c.city || '',
          area: c.province || '',
          createdBy: c.visitor_id || '',
          primaryVisitorId: c.visitor_id || undefined,
          sharedVisitorIds: [],
          status: 'active',
          createdAt: c.created_at || new Date().toISOString(),
          totalOrdersCount: 0,
          totalOrderAmount: 0,
        }));
      }

      if (ordersRes.data && ordersRes.data.length > 0) {
        result.orders = ordersRes.data.map((o: any) => {
          const total = Number(o.total_amount) || 0;
          return {
            id: o.id,
            storeId: o.store_id,
            orderNumber: o.id.slice(-6).toUpperCase(),
            visitorId: o.visitor_id,
            visitorName: '',
            customerId: o.customer_id,
            customerName: o.customer_name,
            items: Array.isArray(o.items) ? o.items : [],
            subtotalAFN: total,
            discountAFN: 0,
            totalAFN: total,
            paidAmountAFN: 0,
            remainingAmountAFN: total,
            status: o.status || 'pending',
            paymentStatus: 'unpaid',
            notes: o.notes || '',
            history: [],
            payments: [],
            createdAt: o.created_at || new Date().toISOString(),
            updatedAt: o.created_at || new Date().toISOString(),
          };
        });
      }

      return result;
    } catch (err) {
      console.warn('Pulling cloud data warning:', err);
      return {};
    }
  },
};
