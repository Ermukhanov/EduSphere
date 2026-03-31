-- EduSphere Complete DB Schema
-- Run in Supabase Dashboard → SQL Editor

DO $$ BEGIN CREATE TYPE public.app_role AS ENUM ('student','parent','teacher','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.schools (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, city text NOT NULL, address text, director_name text, phone text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.classes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL, name text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.subjects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE, name text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE, username text UNIQUE, full_name text, role app_role DEFAULT 'student', school_id uuid REFERENCES public.schools(id), class_id uuid REFERENCES public.classes(id), avatar_url text, bio text, xp integer DEFAULT 0, level integer DEFAULT 1, streak integer DEFAULT 0, last_active_date date, sphere_coins integer DEFAULT 0, followers_count integer DEFAULT 0, likes_count integer DEFAULT 0, created_at timestamptz DEFAULT now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role app_role DEFAULT 'student';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sphere_coins integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
CREATE TABLE IF NOT EXISTS public.user_roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, role app_role NOT NULL, UNIQUE(user_id, role));
CREATE TABLE IF NOT EXISTS public.parent_children (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), parent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, child_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, created_at timestamptz DEFAULT now(), UNIQUE(parent_id, child_id));
CREATE TABLE IF NOT EXISTS public.grades (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, subject_id uuid REFERENCES public.subjects(id), grade integer CHECK (grade BETWEEN 1 AND 5) NOT NULL, type text DEFAULT 'regular', comment text, teacher_id uuid REFERENCES auth.users(id), date date DEFAULT CURRENT_DATE, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.lessons (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL, subject_id uuid REFERENCES public.subjects(id), teacher_id uuid REFERENCES auth.users(id), day_of_week integer CHECK (day_of_week BETWEEN 1 AND 7) NOT NULL, start_time time NOT NULL, end_time time NOT NULL, room text, status text DEFAULT 'active', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.achievements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, title_kz text, description text, description_kz text, icon text DEFAULT '⭐', condition_type text, xp_reward integer DEFAULT 50, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.user_achievements (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, achievement_id uuid REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL, earned_at timestamptz DEFAULT now(), UNIQUE(user_id, achievement_id));
CREATE TABLE IF NOT EXISTS public.xp_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, amount integer NOT NULL, reason text, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.onboarding (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE, how_found text, completed boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.followers (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), follower_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, following_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, created_at timestamptz DEFAULT now(), UNIQUE(follower_id, following_id));
CREATE TABLE IF NOT EXISTS public.conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), type text DEFAULT 'direct', name text, class_id uuid REFERENCES public.classes(id), created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.conversation_members (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL, user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, joined_at timestamptz DEFAULT now(), UNIQUE(conversation_id, user_id));
CREATE TABLE IF NOT EXISTS public.messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL, sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, content text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.posts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, school_id uuid REFERENCES public.schools(id), content text, image_url text, likes_count integer DEFAULT 0, comments_count integer DEFAULT 0, is_featured boolean DEFAULT false, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.post_likes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL, user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, created_at timestamptz DEFAULT now(), UNIQUE(post_id, user_id));
CREATE TABLE IF NOT EXISTS public.post_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL, user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, content text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ai_conversations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, title text DEFAULT 'Новый чат', created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.ai_messages (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE NOT NULL, role text NOT NULL, content text NOT NULL, created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.attendance (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE, status text DEFAULT 'present', date date DEFAULT CURRENT_DATE, created_at timestamptz DEFAULT now());

-- RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Security function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- RLS Policies
DROP POLICY IF EXISTS "read_schools" ON public.schools; CREATE POLICY "read_schools" ON public.schools FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "read_classes" ON public.classes; CREATE POLICY "read_classes" ON public.classes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "read_subjects" ON public.subjects; CREATE POLICY "read_subjects" ON public.subjects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "read_profiles" ON public.profiles; CREATE POLICY "read_profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles; CREATE POLICY "update_own_profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles; CREATE POLICY "insert_own_profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "read_own_roles" ON public.user_roles; CREATE POLICY "read_own_roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "read_parent_links" ON public.parent_children; CREATE POLICY "read_parent_links" ON public.parent_children FOR SELECT TO authenticated USING (parent_id = auth.uid());
DROP POLICY IF EXISTS "insert_parent_links" ON public.parent_children; CREATE POLICY "insert_parent_links" ON public.parent_children FOR INSERT TO authenticated WITH CHECK (parent_id = auth.uid());
DROP POLICY IF EXISTS "read_grades" ON public.grades; CREATE POLICY "read_grades" ON public.grades FOR SELECT TO authenticated USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM parent_children WHERE parent_id = auth.uid() AND child_id = student_id) OR public.has_role(auth.uid(), 'teacher'));
DROP POLICY IF EXISTS "insert_grades" ON public.grades; CREATE POLICY "insert_grades" ON public.grades FOR INSERT TO authenticated WITH CHECK (teacher_id = auth.uid());
DROP POLICY IF EXISTS "read_lessons" ON public.lessons; CREATE POLICY "read_lessons" ON public.lessons FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "manage_lessons" ON public.lessons; CREATE POLICY "manage_lessons" ON public.lessons FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "read_achievements" ON public.achievements; CREATE POLICY "read_achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "read_user_ach" ON public.user_achievements; CREATE POLICY "read_user_ach" ON public.user_achievements FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_user_ach" ON public.user_achievements; CREATE POLICY "insert_user_ach" ON public.user_achievements FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "read_xp" ON public.xp_log; CREATE POLICY "read_xp" ON public.xp_log FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert_xp" ON public.xp_log; CREATE POLICY "insert_xp" ON public.xp_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "manage_onboarding" ON public.onboarding; CREATE POLICY "manage_onboarding" ON public.onboarding FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "read_followers" ON public.followers; CREATE POLICY "read_followers" ON public.followers FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_followers" ON public.followers; CREATE POLICY "insert_followers" ON public.followers FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
DROP POLICY IF EXISTS "delete_followers" ON public.followers; CREATE POLICY "delete_followers" ON public.followers FOR DELETE TO authenticated USING (follower_id = auth.uid());
DROP POLICY IF EXISTS "read_convos" ON public.conversations; CREATE POLICY "read_convos" ON public.conversations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "create_convos" ON public.conversations; CREATE POLICY "create_convos" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "read_members" ON public.conversation_members; CREATE POLICY "read_members" ON public.conversation_members FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "join_convos" ON public.conversation_members; CREATE POLICY "join_convos" ON public.conversation_members FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "read_msgs" ON public.messages; CREATE POLICY "read_msgs" ON public.messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "send_msgs" ON public.messages; CREATE POLICY "send_msgs" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
DROP POLICY IF EXISTS "read_posts" ON public.posts; CREATE POLICY "read_posts" ON public.posts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "create_posts" ON public.posts; CREATE POLICY "create_posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "update_posts" ON public.posts; CREATE POLICY "update_posts" ON public.posts FOR UPDATE TO authenticated USING (true);
DROP POLICY IF EXISTS "read_likes" ON public.post_likes; CREATE POLICY "read_likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_likes" ON public.post_likes; CREATE POLICY "insert_likes" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "delete_likes" ON public.post_likes; CREATE POLICY "delete_likes" ON public.post_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "read_comments" ON public.post_comments; CREATE POLICY "read_comments" ON public.post_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "insert_comments" ON public.post_comments; CREATE POLICY "insert_comments" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "manage_ai_convos" ON public.ai_conversations; CREATE POLICY "manage_ai_convos" ON public.ai_conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "manage_ai_msgs" ON public.ai_messages; CREATE POLICY "manage_ai_msgs" ON public.ai_messages FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM ai_conversations WHERE id = conversation_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM ai_conversations WHERE id = conversation_id AND user_id = auth.uid()));
DROP POLICY IF EXISTS "read_attendance" ON public.attendance; CREATE POLICY "read_attendance" ON public.attendance FOR SELECT TO authenticated USING (student_id = auth.uid());
DROP POLICY IF EXISTS "manage_attendance" ON public.attendance; CREATE POLICY "manage_attendance" ON public.attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  INSERT INTO public.onboarding (user_id, completed) VALUES (NEW.id, false);
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.calculate_xp_from_grade() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE xp_amount integer := 0;
BEGIN
  IF NEW.grade = 5 THEN xp_amount := 50; ELSIF NEW.grade = 4 THEN xp_amount := 20; END IF;
  IF xp_amount > 0 THEN
    INSERT INTO public.xp_log (user_id, amount, reason) VALUES (NEW.student_id, xp_amount, 'grade_' || NEW.grade);
    UPDATE public.profiles SET xp = xp + xp_amount, level = (xp + xp_amount) / 1000 + 1 WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_grade_inserted ON public.grades;
