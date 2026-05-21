// ============================================================
// Learning Hub - Configuration
// ⚠️ ห้ามใส่ secret/API key ที่นี่ — เก็บใน Supabase Secret เท่านั้น
// ============================================================
export const CONFIG = {
  SUPABASE_URL: "https://spjsbgyuslbxtpxusvxx.supabase.co",
  // anon key เปิดเผยได้ — เพราะมี RLS ป้องกัน
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwanNiZ3l1c2xieHRweHVzdnh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzNDU2NzIsImV4cCI6MjA5MzkyMTY3Mn0.cSKc9DDX91c5DfVHUAFMeDMSBCU9X8ZKwCLc_yVKGf4",
  EDGE_FUNCTION_URL: "https://spjsbgyuslbxtpxusvxx.supabase.co/functions/v1/generate-lesson",
  APP_NAME: "Learning Hub",
  VERSION: "0.1.0",
};

export const CATEGORIES = [
  { id: "logic",   name: "Logic & Problem Solving", icon: "🧩", color: "#3B82F6" },
  { id: "design",  name: "Design Thinking",         icon: "🎨", color: "#EC4899" },
  { id: "ai",      name: "AI (Prompt/Skill/Agent)", icon: "🤖", color: "#8B5CF6" },
  { id: "english", name: "English",                  icon: "🗣️", color: "#10B981" },
  { id: "it",      name: "IT & Tech",                icon: "💻", color: "#F59E0B" },
  { id: "soft",    name: "Soft Skill",               icon: "🤝", color: "#EF4444" },
];

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
