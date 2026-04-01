import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { getMockScheduleForClass } from "@/lib/mockSchedule";
import { CalendarDays, Clock, Loader2, MapPin } from "lucide-react";

interface SchedulePageProps {
  user: any;
}

type LessonRow = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  status: string | null;
  subjects?: { name?: string | null } | null;
};

const DAY_LABELS_RU = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const DAY_LABELS_KZ = ["", "Дс", "Сс", "Ср", "Бс", "Жм", "Сб", "Жс"];

export default function SchedulePage({ user }: SchedulePageProps) {
  const { t, lang } = useI18n();
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [activeDay, setActiveDay] = useState<number>(() => new Date().getDay() || 7);

  const dayLabels = lang === "kz" ? DAY_LABELS_KZ : DAY_LABELS_RU;

  useEffect(() => {
    const load = async () => {
      if (!user?.class_id) {
        setLessons(getMockScheduleForClass(user?.class_name));
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("lessons")
        .select("id, day_of_week, start_time, end_time, room, status, subjects(name)")
        .eq("class_id", user.class_id)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Schedule load error:", error);
        setLessons(getMockScheduleForClass(user?.class_name));
      } else {
        const nextLessons = (data || []) as LessonRow[];
        setLessons(nextLessons.length > 0 ? nextLessons : getMockScheduleForClass(user?.class_name));
      }
      setLoading(false);
    };

    load();
  }, [user?.class_id]);

  const grouped = useMemo(() => {
    const map = new Map<number, LessonRow[]>();
    for (const l of lessons) {
      const d = l.day_of_week || 1;
      map.set(d, [...(map.get(d) || []), l]);
    }
    return map;
  }, [lessons]);

  const activeLessons = grouped.get(activeDay) || [];

  return (
    <div className="px-4 pt-12 pb-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          {t("nav.schedule")}
        </h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <motion.button
            key={d}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveDay(d)}
            className={`px-4 py-2 rounded-xl font-black text-sm border ${
              activeDay === d
                ? "gradient-primary text-primary-foreground border-transparent"
                : "bg-card text-foreground border-border"
            }`}
          >
            {dayLabels[d]}
          </motion.button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : !user?.class_id ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm font-semibold">
            {lang === "kz" ? "Сынып таңдалмаған" : "Класс не выбран"}
          </p>
          <p className="text-muted-foreground text-xs mt-2">
            {lang === "kz"
              ? "Профильде сыныпты көрсетіңіз немесе әкімшіге хабарласыңыз."
              : "Укажите класс в профиле или обратитесь к администратору."}
          </p>
        </div>
      ) : activeLessons.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm font-semibold">{t("home.noLessons")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeLessons.map((lesson, i) => (
            <motion.div
              key={lesson.id}
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
                  <p className="font-black text-foreground text-sm truncate">
                    {lesson.subjects?.name || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground font-semibold mt-1">
                    {String(lesson.start_time).slice(0, 5)}–{String(lesson.end_time).slice(0, 5)}
                  </p>
                  {lesson.room && (
                    <p className="text-xs text-muted-foreground font-semibold mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {lang === "kz" ? "Каб." : "Каб."} {lesson.room}
                    </p>
                  )}
                  {lesson.status === "changed" && (
                    <span className="inline-block mt-2 text-[10px] font-black bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                      {t("home.replacement")}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

