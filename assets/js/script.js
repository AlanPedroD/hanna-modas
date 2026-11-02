/* ====== CONFIGURAÇÃO — preencha com os dados da cliente ====== */
const CONFIG={
 firebase:{
  apiKey:"AIzaSyA15E8pflCZPNoHTwOVAE_DDyOMgSHKkeo",
  authDomain:"catalogo-moda-intima-37770.firebaseapp.com",
  projectId:"catalogo-moda-intima-37770",
  appId:"1:355101146407:web:b901ccc4422281ae17fd02"
 },
 cloudinary:{cloudName:"ddojjqwky",uploadPreset:"moda_intima"},
 whatsapp:"5582996429077",
 loja:"Hanna moda íntima"
};

/* ============================================================= */
const DEMO=!CONFIG.firebase.apiKey;
const $=s=>document.querySelector(s);
const brl=n=>Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CATS=['Sutiãs','Calcinhas','Conjuntos'];

let products=[],cat='Todos',sel={},cart=JSON.parse(localStorage.getItem('cart')||'{}'),db,auth,fb={};

/* Contatos */
$('#yr').textContent=new Date().getFullYear();
const wl='https://wa.me/'+CONFIG.whatsapp;
$('#wa').href=wl+'?text='+encodeURIComponent('Olá! Gostaria de mais informações.');
$('#wa2').href=wl;
$('#waEncomenda').href=wl+'?text='+encodeURIComponent('Olá! Gostaria de fazer uma encomenda ou saber sobre outros tamanhos.');

/* Disponibilidade de um item do carrinho (chave = id|tamanho) */
const parse=k=>{const [id,size]=k.split('|');return{id,size,p:products.find(x=>x.id===id)};};
const avail=k=>{const {size,p}=parse(k);return !!p&&!p.soldOut&&(!p.sizes?.length||p.sizes.includes(size));};

/* Dados */
async function init(){
 if(DEMO){
  products=[
   {id:'1',name:'Sutiã Renda Suave',desc:'Sem bojo, com renda delicada e conforto o dia todo.',price:79.9,badge:'Novo',cat:'Sutiãs',sizes:['P','M','G'],img:''},
   {id:'2',name:'Calcinha Algodão Conforto',desc:'Algodão macio, com costura discreta.',price:34.9,oldPrice:44.9,badge:'Promoção',cat:'Calcinhas',sizes:['P','M','G','GG'],img:''},
   {id:'3',name:'Conjunto Renda Rosé',desc:'Sutiã e calcinha combinando.',price:109.9,badge:'Mais vendido',cat:'Conjuntos',sizes:['P','M','G'],img:''},
   {id:'4',name:'Sutiã Modelador',desc:'Sustentação com acabamento liso.',price:89.9,cat:'Sutiãs',sizes:['M','G'],soldOut:true,img:''}];
  render();return;
 }
 const A=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
 const F=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
 const U=await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
 const app=A.initializeApp(CONFIG.firebase);db=F.getFirestore(app);auth=U.getAuth(app);fb={...F,...U};
 fb.onSnapshot(fb.collection(db,'products'),s=>{
  products=s.docs.map(d=>({id:d.id,...d.data()}));
  const gone=Object.keys(cart).filter(k=>!avail(k));
  if(gone.length){gone.forEach(k=>delete cart[k]);save();toast('Itens indisponíveis foram removidos do carrinho.');}
  render();
 });
}

/* Menu */
$('#cats').innerHTML=['Todos',...CATS].map(c=>`<li><button data-c="${c}">${c}</button></li>`).join('');
const setMenu=o=>{$('#nav').classList.toggle('open',o);$('#burger').classList.toggle('open',o);$('#burger').setAttribute('aria-expanded',o);$('#burger').setAttribute('aria-label',o?'Fechar menu':'Abrir menu');};
$('#burger').onclick=()=>setMenu(!$('#nav').classList.contains('open'));
$('#cats').onclick=e=>{const c=e.target.dataset.c;if(!c)return;cat=c;setMenu(false);render();};

