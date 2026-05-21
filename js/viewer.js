// Lesson viewer — render Markdown + Mermaid + Export
import { marked } from "https://esm.sh/marked@13.0.3";
import mermaid from "https://esm.sh/mermaid@11.2.1";
import { sanitizeHTML, escapeText } from "./security.js";

let mermaidInited = false;
function initMermaid(theme) {
  const isDark = theme === "gold-dark";
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      // Background
      background: isDark ? "#1F1F1F" : "#FFFFFF",
      mainBkg: isDark ? "#2A2A2A" : "#FAF8F3",
      secondBkg: isDark ? "#161616" : "#FFFFFF",
      tertiaryBkg: isDark ? "#0A0A0A" : "#F5F0E1",

      // Primary (active/current nodes)
      primaryColor: "#D4AF37",
      primaryTextColor: "#0A0A0A",
      primaryBorderColor: "#B8860B",

      // Secondary
      secondaryColor: isDark ? "#3A3A3A" : "#E8DFC9",
      secondaryTextColor: isDark ? "#FAF8F3" : "#1A1A1A",
      secondaryBorderColor: "#D4AF37",

      // Tertiary
      tertiaryColor: isDark ? "#1F1F1F" : "#FAF8F3",
      tertiaryTextColor: isDark ? "#FAF8F3" : "#1A1A1A",
      tertiaryBorderColor: "#B8860B",

      // Text everywhere (สำคัญที่สุด — กันข้อความหาย)
      textColor: isDark ? "#FAF8F3" : "#1A1A1A",
      nodeTextColor: isDark ? "#FAF8F3" : "#1A1A1A",
      labelTextColor: isDark ? "#FAF8F3" : "#1A1A1A",
      titleColor: "#D4AF37",

      // Lines & borders
      lineColor: "#D4AF37",
      nodeBorder: "#D4AF37",
      clusterBkg: isDark ? "#161616" : "#FAF8F3",
      clusterBorder: "#B8860B",
      defaultLinkColor: "#D4AF37",

      // Misc
      fontFamily: '-apple-system, "Segoe UI", "Sarabun", sans-serif',
      fontSize: "14px",
    },
    securityLevel: "loose",
    flowchart: { curve: "basis", htmlLabels: true },
  });
  mermaidInited = true;
}

export async function renderMarkdown(md) {
  if (!md) return "";
  const raw = await marked.parse(md, { breaks: true, gfm: true });
  return sanitizeHTML(raw);
}

export async function renderMermaid(code, id) {
  if (!mermaidInited) initMermaid(document.documentElement.dataset.theme || "gold-dark");
  try {
    const { svg } = await mermaid.render(`m_${id}_${Math.random().toString(36).slice(2)}`, code);
    return svg;
  } catch (e) {
    return `<pre class="error">Mermaid error: ${escapeText(e.message)}</pre>`;
  }
}

export function renderAnalogyCard(a) {
  return `
    <div class="analogy-card">
      <div class="analogy-emoji">${escapeText(a.emoji || "💡")}</div>
      <h4>${escapeText(a.title || "")}</h4>
      <p>${escapeText(a.comparison || "")}</p>
    </div>`;
}

export function renderExample(ex) {
  const codeBlock = ex.code
    ? `<pre><code>${escapeText(ex.code)}</code></pre>`
    : "";
  const outBlock = ex.output
    ? `<div class="example-output"><strong>ผลลัพธ์:</strong> ${escapeText(ex.output)}</div>`
    : "";
  return `
    <div class="example-card">
      <div class="example-scenario">📌 ${escapeText(ex.scenario || "")}</div>
      ${codeBlock}
      ${outBlock}
    </div>`;
}

