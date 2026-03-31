import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { I18nProvider } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import SplashScreen from "@/components/SplashScreen";
import Onboarding from "@/components/Onboarding";
import LoginPage from "@/components/LoginPage";
import ApplyPage from "@/components/ApplyPage";
import PostRegOnboarding from "@/components/PostRegOnboarding";
import StudentDashboard from "@/components/StudentDashboard";
import ParentDashboard from "@/components/ParentDashboard";
import TeacherDashboard from "@/components/TeacherDashboard";
import AdminDashboard from "@/components/AdminDashboard";
import { toast } from "sonner";

type Screen = "splash" | "onboarding" | "login" | "apply" | "postOnboarding" | "dashboard";

const Index = () => {
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = sessionStorage.getItem("edusphere-screen");
    return (saved as Screen) || "splash";
  });
  const [user, setUser] = useState<any>(() => {
    const saved = sessionStorage.getItem("edusphere-user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Persist session state
  useEffect(() => {
    if (user) sessionStorage.setItem("edusphere-user", JSON.stringify(user));
    else sessionStorage.removeItem("edusphere-user");
  }, [user]);

  useEffect(() => {
    sessionStorage.setItem("edusphere-screen", screen);
  }, [screen]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, classes(name), schools(name)")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          const userData = { ...profile, email: session.user.email };
          setUser(userData);

          // Update streak
          await supabase.from("profiles").update({ last_active_date: new Date().toISOString().split("T")[0] }).eq("id", session.user.id);

          const { data: onboarding } = await supabase
            .from("onboarding")
            .select("completed")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (onboarding && !onboarding.completed) {
            setScreen("postOnboarding");
          } else {
            setScreen("dashboard");
          }
        }
      } else {
        setUser(null);
        if (screen === "dashboard") setScreen("splash");
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*, classes(name), schools(name)")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          const userData = { ...profile, email: session.user.email };
          setUser(userData);
          await supabase.from("profiles").update({ last_active_date: new Date().toISOString().split("T")[0] }).eq("id", session.user.id);
          
          const { data: onboarding } = await supabase
            .from("onboarding")
            .select("completed")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (onboarding && !onboarding.completed) {
            setScreen("postOnboarding");
          } else {
            setScreen("dashboard");
          }
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          toast(notification.title || "Уведомление", {
            description: notification.body || "",
          });

          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(notification.title || "Уведомление", {
              body: notification.body || "",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleSplashComplete = useCallback(() => {
    if (!user) setScreen("onboarding");
  }, [user]);

  const handleLogin = useCallback(() => setScreen("login"), []);
  const handleApply = useCallback(() => setScreen("apply"), []);
  const handleBack = useCallback(() => setScreen("onboarding"), []);

  const handleLoginSuccess = useCallback((_role: string, userData: any) => {
    setUser(userData);
    if (userData.isNewUser) {
      setScreen("postOnboarding");
    } else {
      setScreen("dashboard");
    }
  }, []);

  const handlePostOnboardingComplete = useCallback(() => {
    setScreen("dashboard");
  }, []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.clear();
    setScreen("onboarding");
  }, []);

  const renderDashboard = () => {
    if (!user) return null;
    const role = user.role || "student";
    switch (role) {
      case "parent": return <ParentDashboard user={user} onLogout={handleLogout} />;
      case "teacher": return <TeacherDashboard user={user} onLogout={handleLogout} />;
      case "admin": return <AdminDashboard user={user} onLogout={handleLogout} />;
      default: return <StudentDashboard user={user} onLogout={handleLogout} />;
    }
  };

  return (
    <I18nProvider>
      <div
        className={`min-h-screen bg-background relative overflow-hidden ${
          screen === "dashboard" ? "w-full" : "max-w-lg mx-auto"
        }`}
      >
        <AnimatePresence mode="wait">
          {screen === "splash" && <SplashScreen key="splash" onComplete={handleSplashComplete} />}
        </AnimatePresence>
        {screen === "onboarding" && <Onboarding onComplete={() => {}} onLogin={handleLogin} onApply={handleApply} />}
        {screen === "login" && <LoginPage onBack={handleBack} onLoginSuccess={handleLoginSuccess} />}
        {screen === "apply" && <ApplyPage onBack={handleBack} />}
        {screen === "postOnboarding" && user && <PostRegOnboarding user={user} onComplete={handlePostOnboardingComplete} />}
        {screen === "dashboard" && renderDashboard()}
      </div>
    </I18nProvider>
  );
};

export default Index;
