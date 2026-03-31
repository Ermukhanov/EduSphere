import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase, callAlemAI } from "@/lib/supabase";
import { Flame, TrendingUp, Sparkles, Clock, AlertTriangle, Trophy, Star, Copy } from "lucide-react";
import { toast } from "sonner";

interface HomePageProps {
  user: any;
}

function getBilimClassMock() {
  const subjects = ["Математика", "Физика", "Қазақ тілі", "Русский язык", "Информатика"];
  return subjects.map((s) => ({
    subject: s,
    grade: Math.floor(Math.random() * 4) + 2,
    type: Math.random() > 0.5 ? "БЖБ" : "ТЖБ",
  }));
}

const HomePage = ({ user }: HomePageProps) => {
  const { t, lang } = useI18n();
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`;

  const [grades, setGrades] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [aiInsight, setAiInsight] = useState("");
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState(0);
  const [countdown, setCountdown] = useState("");

  const xp = user.xp || 0;
  const level = user.level || 1;
  const streak = user.streak || 0;
  const xpForNext = level * 1000;
  const xpProgress = (xp % 1000) / 10;

  useEffect(() => { loadData(); }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentLesson = lessons.find((l) => {
        const start = l.start_time?.slice(0, 5);
        const end = l.end_time?.slice(0, 5);
        const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        return cur >= start && cur <= end;
      });
      if (currentLesson) {
        const [eh, em] = currentLesson.end_time.split(":").map(Number);
        const endMs = new Date().setHours(eh, em, 0, 0);
        const diff = endMs - Date.now();
        if (diff > 0) {
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setCountdown(`${mins}:${String(secs).padStart(2, "0")}`);
        }
      } else {
        setCountdown("");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lessons]);

  const loadData = async () => {
    setLoading(true);
    const { data: subjectsData } = await supabase.from("subjects").select("*");
    if (subjectsData?.length) setSubjects(subjectsData);

    // Grades
    const { data: gradesData } = await supabase
      .from("grades").select("*, subjects(name)").eq("student_id", user.id)
      .order("created_at", { ascending: false }).limit(20);

    if (gradesData?.length) {
      setGrades(gradesData);
    } else {
      const mock = getBilimClassMock();
      setGrades(mock.map((m, i) => ({ id: `mock-${i}`, grade: m.grade, subjects: { name: m.subject }, comment: m.type, isMock: true })));
    }

    // Lessons
    const dayOfWeek = new Date().getDay() || 7;
    const { data: lessonsData } = await supabase
      .from("lessons").select("*, subjects(name)")
      .eq("class_id", user.class_id).eq("day_of_week", dayOfWeek)
      .order("start_time", { ascending: true });
    if (lessonsData) setLessons(lessonsData);

    // Leaderboard
    if (user.class_id) {
      const { data: leaderData } = await supabase
        .from("profiles").select("id, username, xp, level, avatar_url")
        .eq("class_id", user.class_id).order("xp", { ascending: false }).limit(10);
      if (leaderData) {
        setLeaderboard(leaderData);
        const rank = leaderData.findIndex((p: any) => p.id === user.id);
        setMyRank(rank >= 0 ? rank + 1 : 0);
      }
    }

    // Achievements
    const { data: achData } = await supabase.from("achievements").select("*");
    if (achData) setAllAchievements(achData);
    const { data: userAch } = await supabase.from("user_achievements").select("achievement_id").eq("user_id", user.id);
    if (userAch) setUserAchievements(userAch.map((a: any) => a.achievement_id));

    // AI insight
    const recentGrades = gradesData?.slice(0, 5) || [];
    if (recentGrades.length > 0) {
      const gradesCtx = recentGrades.map((g: any) => `${g.subjects?.name}: ${g.grade}`).join(", ");
      const prompt = lang === "kz"
        ? `Сен оқушының AI көмекшісісің. Оқушы аты: ${user.username}. Соңғы бағалары: ${gradesCtx}. Бір қысқа кеңес бер (1-2 сөйлем). Ынталандыр.`
        : `Ты AI-помощник ученика. Имя: ${user.username}. Последние оценки: ${gradesCtx}. Дай один короткий совет (1-2 предложения). Мотивируй.`;
      const insight = await callAlemAI([{ role: "user", content: prompt }]);
      setAiInsight(insight);
    } else {
      setAiInsight(lang === "kz" ? "Оқуды бастайық! 💪" : "Начнём учиться! 💪");
    }

    setLoading(false);
  };

  const getGradeColor = (grade: number) => {
    if (grade === 5) return "bg-accent";
    if (grade === 4) return "bg-primary";
    if (grade === 3) return "bg-secondary";
    return "bg-destructive";
  };

  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const overallGPA = grades.length > 0
    ? (grades.reduce((s, g) => s + g.grade, 0) / grades.length).toFixed(1)
    : "0.0";

  return (
    <div className="px-4 pt-12 pb-4">
      {/* RPG Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-full bg-muted border-3 border-primary" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 gradient-primary rounded-full flex items-center justify-center text-[10px] font-black text-primary-foreground border-2 border-card">
              {level}
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black text-foreground">@{user.username}</h1>
            <p className="text-xs text-muted-foreground font-semibold">
              {user.classes?.name || ""} • ID: {user.id?.slice(0, 8)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-secondary/20 px-3 py-1.5 rounded-full">
            <Flame className="w-5 h-5 text-secondary" />
            <span className="font-black text-secondary text-sm">{streak}</span>
          </div>
          {myRank > 0 && (
            <div className="flex items-center gap-1 bg-accent/20 px-3 py-1.5 rounded-full">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="font-black text-accent text-sm">#{myRank}</span>
            </div>
          )}
        </div>
      </div>

      {/* XP Bar */}
      <div className="bg-card rounded-2xl p-3 shadow-card mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-bold text-muted-foreground">{t("home.level")} {level}</span>
          <span className="text-xs font-bold text-primary">{xp % 1000} / 1000 XP</span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full gradient-primary rounded-full" initial={{ width: 0 }} animate={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      {/* GPA + AI Insight row */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-card rounded-2xl p-4 shadow-card text-center">
          <p className="text-xs font-bold text-muted-foreground mb-1">{t("home.gpa")}</p>
          <p className="text-3xl font-black text-foreground">{overallGPA}</p>
        </div>
        <div className="flex-[2] gradient-primary rounded-2xl p-3 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary-foreground flex-shrink-0" />
          <p className="text-primary-foreground text-xs font-semibold leading-tight">
            {aiInsight || (lang === "kz" ? "Жүктелуде..." : "Загрузка...")}
          </p>
        </div>
      </div>

      {/* Smart Schedule */}
      <div className="mb-4">
        <h2 className="text-base font-black text-foreground mb-2">{t("home.schedule")}</h2>
        {lessons.length > 0 ? (
          <div className="space-y-2">
            {lessons.map((lesson, i) => {
              const isCurrent = currentTimeStr >= lesson.start_time?.slice(0, 5) && currentTimeStr <= lesson.end_time?.slice(0, 5);
              return (
                <motion.div key={lesson.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className={`bg-card rounded-xl p-3 shadow-card flex items-center gap-3 ${isCurrent ? "ring-2 ring-primary/60 bg-primary/5" : ""}`}>
                  <div className="flex flex-col items-center min-w-[50px]">
                    <Clock className={`w-4 h-4 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-bold text-muted-foreground">{lesson.start_time?.slice(0, 5)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-sm">{lesson.subjects?.name || "—"}</p>
                    {lesson.room && <p className="text-xs text-muted-foreground">Каб. {lesson.room}</p>}
                  </div>
                  {isCurrent && countdown && (
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-lg">{countdown}</span>
                  )}
                  {lesson.status === "changed" && (
                    <div className="flex items-center gap-1 bg-secondary/20 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-secondary" />
                      <span className="text-[10px] font-bold text-secondary">{t("home.replacement")}</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("home.noLessons")}</p>
        )}
      </div>

      {/* Today's Grades */}
      <div className="mb-4">
        <h2 className="text-base font-black text-foreground mb-2">{t("home.todayGrades")}</h2>
        {grades.length > 0 ? (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {grades.slice(0, 8).map((g, i) => (
              <motion.div key={g.id || i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="min-w-[80px] bg-card rounded-xl p-3 shadow-card text-center flex-shrink-0">
                <div className={`w-10 h-10 ${getGradeColor(g.grade)} rounded-lg mx-auto flex items-center justify-center mb-1`}>
                  <span className="text-primary-foreground font-black text-lg">{g.grade}</span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground truncate">{g.subjects?.name || "—"}</p>
              </motion.div>
            ))}
          </div>
        ) : <p className="text-sm text-muted-foreground">{t("home.noGrades")}</p>}
      </div>

      {/* Achievements */}
      <div className="mb-4">
        <h2 className="text-base font-black text-foreground mb-2">{t("home.achievements")}</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allAchievements.map((a) => {
            const earned = userAchievements.includes(a.id);
            return (
              <div key={a.id} className={`min-w-[70px] h-[70px] bg-card rounded-xl shadow-card flex flex-col items-center justify-center ${earned ? "border-2 border-primary" : "opacity-30"}`}>
                <span className="text-2xl">{a.icon}</span>
                <p className="text-[8px] font-bold text-foreground mt-0.5 text-center px-1 truncate w-full">
                  {lang === "kz" ? a.title_kz || a.title : a.title}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-black text-foreground mb-2">{t("home.leaderboard")}</h2>
          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            {leaderboard.slice(0, 5).map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 px-4 py-2.5 ${i !== Math.min(4, leaderboard.length - 1) ? "border-b border-border" : ""} ${p.id === user.id ? "bg-primary/5" : ""}`}>
                <span className={`text-base font-black w-5 ${i === 0 ? "text-accent" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-secondary" : "text-muted-foreground"}`}>
                  {i + 1}
                </span>
                <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${p.username}`} alt="" className="w-8 h-8 rounded-full bg-muted" />
                <p className={`flex-1 text-sm font-bold ${p.id === user.id ? "text-primary" : "text-foreground"}`}>@{p.username}</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-accent" />
                  <span className="text-xs font-black text-foreground">{p.xp || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
