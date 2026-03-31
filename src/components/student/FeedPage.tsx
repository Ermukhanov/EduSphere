import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { Heart, MessageCircle, Send, Image, X } from "lucide-react";
import { toast } from "sonner";

interface FeedPageProps {
  user: any;
}

const MOCK_POSTS = [
  {
    id: "mock-1", content: "🏆 Математика олимпиадасының жеңімпаздарын құттықтаймыз! 1 орын — Арман, 2 орын — Айгерім!",
    image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600", likes_count: 24, comments_count: 5,
    author: { username: "school_admin", full_name: "Школьная администрация" }, created_at: new Date().toISOString(),
  },
  {
    id: "mock-2", content: "📸 8-сынып кешінен фоторепортаж! Өте көңілді өтті 🎉",
    image_url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600", likes_count: 45, comments_count: 12,
    author: { username: "class_8a", full_name: "8А Класс" }, created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "mock-3", content: "🍕 Сегодня в столовой: пицца и компот! Меню обновлено до 15:00",
    image_url: null, likes_count: 67, comments_count: 8,
    author: { username: "canteen", full_name: "Столовая" }, created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "mock-4", content: "🇷🇺 Завтра в 18:30 родительское собрание в актовом зале. Ждём всех!",
    image_url: null, likes_count: 18, comments_count: 3,
    author: { username: "vice_principal", full_name: "Заместитель директора" }, created_at: new Date(Date.now() - 259200000).toISOString(),
  },
];

