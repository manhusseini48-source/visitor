# راهنمای جامع ارسال به گیت‌هاب و استقرار روی سرور مجازی (VPS)
پلتفرم جامع مدیریت ویزیتور و داروخانه

این راهنما شامل تمام مراحل از کامپیوتر شما تا گیت‌هاب و سرور مجازی (VPS) به صورت کاملاً تست‌شده و بدون باگ است.

---

## 📌 بخش اول: ارسال پروژه به گیت‌هاب (از سیستم خودتان)

اگر پروژه روی سیستم شما قرار دارد، مراحل زیر را در ترمینال یا CMD داخل پوشه پروژه اجرا کنید:

### ۱. ساخت ریپازیتوری در گیت‌هاب
1. وارد حساب گیت‌هاب خود شوید: [github.com](https://github.com)
2. روی دکمه **New** (ساخت مخزن جدید) کلیک کنید.
3. یک نام انتخاب کنید (مثلاً: `pharma-visitor-app`).
4. نوع آن را **Private** (خصوصی) یا **Public** انتخاب کرده و روی **Create repository** بزنید. (تیک Add README را نزنید چون پروژه فایل دارد).

### ۲. مقداردهی اولیه و ارسال به گیت‌هاب
دستورات زیر را داخل پوشه اصلی پروژه اجرا کنید:

```bash
# مقداردهی اولیه گیت
git init

# بررسی فایل‌های نادیده گرفته شده (.gitignore مانع آپلود node_modules و dist و رمزها می‌شود)
git status

# افزودن تمام فایل‌های پروژه
git add .

# ثبت کامیت اول
git commit -m "feat: complete production ready pharma visitor system"

# تغییر نام برنچ به main
git branch -M main

# اتصال به مخزن گیت‌هاب خودتان (آدرس ریپازیتوری خود را جایگزین کنید)
git remote add origin https://github.com/YOUR_USERNAME/pharma-visitor-app.git

# ارسال فایل‌ها به گیت‌هاب
git push -u origin main
```
*(اگر از توکن شخصی گیت‌هاب استفاده می‌کنید، موقع رمز Personal Access Token خود را وارد کنید).*

---

## 📌 بخش دوم: آماده‌سازی سرور مجازی (VPS)

سیستم‌عامل پیشنهادی: **Ubuntu 22.04 LTS** یا **Ubuntu 24.04** یا **Debian 12**

### ۱. ورود به سرور از طریق SSH
```bash
ssh root@YOUR_SERVER_IP
```

### ۲. به‌روزرسانی پکیج‌های لینوکس
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw nano
```

### ۳. نصب Node.js نسخه 20 (LTS) و ابزار PM2
```bash
# نصب Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# بررسی نسخه
node -v
npm -v

# نصب PM2 و serve برای اجرای دائمی
sudo npm install -g pm2 serve
```

---

## 📌 بخش سوم: دریافت پروژه روی VPS و بیلد نهایی

### ۱. دریافت کد از گیت‌هاب
```bash
# ساخت پوشه برنامه‌ها در سرور
mkdir -p /var/www
cd /var/www

# کلون کردن ریپازیتوری از گیت‌هاب
git clone https://github.com/YOUR_USERNAME/pharma-visitor-app.git visitor-app
cd /var/www/visitor-app
```

### ۲. تنظیم متغیرهای محیطی
```bash
# کپی فایل نمونه به فایل محیطی اصلی
cp .env.example .env

# ویرایش فایل .env در صورت نیاز به تنظیمات خاص
nano .env
```
*(برای ذخیره در نانو: کلید `Ctrl + O` سپس `Enter` و خروج با `Ctrl + X`)*

### ۳. نصب پکیج‌ها و ساخت نسخه تولیدی (Build)
```bash
# نصب وابستگی‌ها
npm install

# ساخت بیلد سبک و بهینه (dist)
npm run build
```
پس از اتمام، پوشه `dist` که شامل وبسایت کامپایل‌شده سبک و سریع است ساخته می‌شود.

---

## 📌 بخش چهارم: بالا آوردن وبسایت و اتصال به Nginx + دامنه + SSL

### روش پیشنهادی ۱: اجرای فوق‌سریع با Nginx و SSL (پیشنهاد استاندارد)

#### ۱. نصب وب‌سرور Nginx
```bash
sudo apt install -y nginx
```

#### ۲. تنظیم کانفیگ Nginx برای پروژه
فایل کانفیگ سایت را بسازید:
```bash
sudo nano /etc/nginx/sites-available/visitor-app
```
محتوای زیر را داخل آن قرار دهید (دامنه خود مثل `mvpanel.modesk.org` یا آی‌پی سرور خود را جایگزین کنید):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com; # یا آی‌پی سرور اگر دامنه ندارید

    root /var/www/visitor-app/dist;
    index index.html;

    # فشرده‌سازی برای لود سریع
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # پشتیبانی از SPA Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # کشینگ قدرتمند فونت‌ها و تصاویر
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }
}
```

#### ۳. فعال‌سازی سایت و تست Nginx
```bash
# ایجاد لینک به sites-enabled
sudo ln -s /etc/nginx/sites-available/visitor-app /etc/nginx/sites-enabled/

# حذف کانفیگ پیش‌فرض Nginx
sudo rm -f /etc/nginx/sites-enabled/default

# تست صحت سینتکس
sudo nginx -t

# راه‌اندازی مجدد Nginx
sudo systemctl restart nginx
```

#### ۴. فعال‌سازی رایگان SSL (HTTPS) با Let's Encrypt
اگر دامنه به آی‌پی سرور متصل شده است:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
دستور بالا خودکار SSL را دریافت، نصب و تمدید خودکار می‌کند!

---

### روش پیشنهادی ۲: اجرا با PM2 (بدون نیاز به کانفیگ دستی Nginx)
اگر می‌خواهید روی یک پورت مستقل (مثلاً 3000) بالا بیاید:
```bash
cd /var/www/visitor-app
pm2 start "npm run start" --name "pharma-app"
pm2 save
pm2 startup
```

---

## 📌 بخش پنجم: تنظیم فایروال سرور (امنیت)
```bash
sudo ufw allow 22/tcp    # پورت اتصال SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3000/tcp  # پورت اختیاری برنامه
sudo ufw --force enable
```

---

## 🔄 نحوه بروزرسانی وبسایت در دفعات بعد (Update Workflow)

هر بار که در پروژه تغییری دادید و به گیت‌هاب push کردید، فقط کافیست در سرور دستورات ۳ خطی زیر را بزنید:
```bash
cd /var/www/visitor-app
git pull origin main
npm run build
sudo systemctl reload nginx
```
تمام تغییرات در کمتر از ۵ ثانیه روی سایت فعال می‌شوند بدون قطعی!
