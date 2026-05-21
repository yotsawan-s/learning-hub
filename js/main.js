// ============================================================
// Main entry — ai-tutor.html
// ============================================================
import { CATEGORIES } from "./config.js";
import { supabase } from "./supabase-client.js";
import * as Auth from "./auth.js";
import * as Lesson from "./lesson.js";
import { renderLesson, renderQuiz, exportLessonMarkdown, exportLessonPDF } from "./viewer.js";
import { escapeText } from "./security.js";

// -------- State --------
const state = {
  selectedCategory: "ai",
  currentLesson: null,
  filter: "all",
};

// -------- DOM --------
const $ = (id) => document.getElementById(id);

const viewAuth = $("view-auth");
const viewMain = $("view-main");
const viewLesson = $("view-lesson");

// -------- Theme --------
const THEME_KEY = "lh-theme";
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
  $("btn-theme").textContent = theme === "gold-dark" ? "🌙" : "☀️";
}
applyTheme(localStorage.getItem(THEME_KEY) || "gold-dark");
$("btn-theme").onclick = () => {
  applyTheme(document.documentElement.dataset.theme === "gold-dark" ? "gold-light" : "gold-dark");
};

// -------- Toast --------
let toastTimer;
function toast(msg, type = "") {
  const el = $("toast");
  el.textContent = msg;
  el.className = `toast ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3500);
}

// -------- Category pills --------
function renderCategoryPills() {
  $("cat-pills").innerHTML = CATEGORIES.map((c) => `
    <button class="cat-pill ${c.id === state.selectedCategory ? 'active' : ''}" data-cat="${c.id}">
      ${c.icon} ${escapeText(c.name)}
    </button>
  `).join("");
  $("cat-pills").querySelectorAll(".cat-pill").forEach((btn) => {
    btn.onclick = () => {
      state.selectedCategory = btn.dataset.cat;
      renderCategoryPills();
      loadHistory();
    };
  });
}

// -------- Auth flow --------
async function showAuth() {
  viewAuth.classList.remove("hidden");
  viewMain.classList.add("hidden");
  $("btn-logout").classList.add("hidden");
}
async function showMain() {
  viewAuth.classList.add("hidden");
  viewMain.classList.remove("hidden");
  $("btn-logout").classList.remove("hidden");
  renderCategoryPills();
  await loadHistory();
}

$("btn-login").onclick = async () => {
  const email = $("auth-email").value.trim();
  const pass = $("auth-pass").value;
  $("auth-msg").textContent = "";
  const { error } = await Auth.signIn(email, pass);
  if (error) $("auth-msg").textContent = error.message;
};
$("btn-signup").onclick = async () => {
  const email = $("auth-email").value.trim();
  const pass = $("auth-pass").value;
  $("auth-msg").textContent = "";
  const { error } = await Auth.signUp(email, pass);
  if (error) $("auth-msg").textContent = error.message;
  else $("auth-msg").textContent = "สมัครสำเร็จ — กรุณาเช็คอีเมลเพื่อยืนยัน";
};
$("btn-logout").onclick = async () => {
  await Auth.signOut();
};

Auth.onAuthChange((event, session) => {
  if (session) showMain();
  else showAuth();
});

// -------- Generate lesson --------
$("btn-generate").onclick = async () => {
  const topic = $("topic-input").value.trim();
  if (!topic) { toast("กรุณาใส่หัวข้อ", "error"); return; }

  const btn = $("btn-generate");
  btn.disabled = true;
  $("gen-status").innerHTML = '<span class="loader"></span> กำลังสร้างบทเรียน... (5-15 วินาที)';

  try {
    const lesson = await Lesson.generateLesson({
      category: state.selectedCategory,
      topic,
      level: $("sel-level").value,
      useWebSearch: $("sel-search").value,
    });
    $("gen-status").textContent = "";
    toast("สร้างบทเรียนสำเร็จ ✓", "success");
    await openLesson(lesson);
    $("topic-input").value = "";
    await loadHistory();
  } catch (e) {
    $("gen-status").innerHTML = `<span class="error">❌ ${escapeText(e.message)}</span>`;
    toast(e.message, "error");
  } finally {
    btn.disabled = false;
  }
};

$("btn-random").onclick = () => {
  const samples = {
    ai: ["MCP Server คืออะไร", "Prompt Caching ใน Claude API", "Agent Loop pattern", "Tool Use ในการสร้าง agent", "Few-shot vs Zero-shot"],
    logic: ["First Principle Thinking", "Inductive vs Deductive", "Logical Fallacy ที่พบบ่อย"],
    design: ["Double Diamond Process", "Empathy Map", "Jobs-to-be-Done"],
    english: ["Phrasal Verbs สำคัญในที่ทำงาน", "Tense ที่คนไทยใช้ผิดบ่อย"],
    it: ["REST vs GraphQL", "Docker คืออะไร", "Git workflow ที่ใช้จริง"],
    soft: ["Active Listening", "Giving Feedback แบบ SBI", "Time blocking"],
  };
  const arr = samples[state.selectedCategory] || samples.ai;
  $("topic-input").value = arr[Math.floor(Math.random() * arr.length)];
};

// -------- Open lesson --------
async function openLesson(lesson) {
  state.currentLesson = lesson;
  viewLesson.classList.remove("hidden");
  $("lesson-content").innerHTML = await renderLesson(lesson);
  $("lesson-quiz").innerHTML = renderQuiz(lesson.quiz);
  $("btn-bookmark").textContent = lesson.bookmarked ? "★ Bookmarked" : "⭐ Bookmark";
  viewLesson.scrollIntoView({ behavior: "smooth" });
}

$("btn-close-lesson").onclick = () => {
  viewLesson.classList.add("hidden");
  state.currentLesson = null;
};

$("btn-bookmark").onclick = async () => {
  if (!state.currentLesson) return;
  const next = !state.currentLesson.bookmarked;
  try {
    await Lesson.toggleBookmark(state.currentLesson.id, next);
    state.currentLesson.bookmarked = next;
    $("btn-bookmark").textContent = next ? "★ Bookmarked" : "⭐ Bookmark";
    toast(next ? "บันทึกแล้ว" : "ยกเลิก bookmark", "success");
    await loadHistory();
  } catch (e) {
    toast(e.message, "error");
  }
};

$("btn-export-md").onclick = () => {
  if (state.currentLesson) exportLessonMarkdown(state.currentLesson);
};
$("btn-export-pdf").onclick = async () => {
  if (!state.currentLesson) return;
  toast("กำลังสร้าง PDF...", "");
  try {
    await exportLessonPDF($("lesson-content"));
  } catch (e) {
    toast("Export PDF ล้มเหลว: " + e.message, "error");
  }
};

// -------- History --------
$("filter-all").onclick = () => { state.filter = "all"; loadHistory(); };
$("filter-bookmark").onclick = () => { state.filter = "bookmark"; loadHistory(); };

async function loadHistory() {
  try {
    let items = await Lesson.listLessons({ category: state.selectedCategory });
    if (state.filter === "bookmark") items = items.filter((x) => x.bookmarked);

    if (items.length === 0) {
      $("history-list").innerHTML = '<p class="muted center">ยังไม่มีบทเรียนในหมวดนี้</p>';
      return;
    }

    $("history-list").innerHTML = items.map((it) => `
      <div class="history-item" data-id="${it.id}">
        <div>
          <span class="icon">${it.bookmarked ? "⭐" : "📖"}</span>
          <span class="title">${escapeText(it.topic)}</span>
        </div>
        <div>
          <span class="date">${new Date(it.created_at).toLocaleDateString("th-TH")}</span>
          <button class="btn-ghost" data-action="delete" data-id="${it.id}" title="ลบ" style="margin-left:8px;padding:4px 8px;">🗑️</button>
        </div>
      </div>
    `).join("");

    $("history-list").querySelectorAll(".history-item").forEach((row) => {
      row.onclick = async (e) => {
        if (e.target.dataset.action === "delete") return;
        const id = Number(row.dataset.id);
        const lesson = await Lesson.getLesson(id);
        await openLesson(lesson);
      };
    });
    $("history-list").querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        if (!confirm("ลบบทเรียนนี้?")) return;
        await Lesson.deleteLesson(Number(btn.dataset.id));
        toast("ลบแล้ว", "success");
        await loadHistory();
      };
    });
  } catch (e) {
    $("history-list").innerHTML = `<p class="error">โหลดประวัติล้มเหลว: ${escapeText(e.message)}</p>`;
  }
}

// -------- Init --------
(async () => {
  const session = await Auth.getSession();
  if (session) showMain();
  else showAuth();
})();