const FeedPage = ({ user }: FeedPageProps) => {
  const { lang } = useI18n();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [showComments, setShowComments] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showNewPost, setShowNewPost] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const [profileModalUser, setProfileModalUser] = useState<any | null>(null);
  const [profileModalLoading, setProfileModalLoading] = useState(false);
  const [profileModalFollowing, setProfileModalFollowing] = useState(false);

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoadingPosts(true);
    const { data, error } = await supabase
      .from("posts")
      .select("*, author:profiles!author_id(username, full_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("loadPosts error:", error);
      setPosts(MOCK_POSTS);
      setLoadingPosts(false);
      return;
    }

    setPosts(data || []);

    const { data: likes, error: likesErr } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", user.id);
    if (!likesErr && likes) setLikedPosts(new Set(likes.map((l: any) => l.post_id)));
    setLoadingPosts(false);
  };

  const createPost = async () => {
    if (!newPost.trim()) return;
    const { data, error } = await supabase.from("posts").insert({
      author_id: user.id,
      school_id: user.school_id,
      content: newPost.trim(),
    }).select("*, author:profiles!author_id(username, full_name, avatar_url)").single();

    if (data) {
      setPosts([data, ...posts]);
      setNewPost("");
      setShowNewPost(false);
      toast.success(lang === "kz" ? "Жарияланды!" : "Опубликовано!");
    }
    if (error) toast.error(error.message);
  };

  const toggleLike = async (postId: string) => {
    if (postId.startsWith("mock")) return;
    const liked = likedPosts.has(postId);
    if (liked) {
      const { error } = await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      setLikedPosts((prev) => { const s = new Set(prev); s.delete(postId); return s; });
    } else {
      const { error } = await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
      if (error) {
        toast.error(error.message);
        return;
      }
      setLikedPosts((prev) => new Set(prev).add(postId));
    }
    // counts are maintained by DB triggers; refresh post list for accurate counts
    loadPosts();
  };

  const loadComments = async (postId: string) => {
    if (postId.startsWith("mock")) {
      setComments([]);
      setShowComments(postId);
      return;
    }
    setLoadingComments(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*, user:profiles!user_id(username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments(data || []);
    setShowComments(postId);
    setLoadingComments(false);
  };

  const addComment = async () => {
    if (!commentInput.trim() || !showComments || showComments.startsWith("mock")) return;
    const content = commentInput.trim();
    setCommentInput("");
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: showComments, user_id: user.id, content })
      .select("*, user:profiles!user_id(username, avatar_url)")
      .single();
    if (error) {
      toast.error(error.message);
      setCommentInput(content);
      return;
    }
    if (data) setComments((prev) => [...prev, data]);
    // counts are maintained by DB triggers; refresh post list for accurate counts
    loadPosts();
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const openUserProfile = async (userId: string) => {
    setProfileModalLoading(true);
    setProfileModalUser(null);
    setProfileModalFollowing(false);
    try {
      const { data: p, error } = await supabase
        .from("profiles")
        .select("*, classes(name), schools(name)")
        .eq("id", userId)
        .maybeSingle();
      if (error || !p) {
        toast.error(error?.message || (lang === "kz" ? "Пайдаланушы табылмады" : "Пользователь не найден"));
        return;
      }
      setProfileModalUser(p);
      const { data: follow } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle();
      setProfileModalFollowing(!!follow);
    } finally {
      setProfileModalLoading(false);
    }
  };

  const toggleFollowModalUser = async () => {
    if (!profileModalUser) return;
    const targetId = profileModalUser.id;
    if (profileModalFollowing) {
      const { error } = await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", targetId);
      if (error) return toast.error(error.message);
      setProfileModalFollowing(false);
    } else {
      const { error } = await supabase.from("followers").insert({ follower_id: user.id, following_id: targetId });
      if (error) return toast.error(error.message);
      setProfileModalFollowing(true);
    }
  };

  const startDirectChatFromModal = async () => {
    if (!profileModalUser) return;
    const otherId = profileModalUser.id;
    try {
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
            toast.success(lang === "kz" ? "Чат ашылды" : "Чат открыт");
            setProfileModalUser(null);
            return;
          }
        }
      }

      const { data: newConvo, error: convoErr } = await supabase
        .from("conversations")
        .insert({ type: "direct" })
        .select()
        .single();
      if (convoErr || !newConvo) return toast.error(convoErr?.message || "Не удалось создать чат");

      const { error: membersErr } = await supabase.from("conversation_members").insert([
        { conversation_id: newConvo.id, user_id: user.id },
        { conversation_id: newConvo.id, user_id: otherId },
      ]);
      if (membersErr) return toast.error(membersErr.message);
      toast.success(lang === "kz" ? "Чат ашылды" : "Чат открыт");
      setProfileModalUser(null);
    } catch (e) {
      console.error(e);
      toast.error(lang === "kz" ? "Чат ашылмады" : "Не удалось открыть чат");
    }
  };

  return (
    <div className="pt-12 pb-4">
      {/* Header */}
      <div className="px-4 flex items-center justify-between mb-4">
        <h1 className="text-2xl font-black text-foreground">
          {lang === "kz" ? "Лента" : "Лента"}
        </h1>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNewPost(!showNewPost)}
          className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
          {showNewPost ? <X className="w-5 h-5 text-primary-foreground" /> : <Image className="w-5 h-5 text-primary-foreground" />}
        </motion.button>
      </div>

      {/* New post */}
      {showNewPost && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 mb-4">
          <div className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-start gap-3">
              <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`} alt="" className="w-10 h-10 rounded-full bg-muted" />
              <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)}
                placeholder={lang === "kz" ? "Не ойлайсыз?" : "Что у вас нового?"}
                className="flex-1 bg-transparent text-foreground font-semibold outline-none resize-none h-20 text-sm" />
            </div>
            <div className="flex justify-end mt-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={createPost} disabled={!newPost.trim()}
                className="gradient-primary text-primary-foreground font-bold px-6 py-2 rounded-xl text-sm disabled:opacity-50">
                {lang === "kz" ? "Жариялау" : "Опубликовать"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Posts */}
      <div className="space-y-4 px-4">
        {loadingPosts && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground font-semibold">
              {lang === "kz" ? "Жүктелуде..." : "Загрузка..."}
            </p>
          </div>
        )}
        {!loadingPosts && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground font-semibold">
              {lang === "kz" ? "Әзірше жазбалар жоқ" : "Постов пока нет"}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {lang === "kz" ? "Бірінші болып жариялаңыз." : "Опубликуйте первый пост."}
            </p>
          </div>
        )}
        {posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl shadow-card overflow-hidden">
            {/* Post header */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-2">
              <button
                type="button"
                onClick={() => post.author_id && openUserProfile(post.author_id)}
                className="w-10 h-10 rounded-full bg-muted overflow-hidden"
                title="@profile"
              >
                <img
                  src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${post.author?.username || "user"}`}
                  alt=""
                  className="w-10 h-10"
                />
              </button>
              <div className="flex-1">
                <button
                  type="button"
                  onClick={() => post.author_id && openUserProfile(post.author_id)}
                  className="font-bold text-foreground text-sm"
                >
                  @{post.author?.username || "user"}
                </button>
                <p className="text-[10px] text-muted-foreground">{timeAgo(post.created_at)}</p>
              </div>
            </div>
            {/* Content */}
            <p className="px-4 text-sm text-foreground mb-2">{post.content}</p>
            {/* Image */}
            {post.image_url && (
              <img src={post.image_url} alt="" className="w-full h-64 object-cover" />
            )}
            {/* Actions */}
            <div className="flex items-center gap-6 px-4 py-3 border-t border-border">
              <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5">
                <Heart className={`w-5 h-5 ${likedPosts.has(post.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                <span className="text-sm font-bold text-muted-foreground">{post.likes_count || 0}</span>
              </button>
              <button onClick={() => loadComments(post.id)} className="flex items-center gap-1.5">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-bold text-muted-foreground">{post.comments_count || 0}</span>
              </button>
            </div>
            {/* Comments */}
            {showComments === post.id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 pb-4 border-t border-border">
                <div className="max-h-40 overflow-y-auto space-y-2 py-2">
                  {loadingComments && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      {lang === "kz" ? "Жүктелуде..." : "Загрузка..."}
                    </p>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2">
                      <img src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${c.user?.username || 'u'}`}
                        alt="" className="w-6 h-6 rounded-full bg-muted mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-foreground">@{c.user?.username}</span>
                        <p className="text-xs text-muted-foreground">{c.content}</p>
                      </div>
                    </div>
                  ))}
                  {!loadingComments && comments.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      {lang === "kz" ? "Пікірлер жоқ" : "Нет комментариев"}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <input value={commentInput} onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                    placeholder={lang === "kz" ? "Пікір..." : "Комментарий..."}
                    className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-foreground outline-none" />
                  <button onClick={addComment} className="text-primary">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Profile modal */}
      {profileModalLoading || profileModalUser ? (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-black/40" onClick={() => setProfileModalUser(null)} />
          <div className="absolute left-1/2 top-1/2 w-[92%] max-w-md -translate-x-1/2 -translate-y-1/2 bg-background rounded-2xl border border-border shadow-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border bg-card">
              <div className="font-black text-foreground text-sm">
                {lang === "kz" ? "Профиль" : "Профиль"}
              </div>
              <button onClick={() => setProfileModalUser(null)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-4">
              {profileModalLoading ? (
                <p className="text-sm text-muted-foreground text-center py-10">
                  {lang === "kz" ? "Жүктелуде..." : "Загрузка..."}
                </p>
              ) : profileModalUser ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={`https://api.dicebear.com/7.x/adventurer/svg?seed=${profileModalUser.username}`}
                      alt=""
                      className="w-14 h-14 rounded-full bg-muted"
                    />
                    <div className="min-w-0">
                      <p className="font-black text-foreground truncate">@{profileModalUser.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{profileModalUser.full_name || ""}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {profileModalUser.classes?.name || ""} {profileModalUser.schools?.name ? `• ${profileModalUser.schools?.name}` : ""}
                      </p>
                    </div>
                  </div>
                  {profileModalUser.id !== user.id && (
                    <div className="flex gap-2">
                      <button
                        onClick={toggleFollowModalUser}
                        className={`flex-1 font-bold py-2.5 rounded-xl ${
                          profileModalFollowing ? "bg-muted text-foreground" : "gradient-primary text-primary-foreground"
                        }`}
                      >
                        {profileModalFollowing ? (lang === "kz" ? "Жазылдыңыз" : "Вы подписаны") : (lang === "kz" ? "Жазылу" : "Подписаться")}
                      </button>
                      <button
                        onClick={startDirectChatFromModal}
                        className="flex-1 bg-card border-2 border-border font-bold py-2.5 rounded-xl text-foreground"
                      >
                        {lang === "kz" ? "Жазу" : "Написать"}
                      </button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default FeedPage;
