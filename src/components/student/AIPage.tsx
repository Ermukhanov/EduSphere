import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase, callAlemAI } from "@/lib/supabase";
import { EDU_SPHERE_AI_SYSTEM_PROMPT } from "@/lib/ai-system-prompt";
import { Send, Sparkles, Plus, MessageSquare, Trash2, Menu } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIPageProps {
  user: any;
}

interface AIConvo {
  id: string;
  title: string;
  created_at: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIPage = ({ user }: AIPageProps) => {
  const { lang } = useI18n();
  const [conversations, setConversations] = useState<AIConvo[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [aiContext, setAiContext] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
    loadAIContext();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    const { data } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setConversations(data);
  };

  const loadAIContext = async () => {
    const { data, error } = await supabase.rpc("get_ai_context");
    if (!error && data) {
      setAiContext(data);
    } else {
      setAiContext(null);
    }
  };

  const buildFallbackContext = async () => {
    const role = user.role || "student";

    let studentId: string | null = null;
    if (role === "parent") {
      const { data: link } = await supabase
        .from("parent_children")
        .select("child_id")
        .eq("parent_id", user.id)
        .maybeSingle();
      studentId = link?.child_id || null;
    } else if (role === "student") {
      studentId = user.id;
    }

    const base: any = { role, student_id: studentId, student_name: null, grades: [], lessons: [], attendance: [] };

    if (role === "student" || role === "parent") {
      if (!studentId) return base;
      const { data: studentProfile } = await supabase.from("profiles").select("username, class_id").eq("id", studentId).maybeSingle();
      base.student_name = studentProfile?.username || null;

      const { data: grades } = await supabase
        .from("grades")
        .select("grade, type, date, subjects(name)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(20);
      base.grades = (grades || []).map((g: any) => ({ grade: g.grade, type: g.type, date: g.date, subject: g.subjects?.name || null }));

      const { data: lessons } = await supabase
        .from("lessons")
        .select("day_of_week, start_time, end_time, room, status, subjects(name)")
        .eq("class_id", studentProfile?.class_id)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(30);
      base.lessons = (lessons || []).map((l: any) => ({ day_of_week: l.day_of_week, start_time: l.start_time, end_time: l.end_time, room: l.room, status: l.status, subject: l.subjects?.name || null }));
    }

    return base;
  };

  const summarizeContext = (ctx: any) => {
    const grades = Array.isArray(ctx?.grades) ? ctx.grades : [];
    const lessons = Array.isArray(ctx?.lessons) ? ctx.lessons : [];

    const gradesText = grades.length
      ? grades
          .slice(0, 15)
          .map((g: any) => `${g.subject || "—"}: ${g.grade}${g.type ? ` (${g.type})` : ""}${g.date ? ` [${g.date}]` : ""}`)
          .join("; ")
      : "нет данных";

    const lessonsText = lessons.length
      ? lessons
          .slice(0, 15)
          .map((l: any) => `день ${l.day_of_week}: ${String(l.start_time || "").slice(0, 5)}-${String(l.end_time || "").slice(0, 5)} ${l.subject || "—"}${l.room ? ` (каб. ${l.room})` : ""}${l.status === "changed" ? " (замена)" : ""}`)
          .join("; ")
      : "нет данных";

    return { gradesText, lessonsText };
  };

  const loadMessages = async (convoId: string) => {
    setActiveConvoId(convoId);
    setShowSidebar(false);
    const { data } = await supabase
      .from("ai_messages")
      .select("*")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    if (data) setMessages(data.map((m: any) => ({ role: m.role, content: m.content })));
  };

  const createNewConvo = async () => {
    const title = lang === "kz" ? "Жаңа чат" : "Новый чат";
    const { data } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title })
      .select()
      .single();
    if (data) {
      setConversations((prev) => [data, ...prev]);
      setActiveConvoId(data.id);
      setMessages([]);
      setShowSidebar(false);
    }
  };

