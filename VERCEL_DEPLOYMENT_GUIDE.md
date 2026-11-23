# 🚀 হিস্টোরি ও হিসাবূ (Hisaaboo) - Vercel ডিপ্লয়মেন্ট গাইড

এই গাইডটি অনুসরণ করে আপনি খুব সহজেই **হিসাবূ (Hisaaboo)** সফটওয়্যারটি **Vercel**-এ লাইভ ডিপ্লয় করতে পারবেন।

---

## 📌 ডিপ্লয় করার পূর্বপ্রস্তুতি (Prerequisites)

১. **GitHub রিপোজিটরি**: প্রজেক্টটি আপনার GitHub অ্যাকাউন্টে পুশ করা থাকতে হবে।
২. **MongoDB Atlas ক্লাউড ডেটাবেজ**: লোকালহোস্ট (`mongodb://127.0.0.1:27017`) ইন্টারনেটে চলে না, তাই একটি ফ্রি ক্লাউড MongoDB কানেকশন স্ট্রিং লাগবে:
   - [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) এ একটি ফ্রি অ্যাকাউন্ট খুলুন।
   - একটি ফ্রি `M0 Sandbox Cluster` তৈরি করুন।
   - **Database Access** এ গিয়ে একটি ইউজারনেম ও পাসওয়ার্ড সেট করুন।
   - **Network Access** এ গিয়ে `Allow Access from Anywhere` (`0.0.0.0/0`) সিলেক্ট করুন।
   - **Connect** > **Drivers** থেকে আপনার কানেকশন স্ট্রিংটি কপি করুন:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/hisaaboo?retryWrites=true&w=majority
     ```

---

## 🌟 পদ্ধতি ১: অল-ইন-ওয়ান ভার্সেল ডিপ্লয়মেন্ট (Fullstack on Vercel) - সবচেয়ে সহজ

প্রজেক্টটিতে ইতিমধ্যে `vercel.json` এবং `api/index.js` কনফিগার করা আছে। ফলে ফ্রন্টএন্ড এবং ব্যাকএন্ড API একই সাথে Vercel-এ চলবে!

### ধাপসমূহ:
1. [vercel.com](https://vercel.com)-এ লগইন করুন এবং **"Add New..."** > **"Project"** এ ক্লিক করুন।
2. আপনার GitHub রিপোজিটরি (`hisaaboo`) সিলেক্ট করে **"Import"** চাপুন।
3. **Configure Project** স্ক্রিনে:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./` (ডিফল্ট যা আছে তাই রাখুন)
   - **Build Command**: ডিফল্ট (`npm run build`)
   - **Output Directory**: ডিফল্ট
4. **Environment Variables** সেকশনে নিচের ভেরিয়েবলগুলো যোগ করুন:

| Variable Name | ভ্যালু / উদাহরণ |
| :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/hisaaboo?retryWrites=true&w=majority` |
| `JWT_SECRET` | `hisaaboo-secure-jwt-secret-key-2026-production` (যেকোনো নিরাপদ বড় স্ট্রিং) |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_NAME` | `Hisaaboo` |
| `NEXT_PUBLIC_DEFAULT_LANG` | `bn` |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | `BDT` |

5. **"Deploy"** বাটনে ক্লিক করুন!
   - ২-৩ মিনিটের মধ্যে আপনার সাইট লাইভ হয়ে যাবে (যেমন: `https://hisaaboo.vercel.app`)।

---

## 🏢 পদ্ধতি ২: স্প্লিট ডিপ্লয়মেন্ট (Frontend on Vercel + Backend on Render/Railway)

যদি আপনি ব্যাকএন্ড আলাদা কোনো সার্ভারে (যেমন Render.com বা Railway-তে) দীর্ঘক্ষণ রানিং রাখতে চান:

### ১. ব্যাকএন্ড ডিপ্লয় (Render/Railway):
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `MONGODB_URI`: আপনার MongoDB Atlas স্ট্রিং
  - `JWT_SECRET`: আপনার সিক্রেট কী
  - `FRONTEND_URL`: আপনার Vercel ডোমেইন (যেমন: `https://hisaaboo.vercel.app`)

### ২. ফ্রন্টএন্ড ডিপ্লয় (Vercel):
- Vercel-এ ইমপোর্ট করার সময় **Root Directory** হিসেবে `frontend` সিলেক্ট করুন।
- **Environment Variables** এ যুক্ত করুন:
  - `NEXT_PUBLIC_API_URL`: আপনার রেন্ডার ব্যাকএন্ড API লিঙ্ক (যেমন: `https://hisaaboo-api.onrender.com/api`)
  - `BACKEND_URL`: `https://hisaaboo-api.onrender.com`

---

## 🔑 সুপারঅ্যাডমিন দিয়ে প্রথমবার লগইন করার নিয়ম

ডেটাবেজ নতুন হলে সুপারঅ্যাডমিন অ্যাকাউন্ট দিয়ে লগইন করে ব্যবসা যুক্ত করুন:
- **লগইন পেজ**: `https://your-domain.vercel.app/login`
- **ডিফল্ট সুপারঅ্যাডমিন ফোন**: `01700000000`
- **ডিফল্ট পাসওয়ার্ড**: `admin123`

*(লগইন করার পর `/admin` পেজ থেকে নতুন ব্যবসা, প্যাকেজ ও মডিউল পারমিশন পরিচালনা করতে পারবেন)*।

---

## 🛠️ লোকাল ডেভেলপমেন্ট কমান্ডসমূহ

```bash
# রুট থেকে সরাসরি বিল্ড যাচাই করতে
npm run build

# লোকাল ডেভেলপমেন্ট
npm run dev
```