CREATE TRIGGER on_grade_inserted AFTER INSERT ON public.grades FOR EACH ROW EXECUTE FUNCTION public.calculate_xp_from_grade();

CREATE OR REPLACE FUNCTION public.update_followers_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id; END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS on_follow_change ON public.followers;
CREATE TRIGGER on_follow_change AFTER INSERT OR DELETE ON public.followers FOR EACH ROW EXECUTE FUNCTION public.update_followers_count();

CREATE OR REPLACE FUNCTION public.update_post_likes() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    UPDATE profiles SET likes_count = likes_count + 1 WHERE id = (SELECT author_id FROM posts WHERE id = NEW.post_id);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    UPDATE profiles SET likes_count = likes_count - 1 WHERE id = (SELECT author_id FROM posts WHERE id = OLD.post_id);
  END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS on_like_change ON public.post_likes;
CREATE TRIGGER on_like_change AFTER INSERT OR DELETE ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.update_post_likes();

CREATE OR REPLACE FUNCTION public.update_post_comments_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id; END IF;
  RETURN NULL;
END; $$;
DROP TRIGGER IF EXISTS on_comment_change ON public.post_comments;
CREATE TRIGGER on_comment_change AFTER INSERT OR DELETE ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- Realtime
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.posts; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed achievements
INSERT INTO public.achievements (title, title_kz, icon, condition_type, xp_reward) VALUES
  ('Первая пятёрка','Алғашқы бесті','⭐','first_five',50),
  ('Мастер БЖБ','БЖБ шебері','🏆','master_bjb',100),
  ('Железная воля','Темір ерік','💪','no_absences_month',150),
  ('Ночной дозор','Түнгі кезек','🌙','night_owl',30),
  ('Стрик 7 дней','7 күн серия','🔥','streak_7',70),
  ('Стрик 30 дней','30 күн серия','💎','streak_30',300),
  ('Социальная бабочка','Әлеуметтік көбелек','🦋','friends_10',80),
  ('Первый пост','Алғашқы жазба','📝','first_post',40)
