import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { BookOpen, Calendar, MessageCircle, Sparkles, Newspaper, Trophy, GraduationCap, Users, School, ShieldCheck, ChevronRight, ChevronLeft } from "lucide-react";
import icon from "@/assets/icon.png";

interface OnboardingProps {
  onComplete: () => void;
  onLogin: () => void;
  onApply: () => void;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const Onboarding = ({ onComplete, onLogin, onApply }: OnboardingProps) => {
  const { t, lang, setLang } = useI18n();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const totalSteps = 5;

  const next = () => {
    if (step < totalSteps - 1) { setDir(1); setStep(step + 1); }
  };
  const prev = () => {
    if (step > 0) { setDir(-1); setStep(step - 1); }
  };

  const features = [
    { icon: BookOpen, label: t("onboard.features.grades"), color: "bg-primary" },
    { icon: Calendar, label: t("onboard.features.schedule"), color: "bg-secondary" },
    { icon: MessageCircle, label: t("onboard.features.chat"), color: "bg-accent" },
    { icon: Sparkles, label: t("onboard.features.ai"), color: "gradient-primary" },
    { icon: Newspaper, label: t("onboard.features.news"), color: "bg-secondary" },
    { icon: Trophy, label: t("onboard.features.achievements"), color: "bg-accent" },
  ];

  const roles = [
    { icon: GraduationCap, label: t("onboard.roles.student"), desc: lang === "ru" ? "Оценки, расписание, чат" : "Бағалар, кесте, чат", color: "gradient-primary" },
    { icon: Users, label: t("onboard.roles.parent"), desc: lang === "ru" ? "Контроль успеваемости" : "Үлгерімді бақылау", color: "gradient-secondary" },
    { icon: School, label: t("onboard.roles.teacher"), desc: lang === "ru" ? "Управление классом" : "Сыныпты басқару", color: "gradient-accent" },
    { icon: ShieldCheck, label: t("onboard.roles.admin"), desc: lang === "ru" ? "Управление школой" : "Мектепті басқару", color: "gradient-primary" },
  ];

  const stats = [
    { value: "100+", label: t("onboard.stats.schools") },
    { value: "5 000+", label: t("onboard.stats.students") },
    { value: "500+", label: t("onboard.stats.teachers") },
    { value: "3 000+", label: t("onboard.stats.parents") },
  ];

  const renderSlide = () => {
    switch (step) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center px-6">
            <motion.img src={icon} alt="EduSphere" className="w-24 h-24 rounded-2xl mb-6" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} />
            <h2 className="text-2xl font-black text-foreground">{t("onboard.about.title")}</h2>
            <p className="text-muted-foreground mt-3 text-base leading-relaxed">{t("onboard.about.desc")}</p>
          </div>
        );
      case 1:
        return (
          <div className="flex flex-col items-center text-center px-6">
            <h2 className="text-2xl font-black text-foreground mb-8">{t("onboard.lang.title")}</h2>
            <div className="flex gap-4 w-full max-w-xs">
              {(["kz", "ru"] as const).map((l) => (
                <motion.button key={l} whileTap={{ scale: 0.95 }} onClick={() => setLang(l)}
                  className={`flex-1 py-4 rounded-2xl font-bold text-lg transition-all ${lang === l ? "gradient-primary text-primary-foreground shadow-button" : "bg-muted text-foreground border-2 border-border"}`}>
                  {l === "kz" ? "Қазақша" : "Русский"}
                </motion.button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col items-center text-center px-6">
            <h2 className="text-2xl font-black text-foreground mb-8">{t("onboard.stats.title")}</h2>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              {stats.map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="text-3xl font-black text-primary">{stat.value}</div>
                  <div className="text-sm font-semibold text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col items-center text-center px-6">
            <h2 className="text-2xl font-black text-foreground mb-6">{t("onboard.features.title")}</h2>
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl p-4 shadow-card flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center`}>
                    <f.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{f.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col items-center text-center px-6">
            <h2 className="text-2xl font-black text-foreground mb-2">{t("onboard.roles.title")}</h2>
            <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
              {roles.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }} className="bg-card rounded-2xl p-4 shadow-card flex items-center gap-4">
                  <div className={`w-12 h-12 ${r.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <r.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-foreground">{r.label}</div>
                    <div className="text-sm text-muted-foreground">{r.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex justify-center gap-2 pt-12 pb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : "w-2 bg-muted"}`} />
        ))}
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence custom={dir} mode="wait">
          <motion.div key={step} custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full">
            {renderSlide()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-6 pb-10 flex items-center justify-between">
        {step > 0 ? (
          <motion.button whileTap={{ scale: 0.9 }} onClick={prev} className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </motion.button>
        ) : <div className="w-12" />}

        {step < totalSteps - 1 ? (
          <motion.button whileTap={{ scale: 0.95 }} onClick={next} className="gradient-primary text-primary-foreground font-bold py-3 px-8 rounded-2xl shadow-button text-lg">
            {t("next")}
          </motion.button>
        ) : (
          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={onApply} className="bg-muted text-foreground font-bold py-3 px-5 rounded-2xl text-base">
              {t("onboard.join.apply")}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={onLogin} className="gradient-primary text-primary-foreground font-bold py-3 px-6 rounded-2xl shadow-button text-base">
              {t("onboard.join.login")}
            </motion.button>
          </div>
        )}

        {step > 0 && step < totalSteps - 1 ? (
          <motion.button whileTap={{ scale: 0.9 }} onClick={next} className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </motion.button>
        ) : step === 0 ? (
          <motion.button whileTap={{ scale: 0.9 }} onClick={next} className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </motion.button>
        ) : <div className="w-12" />}
      </div>
    </div>
  );
};

export default Onboarding;
