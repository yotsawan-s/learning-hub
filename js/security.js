// ============================================================
// Security utilities
//   - XSS protection (DOMPurify)
//   - Input validation
// ============================================================
import DOMPurify from "https://esm.sh/dompurify@3.1.6";

const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    "h1","h2","h3","h4","h5","h6","p","br","hr","strong","em","u","s","del","ins",
    "ul","ol","li","blockquote","code","pre","a","img","table","thead","tbody","tr","th","td",
    "span","div","section","article","figure","figcaption","mark","sup","sub","kbd"
  ],
  ALLOWED_ATTR: ["href","title","alt","src","class","id","target","rel"],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ["script","style","iframe","object","embed","form","input","button"],
  FORBID_ATTR: ["onerror","onload","onclick","onmouseover","onfocus","onblur","style"],
  ADD_ATTR: ["target"],
};

export function sanitizeHTML(dirty) {
  if (typeof dirty !== "string") return "";
  const clean = DOMPurify.sanitize(dirty, PURIFY_CONFIG);
  // บังคับ target="_blank" + rel="noopener" สำหรับ external links
  return clean.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
}

export function escapeText(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function validateTopic(topic) {
  if (typeof topic !== "string") return { ok: false, error: "ต้องเป็นข้อความ" };
  const trimmed = topic.trim();
  if (trimmed.length === 0) return { ok: false, error: "กรุณาใส่หัวข้อ" };
  if (trimmed.length > 200) return { ok: false, error: "ยาวเกิน 200 ตัวอักษร" };
  return { ok: true, value: trimmed };
}
