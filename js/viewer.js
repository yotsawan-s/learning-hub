// Lesson viewer — render Markdown + Mermaid (via mermaid.ink) + Export
import { marked } from "https://esm.sh/marked@13.0.3";
import { sanitizeHTML, escapeText } from "./security.js";

// ============================================================
// Mermaid via mermaid.ink — server-rendered image (rock-solid)
// แปลง code เป็น base64 → ใส่ใน <img src="https://mermaid.ink/svg/...">
// ============================================================
function toBase64Url(str) {
  // UTF-8 safe base64 (รองรับภาษาไทย)
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function mermaidImageURL(code, format = "svg") {
  // ลบ HTML tags ที่ Claude อาจใส่ใน node labels (กัน font size เพี้ยน)
  const cleaned = code
    .replace(/<\/?(?:b|strong|i|em|u|font|span|big|small|h[1-6])[^>]*>/gi, "")
    .replace(/<br\s*\/?>/gi, "<br/>"); // เหลือแค่ <br/> สำหรับขึ้นบรรทัด

  // htmlLabels: false → บังคับ plain text เท่ากันทุก node
  const configured = `%%{init: {
    "theme":"neutral",
    "themeVariables": {
      "fontFamily":"-apple-system, Segoe UI, Sarabun, sans-serif",
      "fontSize":"16px",
      "primaryColor":"#FAF8F3",
      "primaryTextColor":"#1A1A1A",
      "primaryBorderColor":"#B8860B",
      "lineColor":"#666666",
      "secondaryColor":"#FFF8DC",
      "tertiaryColor":"#FFFFFF"
    },
    "flowchart":{"curve":"basis","htmlLabels":false,"useMaxWidth":true},
    "sequence":{"useMaxWidth":true}
  } }%%\n${cleaned}`;
  const encoded = toBase64Url(configured);
  return `https://mermaid.ink/${format}/${encoded}?bgColor=FFFFFF`;
}

export async function renderMarkdown(md) {
  if (!md) return "";
  const raw = await marked.parse(md, { breaks: true, gfm: true });
  return sanitizeHTML(raw);
}

export async function renderMermaid(code, id) {
  if (!code || typeof code !== "string") return "";
  try {
    const svgUrl = mermaidImageURL(code, "svg");
    const pngUrl = mermaidImageURL(code, "img");
    // SVG preferred, fallback to PNG ถ้า SVG ล้มเหลว
    return `<img class="mermaid-img"
      src="${escapeText(svgUrl)}"
      onerror="this.onerror=null;this.src='${escapeText(pngUrl)}';"
      alt="diagram"
      loading="lazy">`;
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
