// Name: Joshua Roberts
// Description: Slack With Backend + Extra Credit (Send Message)

// switch active channel and load its messages
function changeChannel(e) {
  document.querySelector(".active").classList.remove("active");
  e.currentTarget.classList.add("active");
  populateMessages(e.currentTarget.getAttribute("data-channel"));
  document.querySelector("#channel-title").innerText =
    e.currentTarget.innerText;
}

// load and display messages for the selected channel
function populateMessages(chat) {
  document.querySelectorAll(".message").forEach((item) => item.remove());
  let template = document.querySelector("template");

  (async () => {
    const wrap = document.querySelector(".chat-messages");
    if (!wrap || !template) return;

    // get messages for this channel
    const res = await fetch(`https://slackclonebackendapi.onrender.com/messages?channelId=${chat}`);
    const messages = await res.json();

    // get sender names
    const ids = [...new Set(messages.map(m => m.senderId).filter(Boolean))];
    const names = {};
    for (const id of ids) {
      const ur = await fetch(`https://slackclonebackendapi.onrender.com/users?id=${id}`);
      const u = await ur.json();
      names[id] = u?.[0]?.name || "Unknown";
    }

    // display each message
    for (const m of messages) {
      const clone = template.content.cloneNode(true);
      const senderEl = clone.querySelector(".sender");
      const textEl = clone.querySelector(".text");
      if (senderEl) senderEl.innerText = (names[m.senderId] || "Unknown") + ":";
      const txt = m.text ?? m.message ?? m.body ?? m.content ?? "";
      if (textEl) textEl.innerText = txt;
      wrap.appendChild(clone);
    }
    wrap.scrollTop = wrap.scrollHeight;
  })();
}

// send a new message (extra credit)
async function sendMessage() {
  const input = document.querySelector("#message-input");
  const active = document.querySelector(".channel.active");
  if (!input || !active) return;

  const text = input.value.trim();
  if (!text) return;

  const channelId = Number(active.getAttribute("data-channel"));

  // pick random valid senderId from users
  let senderId = 1;
  try {
    const ur = await fetch("https://slackclonebackendapi.onrender.com/users");
    const users = await ur.json();
    const ids = users.map(u => u.id).filter(id => typeof id === "number");
    if (ids.length) senderId = ids[Math.floor(Math.random() * ids.length)];
  } catch {}

  // create payload for backend
  const payload = { channelId, text, senderId, timestamp: Date.now() };

  // POST message to backend and update chat
  try {
    const res = await fetch("https://slackclonebackendapi.onrender.com/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Post failed");
    await res.json();

    // add message instantly to chat window
    const wrap = document.querySelector(".chat-messages");
    const template = document.querySelector("template");
    const clone = template.content.cloneNode(true);
    const senderEl = clone.querySelector(".sender");
    const textEl = clone.querySelector(".text");
    if (senderEl) senderEl.innerText = "You:";
    if (textEl) textEl.innerText = text;
    wrap.appendChild(clone);
    wrap.scrollTop = wrap.scrollHeight;

    input.value = "";
  } catch {
    alert("Could not send message.");
  }
}

// build channel buttons and setup listeners
async function init() {
  const res = await fetch("https://slackclonebackendapi.onrender.com/channels");
  const channels = await res.json();

  const list = document.querySelector(".channel-list");
  if (!list) return;
  list.innerHTML = "";

  // create button for each channel
  channels.forEach((ch, i) => {
    const btn = document.createElement("button");
    btn.classList.add("channel");
    btn.setAttribute("data-channel", ch.id);
    btn.innerText = ch.name;
    list.appendChild(btn);

    // load first channel automatically
    if (i === 0) {
      btn.classList.add("active");
      document.querySelector("#channel-title").innerText = ch.name;
      populateMessages(ch.id);
    }
  });

  // add click events for all channels
  document
    .querySelectorAll(".channel")
    .forEach((item) => item.addEventListener("click", changeChannel));

  // wire send button and Enter key
  const sendBtn = document.querySelector("#chat-form button");
  const msgInput = document.querySelector("#message-input");
  if (sendBtn) sendBtn.addEventListener("click", sendMessage);
  if (msgInput) msgInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

init();