export async function renderLesson(lesson) {
  const basic = await renderMarkdown(lesson.content_basic);
  const advance = await renderMarkdown(lesson.content_advance);
  const teaching = await renderMarkdown(lesson.teaching_notes);
  const tips = await renderMarkdown(lesson.pro_tips);

  const analogies = (lesson.analogies || []).map(renderAnalogyCard).join("");
  const examples = (lesson.examples || []).map(renderExample).join("");

  let diagrams = "";
  for (let i = 0; i < (lesson.diagrams || []).length; i++) {
    const d = lesson.diagrams[i];
    if (d.type === "mermaid" && d.code) {
      const svg = await renderMermaid(d.code, `${lesson.id}_${i}`);
      diagrams += `<figure class="diagram"><figcaption>${escapeText(d.title || "")}</figcaption>${svg}</figure>`;
    }
  }

  const sources = (lesson.sources || []).length > 0
    ? `<section class="sources"><h4>📚 แหล่งอ้างอิง</h4><ul>${
        lesson.sources.map((s) =>
          `<li><a href="${escapeText(s.url || "#")}" target="_blank" rel="noopener">${escapeText(s.title || s.url || "")}</a></li>`
        ).join("")
      }</ul></section>`
    : "";

  return `
    <article class="lesson">
      <header class="lesson-head">
        <h1>${escapeText(lesson.topic)}</h1>
        <div class="meta">
          <span>📂 ${escapeText(lesson.category)}</span>
          <span>⏱️ ${lesson.estimated_min || 8} นาที</span>
          <span>⭐ Difficulty ${lesson.difficulty || 3}/5</span>
          ${lesson.used_web_search ? '<span class="badge">🌐 ข้อมูลสด</span>' : ""}
        </div>
      </header>

      ${analogies ? `<section class="analogies"><h2>🎭 Analogy</h2><div class="cards">${analogies}</div></section>` : ""}
      ${diagrams ? `<section class="diagrams"><h2>📊 Diagram</h2>${diagrams}</section>` : ""}

      <section class="part part-basic">
        <h2>🌱 PART 1: BASIC</h2>
        <div class="content">${basic}</div>
      </section>

      ${examples ? `<section class="examples"><h2>💼 ตัวอย่างใช้งาน</h2>${examples}</section>` : ""}

      <section class="part part-advance">
        <h2>🚀 PART 2: ADVANCE</h2>
        <div class="content">${advance}</div>
      </section>

      <section class="part part-teaching">
        <h2>🎤 PART 3: TEACHING NOTES</h2>
        <div class="content">${teaching}</div>
      </section>

      <section class="part part-tips">
        <h2>💎 PART 4: PRO TIPS</h2>
        <div class="content">${tips}</div>
      </section>

      ${sources}
    </article>
  `;
}

export function renderQuiz(quiz) {
  if (!quiz || quiz.length === 0) return "";
  return `
    <section class="quiz">
      <h2>✍️ Quiz ทบทวน</h2>
      ${quiz.map((q, i) => `
        <details class="quiz-item">
          <summary><strong>Q${i + 1}.</strong> ${escapeText(q.question || "")} <span class="qtype">[${escapeText(q.type || "basic")}]</span></summary>
          <div class="answer">
            <p><strong>เฉลย:</strong> ${escapeText(q.answer || "")}</p>
            ${q.explanation ? `<p><em>${escapeText(q.explanation)}</em></p>` : ""}
          </div>
        </details>
      `).join("")}
    </section>
  `;
}

export async function exportLessonMarkdown(lesson) {
  const lines = [
    `# ${lesson.topic}`,
    ``,
    `- หมวด: ${lesson.category}`,
    `- ระดับ: ${lesson.level}`,
    `- เวลา: ${lesson.estimated_min} นาที`,
    ``,
  ];
  if (lesson.analogies?.length) {
    lines.push(`## 🎭 Analogy`);
    lesson.analogies.forEach((a) => lines.push(`- **${a.emoji} ${a.title}**: ${a.comparison}`));
    lines.push("");
  }
  lines.push(`## 🌱 BASIC\n\n${lesson.content_basic || ""}\n`);
  lines.push(`## 🚀 ADVANCE\n\n${lesson.content_advance || ""}\n`);
  lines.push(`## 🎤 TEACHING NOTES\n\n${lesson.teaching_notes || ""}\n`);
  lines.push(`## 💎 PRO TIPS\n\n${lesson.pro_tips || ""}\n`);

  if (lesson.quiz?.length) {
    lines.push(`## ✍️ Quiz`);
    lesson.quiz.forEach((q, i) => {
      lines.push(`${i + 1}. ${q.question}`);
      lines.push(`   - เฉลย: ${q.answer}`);
      if (q.explanation) lines.push(`   - คำอธิบาย: ${q.explanation}`);
    });
  }

  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lesson-${lesson.id}-${(lesson.topic || "untitled").replace(/[^a-zA-Z0-9ก-๙]/g, "_").slice(0, 50)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportLessonPDF(lessonElement) {
  const html2pdf = (await import("https://esm.sh/html2pdf.js@0.10.2")).default;
  await html2pdf().set({
    margin: 10,
    filename: `lesson-${Date.now()}.pdf`,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  }).from(lessonElement).save();
}
