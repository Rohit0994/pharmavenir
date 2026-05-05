/* PharmAvenir Chatbot Widget
 * Injects a floating chat bubble + popup window on every page.
 * Sends questions to the FastAPI backend's POST /ask endpoint.
 */
(function () {
  // ---- CONFIG --------------------------------------------------------------
  // Local testing uses localhost. After deploying to Render, change this
  // to your Render URL (e.g. "https://pharmavenir-backend.onrender.com").
  const BACKEND_URL = "http://localhost:8000";
  // --------------------------------------------------------------------------

  const STYLES = `
    #pa-chat-bubble{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;
      background:#0b6e4f;color:#fff;font-size:28px;display:flex;align-items:center;justify-content:center;
      cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25);z-index:99999;border:none;transition:transform .2s}
    #pa-chat-bubble:hover{transform:scale(1.08)}
    #pa-chat-window{position:fixed;bottom:96px;right:24px;width:360px;max-width:calc(100vw - 32px);
      height:520px;max-height:calc(100vh - 120px);background:#fff;border-radius:14px;
      box-shadow:0 10px 40px rgba(0,0,0,.25);display:none;flex-direction:column;overflow:hidden;
      z-index:99999;font-family:'Segoe UI',Arial,sans-serif}
    #pa-chat-window.open{display:flex}
    #pa-chat-header{background:#0b6e4f;color:#fff;padding:14px 16px;font-weight:600;display:flex;
      justify-content:space-between;align-items:center}
    #pa-chat-close{background:none;border:none;color:#fff;font-size:20px;cursor:pointer;line-height:1}
    #pa-chat-body{flex:1;overflow-y:auto;padding:14px;background:#f7faf9;font-size:14px;line-height:1.45}
    .pa-msg{margin-bottom:10px;padding:9px 12px;border-radius:10px;max-width:85%;word-wrap:break-word}
    .pa-msg.user{background:#0b6e4f;color:#fff;margin-left:auto;border-bottom-right-radius:2px}
    .pa-msg.bot{background:#e6f4ef;color:#222;border-bottom-left-radius:2px}
    .pa-msg.bot .pa-sources{margin-top:6px;font-size:11px;color:#555}
    .pa-msg.bot .pa-sources a{color:#0b6e4f;text-decoration:none;display:block}
    .pa-msg.bot .pa-sources a:hover{text-decoration:underline}
    .pa-msg.typing{font-style:italic;color:#666;background:#eee}
    #pa-chat-form{display:flex;border-top:1px solid #ddd;background:#fff}
    #pa-chat-input{flex:1;border:none;padding:12px;font-size:14px;outline:none;font-family:inherit}
    #pa-chat-send{background:#0b6e4f;color:#fff;border:none;padding:0 16px;cursor:pointer;font-weight:600}
    #pa-chat-send:disabled{background:#999;cursor:not-allowed}
  `;

  function injectStyles() {
    const s = document.createElement("style");
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  function buildUI() {
    const bubble = document.createElement("button");
    bubble.id = "pa-chat-bubble";
    bubble.innerHTML = "&#128172;"; // 💬
    bubble.title = "Ask PharmAvenir";

    const win = document.createElement("div");
    win.id = "pa-chat-window";
    win.innerHTML = `
      <div id="pa-chat-header">
        <span>PharmAvenir Assistant</span>
        <button id="pa-chat-close" aria-label="Close">&times;</button>
      </div>
      <div id="pa-chat-body"></div>
      <form id="pa-chat-form" autocomplete="off">
        <input id="pa-chat-input" type="text" placeholder="Ask a question..." required>
        <button id="pa-chat-send" type="submit">Send</button>
      </form>
    `;

    document.body.appendChild(bubble);
    document.body.appendChild(win);

    const body = win.querySelector("#pa-chat-body");
    addMessage(body, "bot", "Hi! I'm PharmAvenir's virtual assistant. Ask me about our products, services, FAQs, or contact info.");

    bubble.addEventListener("click", () => {
      win.classList.toggle("open");
      if (win.classList.contains("open")) win.querySelector("#pa-chat-input").focus();
    });
    win.querySelector("#pa-chat-close").addEventListener("click", () => win.classList.remove("open"));
    win.querySelector("#pa-chat-form").addEventListener("submit", onSubmit);
  }

  function addMessage(body, role, text, sources) {
    const div = document.createElement("div");
    div.className = "pa-msg " + role;
    div.textContent = text;
    if (sources && sources.length) {
      const src = document.createElement("div");
      src.className = "pa-sources";
      src.innerHTML = "<strong>Sources:</strong>";
      sources.forEach(s => {
        const a = document.createElement("a");
        a.href = s.url; a.target = "_blank"; a.rel = "noopener";
        a.textContent = "→ " + (s.title || s.url);
        src.appendChild(a);
      });
      div.appendChild(src);
    }
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
  }

  async function onSubmit(e) {
    e.preventDefault();
    const input = document.getElementById("pa-chat-input");
    const sendBtn = document.getElementById("pa-chat-send");
    const body = document.getElementById("pa-chat-body");
    const question = input.value.trim();
    if (!question) return;

    addMessage(body, "user", question);
    input.value = "";
    sendBtn.disabled = true;
    const typing = addMessage(body, "bot typing", "Thinking...");

    try {
      const res = await fetch(BACKEND_URL + "/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      if (!res.ok) throw new Error("Server returned " + res.status);
      const data = await res.json();
      typing.remove();
      addMessage(body, "bot", data.answer || "(no answer)", data.sources);
    } catch (err) {
      typing.remove();
      addMessage(body, "bot", "Sorry, I couldn't reach the server. Please try again later.\n\n(" + err.message + ")");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { injectStyles(); buildUI(); });
  } else {
    injectStyles();
    buildUI();
  }
})();
