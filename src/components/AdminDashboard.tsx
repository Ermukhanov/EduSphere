import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { Home, User, Users, Settings, School, LogOut, Star, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

type Tab = "home" | "users" | "classes" | "schedule" | "profile";

const AdminDashboard = ({ user, onLogout }: AdminDashboardProps) => {
  const { t, lang, setLang } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [school, setSchool] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (user.school_id) {
      const { data: schoolData } = await supabase.from("schools").select("*").eq("id", user.school_id).single();
      if (schoolData) setSchool(schoolData);

      const { data: usersData } = await supabase.from("profiles").select("*").eq("school_id", user.school_id);
      if (usersData) setAllUsers(usersData);

      const { data: classesData } = await supabase.from("classes").select("*").eq("school_id", user.school_id);
      if (classesData) setClasses(classesData);

      const { data: postsData } = await supabase.from("posts").select("*, author:profiles!author_id(username)").eq("school_id", user.school_id).order("created_at", { ascending: false }).limit(20);
      if (postsData) setPosts(postsData);
    }
  };

  const toggleFeatured = async (postId: string, current: boolean) => {
    await supabase.from("posts").update({ is_featured: !current }).eq("id", postId);
    setPosts(posts.map(p => p.id === postId ? { ...p, is_featured: !current } : p));
    toast.success(lang === "kz" ? "Жаңартылды!" : "Обновлено!");
  };

  const studentCount = allUsers.filter(u => u.role === "student").length;
  const teacherCount = allUsers.filter(u => u.role === "teacher").length;
  const parentCount = allUsers.filter(u => u.role === "parent").length;

  const tabs: { key: Tab; icon: typeof Home; label: string }[] = [
    { key: "home", icon: Home, label: t("nav.home") },
    { key: "users", icon: Users, label: lang === "kz" ? "Қолданушылар" : "Пользователи" },
    { key: "classes", icon: School, label: lang === "kz" ? "Сыныптар" : "Классы" },
    { key: "schedule", icon: Settings, label: lang === "kz" ? "Басқару" : "Управление" },
    { key: "profile", icon: User, label: t("nav.profile") },
  ];

  const renderHome = () => (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-xl font-black text-foreground mb-1">
        {lang === "kz" ? "🛡 Әкімші панелі" : "🛡 Панель администратора"}
      </h1>
      {school && <p className="text-sm text-muted-foreground font-semibold mb-4">{school.name}, {school.city}</p>}

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card rounded-xl p-3 shadow-card text-center">
          <p className="text-2xl font-black text-foreground">{studentCount}</p>
          <p className="text-[10px] text-muted-foreground">{lang === "kz" ? "Оқушылар" : "Учеников"}</p>
        </div>
        <div className="bg-card rounded-xl p-3 shadow-card text-center">
          <p className="text-2xl font-black text-foreground">{teacherCount}</p>
          <p className="text-[10px] text-muted-foreground">{lang === "kz" ? "Мұғалімдер" : "Учителей"}</p>
        </div>
        <div className="bg-card rounded-xl p-3 shadow-card text-center">
          <p className="text-2xl font-black text-foreground">{parentCount}</p>
          <p className="text-[10px] text-muted-foreground">{lang === "kz" ? "Ата-аналар" : "Родителей"}</p>
        </div>
      </div>

      {/* Kiosk manager - featured posts */}
      <h3 className="font-black text-foreground mb-2">{lang === "kz" ? "📰 Жаңалықтар" : "📰 Управление лентой"}</h3>
      {posts.slice(0, 5).map(p => (
        <div key={p.id} className="bg-card rounded-xl p-3 shadow-card mb-2 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground truncate">{p.content?.slice(0, 50)}</p>
            <p className="text-xs text-muted-foreground">@{p.author?.username}</p>
          </div>
          <button onClick={() => toggleFeatured(p.id, p.is_featured)}
            className={`px-3 py-1 rounded-lg text-xs font-bold ${p.is_featured ? "bg-accent text-accent-foreground" : "bg-muted text-foreground"}`}>
            {p.is_featured ? "★" : "☆"}
          </button>
        </div>
      ))}
    </div>
  );

  const renderUsers = () => (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-xl font-black text-foreground mb-4">{lang === "kz" ? "Қолданушылар" : "Пользователи"}</h1>
      {allUsers.map(u => (
        <div key={u.id} className="bg-card rounded-xl p-3 shadow-card mb-2 flex items-center gap-3">
          <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`} alt="" className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1">
            <p className="font-bold text-foreground text-sm">@{u.username}</p>
            <p className="text-xs text-muted-foreground">{u.role} • {u.full_name}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderClasses = () => (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-xl font-black text-foreground mb-4">{lang === "kz" ? "Сыныптар" : "Классы"}</h1>
      {classes.map(c => (
        <div key={c.id} className="bg-card rounded-xl p-4 shadow-card mb-2">
          <p className="font-bold text-foreground">{c.name}</p>
          <p className="text-xs text-muted-foreground">{allUsers.filter(u => u.class_id === c.id).length} {lang === "kz" ? "оқушы" : "учеников"}</p>
        </div>
      ))}
    </div>
  );

  const renderProfile = () => (
    <div className="px-4 pt-12 pb-4">
      <div className="flex flex-col items-center mb-6">
        <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
          alt="" className="w-24 h-24 rounded-full bg-muted border-4 border-primary" />
        <h2 className="text-xl font-black text-foreground mt-3">@{user.username}</h2>
        <p className="text-sm text-muted-foreground">{user.full_name}</p>
        <p className="text-xs text-muted-foreground">ID: {user.id?.slice(0, 8)} • {lang === "kz" ? "Әкімші" : "Администратор"}</p>
      </div>
      <div className="bg-card rounded-xl p-4 shadow-card mb-4">
        <p className="text-sm font-bold text-foreground mb-2">{t("onboard.lang.title")}</p>
        <div className="flex gap-2">
          {(["kz", "ru"] as const).map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${lang === l ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {l === "kz" ? "Қазақша" : "Русский"}
            </button>
          ))}
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
        const ok = window.confirm(lang === "kz" ? "Шығуға сенімдісіз бе?" : "Вы точно хотите выйти?");
        if (ok) onLogout();
      }}
        className="w-full bg-destructive/10 text-destructive font-bold py-3 rounded-xl flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> {t("profile.logout")}
      </motion.button>
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "home": return renderHome();
      case "users": return renderUsers();
      case "classes": return renderClasses();
      case "profile": return renderProfile();
      default: return <div className="px-4 pt-12"><p className="text-muted-foreground text-center py-20">{lang === "kz" ? "Жақында..." : "Скоро..."}</p></div>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {renderTab()}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
        <div className="flex justify-around items-center py-2 max-w-lg mx-auto">
          {tabs.map((tab) => (
            <motion.button key={tab.key} whileTap={{ scale: 0.85 }} onClick={() => setActiveTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl ${activeTab === tab.key ? "text-primary" : "text-muted-foreground"}`}>
              <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-bold">{tab.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
