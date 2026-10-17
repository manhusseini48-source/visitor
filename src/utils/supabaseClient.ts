import { createClient } from '@supabase/supabase-js';

// Environment variables from Vite (.env or server)
const rawSupabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  'https://obylzwvrfcagpfnqrhek.supabase.co';

// Automatically sanitize and strip any /rest/v1 or trailing slash
export const cleanSupabaseUrl = rawSupabaseUrl
  .trim()
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/+$/, '');

const rawSupabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ieWx6d3ZyZmNhZ3BmbnFyaGVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2NDYxMDgsImV4cCI6MjEwNzIyMjEwOH0.XNxraCLikkOz0zfcQBs2aAqbJ0nNegd1j0FDRAl6pp4';

export const supabaseAnonKey = rawSupabaseAnonKey.trim();

export const isSupabaseConfigured = Boolean(
  cleanSupabaseUrl && 
  supabaseAnonKey && 
  !cleanSupabaseUrl.includes('your-project') &&
  cleanSupabaseUrl.startsWith('https://')
);

// Graceful client configured with real Supabase credentials
export const supabase = isSupabaseConfigured
  ? createClient(cleanSupabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Send Email OTP through Supabase Auth
 */
export async function sendSupabaseSignUpOtp(
  email: string,
  password: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; message?: string; isSimulated?: boolean }> {
  const cleanEmail = email.trim().toLowerCase();

  // If Supabase is not configured yet (local dev or demo), provide simulation mode
  if (!supabase || !isSupabaseConfigured) {
    return {
      success: true,
      isSimulated: true,
      message: 'کد تایید فعال‌سازی ارسال گردید.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: metadata || {},
      },
    });

    if (error) {
      // Friendly Persian error translation
      let errText = error.message;
      if (error.message.toLowerCase().includes('already registered')) {
        errText = 'این ایمیل قبلاً در سامانه ثبت شده است.';
      } else if (error.message.toLowerCase().includes('rate limit')) {
        errText = 'تعداد تلاش‌های ارسال ایمیل بیش از حد مجاز است؛ لطفاً چند دقیقه دیگر امتحان کنید.';
      } else if (error.message.toLowerCase().includes('valid email')) {
        errText = 'فرمت ایمیل وارد شده نامعتبر است.';
      }
      return { success: false, message: errText };
    }

    return {
      success: true,
      isSimulated: false,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'خطا در ارتباط با سرور احراز هویت.',
    };
  }
}

/**
 * Verify Supabase Email OTP Token (6 digits)
 */
export async function verifySupabaseOtp(
  email: string,
  token: string
): Promise<{ success: boolean; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();

  // If Supabase is not configured yet, simulate verification
  if (!supabase || !isSupabaseConfigured) {
    // Demo OTP is 123456 or any 6-digit entered
    return { success: true };
  }

  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    if (error) {
      let errText = 'کد تایید اشتباه است یا منقضی شده است.';
      if (error.message.toLowerCase().includes('expired')) {
        errText = 'مهلت زمانی کد تایید به پایان رسیده است؛ لطفاً مجدداً کد ارسال کنید.';
      }
      return { success: false, message: errText };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'خطا در تایید کد یکبار مصرف.',
    };
  }
}

/**
 * Resend Supabase Email OTP
 */
export async function resendSupabaseOtp(
  email: string
): Promise<{ success: boolean; message?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (!supabase || !isSupabaseConfigured) {
    return { success: true, message: 'کد تایید آزمایشی مجدداً ارسال گردید.' };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'خطا در ارسال مجدد کد.',
    };
  }
}
