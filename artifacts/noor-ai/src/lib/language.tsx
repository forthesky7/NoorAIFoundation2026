import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "ar" | "en";

export const translations = {
  ar: {
    dashboard: "لوحة التحكم",
    library: "المكتبة",
    futureSimulator: "محاكي المستقبل",
    admin: "الإدارة",
    adminNoor: "لوحة الإدارة",
    logout: "تسجيل الخروج",
    subscribe: "اشترك بـ 5$/شهر",
    logIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    searchLessons: "ابحث عن الدروس...",
    videoLibrary: "مكتبة الفيديوهات",
    videoLibraryDesc: "دروس تفاعلية مع نقاط تحقق بالذكاء الاصطناعي.",
    discussWithNoor: "ناقش الدرس مع نُور AI",
    allCategories: "جميع الفئات",
    noVideos: "لم يتم العثور على فيديوهات",
    noVideosDesc: "لم نجد أي دروس تطابق بحثك. حاول تعديل البحث أو مسح الفلاتر.",
    clearFilters: "مسح الفلاتر",
    loading: "جاري التحميل...",
    langToggle: "English",
    lessonCheckpoints: "نقاط التحقق",
    noCheckpoints: "لا توجد نقاط تحقق لهذا الدرس.",
    checkpointReached: "نقطة تحقق",
    resumeVideo: "استئناف الفيديو",
    skipForNow: "تخطي الآن",
    typeAnswer: "اكتب إجابتك هنا...",
    greeting: "مرحباً",
    totalVideos: "إجمالي الفيديوهات",
    totalUsers: "إجمالي المستخدمين",
    subscribers: "المشتركون",
    videoManagement: "إدارة الفيديوهات",
    recentUsers: "المستخدمون الأخيرون",
    addVideo: "إضافة فيديو",
    videoTitle: "عنوان الفيديو",
    youtubeUrl: "رابط يوتيوب",
    category: "الفئة",
    save: "حفظ",
    saving: "جارٍ الحفظ...",
    delete: "حذف",
    confirmDelete: "هل أنت متأكد من الحذف؟",
    footerText: "جميع الحقوق محفوظة",
    grade: "الصف",
    subject: "المادة",
    subscribeTitle: "اشترك في نُور AI",
    subscribeDesc: "احصل على وصول غير محدود لجميع الدروس والميزات المميزة",
    payWithCrypto: "الدفع بالعملات المشفرة (USDT)",
    paymentPending: "في انتظار الدفع",
    paymentAddress: "عنوان المحفظة",
    copyAddress: "نسخ العنوان",
    addressCopied: "تم نسخ العنوان",
    priceMonth: "5 دولار / شهر",
    dashboardWelcome: "أهلاً وسهلاً",
    continueWatching: "متابعة المشاهدة",
    startLearning: "ابدأ التعلم",
    noProgress: "لم تبدأ أي دروس بعد",
    home: "الرئيسية",
    features: "المميزات",
    joinNoor: "انضم إلى نُور AI",
    menu: "القائمة",
  },
  en: {
    dashboard: "Dashboard",
    library: "Library",
    futureSimulator: "Future Simulator",
    admin: "Admin",
    adminNoor: "Admin Panel",
    logout: "Log out",
    subscribe: "Subscribe $5/mo",
    logIn: "Log in",
    signUp: "Sign up",
    searchLessons: "Search lessons...",
    videoLibrary: "Video Library",
    videoLibraryDesc: "Interactive lessons with AI comprehension checks.",
    discussWithNoor: "ناقش الدرس مع نُور AI",
    allCategories: "All Categories",
    noVideos: "No videos found",
    noVideosDesc: "We couldn't find any lessons matching your filters. Try adjusting your search or clearing filters.",
    clearFilters: "Clear Filters",
    loading: "Loading...",
    langToggle: "العربية",
    lessonCheckpoints: "Lesson Checkpoints",
    noCheckpoints: "No checkpoints set for this lesson.",
    checkpointReached: "Checkpoint",
    resumeVideo: "Resume Video",
    skipForNow: "Skip for now",
    typeAnswer: "Type your answer here...",
    greeting: "Hello",
    totalVideos: "Total Videos",
    totalUsers: "Total Users",
    subscribers: "Subscribers",
    videoManagement: "Video Management",
    recentUsers: "Recent Users",
    addVideo: "Add Video",
    videoTitle: "Video Title",
    youtubeUrl: "YouTube URL",
    category: "Category",
    save: "Save",
    saving: "Saving...",
    delete: "Delete",
    confirmDelete: "Are you sure you want to delete this video?",
    footerText: "All rights reserved",
    grade: "Grade",
    subject: "Subject",
    subscribeTitle: "Subscribe to NOOR AI",
    subscribeDesc: "Get unlimited access to all lessons and premium features",
    payWithCrypto: "Pay with Crypto (USDT)",
    paymentPending: "Awaiting Payment",
    paymentAddress: "Wallet Address",
    copyAddress: "Copy Address",
    addressCopied: "Address Copied",
    priceMonth: "$5 / month",
    dashboardWelcome: "Welcome back",
    continueWatching: "Continue Watching",
    startLearning: "Start Learning",
    noProgress: "You haven't started any lessons yet",
    home: "Home",
    features: "Features",
    joinNoor: "Join NOOR AI",
    menu: "Menu",
  }
};

interface LangContextType {
  lang: Lang;
  t: typeof translations.ar;
  toggle: () => void;
}

const LangContext = createContext<LangContextType>({
  lang: "ar",
  t: translations.ar,
  toggle: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  const toggle = () => setLang(l => (l === "ar" ? "en" : "ar"));

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], toggle }}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="contents">
        {children}
      </div>
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
