import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { Send, Search, Plus, ArrowLeft } from "lucide-react";

interface ChatPageProps {
  user: any;
}

interface Conversation {
  id: string;
  type: string;
  name: string | null;
  last_message?: string;
  other_user?: any;
}

const ChatPage = ({ user }: ChatPageProps) => {
  const { lang } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedConvo) return;

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${selectedConvo.id}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${selectedConvo.id}`,
      }, async (payload) => {
        const newMsg = payload.new as any;
        // Fetch sender info
        const { data: sender } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", newMsg.sender_id)
          .single();
        setMessages((prev) => [...prev, { ...newMsg, sender }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo?.id]);

  const loadConversations = async () => {
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (!memberships?.length) return;

    const convoIds = memberships.map((m: any) => m.conversation_id);
    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convoIds)
      .order("created_at", { ascending: false });

    if (!convos) return;

    // For direct chats, get other user info
    const enriched = await Promise.all(
      convos.map(async (c: any) => {
        if (c.type === "direct") {
          const { data: members } = await supabase
            .from("conversation_members")
            .select("user_id")
            .eq("conversation_id", c.id)
            .neq("user_id", user.id);
          if (members?.[0]) {
            const { data: otherUser } = await supabase
              .from("profiles")
              .select("id, username, full_name, avatar_url")
              .eq("id", members[0].user_id)
              .single();
            return { ...c, other_user: otherUser, name: otherUser?.full_name || otherUser?.username };
          }
        }
        return c;
      })
    );

    setConversations(enriched);
  };

  const loadMessages = async (convo: Conversation) => {
    setSelectedConvo(convo);
    const { data } = await supabase
      .from("messages")
      .select("*, sender:profiles!sender_id(username, avatar_url)")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const sendMsg = async () => {
    if (!input.trim() || !selectedConvo) return;
    await supabase.from("messages").insert({
      conversation_id: selectedConvo.id,
      sender_id: user.id,
      content: input.trim(),
    });
    setInput("");
  };

  const searchUsers = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.rpc("search_profiles", {
      p_query: q.trim().toLowerCase(),
    });
    if (data) setSearchResults(data.filter((u: any) => u.id !== user.id));
  };

  const startDirectChat = async (otherId: string) => {
    // Check if direct chat already exists
    const { data: myConvos } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", user.id);

    if (myConvos) {
      for (const mc of myConvos) {
        const { data: otherMember } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", mc.conversation_id)
          .eq("user_id", otherId)
          .single();
        if (otherMember) {
          const { data: convo } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", mc.conversation_id)
            .eq("type", "direct")
            .single();
          if (convo) {
            await loadMessages(convo);
            setSearch("");
            setSearchResults([]);
            return;
          }
        }
      }
    }

    // Create new conversation
    const { data: newConvo } = await supabase
      .from("conversations")
      .insert({ type: "direct" })
      .select()
      .single();

    if (newConvo) {
      await supabase.from("conversation_members").insert([
        { conversation_id: newConvo.id, user_id: user.id },
        { conversation_id: newConvo.id, user_id: otherId },
      ]);
      await loadConversations();
      await loadMessages(newConvo);
    }
    setSearch("");
    setSearchResults([]);
  };

  if (selectedConvo) {
    const convoName = selectedConvo.name || selectedConvo.other_user?.username || (lang === "kz" ? "Чат" : "Чат");
    return (
      <div className="flex flex-col h-screen">
        <div className="bg-card border-b border-border px-4 pt-12 pb-3 flex items-center gap-3">
          <button onClick={() => { setSelectedConvo(null); loadConversations(); }}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${selectedConvo.other_user?.username || 'group'}`}
            alt="" className="w-8 h-8 rounded-full bg-muted" />
          <h2 className="font-black text-foreground">{convoName}</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {messages.map((msg: any) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  isMe ? "gradient-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  {!isMe && <p className="text-[10px] font-bold text-primary mb-0.5">{msg.sender?.username}</p>}
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-0.5 text-right ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 pb-24 pt-2 bg-background border-t border-border">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMsg()}
              placeholder={lang === "kz" ? "Хабарлама..." : "Сообщение..."}
              className="flex-1 bg-muted rounded-xl px-4 py-3 text-foreground font-semibold outline-none" />
            <motion.button whileTap={{ scale: 0.9 }} onClick={sendMsg}
              className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center shadow-button">
              <Send className="w-5 h-5 text-primary-foreground" />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-foreground">
          {lang === "kz" ? "💬 Чат" : "💬 Чат"}
        </h1>
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => searchUsers(e.target.value)}
          placeholder={lang === "kz" ? "Пайдаланушы іздеу..." : "Поиск пользователя..."}
          className="w-full bg-muted rounded-xl pl-10 pr-4 py-2.5 text-foreground text-sm font-semibold outline-none"
        />
      </div>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="mb-4 space-y-1">
          <p className="text-xs font-bold text-muted-foreground mb-2">
            {lang === "kz" ? "Нәтижелер" : "Результаты"}
          </p>
          {searchResults.map((u) => (
            <motion.button key={u.id} whileTap={{ scale: 0.98 }} onClick={() => startDirectChat(u.id)}
              className="w-full bg-card rounded-xl p-3 shadow-card flex items-center gap-3 text-left">
              <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${u.username}`} alt="" className="w-10 h-10 rounded-full bg-muted" />
              <div>
                <p className="font-bold text-foreground text-sm">@{u.username}</p>
                <p className="text-xs text-muted-foreground">{u.full_name}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Conversation list */}
      <div className="space-y-2">
        {conversations.length === 0 && !search && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-sm">
              {lang === "kz" ? "Чаттар жоқ. Пайдаланушы іздеңіз!" : "Нет чатов. Найдите пользователя!"}
            </p>
          </div>
        )}
        {conversations.map((c) => (
          <motion.button key={c.id} whileTap={{ scale: 0.98 }} onClick={() => loadMessages(c)}
            className="w-full bg-card rounded-xl p-3 shadow-card flex items-center gap-3 text-left">
            <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${c.other_user?.username || 'group'}`}
              alt="" className="w-12 h-12 rounded-full bg-muted" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm">{c.name || c.other_user?.username || "Чат"}</p>
              <p className="text-xs text-muted-foreground truncate">{c.other_user?.full_name || ""}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ChatPage;
