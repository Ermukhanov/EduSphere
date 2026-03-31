import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface GradesPageProps {
  user?: any;
}

const GradesPage = ({ user }: GradesPageProps) => {
  const { lang, t } = useI18n();
  const [subjectGrades, setSubjectGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    if (!user?.id) { setLoading(false); return; }

    const { data: grades } = await supabase
      .from("grades")
      .select("*, subjects(name)")
      .eq("student_id", user.id)
      .order("date", { ascending: false });

    if (grades && grades.length > 0) {
      // Group by subject
      const grouped: Record<string, { name: string; grades: number[] }> = {};
      grades.forEach((g: any) => {
        const name = g.subjects?.name || "—";
        if (!grouped[name]) grouped[name] = { name, grades: [] };
        grouped[name].grades.push(g.grade);
      });
      setSubjectGrades(Object.values(grouped).map((s) => ({
        ...s,
        avg: s.grades.reduce((a, b) => a + b, 0) / s.grades.length,
      })));
    } else {
      // BilimClass mock fallback
      const mockSubjects = [
        { name: lang === "kz" ? "Математика" : "Математика", grades: [5, 4, 5, 3, 5, 4] },
        { name: lang === "kz" ? "Қазақ тілі" : "Русский язык", grades: [4, 4, 5, 4, 5] },
        { name: lang === "kz" ? "Ағылшын тілі" : "Английский язык", grades: [5, 5, 4, 5, 5] },
        { name: lang === "kz" ? "Тарих" : "История", grades: [3, 4, 4, 5, 4] },
        { name: lang === "kz" ? "Физика" : "Физика", grades: [4, 5, 4, 4, 5, 3] },
        { name: lang === "kz" ? "Биология" : "Биология", grades: [5, 5, 5, 4, 5] },
      ];
      setSubjectGrades(mockSubjects.map((s) => ({
        ...s,
        avg: s.grades.reduce((a, b) => a + b, 0) / s.grades.length,
      })));
    }
    setLoading(false);
  };

  const gradeColor = (g: number) => {
    if (g === 5) return "bg-accent text-accent-foreground";
    if (g === 4) return "bg-secondary text-secondary-foreground";
    if (g === 3) return "bg-primary/60 text-primary-foreground";
    return "bg-destructive text-destructive-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-12">
      <h1 className="text-2xl font-black text-foreground mb-6">
        {lang === "kz" ? "📊 Бағалар" : "📊 Оценки"}
      </h1>

      <div className="space-y-3">
        {subjectGrades.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-foreground text-sm">{s.name}</h3>
              <span className={`text-sm font-black px-2 py-0.5 rounded-lg ${s.avg >= 4.5 ? "bg-accent/20 text-accent" : s.avg >= 4 ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"}`}>
                {s.avg.toFixed(1)}
              </span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {s.grades.map((g: number, j: number) => (
                <span key={j} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black ${gradeColor(g)}`}>
                  {g}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default GradesPage;
