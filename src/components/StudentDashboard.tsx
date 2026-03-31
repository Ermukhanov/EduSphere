import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { Home, Sparkles, MessageCircle, Newspaper, User } from "lucide-react";
import HomePage from "./student/HomePage";
import ProfilePage from "./student/ProfilePage";
import AIPage from "./student/AIPage";
import FeedPage from "./student/FeedPage";
import ChatPage from "./student/ChatPage";

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
}

type Tab = "home" | "feed" | "ai" | "chat" | "profile";

const StudentDashboard = ({ user, onLogout }: StudentDashboardProps) => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    return (localStorage.getItem("edusphere-student-tab") as Tab) || "home";
  });

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    localStorage.setItem("edusphere-student-tab", tab);
  };

  const tabs: { key: Tab; icon: typeof Home; label: string }[] = [
    { key: "home", icon: Home, label: t("nav.home") },
    { key: "feed", icon: Newspaper, label: t("home.feed") },
    { key: "ai", icon: Sparkles, label: "AI" },
    { key: "chat", icon: MessageCircle, label: t("nav.chat") },
    { key: "profile", icon: User, label: t("nav.profile") },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case "home": return <HomePage user={user} />;
      case "feed": return <FeedPage user={user} />;
      case "ai": return <AIPage user={user} />;
      case "chat": return <ChatPage user={user} />;
      case "profile": return <ProfilePage user={user} onLogout={onLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {renderTab()}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
        <div className="flex justify-around items-center py-2 max-w-lg mx-auto">
          {tabs.map((tab) => (
            <motion.button key={tab.key} whileTap={{ scale: 0.85 }} onClick={() => changeTab(tab.key)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${activeTab === tab.key ? "text-primary" : "text-muted-foreground"}`}>
              <tab.icon className={`w-5 h-5 ${activeTab === tab.key ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-bold">{tab.label}</span>
              {activeTab === tab.key && <motion.div layoutId="tab-indicator" className="w-1 h-1 rounded-full bg-primary" />}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