ON CONFLICT DO NOTHING;

-- Backward-compatible schema fixes
ALTER TABLE public.onboarding ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.school_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  director_name text NOT NULL,
  school_name text NOT NULL,
  city text NOT NULL,
  email text NOT NULL,
  phone text,
  comment text,
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text,
  payload jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.school_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_school_applications" ON public.school_applications;
CREATE POLICY "insert_school_applications" ON public.school_applications
FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "read_own_school_applications" ON public.school_applications;
CREATE POLICY "read_own_school_applications" ON public.school_applications
FOR SELECT TO authenticated USING (created_by = auth.uid());

DROP POLICY IF EXISTS "read_notifications" ON public.notifications;
CREATE POLICY "read_notifications" ON public.notifications
FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "update_notifications" ON public.notifications;
CREATE POLICY "update_notifications" ON public.notifications
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert_notifications_service" ON public.notifications;
CREATE POLICY "insert_notifications_service" ON public.notifications
FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_payload jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, body, payload)
  VALUES (p_user_id, p_type, p_title, p_body, COALESCE(p_payload, '{}'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.award_xp_to_child(
  p_child_id uuid,
  p_amount integer DEFAULT 30,
  p_reason text DEFAULT 'parent_praise'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_linked boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.parent_children
    WHERE parent_id = auth.uid() AND child_id = p_child_id
  ) INTO is_linked;

  IF NOT is_linked THEN
    RAISE EXCEPTION 'Parent is not linked to this child';
  END IF;

  INSERT INTO public.xp_log(user_id, amount, reason)
  VALUES (p_child_id, p_amount, p_reason);

  UPDATE public.profiles
  SET xp = COALESCE(xp, 0) + p_amount,
      level = ((COALESCE(xp, 0) + p_amount) / 1000) + 1
  WHERE id = p_child_id;

  PERFORM public.notify_user(
    p_child_id,
    'xp_reward',
    'Вы получили баллы',
    format('Вы получили %s XP', p_amount),
    jsonb_build_object('amount', p_amount, 'reason', p_reason)
  );

  RETURN jsonb_build_object('ok', true, 'amount', p_amount);
END;
$$;

CREATE OR REPLACE FUNCTION public.on_xp_log_insert_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.notify_user(
    NEW.user_id,
    'xp_log',
    'Новые баллы',
    format('Вы получили %s XP (%s)', NEW.amount, COALESCE(NEW.reason, 'награда')),
    jsonb_build_object('xp_log_id', NEW.id, 'amount', NEW.amount, 'reason', NEW.reason)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_xp_log_insert_notify ON public.xp_log;
CREATE TRIGGER on_xp_log_insert_notify
AFTER INSERT ON public.xp_log
FOR EACH ROW EXECUTE FUNCTION public.on_xp_log_insert_notify();

CREATE OR REPLACE FUNCTION public.on_grade_insert_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_name text;
BEGIN
  SELECT name INTO sub_name FROM public.subjects WHERE id = NEW.subject_id;
  PERFORM public.notify_user(
    NEW.student_id,
    'new_grade',
    'Новая оценка',
    format('Новая оценка %s по предмету %s', NEW.grade, COALESCE(sub_name, 'предмет')),
    jsonb_build_object('grade_id', NEW.id, 'grade', NEW.grade)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_grade_insert_notify ON public.grades;
CREATE TRIGGER on_grade_insert_notify
AFTER INSERT ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.on_grade_insert_notify();

-- Feed seed data (RU/KZ) for a "live" feeling
INSERT INTO public.posts (author_id, school_id, content, is_featured)
SELECT p.id, p.school_id, v.content, false
FROM (
  VALUES
    ('🇰🇿 Бүгін 8А сыныбы робототехника сабағында шағын дрон жобасын сәтті қорғады!'),
    ('🇷🇺 Сегодня в библиотеке стартовал книжный марафон: читаем по 20 минут каждый день.'),
    ('🇰🇿 Ертең 10:00-де информатикадан ашық сабақ болады, барлық ата-ана шақырылады.'),
    ('🇷🇺 Школьная команда заняла 2 место на городском дебатном турнире. Поздравляем!'),
    ('🇰🇿 Асханада бүгін жаңа мәзір: көкөніс сорпасы, тауық еті және компот.')
) AS v(content)
JOIN public.profiles p ON p.role IN ('teacher', 'admin')
WHERE NOT EXISTS (
  SELECT 1 FROM public.posts pp
  WHERE pp.content = v.content
);

CREATE OR REPLACE FUNCTION public.resolve_user_id_by_code(p_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE id::text = lower(p_code) OR left(id::text, 8) = lower(p_code)
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.search_profiles(p_query text)
RETURNS TABLE(
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  class_id uuid,
  school_id uuid,
  level integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.username, p.full_name, p.avatar_url, p.class_id, p.school_id, p.level
  FROM public.profiles p
  WHERE
    p.id::text = lower(p_query)
    OR left(p.id::text, 8) = lower(p_query)
    OR p.username ILIKE '%' || p_query || '%'
    OR p.full_name ILIKE '%' || p_query || '%'
  LIMIT 10
$$;

CREATE OR REPLACE FUNCTION public.get_classes_for_school(p_school_id uuid)
RETURNS TABLE(id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.classes c
  WHERE c.school_id = p_school_id
  ORDER BY c.name
$$;

CREATE OR REPLACE FUNCTION public.get_ai_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.app_role;
  v_user_id uuid := auth.uid();
  v_student_id uuid;
  v_student_name text;
  v_grades jsonb := '[]'::jsonb;
  v_lessons jsonb := '[]'::jsonb;
  v_attendance jsonb := '[]'::jsonb;
  v_teacher_class uuid;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = v_user_id;

  IF v_role = 'parent' THEN
    SELECT child_id INTO v_student_id
    FROM public.parent_children
    WHERE parent_id = v_user_id
    ORDER BY created_at
    LIMIT 1;
  ELSIF v_role = 'student' THEN
    v_student_id := v_user_id;
  END IF;

  IF v_role IN ('student', 'parent') AND v_student_id IS NOT NULL THEN
    SELECT username INTO v_student_name FROM public.profiles WHERE id = v_student_id;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_grades
    FROM (
      SELECT g.grade, g.type, g.date, s.name AS subject
      FROM public.grades g
      LEFT JOIN public.subjects s ON s.id = g.subject_id
      WHERE g.student_id = v_student_id
      ORDER BY g.created_at DESC
      LIMIT 20
    ) t;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_lessons
    FROM (
      SELECT l.day_of_week, l.start_time, l.end_time, l.room, l.status, s.name AS subject
      FROM public.lessons l
      LEFT JOIN public.subjects s ON s.id = l.subject_id
      WHERE l.class_id = (SELECT class_id FROM public.profiles WHERE id = v_student_id)
      ORDER BY l.day_of_week, l.start_time
      LIMIT 30
    ) t;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_attendance
    FROM (
      SELECT a.date, a.status
      FROM public.attendance a
      WHERE a.student_id = v_student_id
      ORDER BY a.created_at DESC
      LIMIT 20
    ) t;
  ELSIF v_role = 'teacher' THEN
    SELECT class_id INTO v_teacher_class FROM public.profiles WHERE id = v_user_id;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_grades
    FROM (
      SELECT p.username AS student, g.grade, g.type, g.date, s.name AS subject
      FROM public.grades g
      JOIN public.profiles p ON p.id = g.student_id
      LEFT JOIN public.subjects s ON s.id = g.subject_id
      WHERE p.class_id = v_teacher_class
      ORDER BY g.created_at DESC
      LIMIT 40
    ) t;

    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_lessons
    FROM (
      SELECT l.day_of_week, l.start_time, l.end_time, l.room, l.status, s.name AS subject
      FROM public.lessons l
      LEFT JOIN public.subjects s ON s.id = l.subject_id
      WHERE l.class_id = v_teacher_class
      ORDER BY l.day_of_week, l.start_time
      LIMIT 40
    ) t;
  END IF;

  RETURN jsonb_build_object(
    'role', v_role,
    'student_id', v_student_id,
    'student_name', v_student_name,
    'grades', v_grades,
    'lessons', v_lessons,
    'attendance', v_attendance
  );
END;
$$;
