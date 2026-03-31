import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface ApplyPageProps {
  onBack: () => void;
}

const ApplyPage = ({ onBack }: ApplyPageProps) => {
  const { t } = useI18n();
  const [form, setForm] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    const required = ["director", "school", "city", "email"];
    const missing = required.some((k) => !form[k]?.trim());
    if (missing) {
      toast.error(t("auth.fillAllFields"));
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("school_applications").insert({
      director_name: form.director.trim(),
      school_name: form.school.trim(),
      city: form.city.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || null,
      comment: form.comment?.trim() || null,
      created_by: user?.id || null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <CheckCircle className="w-20 h-20 text-accent mx-auto" />
        </motion.div>
        <h2 className="text-2xl font-black text-foreground mt-6 text-center">
          {t("lang") === "kz" ? "Өтінім жіберілді!" : "Заявка отправлена!"}
        </h2>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
          className="gradient-primary text-primary-foreground font-bold py-3 px-8 rounded-2xl shadow-button mt-8">
          {t("back")}
        </motion.button>
      </div>
    );
  }

  const Field = ({ label, field, type = "text", multiline = false }: { label: string; field: string; type?: string; multiline?: boolean }) => (
    <div className="mb-3">
      <label className="text-sm font-semibold text-muted-foreground mb-1 block">{label}</label>
      {multiline ? (
        <textarea value={form[field] || ""} onChange={(e) => update(field, e.target.value)}
          className="w-full bg-muted border-2 border-border rounded-xl px-4 py-3 text-foreground font-semibold outline-none focus:border-primary transition-colors resize-none h-24"
          placeholder={label} />
      ) : (
        <input type={type} value={form[field] || ""} onChange={(e) => update(field, e.target.value)}
          className="w-full bg-muted border-2 border-border rounded-xl px-4 py-3 text-foreground font-semibold outline-none focus:border-primary transition-colors"
          placeholder={label} />
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center px-4 pt-12 pb-4">
        <motion.button whileTap={{ scale: 0.9 }} onClick={onBack}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </motion.button>
        <h1 className="flex-1 text-center text-xl font-black text-foreground pr-6">{t("apply.title")}</h1>
      </div>

      <motion.div className="px-6 pb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Field label={t("apply.directorName")} field="director" />
        <Field label={t("apply.schoolName")} field="school" />
        <Field label={t("apply.city")} field="city" />
        <Field label={t("auth.email")} field="email" type="email" />
        <Field label={t("apply.phone")} field="phone" type="tel" />
        <Field label={t("apply.comment")} field="comment" multiline />

        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit}
          className="w-full gradient-primary text-primary-foreground font-bold py-3.5 rounded-2xl shadow-button text-lg mt-4">
          {t("apply.send")}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ApplyPage;
