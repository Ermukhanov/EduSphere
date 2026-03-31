import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { Newspaper, Search, Users, School, MoreHorizontal, MessageCircle, Calendar, Sparkles, Trophy, Bell, BookOpen, Shield, ChevronRight } from "lucide-react";
import icon from "@/assets/icon.png";

interface PostRegOnboardingProps {
  user: any;
  onComplete: () => void;
}

const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 },
};

const PostRegOnboarding = ({ user, onComplete }: PostRegOnboardingProps) => {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [howFound, setHowFound] = useState<string | null>(null);
  const [contactsRequested, setContactsRequested] = useState(false);
  const role = user.role || "student";

  const totalSteps = role === "admin" ? 0 : 5; // admin skips onboarding

  if (role === "admin") {
    handleComplete();
    return null;
  }

  const howFoundOptions = [
    { key: "news", icon: Newspaper, label: t("postOnboard.howFound.news") },
    { key: "social", icon: MessageCircle, label: t("postOnboard.howFound.social") },
    { key: "friends", icon: Users, label: t("postOnboard.howFound.friends") },
    { key: "school", icon: School, label: t("postOnboard.howFound.school") },
    { key: "search", icon: Search, label: t("postOnboard.howFound.search") },
    { key: "other", icon: MoreHorizontal, label: t("postOnboard.howFound.other") },
  ];

  const getFeatures = () => {
    if (role === "parent") {
      return [
        { icon: BookOpen, label: t("postOnboard.parent.feat1"), desc: t("postOnboard.parent.feat1.desc"), color: "bg-primary" },
        { icon: MessageCircle, label: t("postOnboard.parent.feat2"), desc: t("postOnboard.parent.feat2.desc"), color: "bg-secondary" },
        { icon: Bell, label: t("postOnboard.parent.feat3"), desc: t("postOnboard.parent.feat3.desc"), color: "bg-accent" },
      ];
    }
    if (role === "teacher") {
      return [
        { icon: Shield, label: t("postOnboard.teacher.feat1"), desc: t("postOnboard.teacher.feat1.desc"), color: "bg-primary" },
        { icon: Sparkles, label: t("postOnboard.teacher.feat2"), desc: t("postOnboard.teacher.feat2.desc"), color: "bg-secondary" },
        { icon: MessageCircle, label: t("postOnboard.teacher.feat3"), desc: t("postOnboard.teacher.feat3.desc"), color: "bg-accent" },
      ];
    }
    // student
    return [
      { icon: Calendar, label: t("postOnboard.student.feat1"), desc: t("postOnboard.student.feat1.desc"), color: "bg-primary" },
      { icon: Sparkles, label: t("postOnboard.student.feat2"), desc: t("postOnboard.student.feat2.desc"), color: "bg-secondary" },
      { icon: Trophy, label: t("postOnboard.student.feat3"), desc: t("postOnboard.student.feat3.desc"), color: "bg-accent" },
    ];
  };

  async function handleComplete() {
    if (user.id) {
      await supabase.from("onboarding").update({
        how_found: howFound,
        completed: true,
        completed_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    }
    onComplete();
  }

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleComplete();
  };

  const requestContacts = async () => {
    // In a real PWA/native app, this would use the Contacts API
    if ("contacts" in navigator && (navigator as any).contacts) {
      try {
        const contacts = await (navigator as any).contacts.select(["name", "tel", "email"], { multiple: true });
        console.log("Contacts:", contacts);
      } catch (e) {
        console.log("Contacts access denied");
      }
    }
    setContactsRequested(true);
  };

  const requestNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log("Notification permission:", permission);
    }
    next();
  };

  const renderStep = () => {
    switch (step) {
      case 0: // How did you find us?
        return (
          <div className="flex flex-col px-6">
            <div className="flex items-center gap-3 mb-8">
              <img src={icon} alt="EduSphere" className="w-16 h-16 rounded-2xl" />
              <div className="bg-card rounded-2xl rounded-bl-sm px-4 py-2 shadow-card">
                <p className="text-foreground font-bold text-sm">{t("postOnboard.howFound.title")}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {howFoundOptions.map((o) => (
                <motion.button key={o.key} whileTap={{ scale: 0.95 }}
                  onClick={() => setHowFound(o.key)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${howFound === o.key ? "border-primary bg-primary/10" : "border-border bg-card"}`}>
                  <o.icon className={`w-5 h-5 flex-shrink-0 ${howFound === o.key ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-bold text-foreground text-left">{o.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 1: // What awaits you
        return (
          <div className="flex flex-col px-6">
            <div className="flex items-center gap-3 mb-8">
              <img src={icon} alt="EduSphere" className="w-16 h-16 rounded-2xl" />
              <div className="bg-card rounded-2xl rounded-bl-sm px-4 py-2 shadow-card">
                <p className="text-foreground font-bold text-sm">{t("postOnboard.whatAwaits.title")}</p>
              </div>
            </div>
            <div className="space-y-4">
              {getFeatures().map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                  className="flex items-start gap-4">
                  <div className={`w-12 h-12 ${f.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <f.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{f.label}</p>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 2: // Find contacts
        return (
          <div className="flex flex-col items-center px-6 text-center">
            <div className="flex items-center gap-3 mb-8 self-start">
              <img src={icon} alt="EduSphere" className="w-16 h-16 rounded-2xl" />
              <div className="bg-card rounded-2xl rounded-bl-sm px-4 py-2 shadow-card">
                <p className="text-foreground font-bold text-sm">{t("postOnboard.contacts.title")}</p>
              </div>
            </div>
            <Users className="w-20 h-20 text-primary mb-4" />
            <p className="text-muted-foreground mb-6">{t("postOnboard.contacts.desc")}</p>
            {!contactsRequested ? (
              <motion.button whileTap={{ scale: 0.95 }} onClick={requestContacts}
                className="gradient-primary text-primary-foreground font-bold py-3 px-8 rounded-2xl shadow-button">
                {t("postOnboard.contacts.allow")}
              </motion.button>
            ) : (
              <p className="text-sm text-muted-foreground">{t("postOnboard.contacts.noContacts")}</p>
            )}
          </div>
        );

      case 3: // Notifications
        return (
          <div className="flex flex-col items-center px-6 text-center">
            <div className="flex items-center gap-3 mb-8 self-start">
              <img src={icon} alt="EduSphere" className="w-16 h-16 rounded-2xl" />
              <div className="bg-card rounded-2xl rounded-bl-sm px-4 py-2 shadow-card">
                <p className="text-foreground font-bold text-sm">{t("postOnboard.notifications.title")}</p>
              </div>
            </div>
            <Bell className="w-20 h-20 text-secondary mb-4" />
            <p className="text-muted-foreground mb-6">{t("postOnboard.notifications.desc")}</p>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => next()}
                className="bg-muted text-foreground font-bold py-3 px-6 rounded-2xl">
                {t("postOnboard.notifications.skip")}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={requestNotifications}
                className="gradient-primary text-primary-foreground font-bold py-3 px-6 rounded-2xl shadow-button">
                {t("postOnboard.notifications.allow")}
              </motion.button>
            </div>
          </div>
        );

      case 4: // Ready!
        return (
          <div className="flex flex-col items-center px-6 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <img src={icon} alt="EduSphere" className="w-24 h-24 rounded-2xl mb-6" />
            </motion.div>
            <h2 className="text-3xl font-black text-foreground mb-2">{t("postOnboard.ready")}</h2>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleComplete()}
              className="gradient-primary text-primary-foreground font-bold py-4 px-12 rounded-2xl shadow-button text-xl mt-8">
              {t("postOnboard.start")}
            </motion.button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-12 pb-4">
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }} className="w-full">
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Next button (for steps 0-1) */}
      {step <= 1 && (
        <div className="px-6 pb-10 flex justify-end">
          <motion.button whileTap={{ scale: 0.95 }} onClick={next}
            disabled={step === 0 && !howFound}
            className="gradient-primary text-primary-foreground font-bold py-3 px-8 rounded-2xl shadow-button text-lg disabled:opacity-40 flex items-center gap-2">
            {t("next")} <ChevronRight className="w-5 h-5" />
          </motion.button>
        </div>
      )}
      {step === 2 && (
        <div className="px-6 pb-10 flex justify-end">
          <motion.button whileTap={{ scale: 0.95 }} onClick={next}
            className="text-muted-foreground font-bold py-3 px-6">
            {t("skip")} <ChevronRight className="w-4 h-4 inline" />
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default PostRegOnboarding;
