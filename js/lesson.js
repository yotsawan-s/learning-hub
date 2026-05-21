// ============================================================
// Lesson API — เรียก Edge Function (ไม่ใช่ Anthropic ตรง)
// API key อยู่ฝั่ง server เท่านั้น
// ============================================================
import { supabase } from "./supabase-client.js";
import { CONFIG } from "./config.js";
import { validateTopic } from "./security.js";

export async function generateLesson({ category, topic, level = "mixed", useWebSearch = "auto" }) {
  const v = validateTopic(topic);
  if (!v.ok) throw new Error(v.error);

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("กรุณา login ก่อน");

  // ดึง 20 หัวข้อล่าสุดของหมวดนี้ ส่งให้ Claude เพื่อเลี่ยงซ้ำ
  const { data: prior } = await supabase
    .from("lessons")
    .select("topic")
    .eq("category", category)
    .order("created_at", { ascending: false })
    .limit(20);

  const priorTopics = (prior || []).map((p) => p.topic);

  const resp = await fetch(CONFIG.EDGE_FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      category,
      topic: v.value,
      level,
      use_web_search: useWebSearch,
      prior_topics: priorTopics,
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }

  const result = await resp.json();
  return result.lesson;
}

export async function listLessons({ category = null, limit = 50 } = {}) {
  let q = supabase.from("lessons").select("*").order("created_at", { ascending: false }).limit(limit);
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export async function getLesson(id) {
  const { data, error } = await supabase.from("lessons").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function deleteLesson(id) {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleBookmark(id, value) {
  const { error } = await supabase.from("lessons").update({ bookmarked: value }).eq("id", id);
  if (error) throw error;
}

export async function markComplete(id, score = null) {
  const update = { completed: true };
  if (score !== null) update.quiz_score = score;
  const { error } = await supabase.from("lessons").update(update).eq("id", id);
  if (error) throw error;
}