  const deleteConvo = async (id: string) => {
    await supabase.from("ai_conversations").delete().eq("id", id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvoId === id) {
      setActiveConvoId(null);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    let convoId = activeConvoId;
    if (!convoId) {
      const title = input.trim().slice(0, 50);
      const { data } = await supabase
        .from("ai_conversations")
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (data) {
        convoId = data.id;
        setActiveConvoId(data.id);
        setConversations((prev) => [data, ...prev]);
      } else return;
    }

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Save user message
    await supabase.from("ai_messages").insert({
      conversation_id: convoId,
      role: "user",
      content: userMsg.content,
    });

    let contextForPrompt: any = {};
    const { data: freshContext, error: ctxErr } = await supabase.rpc("get_ai_context");
    if (!ctxErr && freshContext) contextForPrompt = freshContext;
    else contextForPrompt = aiContext || (await buildFallbackContext());
    const roleForPrompt = contextForPrompt.role || user.role || "student";
    const studentName = contextForPrompt.student_name || user.username || "ученик";
    const contextPayload = JSON.stringify(contextForPrompt);
    const { gradesText, lessonsText } = summarizeContext(contextForPrompt);
    const languageInstruction = lang === "kz"
      ? "Пайдаланушының тіліне бейімдел. Егер хабар қазақша болса, қазақша жауап бер."
      : "Отвечай на языке пользователя. Если сообщение на русском, отвечай на русском.";

    const roleAddressing =
      roleForPrompt === "teacher"
        ? "Обращайся как к учителю: можно использовать 'Вы' и тон наставника. Упоминай 'ваш класс/ваши ученики', если уместно."
        : roleForPrompt === "parent"
          ? "Обращайся как к родителю: спокойно, поддерживающе, с фокусом на действия дома и коммуникацию со школой."
          : roleForPrompt === "admin"
            ? "Обращайся как к администратору школы: кратко, по делу, с фокусом на процессы и показатели."
            : "Обращайся как к ученику: дружелюбно, мотивирующе, с конкретными шагами.";

    const systemPrompt = `${EDU_SPHERE_AI_SYSTEM_PROMPT}

Контекст текущего пользователя:
- role: ${roleForPrompt}
- student_name: ${studentName}
- user_name: ${user.username}

Коротко о данных (только из БД):
- Оценки: ${gradesText}
- Расписание: ${lessonsText}

Данные из БД (JSON, реальные данные):
${contextPayload}

Правило: ссылайся только на факты из JSON выше. Если данных мало, прямо скажи об этом.
${roleAddressing}
${languageInstruction}`;

    const allMsgs = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMsg.content },
    ];

    const aiResponse = await callAlemAI(allMsgs);
    const aiMsg: Message = { role: "assistant", content: aiResponse };
    setMessages((prev) => [...prev, aiMsg]);

    await supabase.from("ai_messages").insert({
      conversation_id: convoId,
      role: "assistant",
      content: aiResponse,
    });

    setLoading(false);
  };

  const Sidebar = ({ className = "" }: { className?: string }) => (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="px-4 pt-12 pb-4 flex items-center justify-between border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div className="leading-tight">
            <h2 className="font-black text-foreground">Sphere AI</h2>
            <p className="text-[10px] font-bold text-muted-foreground">SphereAI v-1.1</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={createNewConvo}
          className="w-9 h-9 gradient-primary rounded-full flex items-center justify-center">
          <Plus className="w-4 h-4 text-primary-foreground" />
        </motion.button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-background">
        {conversations.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-muted-foreground font-semibold">
              {lang === "kz" ? "Жаңа чат бастаңыз" : "Начните новый чат"}
            </p>
          </div>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => loadMessages(c.id)}
            className={`w-full text-left rounded-xl p-3 border transition-colors ${
              activeConvoId === c.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{c.title}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConvo(c.id);
                }}
                className="text-muted-foreground hover:text-destructive"
                title="Удалить"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-background">
      <div className="hidden md:block w-[320px] border-r border-border">
        <Sidebar />
      </div>

      {showSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/40" onClick={() => setShowSidebar(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[360px] bg-background border-r border-border">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-4 pt-12 pb-3 flex items-center gap-3 border-b border-border bg-card">
          <button onClick={() => setShowSidebar(true)} className="md:hidden text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <Sparkles className="w-5 h-5 text-primary" />
          <div className="leading-tight">
            <h1 className="text-lg font-black text-foreground">Sphere AI</h1>
            <p className="text-[10px] font-bold text-muted-foreground">SphereAI v-1.1</p>
          </div>
          <div className="ml-auto">
            {!activeConvoId && (
              <motion.button whileTap={{ scale: 0.95 }} onClick={createNewConvo}
                className="gradient-primary text-primary-foreground font-bold px-4 py-2 rounded-xl text-sm">
                {lang === "kz" ? "Жаңа чат" : "Новый чат"}
              </motion.button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {(!activeConvoId || messages.length === 0) && (
            <div className="text-center py-10">
              <Sparkles className="w-12 h-12 text-primary/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {lang === "kz" ? "Сұрақ қойыңыз..." : "Задайте вопрос..."}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 pb-24 pt-3 bg-background border-t border-border">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={lang === "kz" ? "Сұрақ жазыңыз..." : "Напишите вопрос..."}
              className="flex-1 bg-muted rounded-xl px-4 py-3 text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary min-h-[48px] max-h-40 resize-none"
            />
            <motion.button whileTap={{ scale: 0.9 }} onClick={sendMessage} disabled={loading || !input.trim()}
              className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-button disabled:opacity-50">
              <Send className="w-5 h-5 text-primary-foreground" />
            </motion.button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Enter — отправить, Shift+Enter — новая строка
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIPage;
