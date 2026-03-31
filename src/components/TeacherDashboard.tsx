import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase, callAlemAI } from "@/lib/supabase";
import { Home, User, Star, Users, Sparkles, BookOpen, AlertTriangle, LogOut, Plus, Check, Newspaper } from "lucide-react";
import { toast } from "sonner";
import AIPage from "./student/AIPage";
import FeedPage from "./student/FeedPage";

interface TeacherDashboardProps {
  user: any;
  onLogout: () => void;
}

type Tab = "home" | "feed" | "students" | "grades" | "ai" | "profile";

const TeacherDashboard = ({ user, onLogout }: TeacherDashboardProps) => {
  const { t, lang, setLang } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    if (user.class_id) {
      const { data } = await supabase.from("profiles").select("*").eq("class_id", user.class_id).eq("role", "student");
      if (data?.length) setStudents(data);
    }
    const { data: subj } = await supabase.from("subjects").select("*");
    if (subj?.length) setSubjects(subj);

    // Mock fallback for demo
    if (!user.class_id || students.length === 0) {
      setStudents((prev) => prev.length ? prev : [
        { id: "mock-s1", username: "arman_10a", full_name: "Арман", xp: 120, level: 1 },
        { id: "mock-s2", username: "aigerim_10a", full_name: "Айгерім", xp: 80, level: 1 },
        { id: "mock-s3", username: "daniyar_10a", full_name: "Данияр", xp: 60, level: 1 },
      ]);
    }
    if (subjects.length === 0) {
      setSubjects((prev) => prev.length ? prev : [
        { id: "mock-sub1", name: "Математика" },
        { id: "mock-sub2", name: "Қазақ тілі" },
        { id: "mock-sub3", name: "Информатика" },
      ]);
    }
  };

  const [gradeForm, setGradeForm] = useState({ student_id: "", subject_id: "", grade: 5, type: "regular" });

  const addGrade = async () => {
    if (!gradeForm.student_id || !gradeForm.subject_id) return;
    const { error } = await supabase.from("grades").insert({
      student_id: gradeForm.student_id,
      subject_id: gradeForm.subject_id,
      grade: gradeForm.grade,
      type: gradeForm.type,
      teacher_id: user.id,
    });
    if (error) toast.error(error.message);
    else toast.success(lang === "kz" ? "Баға қойылды!" : "Оценка поставлена!");
  };

  const generateReport = async () => {
    if (!students.length) return;
    const ids = students.map(s => s.id);
    const { data: grades } = await supabase.from("grades").select("*, subjects(name), profiles!student_id(username)")
      .in("student_id", ids).order("date", { ascending: false }).limit(50);
    
    const ctx = JSON.stringify(grades?.map(g => ({ student: (g as any).profiles?.username, subject: g.subjects?.name, grade: g.grade })));
    const prompt = lang === "kz"
      ? `Мұғалім үшін сынып бойынша есеп жаса. Бағалар: ${ctx}. Қысқа аналитика бер.`
      : `Сгенерируй отчёт по классу для учителя. Оценки: ${ctx}. Дай краткую аналитику.`;
    
    const report = await callAlemAI([{ role: "user", content: prompt }]);
    toast.success(lang === "kz" ? "Есеп дайын!" : "Отчёт готов!");
    alert(report);
  };

  const tabs: { key: Tab; icon: typeof Home; label: string }[] = [
    { key: "home", icon: Home, label: t("nav.home") },
    { key: "feed", icon: Newspaper, label: lang === "kz" ? "Лента" : "Лента" },
    { key: "students", icon: Users, label: lang === "kz" ? "Оқушылар" : "Ученики" },
    { key: "grades", icon: Star, label: t("nav.grades") },
    { key: "ai", icon: Sparkles, label: "AI" },
    { key: "profile", icon: User, label: t("nav.profile") },
  ];

  const renderHome = () => (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-xl font-black text-foreground mb-4">
        {lang === "kz" ? "👨‍🏫 Мұғалім панелі" : "👨‍🏫 Панель учителя"}
      </h1>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <Users className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-black text-foreground">{students.length}</p>
          <p className="text-xs text-muted-foreground">{lang === "kz" ? "Оқушылар" : "Учеников"}</p>
        </div>
        <div className="bg-card rounded-xl p-4 shadow-card text-center">
          <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-black text-foreground">{subjects.length}</p>
          <p className="text-xs text-muted-foreground">{lang === "kz" ? "Пәндер" : "Предметов"}</p>
        </div>
      </div>
      <motion.button whileTap={{ scale: 0.95 }} onClick={generateReport}
        className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" /> {lang === "kz" ? "AI-есеп жасау" : "AI-Отчёт по классу"}
      </motion.button>

      {/* Early warning - students with declining grades */}
      <h3 className="font-black text-foreground mb-2">{lang === "kz" ? "⚠️ Назар аударыңыз" : "⚠️ Требуют внимания"}</h3>
      {students.filter(s => (s.xp || 0) < 100).slice(0, 3).map(s => (
        <div key={s.id} className="bg-card rounded-xl p-3 shadow-card mb-2 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-secondary" />
          <div>
            <p className="font-bold text-foreground text-sm">@{s.username}</p>
            <p className="text-xs text-muted-foreground">{s.xp || 0} XP</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStudents = () => (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-xl font-black text-foreground mb-4">{lang === "kz" ? "Оқушылар" : "Ученики"}</h1>
      {students.map(s => (
        <div key={s.id} className="bg-card rounded-xl p-3 shadow-card mb-2 flex items-center gap-3">
          <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${s.username}`} alt="" className="w-10 h-10 rounded-full bg-muted" />
          <div className="flex-1">
            <p className="font-bold text-foreground text-sm">@{s.username}</p>
            <p className="text-xs text-muted-foreground">Lvl {s.level || 1} • {s.xp || 0} XP</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGrades = () => (
    <div className="px-4 pt-12 pb-4">
      <h1 className="text-xl font-black text-foreground mb-4">{lang === "kz" ? "Баға қою" : "Поставить оценку"}</h1>
      <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
        <select value={gradeForm.student_id} onChange={e => setGradeForm({ ...gradeForm, student_id: e.target.value })}
          className="w-full bg-muted rounded-xl px-4 py-3 text-foreground font-semibold outline-none">
          <option value="">{lang === "kz" ? "Оқушы таңдаңыз" : "Выберите ученика"}</option>
          {students.map(s => <option key={s.id} value={s.id}>@{s.username} — {s.full_name}</option>)}
        </select>
        <select value={gradeForm.subject_id} onChange={e => setGradeForm({ ...gradeForm, subject_id: e.target.value })}
          className="w-full bg-muted rounded-xl px-4 py-3 text-foreground font-semibold outline-none">
          <option value="">{lang === "kz" ? "Пән таңдаңыз" : "Выберите предмет"}</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-2">
          {[2, 3, 4, 5].map(g => (
            <button key={g} onClick={() => setGradeForm({ ...gradeForm, grade: g })}
              className={`flex-1 py-3 rounded-xl font-black text-lg ${gradeForm.grade === g ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{g}</button>
          ))}
        </div>
        <select value={gradeForm.type} onChange={e => setGradeForm({ ...gradeForm, type: e.target.value })}
          className="w-full bg-muted rounded-xl px-4 py-3 text-foreground font-semibold outline-none">
          <option value="regular">{lang === "kz" ? "Кәдімгі" : "Обычная"}</option>
          <option value="БЖБ">БЖБ</option>
          <option value="ТЖБ">ТЖБ</option>
          <option value="СОР">СОР</option>
          <option value="СОЧ">СОЧ</option>
        </select>
        <motion.button whileTap={{ scale: 0.95 }} onClick={addGrade}
          className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2">
          <Check className="w-5 h-5" /> {lang === "kz" ? "Баға қою" : "Поставить"}
        </motion.button>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="px-4 pt-12 pb-4">
      <div className="flex flex-col items-center mb-6">
        <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
          alt="" className="w-24 h-24 rounded-full bg-muted border-4 border-accent" />
        <h2 className="text-xl font-black text-foreground mt-3">@{user.username}</h2>
        <p className="text-sm text-muted-foreground">{user.full_name}</p>
        <p className="text-xs text-muted-foreground">ID: {user.id?.slice(0, 8)}</p>
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
      case "feed": return <FeedPage user={user} />;
      case "students": return renderStudents();
      case "grades": return renderGrades();
      case "ai": return <AIPage user={user} />;
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

export default TeacherDashboard;
