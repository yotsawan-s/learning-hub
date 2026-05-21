# 🎓 Learning Hub — AI Tutor

แอปสร้างบทเรียนด้วย Claude API ที่เน้น **Basic + Advance + Teaching Notes + Pro Tips** เก็บใน Supabase ส่งออกเป็น PDF/Markdown ได้

## ✨ Features

- 🤖 **AI-generated lessons** — สร้างบทเรียนตามหัวข้อที่ขอ
- 🌐 **Web Search** — เนื้อหาทันสมัย (auto detect)
- 📚 **4-Part Structure** — Basic / Advance / Teaching Notes / Pro Tips
- 🎭 **Visual aids** — Analogy + Mermaid diagrams + Examples
- ⭐ **Bookmark + History** — เก็บทุกบทเรียนใน cloud
- 📄 **Export** — Markdown และ PDF (เอาไปสอนต่อ)
- 🌙 **Dual theme** — Executive Gold Dark/Light
- 🔐 **Security-first** — API key อยู่ฝั่ง server เท่านั้น

## 📂 Categories

🧩 Logic · 🎨 Design Thinking · 🤖 AI · 🗣️ English · 💻 IT · 🤝 Soft Skill

## 🚀 Setup ครั้งแรก

อ่าน [init.md](init.md) — checklist 7 steps ครบทุกขั้นตอน

## 📖 เอกสาร

| ไฟล์ | สำหรับ |
|------|--------|
| [init.md](init.md) | Setup ครั้งแรก |
| [DEVELOPMENT.md](DEVELOPMENT.md) | แก้ไข/พัฒนาต่อ |
| [SECURITY.md](SECURITY.md) | นโยบายความปลอดภัย |
| [CHANGELOG.md](CHANGELOG.md) | ประวัติเวอร์ชัน |

## 🛠️ Tech Stack

- **Frontend:** HTML + JS Modules + Executive Gold CSS
- **Auth/DB:** Supabase (Project: Learn ENG)
- **AI Proxy:** Supabase Edge Function (Deno)
- **AI Model:** Claude Opus (claude-opus-4-5)
- **Render:** marked.js + mermaid.js + DOMPurify
- **Export:** html2pdf.js
- **Deploy:** GitHub Pages (frontend) + Supabase (backend)

## 🗺️ Architecture

```
Browser (ai-tutor.html)
   │ no API key — ส่งแค่ JWT
   ↓
Supabase Edge Function (generate-lesson)
   │ + ANTHROPIC_API_KEY (secret)
   │ + Auth verify
   │ + Rate limit
   ↓
Anthropic API
   ↓
ตอบกลับ JSON → save ใน lessons table → return
```

## 💰 Cost

- Supabase: ฟรี (Free tier เหลือเฟือ)
- Anthropic API: ~$0.03-0.05/บทเรียน → ใช้ 1-2 ครั้ง/วัน ≈ **$1.5/เดือน**

## 🔗 URLs

- Live: https://yotsawan-s.github.io/learning-hub/
- Repo: https://github.com/yotsawan-s/learning-hub
- Supabase: spjsbgyuslbxtpxusvxx (Learn ENG)
