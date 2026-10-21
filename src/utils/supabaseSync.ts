/**
 * Supabase Cloud Database Synchronization Service
 * Provides real-time synchronization between local app state and Supabase tables.
 */
import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Store,
  UserProfile,
  Medicine,
  Customer,
  Order,
  VisitRecord,
  Message,
  VisitorCashCollection,
  VisitorRemittance,
  PlatformConfig,
} from '../types';

export const SupabaseSync = {
  /**
   * Delete a Profile from Supabase
   */
  async deleteProfile(id: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('profiles').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase profile delete warning:', err);
    }
  },

  /**
   * Delete a Medicine from Supabase
   */
  async deleteMedicine(id: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('medicines').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase medicine delete warning:', err);
    }
  },

  /**
   * Delete a Customer from Supabase
   */
  async deleteCustomer(id: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase customer delete warning:', err);
    }
  },

  /**
   * Delete an Order from Supabase
   */
  async deleteOrder(id: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('orders').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase order delete warning:', err);
    }
  },

  /**
   * Delete a Store from Supabase
   */
  async deleteStore(id: string): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('stores').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase store delete warning:', err);
    }
  },

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
        allow_visitor_cash_collection: store.allowVisitorCashCollection ?? true,
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
      const effStoreId = medicine.storeId || 'store_main';
      try {
        await supabase.from('stores').upsert(
          {
            id: effStoreId,
            name: 'فروشگاه دارو',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      } catch {}

      const { error } = await supabase.from('medicines').upsert({
        id: medicine.id,
        store_id: effStoreId,
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
      if (error) {
        // Fallback for standard Supabase columns in case migration hasn't been run yet
        await supabase.from('medicines').upsert({
          id: medicine.id,
          store_id: effStoreId,
          code: medicine.code,
          name: medicine.name,
          generic_name: medicine.brand || medicine.name,
          company: medicine.brand || '',
          category: medicine.category || '',
          expire_date: medicine.expiryDate || '',
          stock_quantity: medicine.stock || 0,
          buy_price: medicine.purchasePrice || 0,
          sale_price: medicine.salePrice || 0,
          currency: 'AFN',
          image_url: Array.isArray(medicine.images) && medicine.images.length > 0 ? medicine.images[0] : null,
          description: medicine.fullDescription || medicine.shortDescription || '',
          created_at: medicine.createdAt || new Date().toISOString(),
        });
      }
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
        paid_amount: order.paidAmountAFN || 0,
        remaining_amount: order.remainingAmountAFN || 0,
        payment_status: order.paymentStatus || 'unpaid',
        payments: order.payments || [],
        status: order.status || 'pending',
        notes: order.notes || '',
        created_at: order.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase order sync warning:', err);
    }
  },

  /**
   * Sync a Visitor Cash Collection (Deposit / Cash) to Supabase
   */
  async syncCashCollection(col: VisitorCashCollection): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('visitor_cash_collections').upsert({
        id: col.id,
        store_id: col.storeId,
        visitor_id: col.visitorId,
        visitor_name: col.visitorName,
        order_id: col.orderId,
        order_number: col.orderNumber,
        customer_id: col.customerId,
        customer_name: col.customerName,
        amount_afn: col.amountAFN,
        collection_type: col.collectionType,
        payment_method: col.paymentMethod,
        receipt_number: col.receiptNumber || null,
        notes: col.notes || null,
        date: col.date || new Date().toISOString(),
        status: col.status || 'in_hand',
        remittance_id: col.remittanceId || null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase cash collection sync warning:', err);
    }
  },

  /**
   * Sync a Visitor Remittance (Transfer to Store) to Supabase
   */
  async syncRemittance(rem: VisitorRemittance): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('visitor_remittances').upsert({
        id: rem.id,
        remittance_number: rem.remittanceNumber,
        store_id: rem.storeId,
        visitor_id: rem.visitorId,
        visitor_name: rem.visitorName,
        amount_afn: rem.amountAFN,
        payment_method: rem.paymentMethod,
        bank_name: rem.bankName || null,
        destination_account: rem.destinationAccount || null,
        tracking_number: rem.trackingNumber,
        receipt_image_url: rem.receiptImageUrl || null,
        notes: rem.notes || null,
        submitted_at: rem.submittedAt || new Date().toISOString(),
        status: rem.status || 'pending',
        reviewed_at: rem.reviewedAt || null,
        reviewed_by: rem.reviewedBy || null,
        reviewed_by_name: rem.reviewedByName || null,
        rejection_reason: rem.rejectionReason || null,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase remittance sync warning:', err);
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
      const effStoreId = storeId || 'store_main';
      try {
        await supabase.from('stores').upsert(
          {
            id: effStoreId,
            name: 'فروشگاه دارو',
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        );
      } catch {}

      await supabase.from('messages').upsert({
        id: message.id,
        store_id: effStoreId,
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
    collections?: VisitorCashCollection[];
    remittances?: VisitorRemittance[];
  }> {
    if (!supabase || !isSupabaseConfigured) return {};

    try {
      // 1. Fetch medicines: first try matching store_id, fallback to all medicines if empty
      let medsQuery = supabase.from('medicines').select('*');
      if (storeId) {
        medsQuery = medsQuery.eq('store_id', storeId);
      }
      let { data: medsData } = await medsQuery;
      if ((!medsData || medsData.length === 0) && storeId) {
        // Fallback: If no medicines match this exact store_id, fetch any available medicines in database
        const { data: allMeds } = await supabase.from('medicines').select('*').limit(200);
        if (allMeds && allMeds.length > 0) {
          medsData = allMeds;
        }
      }

      // 2. Fetch customers
      let custsQuery = supabase.from('customers').select('*');
      if (storeId) {
        custsQuery = custsQuery.eq('store_id', storeId);
      }
      let { data: custsData } = await custsQuery;
      if ((!custsData || custsData.length === 0) && storeId) {
        const { data: allCusts } = await supabase.from('customers').select('*').limit(200);
        if (allCusts && allCusts.length > 0) {
          custsData = allCusts;
        }
      }

      // 3. Fetch orders
      let ordersQuery = supabase.from('orders').select('*');
      if (storeId) {
        ordersQuery = ordersQuery.eq('store_id', storeId);
      }
      const { data: ordersData } = await ordersQuery;

      // 4. Fetch collections & remittances
      let collectionsData: any[] = [];
      let remittancesData: any[] = [];
      try {
        let colQuery = supabase.from('visitor_cash_collections').select('*');
        if (storeId) colQuery = colQuery.eq('store_id', storeId);
        const { data: cData } = await colQuery;
        if (cData) collectionsData = cData;

        let remQuery = supabase.from('visitor_remittances').select('*');
        if (storeId) remQuery = remQuery.eq('store_id', storeId);
        const { data: rData } = await remQuery;
        if (rData) remittancesData = rData;
      } catch (subErr) {
        // Tables might not exist if migration was skipped
      }

      const result: {
        medicines?: Medicine[];
        customers?: Customer[];
        orders?: Order[];
        collections?: VisitorCashCollection[];
        remittances?: VisitorRemittance[];
      } = {};

      if (medsData && medsData.length > 0) {
        result.medicines = medsData.map((m: any) => ({
          id: m.id,
          storeId: m.store_id || storeId || '',
          code: m.code || '',
          name: m.name || '',
          brand: m.company || m.generic_name || '',
          dosageForm: m.form || 'بسته',
          strength: m.strength || '',
          unit: m.unit || 'بسته',
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

      if (custsData && custsData.length > 0) {
        result.customers = custsData.map((c: any) => ({
          id: c.id,
          storeId: c.store_id || storeId || '',
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

      if (ordersData && ordersData.length > 0) {
        result.orders = ordersData.map((o: any) => {
          const total = Number(o.total_amount) || 0;
          return {
            id: o.id,
            storeId: o.store_id || storeId || '',
            orderNumber: o.id.slice(-6).toUpperCase(),
            visitorId: o.visitor_id,
            visitorName: '',
            customerId: o.customer_id,
            customerName: o.customer_name,
            items: Array.isArray(o.items) ? o.items : [],
            subtotalAFN: total,
            discountAFN: 0,
            totalAFN: total,
            paidAmountAFN: Number(o.paid_amount) || 0,
            remainingAmountAFN: Number(o.remaining_amount) || total,
            status: o.status || 'pending',
            paymentStatus: o.payment_status || 'unpaid',
            notes: o.notes || '',
            history: [],
            payments: Array.isArray(o.payments) ? o.payments : [],
            createdAt: o.created_at || new Date().toISOString(),
            updatedAt: o.created_at || new Date().toISOString(),
          };
        });
      }

      if (collectionsData && collectionsData.length > 0) {
        result.collections = collectionsData.map((col: any) => ({
          id: col.id,
          storeId: col.store_id || storeId || '',
          visitorId: col.visitor_id,
          visitorName: col.visitor_name,
          orderId: col.order_id,
          orderNumber: col.order_number || '',
          customerId: col.customer_id || '',
          customerName: col.customer_name || '',
          amountAFN: Number(col.amount_afn) || 0,
          collectionType: col.collection_type || 'deposit',
          paymentMethod: col.payment_method || 'cash',
          receiptNumber: col.receipt_number || '',
          notes: col.notes || '',
          date: col.date || col.created_at || new Date().toISOString(),
          status: col.status || 'in_hand',
          remittanceId: col.remittance_id || undefined,
        }));
      }

      if (remittancesData && remittancesData.length > 0) {
        result.remittances = remittancesData.map((rem: any) => ({
          id: rem.id,
          remittanceNumber: rem.remittance_number || rem.id.slice(-6).toUpperCase(),
          storeId: rem.store_id || storeId || '',
          visitorId: rem.visitor_id,
          visitorName: rem.visitor_name,
          amountAFN: Number(rem.amount_afn) || 0,
          paymentMethod: rem.payment_method || 'bank_transfer',
          bankName: rem.bank_name || '',
          destinationAccount: rem.destination_account || '',
          trackingNumber: rem.tracking_number || '',
          receiptImageUrl: rem.receipt_image_url || undefined,
          notes: rem.notes || '',
          submittedAt: rem.submitted_at || rem.created_at || new Date().toISOString(),
          status: rem.status || 'pending',
          reviewedAt: rem.reviewed_at || undefined,
          reviewedBy: rem.reviewed_by || undefined,
          reviewedByName: rem.reviewed_by_name || undefined,
          rejectionReason: rem.rejection_reason || undefined,
        }));
      }

      return result;
    } catch (err) {
      console.warn('Pulling cloud data warning:', err);
      return {};
    }
  },

  /**
   * Pull messages for a store or conversation from Supabase
   */
  async pullStoreMessages(storeId: string): Promise<Message[]> {
    if (!supabase || !isSupabaseConfigured) return [];
    try {
      let query = supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (storeId) {
        query = query.or(`store_id.eq.${storeId},store_id.is.null,store_id.eq.store_main`);
      }
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderRole: m.sender_role,
        text: m.text || undefined,
        imageUrl: m.image_url || undefined,
        createdAt: m.created_at || new Date().toISOString(),
        isRead: m.is_read ?? false,
      }));
    } catch (err) {
      console.warn('Pulling messages error:', err);
      return [];
    }
  },

  /**
   * Pull all profiles from Supabase
   */
  async pullAllProfiles(): Promise<UserProfile[]> {
    if (!supabase || !isSupabaseConfigured) return [];
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error || !data) return [];
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: p.username?.includes('@') ? p.username : undefined,
        username: p.username,
        password: p.password_hash || '123456',
        role: p.role,
        storeId: p.store_id || undefined,
        avatarUrl: p.avatar_url || undefined,
        city: p.city || 'کابل',
        createdAt: p.created_at || new Date().toISOString(),
        isActive: p.is_active ?? true,
        allowCashCollection: p.allow_cash_collection ?? true,
      }));
    } catch (err) {
      console.warn('Pulling profiles error:', err);
      return [];
    }
  },

  /**
   * Sync PlatformConfig to Supabase (version, FAQs, announcements)
   */
  async syncPlatformConfig(config: PlatformConfig): Promise<void> {
    if (!supabase || !isSupabaseConfigured) return;
    try {
      await supabase.from('platform_config').upsert({
        id: 'global_config',
        app_name: config.appName,
        short_description: config.shortDescription,
        app_release_version: config.appReleaseVersion || '2.5.0',
        app_version_code: config.appVersionCode || 5,
        app_update_notes: config.appUpdateNotes || '',
        app_update_required: config.appUpdateRequired ?? false,
        plan_6month_price_afn: config.plan6MonthPriceAFN,
        plan_1year_price_afn: config.plan1YearPriceAFN,
        support_phone: config.supportPhone,
        support_whatsapp: config.supportWhatsApp,
        support_welcome_message: config.supportWelcomeMessage || '',
        support_faqs: config.supportFaqs || [],
        public_announcement: config.publicAnnouncement || '',
        announcement_title: config.announcementTitle || '',
        announcement_type: config.announcementType || 'info',
        announcement_enabled: config.announcementEnabled ?? false,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Supabase platform_config sync warning:', err);
    }
  },

  /**
   * Pull PlatformConfig from Supabase
   */
  async pullPlatformConfig(): Promise<Partial<PlatformConfig> | null> {
    if (!supabase || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.from('platform_config').select('*').eq('id', 'global_config');
      if (error || !data || data.length === 0) return null;
      const c = data[0];
      return {
        appName: c.app_name,
        shortDescription: c.short_description,
        appReleaseVersion: c.app_release_version || '2.5.0',
        appVersionCode: Number(c.app_version_code) || 5,
        appUpdateNotes: c.app_update_notes || '',
        appUpdateRequired: c.app_update_required ?? false,
        plan6MonthPriceAFN: Number(c.plan_6month_price_afn) || 1700,
        plan1YearPriceAFN: Number(c.plan_1year_price_afn) || 3000,
        supportPhone: c.support_phone,
        supportWhatsApp: c.support_whatsapp,
        supportWelcomeMessage: c.support_welcome_message,
        supportFaqs: Array.isArray(c.support_faqs) ? c.support_faqs : [],
        publicAnnouncement: c.public_announcement,
        announcementTitle: c.announcement_title,
        announcementType: c.announcement_type || 'info',
        announcementEnabled: c.announcement_enabled ?? false,
        updatedAt: c.updated_at || new Date().toISOString(),
      };
    } catch (err) {
      console.warn('Supabase platform_config pull warning:', err);
      return null;
    }
  },

  /**
   * Complete Bidirectional Cloud Synchronization:
   * Pulls medicines, customers, orders, collections, remittances, messages, profiles and platform config from Supabase,
   * merges with local Storage, and triggers a state refresh across all open views.
   */
  async syncAllData(storeId?: string): Promise<{
    success: boolean;
    medicinesCount: number;
    customersCount: number;
    ordersCount: number;
    messagesCount: number;
    error?: string;
  }> {
    if (!supabase || !isSupabaseConfigured) {
      return { success: false, medicinesCount: 0, customersCount: 0, ordersCount: 0, messagesCount: 0, error: 'Supabase not configured' };
    }

    try {
      const { Storage } = await import('./storage');
      const effStoreId = storeId || Storage.getCurrentUser()?.storeId || Storage.getStores()[0]?.id || '';

      const [cloudData, cloudMsgs, cloudProfiles, cloudConfig] = await Promise.all([
        this.pullStoreCloudData(effStoreId),
        this.pullStoreMessages(effStoreId),
        this.pullAllProfiles(),
        this.pullPlatformConfig(),
      ]);

      let medsCount = 0;
      let custsCount = 0;
      let ordersCount = 0;
      let msgsCount = 0;

      if (cloudData.medicines && cloudData.medicines.length > 0) {
        Storage.mergeCloudMedicines(cloudData.medicines, effStoreId);
        medsCount = cloudData.medicines.length;
      }
      if (cloudData.customers && cloudData.customers.length > 0) {
        Storage.mergeCloudCustomers(cloudData.customers, effStoreId);
        custsCount = cloudData.customers.length;
      }
      if (cloudData.orders && cloudData.orders.length > 0) {
        Storage.mergeCloudOrders(cloudData.orders, effStoreId);
        ordersCount = cloudData.orders.length;
      }
      if (cloudData.collections && cloudData.collections.length > 0) {
        Storage.mergeCloudCollections(cloudData.collections, effStoreId);
      }
      if (cloudData.remittances && cloudData.remittances.length > 0) {
        Storage.mergeCloudRemittances(cloudData.remittances, effStoreId);
      }
      if (cloudMsgs && cloudMsgs.length > 0) {
        Storage.mergeCloudMessages(cloudMsgs, effStoreId);
        msgsCount = cloudMsgs.length;
      }
      if (cloudProfiles && cloudProfiles.length > 0) {
        Storage.mergeCloudProfiles(cloudProfiles);
      }
      if (cloudConfig) {
        Storage.mergeCloudPlatformConfig(cloudConfig);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }

      return {
        success: true,
        medicinesCount: medsCount,
        customersCount: custsCount,
        ordersCount: ordersCount,
        messagesCount: msgsCount,
      };
    } catch (err: any) {
      console.warn('Supabase syncAllData error:', err);
      return { success: false, medicinesCount: 0, customersCount: 0, ordersCount: 0, messagesCount: 0, error: err?.message };
    }
  },
};
