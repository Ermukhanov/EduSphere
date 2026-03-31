import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { Edit, Share2, Award, Heart, Flame, LogOut, Camera, Star, Search, UserPlus, Copy, Check, Users, X, Settings, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface ProfilePageProps {
  user: any;
  onLogout: () => void;
}

const ProfilePage = ({ user, onLogout }: ProfilePageProps) => {
  const { t, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`;

  const [profile, setProfile] = useState(user);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.full_name || "");
  const [editBio, setEditBio] = useState(user.bio || "");
  const [editUsername, setEditUsername] = useState(user.username || "");

  // Friend search
  const [searchId, setSearchId] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [copied, setCopied] = useState(false);

  // View other profile
  const [viewingProfile, setViewingProfile] = useState<any>(null);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const { data: profileData } = await supabase
      .from("profiles").select("*, classes(name), schools(name)")
      .eq("id", user.id).maybeSingle();
    if (profileData) setProfile(profileData);

    const { data: userAch } = await supabase
      .from("user_achievements").select("*, achievements(*)")
      .eq("user_id", user.id);
    if (userAch) setAchievements(userAch);
  };

  const saveProfile = async () => {
    await supabase.from("profiles").update({
      full_name: editName,
      bio: editBio,
      username: editUsername,
    }).eq("id", user.id);
    setProfile({ ...profile, full_name: editName, bio: editBio, username: editUsername });
    setEditing(false);
    toast.success(lang === "kz" ? "Сақталды!" : "Сохранено!");
  };

  const copyId = () => {
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    toast.success(lang === "kz" ? "ID көшірілді!" : "ID скопирован!");
    setTimeout(() => setCopied(false), 2000);
  };

  const searchUser = async () => {
    if (!searchId.trim()) return;
    const { data: matches } = await supabase.rpc("search_profiles", {
      p_query: searchId.trim().toLowerCase(),
    });
    const firstMatch = (matches || []).find((u: any) => u.id !== user.id);
    if (firstMatch) {
      const { data } = await supabase
        .from("profiles").select("*, classes(name), schools(name)")
        .eq("id", firstMatch.id)
        .maybeSingle();
      if (!data) return;
      setFoundUser(data);
      // Check if following
      const { data: follow } = await supabase.from("followers")
        .select("id").eq("follower_id", user.id).eq("following_id", data.id).maybeSingle();
      setIsFollowing(!!follow);
    } else {
      setFoundUser(null);
      toast.error(lang === "kz" ? "Пайдаланушы табылмады" : "Пользователь не найден");
    }
  };

  const toggleFollow = async (targetId: string) => {
    if (isFollowing) {
      await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setIsFollowing(false);
    } else {
      await supabase.from("followers").insert({ follower_id: user.id, following_id: targetId });
      setIsFollowing(true);
    }
  };

  const shareProfile = () => {
    const url = `${window.location.origin}?user=${user.id}`;
    if (navigator.share) {
      navigator.share({ title: `@${profile.username} - EduSphere`, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success(lang === "kz" ? "Сілтеме көшірілді!" : "Ссылка скопирована!");
    }
  };

  const confirmLogout = () => {
    const ok = window.confirm(lang === "kz" ? "Шығуға сенімдісіз бе?" : "Вы точно хотите выйти?");
    if (ok) onLogout();
  };

  // View another user's profile
  if (viewingProfile) {
    return (
      <div className="px-4 pt-12">
        <button onClick={() => setViewingProfile(null)} className="flex items-center gap-2 text-primary font-bold mb-4">
          <X className="w-4 h-4" /> {lang === "kz" ? "Артқа" : "Назад"}
        </button>
        <div className="flex flex-col items-center mb-6">
          <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${viewingProfile.username}`}
            alt="" className="w-24 h-24 rounded-full bg-muted border-4 border-primary" />
          <h2 className="text-xl font-black text-foreground mt-3">@{viewingProfile.username}</h2>
          <p className="text-sm font-semibold text-muted-foreground">{viewingProfile.full_name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {viewingProfile.classes?.name} • {t("home.level")} {viewingProfile.level || 1}
          </p>
          <p className="text-[10px] text-muted-foreground">ID: {viewingProfile.id?.slice(0, 8)}</p>
        </div>
        <div className="flex gap-3 mb-4">
          <div className="flex-1 bg-card rounded-xl p-3 shadow-card text-center">
            <Star className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-lg font-black">{viewingProfile.xp || 0}</p><p className="text-[10px] font-bold text-muted-foreground">XP</p>
          </div>
          <div className="flex-1 bg-card rounded-xl p-3 shadow-card text-center">
            <Users className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-lg font-black">{viewingProfile.followers_count || 0}</p><p className="text-[10px] font-bold text-muted-foreground">{t("profile.followers")}</p>
          </div>
          <div className="flex-1 bg-card rounded-xl p-3 shadow-card text-center">
            <Heart className="w-5 h-5 text-primary mx-auto mb-1" /><p className="text-lg font-black">{viewingProfile.likes_count || 0}</p><p className="text-[10px] font-bold text-muted-foreground">{t("profile.likes")}</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => toggleFollow(viewingProfile.id)}
          className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 ${isFollowing ? "bg-muted text-foreground" : "gradient-primary text-primary-foreground"}`}>
          <UserPlus className="w-4 h-4" />
          {isFollowing ? (lang === "kz" ? "Жазылдыңыз" : "Вы подписаны") : (lang === "kz" ? "Жазылу" : "Подписаться")}
        </motion.button>
      </div>
    );
  }

  const stats = [
    { icon: Star, value: profile.xp || 0, label: "XP" },
    { icon: Flame, value: profile.streak || 0, label: lang === "kz" ? "Серия" : "Стрик" },
    { icon: Users, value: profile.followers_count || 0, label: t("profile.followers") },
    { icon: Heart, value: profile.likes_count || 0, label: t("profile.likes") },
    { icon: Award, value: achievements.length, label: t("profile.achievements") },
  ];

  return (
    <div className="px-4 pt-12 pb-4">
      {/* Profile header */}
      <div className="flex flex-col items-center mb-4">
        <div className="relative">
          <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full bg-muted border-4 border-primary" />
          <div className="absolute bottom-0 right-0 w-8 h-8 gradient-primary rounded-full flex items-center justify-center border-2 border-card">
            <Camera className="w-4 h-4 text-primary-foreground" />
          </div>
        </div>
        <h2 className="text-xl font-black text-foreground mt-3">@{profile.username}</h2>
        <p className="text-sm font-semibold text-muted-foreground">{profile.full_name}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {profile.classes?.name || ""} • {profile.schools?.name || ""} • {t("home.level")} {profile.level || 1}
        </p>
        {/* ID Copy */}
        <button onClick={copyId} className="flex items-center gap-1 mt-1 bg-muted px-3 py-1 rounded-full">
          <span className="text-[10px] font-bold text-muted-foreground">ID: {user.id?.slice(0, 8)}...</span>
          {copied ? <Check className="w-3 h-3 text-accent" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {stats.map((s, i) => (
          <div key={i} className="min-w-[60px] flex-1 bg-card rounded-xl p-2 shadow-card text-center">
            <s.icon className="w-4 h-4 text-primary mx-auto mb-0.5" />
            <p className="text-base font-black text-foreground">{s.value}</p>
            <p className="text-[8px] font-bold text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditing(true)}
          className="flex-1 gradient-primary text-primary-foreground font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
          <Edit className="w-4 h-4" /> {t("profile.edit")}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={shareProfile}
          className="flex-1 bg-muted text-foreground font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
          <Share2 className="w-4 h-4" /> {t("profile.share")}
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSearch(!showSearch)}
          className="w-12 bg-card border-2 border-border rounded-xl flex items-center justify-center">
          <Search className="w-4 h-4 text-foreground" />
        </motion.button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowSettings(!showSettings)}
          className="w-12 bg-card border-2 border-border rounded-xl flex items-center justify-center">
          <Settings className="w-4 h-4 text-foreground" />
        </motion.button>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
          <h3 className="font-black text-foreground mb-3">{lang === "kz" ? "Баптаулар" : "Настройки"}</h3>

          <div className="mb-4">
            <p className="text-sm font-bold text-foreground mb-2">{t("onboard.lang.title")}</p>
            <div className="flex gap-2">
              {(["kz", "ru"] as const).map((l) => (
                <button key={l} onClick={() => setLang(l)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${lang === l ? "gradient-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {l === "kz" ? "Қазақша" : "Русский"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-foreground mb-2">{lang === "kz" ? "Интерфейс" : "Интерфейс"}</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm border-2 ${
                  (theme || "light") === "light" ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-foreground"
                }`}
              >
                <Sun className="w-4 h-4" /> {lang === "kz" ? "Жарық" : "Яркий"}
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 py-2 rounded-xl font-bold text-sm border-2 ${
                  theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-foreground"
                }`}
              >
                <Moon className="w-4 h-4" /> {lang === "kz" ? "Қараңғы" : "Тёмный"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit modal */}
      {editing && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
          <h3 className="font-black text-foreground mb-3">{t("profile.edit")}</h3>
          <div className="space-y-2">
            <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-foreground font-semibold outline-none text-sm"
              placeholder={t("auth.username")} />
            <input value={editName} onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-foreground font-semibold outline-none text-sm"
              placeholder={t("auth.fullName")} />
            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-foreground font-semibold outline-none text-sm h-20 resize-none"
              placeholder={t("profile.about")} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={() => setEditing(false)} className="flex-1 bg-muted text-foreground font-bold py-2 rounded-xl text-sm">{t("cancel")}</button>
            <button onClick={saveProfile} className="flex-1 gradient-primary text-primary-foreground font-bold py-2 rounded-xl text-sm">{t("save")}</button>
          </div>
        </div>
      )}

      {/* Friend search */}
      {showSearch && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-4">
          <h3 className="font-black text-foreground mb-2">{t("profile.addFriend")}</h3>
          <div className="flex gap-2 mb-3">
            <input value={searchId} onChange={(e) => setSearchId(e.target.value)}
              placeholder={lang === "kz" ? "ID немесе username..." : "ID или username..."}
              className="flex-1 bg-muted rounded-xl px-4 py-2.5 text-foreground font-semibold outline-none text-sm"
              onKeyDown={(e) => e.key === "Enter" && searchUser()} />
            <motion.button whileTap={{ scale: 0.9 }} onClick={searchUser}
              className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Search className="w-4 h-4 text-primary-foreground" />
            </motion.button>
          </div>
          {foundUser && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-muted rounded-xl p-3">
              <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${foundUser.username}`}
                alt="" className="w-10 h-10 rounded-full bg-card" />
              <div className="flex-1">
                <p className="font-bold text-foreground text-sm">@{foundUser.username}</p>
                <p className="text-xs text-muted-foreground">{foundUser.classes?.name} • Lvl {foundUser.level || 1}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setViewingProfile(foundUser)} className="text-xs font-bold text-primary">
                  {lang === "kz" ? "Профиль" : "Профиль"}
                </button>
                <button onClick={() => toggleFollow(foundUser.id)}
                  className={`text-xs font-bold px-2 py-1 rounded-lg ${isFollowing ? "bg-muted text-foreground" : "gradient-primary text-primary-foreground"}`}>
                  {isFollowing ? "✓" : "+"}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Achievements */}
      <h3 className="text-base font-black text-foreground mb-2">{t("home.achievements")}</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {achievements.length > 0 ? achievements.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
            className="min-w-[70px] bg-card rounded-xl p-2 shadow-card text-center border-2 border-primary/20">
            <span className="text-xl">{a.achievements?.icon}</span>
            <p className="text-[8px] font-bold text-foreground mt-0.5">{lang === "kz" ? a.achievements?.title_kz || a.achievements?.title : a.achievements?.title}</p>
          </motion.div>
        )) : (
          <p className="text-sm text-muted-foreground">{lang === "kz" ? "Жетістіктер әлі жоқ" : "Достижений пока нет"}</p>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="bg-card rounded-xl p-4 shadow-card mb-4">
          <p className="text-sm font-bold text-foreground mb-1">{t("profile.about")}</p>
          <p className="text-sm text-muted-foreground">{profile.bio}</p>
        </div>
      )}

      <motion.button whileTap={{ scale: 0.95 }} onClick={confirmLogout}
        className="w-full bg-destructive/10 text-destructive font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-10">
        <LogOut className="w-4 h-4" /> {t("profile.logout")}
      </motion.button>
    </div>
  );
};

export default ProfilePage;
