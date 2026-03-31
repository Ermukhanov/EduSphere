import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase, callAlemAI } from "@/lib/supabase";
import { Home, User, Star, MessageCircle, Sparkles, TrendingUp, Heart, Award, LogOut, CalendarDays, Clock, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import AIPage from "./student/AIPage";
import ChatPage from "./student/ChatPage";

interface ParentDashboardProps {
  user: any;
  onLogout: () => void;
}

type Tab = "home" | "grades" | "schedule" | "ai" | "chat" | "profile";

const ParentDashboard = ({ user, onLogout }: ParentDashboardProps) => {
  const { t, lang, setLang } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [child, setChild] = useState<any>(null);
  const [childGrades, setChildGrades] = useState<any[]>([]);
  const [childLessons, setChildLessons] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadChild(); }, []);

  const loadChild = async () => {
    setLoading(true);
    const { data: link } = await supabase
      .from("parent_children")
      .select("child_id")
      .eq("parent_id", user.id)
      .maybeSingle();

    if (link) {
      const { data: childProfile } = await supabase
        .from("profiles")
        .select("*, classes(name), schools(name)")
        .eq("id", link.child_id)
        .maybeSingle();

      if (childProfile) {
        setChild(childProfile);

        // Load grades
        const { data: grades } = await supabase
          .from("grades")
          .select("*, subjects(name)")
          .eq("student_id", link.child_id)
          .order("date", { ascending: false })
          .limit(20);

        if (grades) setChildGrades(grades);

        // Load schedule (today)
        const dayOfWeek = new Date().getDay() || 7;
        setLoadingSchedule(true);
        const { data: lessons } = await supabase
          .from("lessons")
          .select("*, subjects(name)")
          .eq("class_id", childProfile.class_id)
          .eq("day_of_week", dayOfWeek)
          .order("start_time", { ascending: true });
        setChildLessons(lessons || []);
        setLoadingSchedule(false);

        // AI summary
        const gradesCtx = grades?.slice(0, 5).map((g: any) => `${g.subjects?.name}: ${g.grade}`).join(", ") || "";
        const prompt = lang === "kz"
          ? `Сен ата-анаға көмекшісің. Баланың аты: ${childProfile.username}. Бағалары: ${gradesCtx}. Қысқа кеңес бер (1-2 сөйлем).`
          : `Ты помощник для родителя. Имя ребёнка: ${childProfile.username}. Оценки: ${gradesCtx}. Дай краткий совет (1-2 предложения).`;
        const summary = await callAlemAI([{ role: "user", content: prompt }]);
        setAiSummary(summary);
      }
    }
    setLoading(false);
  };

  const praiseChild = async () => {
    if (!child) return;
    const { error } = await supabase.rpc("award_xp_to_child", {
      p_child_id: child.id,
      p_amount: 30,
      p_reason: "parent_praise",
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setChild((prev: any) => ({ ...prev, xp: (prev?.xp || 0) + 30 }));
    toast.success(lang === "kz" ? "Балаңызға +30 XP берілді! 🎉" : "Ребёнку +30 XP! 🎉");
  };

  const avgGrade = childGrades.length > 0
    ? (childGrades.reduce((s, g) => s + g.grade, 0) / childGrades.length).toFixed(1)
    : "—";

  // Calculate predicted quarter grade
  const predictedGrade = childGrades.length >= 3
    ? (childGrades.slice(0, 10).reduce((s, g) => s + g.grade, 0) / Math.min(10, childGrades.length)).toFixed(1)
    : "—";

  const tabs: { key: Tab; icon: typeof Home; label: string }[] = [
    { key: "home", icon: Home, label: t("nav.home") },
    { key: "grades", icon: Star, label: t("nav.grades") },
    { key: "schedule", icon: CalendarDays, label: t("nav.schedule") },
    { key: "ai", icon: Sparkles, label: "AI" },
    { key: "chat", icon: MessageCircle, label: t("nav.chat") },
    { key: "profile", icon: User, label: t("nav.profile") },
  ];

  const renderHome = () => (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-xl font-black text-foreground mb-4">
        {lang === "kz" ? "👨‍👩‍👦 Ата-ана панелі" : "👨‍👩‍👦 Панель родителя"}
      </h1>

      {!child ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">{lang === "kz" ? "Бала табылмады. ID-ді тексеріңіз." : "Ребёнок не найден. Проверьте ID."}</p>
        </div>
      ) : (
        <>
          {/* Child card */}
          <div className="bg-card rounded-2xl p-4 shadow-card mb-4 flex items-center gap-4">
            <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${child.username}`}
              alt="" className="w-16 h-16 rounded-full bg-muted border-3 border-primary" />
            <div className="flex-1">
              <h2 className="font-black text-foreground">@{child.username}</h2>
              <p className="text-sm text-muted-foreground">{child.full_name}</p>
              <p className="text-xs text-muted-foreground">{child.classes?.name} • Lvl {child.level || 1} • {child.xp || 0} XP</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-card rounded-xl p-3 shadow-card text-center">
              <p className="text-2xl font-black text-foreground">{avgGrade}</p>
              <p className="text-[10px] font-bold text-muted-foreground">{t("home.gpa")}</p>
            </div>
            <div className="bg-card rounded-xl p-3 shadow-card text-center">
              <p className="text-2xl font-black text-foreground">{child.streak || 0}</p>
              <p className="text-[10px] font-bold text-muted-foreground">{lang === "kz" ? "Серия" : "Стрик"}</p>
            </div>
            <div className="bg-card rounded-xl p-3 shadow-card text-center">
              <p className="text-2xl font-black text-foreground">{predictedGrade}</p>
              <p className="text-[10px] font-bold text-muted-foreground">{lang === "kz" ? "Болжам" : "Прогноз"}</p>
            </div>
          </div>

          {/* AI Summary */}
          <div className="gradient-primary rounded-2xl p-4 mb-4 flex items-start gap-3">
            <Sparkles className="w-6 h-6 text-primary-foreground flex-shrink-0 mt-0.5" />
            <p className="text-primary-foreground text-sm font-semibold">{aiSummary || "..."}</p>
          </div>

          {/* Praise button */}
          <motion.button whileTap={{ scale: 0.95 }} onClick={praiseChild}
            className="w-full bg-accent text-accent-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-4">
            <Heart className="w-5 h-5" />
            {lang === "kz" ? "Мақтау (+30 XP)" : "Похвалить (+30 XP)"}
          </motion.button>

          {/* Recent grades */}
          <h3 className="font-black text-foreground mb-2">{t("home.todayGrades")}</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {childGrades.slice(0, 8).map((g, i) => (
              <div key={g.id} className={`min-w-[70px] bg-card rounded-xl p-2 shadow-card text-center`}>
                <div className={`w-8 h-8 ${g.grade >= 4 ? "bg-accent" : g.grade === 3 ? "bg-secondary" : "bg-destructive"} rounded-lg mx-auto flex items-center justify-center mb-1`}>
                  <span className="text-primary-foreground font-black">{g.grade}</span>
                </div>
                <p className="text-[9px] font-bold text-muted-foreground truncate">{g.subjects?.name}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="px-4 pt-12 pb-4">
      <div className="flex flex-col items-center mb-6">
        <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
          alt="" className="w-24 h-24 rounded-full bg-muted border-4 border-secondary" />
        <h2 className="text-xl font-black text-foreground mt-3">@{user.username}</h2>
        <p className="text-sm text-muted-foreground">{user.full_name}</p>
        <p className="text-xs text-muted-foreground">ID: {user.id?.slice(0, 8)}</p>
        <p className="text-xs text-muted-foreground mt-1">{lang === "kz" ? "Рөлі: Ата-ана" : "Роль: Родитель"}</p>
      </div>

      {child && (
        <div className="bg-card rounded-xl p-4 shadow-card mb-4">
          <p className="text-sm font-bold text-foreground mb-1">{lang === "kz" ? "Бала" : "Ребёнок"}</p>
          <p className="text-sm text-muted-foreground">@{child.username} • {child.full_name}</p>
          <p className="text-xs text-muted-foreground">ID: {child.id?.slice(0, 8)}</p>
        </div>
      )}

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

  const renderGrades = () => (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-xl font-black text-foreground mb-4">{t("nav.grades")}</h1>
      {childGrades.length > 0 ? (
        <div className="space-y-2">
          {(() => {
            const grouped: Record<string, { name: string; grades: number[] }> = {};
            childGrades.forEach((g: any) => {
              const name = g.subjects?.name || "—";
              if (!grouped[name]) grouped[name] = { name, grades: [] };
              grouped[name].grades.push(g.grade);
            });
            return Object.values(grouped).map((s, i) => (
              <div key={i} className="bg-card rounded-xl p-4 shadow-card">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-foreground text-sm">{s.name}</span>
                  <span className="font-black text-primary text-sm">{(s.grades.reduce((a, b) => a + b, 0) / s.grades.length).toFixed(1)}</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {s.grades.map((g, j) => (
                    <span key={j} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${g >= 4 ? "bg-accent text-accent-foreground" : g === 3 ? "bg-secondary text-secondary-foreground" : "bg-destructive text-destructive-foreground"}`}>{g}</span>
                  ))}
                </div>
              </div>
            ));
          })()}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-10">{lang === "kz" ? "Бағалар жоқ" : "Нет оценок"}</p>
      )}
    </div>
  );

  const renderSchedule = () => (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" /> {t("nav.schedule")}
      </h1>
      {!child ? (
        <p className="text-muted-foreground text-center py-10">{lang === "kz" ? "Бала табылмады" : "Ребёнок не найден"}</p>
      ) : loadingSchedule ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : childLessons.length === 0 ? (
        <p className="text-muted-foreground text-center py-10">{t("home.noLessons")}</p>
      ) : (
        <div className="space-y-2">
          {childLessons.map((lesson: any, i: number) => (
            <motion.div
              key={lesson.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-2xl p-4 shadow-card"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-foreground text-sm truncate">{lesson.subjects?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    {String(lesson.start_time).slice(0, 5)}–{String(lesson.end_time).slice(0, 5)}
                  </p>
                  {lesson.room && (
                    <p className="text-xs text-muted-foreground font-semibold mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Каб. {lesson.room}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTab = () => {
    switch (activeTab) {
      case "home": return renderHome();
      case "grades": return renderGrades();
      case "schedule": return renderSchedule();
      case "ai": return <AIPage user={user} />;
      case "chat": return <ChatPage user={user} />;
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

export default ParentDashboard;
