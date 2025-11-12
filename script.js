// Name: Joshua Roberts
// Description: Slack With Backend

let userIds=[]; // store valid users for sending messages

// change active channel and load messages
function changeChannel(e){
  const active=document.querySelector('.active');
  active.classList.remove('active');
  e.currentTarget.classList.add('active');
  const id=e.currentTarget.getAttribute('data-channel');
  populateMessages(id);
  const title=document.querySelector('#channel-title');
  if(title) title.innerText=e.currentTarget.innerText;
}

// get and display messages for selected channel
async function populateMessages(chat){
  document.querySelectorAll('.message').forEach(msg=>msg.remove());
  const wrap=document.querySelector('.chat-messages');
  const temp=document.querySelector('template');
  if(!wrap||!temp) return;

  const res=await fetch(`https://slackclonebackendapi.onrender.com/messages?channelId=${chat}`);
  const msgs=await res.json();

  const ids=[...new Set(msgs.map(msg=>msg.senderId).filter(Boolean))];
  const names={};
  for(const id of ids){
    const userRes=await fetch(`https://slackclonebackendapi.onrender.com/users?id=${id}`);
    const userData=await userRes.json();
    names[id]=userData?.[0]?.name||'Unknown';
  }

  for(const msg of msgs){
    const clone=temp.content.cloneNode(true);
    const senderEl=clone.querySelector('.sender');
    const textEl=clone.querySelector('.text');
    if(senderEl) senderEl.innerText=(names[msg.senderId]||'Unknown')+':';
    const txt=msg.text ?? msg.message ?? msg.body ?? msg.content ?? '';
    if(textEl) textEl.innerText=txt;
    wrap.appendChild(clone);
  }
  wrap.scrollTop=wrap.scrollHeight;
}

// send new message to backend and update UI
async function sendMessage(){
  const input=document.querySelector('#message-input');
  const active=document.querySelector('.channel.active');
  if(!input||!active) return;

  const text=input.value.trim();
  if(!text) return;

  const channelId=Number(active.getAttribute('data-channel'));
  const senderId=userIds.length ? userIds[Math.floor(Math.random()*userIds.length)] : 1;
  const payload={channelId,text,senderId,timestamp:Date.now()};

  try{
    const res=await fetch('https://slackclonebackendapi.onrender.com/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    await res.json();

    const wrap=document.querySelector('.chat-messages');
    const temp=document.querySelector('template');
    const clone=temp.content.cloneNode(true);
    const root=clone.querySelector('.message')||clone.firstElementChild;
    if(root) root.classList.add('self');
    const senderEl=clone.querySelector('.sender');
    const textEl=clone.querySelector('.text');
    if(senderEl) senderEl.innerText='You:';
    if(textEl) textEl.innerText=text;
    wrap.appendChild(clone);
    wrap.scrollTop=wrap.scrollHeight;

    input.value='';
  }catch{
    alert('Could not send message.');
  }
}

// build channel buttons and setup events
async function init(){
  try{
    const userRes=await fetch('https://slackclonebackendapi.onrender.com/users');
    const userData=await userRes.json();
    userIds=userData.map(u=>u.id).filter(id=>typeof id==='number');
  }catch{}

  const res=await fetch('https://slackclonebackendapi.onrender.com/channels');
  const channels=await res.json();

  const list=document.querySelector('.channel-list');
  if(!list) return;
  list.innerHTML='';

  channels.forEach((ch,i)=>{
    const btn=document.createElement('button');
    btn.className='channel';
    btn.setAttribute('data-channel',ch.id);
    btn.innerText=ch.name;
    btn.addEventListener('click',changeChannel);
    list.appendChild(btn);
    if(i===0){
      btn.classList.add('active');
      const title=document.querySelector('#channel-title');
      if(title) title.innerText=ch.name;
      populateMessages(ch.id);
    }
  });

  const sendBtn=document.querySelector('#chat-form button');
  const msgInput=document.querySelector('#message-input');
  if(sendBtn) sendBtn.addEventListener('click',sendMessage);
  if(msgInput) msgInput.addEventListener('keydown',e=>{if(e.key==='Enter')sendMessage();});
}

init();