/* Catálogo */
function render(){
 document.querySelectorAll('#cats button').forEach(b=>b.classList.toggle('on',b.dataset.c===cat));
 const list=cat==='Todos'?products:products.filter(p=>p.cat===cat);
 $('#grid').innerHTML=list.length?list.map(p=>`<article class="card ${p.soldOut?'out':''}">
  ${p.badge?`<span class="badge ${esc(p.badge)}">${esc(p.badge)}</span>`:''}
  <div class="im">${p.img?`<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">`:'✦'}${p.soldOut?'<span class="out-tag">ESGOTADO</span>':''}</div>
  <div class="b"><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
  ${p.sizes?.length?`<div class="sz" role="group" aria-label="Tamanho">${p.sizes.map(s=>`<button data-pid="${p.id}" data-z="${esc(s)}" class="${sel[p.id]===s?'on':''}">${esc(s)}</button>`).join('')}</div>`:''}
  <div class="pr">${p.badge==='Promoção'&&p.oldPrice?`<s>${brl(p.oldPrice)}</s>`:''}<b class="${p.badge==='Promoção'?'promo':''}">${brl(p.price)}</b></div>
  <button class="add" data-id="${p.id}" ${p.soldOut?'disabled':''}>${p.soldOut?'Indisponível':'Adicionar'}</button></div></article>`).join(''):'<p class="empty">Nenhum produto nesta categoria ainda.</p>';
 renderCart();renderAdminList();
}
$('#grid').onclick=e=>{
 const img=e.target.closest('.im img');
 if(img){$('#zoomImg').src=img.src;$('#zoomImg').alt=img.alt;$('#zoom').classList.add('open');return;}
 const z=e.target.dataset.z;
 if(z){sel[e.target.dataset.pid]=z;render();return;}
 const id=e.target.dataset.id;if(!id)return;
 const p=products.find(x=>x.id===id);if(!p||p.soldOut)return;
 if(p.sizes?.length&&!sel[id])return toast('Escolha um tamanho antes de adicionar.');
 const k=id+'|'+(sel[id]||'');cart[k]=(cart[k]||0)+1;saveCart();toast('Produto adicionado ao carrinho!');
};
const closeZoom=()=>$('#zoom').classList.remove('open');
$('#zoomClose').onclick=closeZoom;
$('#zoom').onclick=e=>{if(e.target.id==='zoom')closeZoom();};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeZoom();});

/* Carrinho */
const save=()=>localStorage.setItem('cart',JSON.stringify(cart));
function saveCart(){save();renderCart();}
const open=o=>{$('#drawer').classList.toggle('open',o);$('#ov').classList.toggle('open',o);};
$('#cartBtn').onclick=()=>open(true);$('#closeCart').onclick=$('#ov').onclick=()=>open(false);
function renderCart(){
 const keys=Object.keys(cart);let total=0,bad=false;
 $('#cnt').textContent=keys.reduce((s,k)=>s+cart[k],0);
 $('#items').innerHTML=keys.length?keys.map(k=>{
  const {size,p}=parse(k),q=cart[k];
  if(!avail(k)){bad=products.length>0||bad;return `<div class="it"><div class="t">⚠</div><div><b>Produto indisponível</b><small class="off">Remova para continuar.</small></div><button data-d="${esc(k)}" aria-label="Remover">🗑</button></div>`;}
  total+=p.price*q;
  return `<div class="it"><div class="t">${p.img?`<img src="${esc(p.img)}" alt="">`:'✦'}</div>
  <div><b>${esc(p.name)}</b>${size?`<small>Tamanho: ${esc(size)}</small>`:''}<small>${brl(p.price)} un.</small>
  <div class="q"><button data-m="${esc(k)}" aria-label="Diminuir" ${q<2?'disabled':''}>−</button>${q}<button data-p="${esc(k)}" aria-label="Aumentar">+</button></div></div>
  <div style="text-align:right"><b>${brl(p.price*q)}</b><br><button data-d="${esc(k)}" aria-label="Excluir">🗑</button></div></div>`;}).join(''):'<p class="empty">Seu carrinho está vazio.</p>';
 $('#total').textContent=brl(total);
 $('#checkout').disabled=!keys.length||bad;$('#checkout').style.opacity=$('#checkout').disabled?.4:1;
}
$('#items').onclick=e=>{const t=e.target.closest('button');if(!t||t.disabled)return;const d=t.dataset;
 if(d.p)cart[d.p]++;if(d.m&&cart[d.m]>1)cart[d.m]--;if(d.d)delete cart[d.d];saveCart();};
$('#checkout').onclick=()=>{
 const keys=Object.keys(cart);
 if(!keys.length||keys.some(k=>!avail(k)))return toast('Remova os produtos indisponíveis.');
 const n=new Date();
 const data=n.toLocaleDateString('pt-BR')+' às '+n.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
 let total=0;
 const linhas=keys.map((k,i)=>{const {size,p}=parse(k),q=cart[k];total+=p.price*q;
  return `*${i+1}. ${p.name}*${size?`\nTamanho: *${size}*`:''}\n${q} un. × ${brl(p.price)} = *${brl(p.price*q)}*`;}).join('\n\n');
 const linha='━━━━━━━━━━━━━━━';
 const msg=`✨ *NOVO PEDIDO • ${CONFIG.loja}* ✨\n📅 ${data}\n\n${linha}\n🛍️ *ITENS DO PEDIDO*\n${linha}\n\n${linhas}\n\n${linha}\n💰 *TOTAL: ${brl(total)}*\n${linha}\n\nOlá! Gostaria de finalizar este pedido. Poderia me informar as formas de pagamento e de entrega? 😊`;
 window.open(wl+'?text='+encodeURIComponent(msg),'_blank');
 cart={};saveCart();open(false);
 toast('Pedido enviado! Continue a conversa pelo WhatsApp.');
};
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2200);}

/* Painel administrativo */
$('#pc').innerHTML=CATS.map(c=>`<option>${c}</option>`).join('');
$('#adminLink').onclick=()=>{$('#admin').classList.add('open');const ok=DEMO||auth.currentUser;$('#login').style.display=ok?'none':'grid';$('#panel').style.display=ok?'block':'none';renderAdminList();};
$('#closeAdmin').onclick=()=>$('#admin').classList.remove('open');
$('#login').onsubmit=async e=>{e.preventDefault();try{await fb.signInWithEmailAndPassword(auth,$('#em').value,$('#pw').value);$('#login').style.display='none';$('#panel').style.display='block';}catch{toast('E-mail ou senha incorretos.');}};
$('#logout').onclick=async()=>{if(!DEMO)await fb.signOut(auth);$('#admin').classList.remove('open');};
function renderAdminList(){
 $('#alist').innerHTML=products.map(p=>`<div class="ar">${p.img?`<img src="${esc(p.img)}" alt="">`:'<div class="ph"></div>'}<div><b>${esc(p.name)}</b><br><small>${esc(p.cat)} · ${brl(p.price)}${p.sizes?.length?' · '+esc(p.sizes.join('/')):''}${p.soldOut?' · ESGOTADO':''}</small></div><button class="lk" data-e="${p.id}">Editar</button><button class="lk" style="color:var(--red)" data-x="${p.id}">Excluir</button></div>`).join('');
}
async function upload(file){
 const c=CONFIG.cloudinary;if(!c.cloudName)return{url:URL.createObjectURL(file),pid:''};
 const fd=new FormData();fd.append('file',file);fd.append('upload_preset',c.uploadPreset);
 const r=await fetch(`https://api.cloudinary.com/v1_1/${c.cloudName}/image/upload`,{method:'POST',body:fd});
 if(!r.ok)throw new Error('upload');const j=await r.json();return{url:j.secure_url,pid:j.public_id};
}
$('#alist').onclick=async e=>{
 const d=e.target.dataset,p=products.find(x=>x.id===(d.e||d.x));if(!p)return;
 if(d.e){$('#pid').value=p.id;$('#pn').value=p.name;$('#pd').value=p.desc;$('#pc').value=p.cat;$('#pb').value=p.badge||'';$('#pp').value=p.price;$('#po').value=p.oldPrice||'';$('#ps').value=(p.sizes||[]).join(', ');$('#px').checked=!!p.soldOut;$('#imgst').textContent=p.img?'Imagem atual mantida, a menos que você escolha outra.':'';scrollTo(0,0);}
 if(d.x&&confirm(`Excluir "${p.name}"?`)){
  if(DEMO)products=products.filter(x=>x.id!==p.id);else await fb.deleteDoc(fb.doc(db,'products',p.id));
  render();toast('Produto excluído.');
 }
};
$('#pf').onsubmit=async e=>{
 e.preventDefault();
 const antigo=products.find(x=>x.id===$('#pid').value);
 if(!$('#pf_img').files[0]&&!antigo?.img)return toast('Escolha uma foto do produto.');
 const b=$('#save');b.disabled=true;b.textContent='Salvando...';
 try{
  const id=$('#pid').value,old=products.find(x=>x.id===id),f=$('#pf_img').files[0];
  let img=old?.img||'',publicId=old?.publicId||'';
  if(f){const u=await upload(f);img=u.url;publicId=u.pid;}
  const badge=$('#pb').value,sizes=$('#ps').value.split(',').map(s=>s.trim().toUpperCase()).filter(Boolean);
  const data={name:$('#pn').value.trim(),desc:$('#pd').value.trim(),cat:$('#pc').value,badge,price:parseFloat($('#pp').value),oldPrice:badge==='Promoção'?parseFloat($('#po').value)||null:null,sizes,soldOut:$('#px').checked,img,publicId};
  if(DEMO){if(id)Object.assign(old,data);else products.push({id:String(Date.now()),...data});render();}
  else if(id)await fb.setDoc(fb.doc(db,'products',id),data);else await fb.addDoc(fb.collection(db,'products'),data);
  $('#pf').reset();$('#pid').value='';$('#imgst').textContent='';toast('Produto salvo!');
 }catch{toast('Não foi possível salvar. Tente novamente.');}
 b.disabled=false;b.textContent='Salvar produto';
};
init();
