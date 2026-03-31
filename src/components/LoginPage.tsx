import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { GraduationCap, Users, School, ShieldCheck, ArrowLeft, Eye, EyeOff, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Role = "student" | "parent" | "teacher" | "admin";

interface LoginPageProps {
  onBack: () => void;
  onLoginSuccess: (role: Role, user: any) => void;
}

// MOVED OUTSIDE to prevent re-render focus loss
const InputField = ({ label, type = "text", value, onChange, showPassword, onTogglePassword }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  showPassword?: boolean; onTogglePassword?: () => void;
}) => (
  <div className="mb-3">
    <label className="text-sm font-semibold text-muted-foreground mb-1 block">{label}</label>
    <div className="relative">
      <input
        type={type === "password" && showPassword ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-muted border-2 border-border rounded-xl px-4 py-3 text-foreground font-semibold outline-none focus:border-primary transition-colors"
        placeholder={label}
      />
      {type === "password" && onTogglePassword && (
        <button type="button" onClick={onTogglePassword} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      )}
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) => (
  <div className="mb-3">
    <label className="text-sm font-semibold text-muted-foreground mb-1 block">{label}</label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-muted border-2 border-border rounded-xl px-4 py-3 text-foreground font-semibold outline-none focus:border-primary transition-colors appearance-none">
        <option value="">{label}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
    </div>
  </div>
);

const LoginPage = ({ onBack, onLoginSuccess }: LoginPageProps) => {
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [childId, setChildId] = useState("");
  const [loading, setLoading] = useState(false);

  const [classes, setClasses] = useState<any[]>([]);
  const [schoolInputId, setSchoolInputId] = useState("");
  const [resolvedSchool, setResolvedSchool] = useState<any>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [resolvingSchool, setResolvingSchool] = useState(false);

  useEffect(() => {
    if (selectedSchoolId) loadClasses(selectedSchoolId);
    else { setClasses([]); setSelectedClassId(""); }
  }, [selectedSchoolId]);

  const loadClasses = async (schoolId: string) => {
    const { data, error } = await supabase.rpc("get_classes_for_school", {
      p_school_id: schoolId,
    });

    if (error) {
      setClasses([]);
      toast.error(`Ошибка загрузки классов: ${error.message}`);
      return;
    }

    setClasses(data || []);
  };

  const resolveSchoolById = async () => {
    const id = schoolInputId.trim();
    if (!id) return;

    setResolvingSchool(true);
    const toastId = toast.loading("Ищем школу...");
    try {
      const { data, error } = await supabase
        .from("schools")
        .select("id, name, city")
        .eq("id", id)
        .maybeSingle();

      if (error || !data) {
        setResolvedSchool(null);
        setSelectedSchoolId("");
        setClasses([]);
        setSelectedClassId("");
        toast.dismiss(toastId);
        toast.error(
          error?.message ||
            "Школа с таким ID не найдена. Введите полный UUID (36 символов).",
        );
        return;
      }

      setResolvedSchool(data);
      setSelectedSchoolId(data.id);
      const { data: classRows, error: classErr } = await supabase.rpc("get_classes_for_school", {
        p_school_id: data.id,
      });

      if (classErr) {
        toast.dismiss(toastId);
        toast.error(`Школа найдена, но классы не читаются: ${classErr.message}`);
        return;
      }

      toast.dismiss(toastId);
      if (!classRows || classRows.length === 0) {
        toast.error("Школа найдена, но в БД для нее нет классов");
      } else {
        toast.success(`${data.name} (${data.city}) — классов: ${classRows.length}`);
      }
    } catch (e) {
      console.error("resolveSchoolById error:", e);
      toast.dismiss(toastId);
      toast.error("Не удалось загрузить школу. Проверьте интернет и повторите.");
    } finally {
      setResolvingSchool(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) { toast.error(error.message); setLoading(false); }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { toast.error(error.message); setLoading(false); return; }
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("*, classes(name), schools(name)").eq("id", data.user.id).maybeSingle();
      if (profile) onLoginSuccess(profile.role as Role, { ...profile, email: data.user.email });
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!selectedRole || !email || !password) return;
    if ((selectedRole === "student" || selectedRole === "teacher") && (!selectedSchoolId || !selectedClassId)) {
      toast.error(t("auth.selectClass")); return;
    }
    if ((selectedRole === "student" || selectedRole === "teacher" || selectedRole === "parent") && !selectedSchoolId) {
      toast.error(t("auth.selectSchool")); return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { role: selectedRole, full_name: fullName, username: username || email.split("@")[0] },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) { toast.error(error.message); setLoading(false); return; }

    if (data.user) {
      await supabase.from("profiles").update({
        school_id: selectedSchoolId || null,
        class_id: selectedClassId || null,
        full_name: fullName,
        username: username || email.split("@")[0],
      }).eq("id", data.user.id);

      if (selectedRole === "parent" && childId) {
        const { data: resolvedChildId } = await supabase.rpc("resolve_user_id_by_code", {
          p_code: childId.trim().toLowerCase(),
        });
        if (resolvedChildId) {
          await supabase.from("parent_children").insert({ parent_id: data.user.id, child_id: resolvedChildId });
        }
      }

      const { data: profile } = await supabase.from("profiles").select("*, classes(name), schools(name)").eq("id", data.user.id).maybeSingle();
      if (profile) onLoginSuccess(selectedRole, { ...profile, email: data.user.email, isNewUser: true });
    }
    setLoading(false);
  };

  const handleSubmit = () => { if (isRegister) handleRegister(); else handleLogin(); };

  const resetForm = () => {
    setEmail(""); setPassword(""); setFullName(""); setUsername(""); setChildId("");
    setSelectedSchoolId(""); setSelectedClassId("");
    setSchoolInputId(""); setResolvedSchool(null);
  };

  const roles: { key: Role; icon: typeof GraduationCap; label: string; color: string }[] = [
    { key: "student", icon: GraduationCap, label: t("onboard.roles.student"), color: "gradient-primary" },
    { key: "parent", icon: Users, label: t("onboard.roles.parent"), color: "gradient-secondary" },
    { key: "teacher", icon: School, label: t("onboard.roles.teacher"), color: "gradient-accent" },
    { key: "admin", icon: ShieldCheck, label: t("onboard.roles.admin"), color: "gradient-primary" },
  ];

  const renderForm = () => {
    if (!selectedRole) return null;

    if (!isRegister) {
      return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <InputField label={t("auth.email")} type="email" value={email} onChange={setEmail} />
          <InputField label={t("auth.password")} type="password" value={password} onChange={setPassword}
            showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
          <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={loading}
            className="w-full gradient-primary text-primary-foreground font-bold py-3.5 rounded-2xl shadow-button text-lg mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.login")}
          </motion.button>
          {selectedRole !== "admin" && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleGoogleSignIn} disabled={loading}
              className="w-full bg-card border-2 border-border text-foreground font-bold py-3 rounded-2xl mt-3 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t("auth.google")}
            </motion.button>
          )}
          {selectedRole !== "admin" && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t("auth.noAccount")}{" "}
              <button onClick={() => { setIsRegister(true); resetForm(); }} className="text-primary font-bold">{t("auth.register")}</button>
            </p>
          )}
        </motion.div>
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {(selectedRole === "student" || selectedRole === "teacher" || selectedRole === "parent") && (
          <div className="mb-3">
            <label className="text-sm font-semibold text-muted-foreground mb-1 block">{t("auth.selectSchool")} ID</label>
            <div className="flex gap-2">
              <input
                value={schoolInputId}
                onChange={(e) => {
                  setSchoolInputId(e.target.value);
                  setResolvedSchool(null);
                  setSelectedSchoolId("");
                  setClasses([]);
                  setSelectedClassId("");
                }}
                onKeyDown={(e) => e.key === "Enter" && resolveSchoolById()}
                placeholder="UUID школы"
                className="flex-1 bg-muted border-2 border-border rounded-xl px-4 py-3 text-foreground font-semibold outline-none focus:border-primary transition-colors"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={resolveSchoolById}
                disabled={resolvingSchool}
                className="px-4 rounded-xl bg-card border-2 border-border font-bold text-foreground"
              >
                {resolvingSchool ? <Loader2 className="w-4 h-4 animate-spin" /> : "OK"}
              </motion.button>
            </div>
            {resolvedSchool && (
              <p className="text-xs text-primary font-bold mt-1">{resolvedSchool.name} ({resolvedSchool.city})</p>
            )}
          </div>
        )}
        {classes.length > 0 && selectedRole !== "parent" && (
          <SelectField label={t("auth.selectClass")} value={selectedClassId} onChange={setSelectedClassId}
            options={classes.map((c) => ({ id: c.id, label: c.name }))} />
        )}
        {selectedRole !== "parent" && selectedSchoolId && classes.length === 0 && (
          <p className="text-xs text-destructive font-semibold mb-3">
            Классы не найдены для этой школы. Проверьте SQL и политики доступа.
          </p>
        )}
        {selectedRole === "parent" && (
          <InputField label={t("auth.childId")} value={childId} onChange={setChildId} />
        )}
        <InputField label={t("auth.username")} value={username} onChange={setUsername} />
        <InputField label={t("auth.fullName")} value={fullName} onChange={setFullName} />
        <InputField label={t("auth.email")} type="email" value={email} onChange={setEmail} />
        <InputField label={t("auth.password")} type="password" value={password} onChange={setPassword}
          showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />

        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={loading}
          className="w-full gradient-primary text-primary-foreground font-bold py-3.5 rounded-2xl shadow-button text-lg mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("auth.register")}
        </motion.button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t("auth.hasAccount")}{" "}
          <button onClick={() => { setIsRegister(false); resetForm(); }} className="text-primary font-bold">{t("auth.login")}</button>
        </p>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center px-4 pt-12 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={selectedRole ? () => { setSelectedRole(null); setIsRegister(false); resetForm(); } : onBack}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </motion.button>
        <h1 className="flex-1 text-center text-xl font-black text-foreground pr-6">
          {isRegister ? t("auth.register") : t("auth.login")}
        </h1>
      </div>

      <div className="px-6 pb-10">
        {!selectedRole ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-center text-muted-foreground font-semibold mb-6">{t("auth.selectRole")}</p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => (
                <motion.button key={r.key} whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}
                  onClick={() => { setSelectedRole(r.key); setIsRegister(false); resetForm(); }}
                  className="bg-card rounded-2xl p-5 shadow-card flex flex-col items-center gap-3">
                  <div className={`w-14 h-14 ${r.color} rounded-xl flex items-center justify-center`}>
                    <r.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-foreground">{r.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div>
            <div className="flex justify-center mb-6">
              {roles.filter(r => r.key === selectedRole).map(r => (
                <div key={r.key} className={`${r.color} text-primary-foreground px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2`}>
                  <r.icon className="w-4 h-4" />
                  {r.label}
                </div>
              ))}
            </div>
            {renderForm()}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
