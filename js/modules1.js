// ===================== CURRENT USER =====================
let currentUser = null;
const SESSION_KEY = 'arcano_session';

// ===================== PWA INSTALL =====================
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault(); deferredPrompt = e;
  if (!localStorage.getItem('arcano_pwa_dismissed')) { var b = document.getElementById('pwa-banner'); if(b) b.style.display='block'; }
});
window.addEventListener('appinstalled', function() {
  deferredPrompt = null; var b = document.getElementById('pwa-banner'); if(b) b.style.display='none';
  localStorage.removeItem('arcano_pwa_dismissed'); toast('Arcano instalada correctamente');
});
function installPWA() {
  if (!deferredPrompt) { toast('No disponible ahora','err'); return; }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(function(c) { if(c.outcome==='accepted') toast('Instalando...'); deferredPrompt=null; });
}
function dismissPWA() { var b=document.getElementById('pwa-banner'); if(b) b.style.display='none'; localStorage.setItem('arcano_pwa_dismissed','1'); }

// ===================== PWA CONFIG =====================
const PWA_CONFIG_KEY = 'arcano_pwa_config';
const PWA_DEFAULTS = {
  name:'Arcano — Complice del Sabor', shortName:'Arcano',
  bgColor:'#1b0b07', themeColor:'#1b0b07', description:'Gestion de especias y blends para Arcano', orientation:'portrait-primary',
  colorBg2:'#221108', colorSurface:'#2a150e', colorSurface2:'#331e12',
  colorGold:'#c9963a', colorGold2:'#e8b84b', colorCream:'#f0e8d0', colorMuted:'#7a6a50',
  fontSizeBase:15, fontSizeTitle:1.9
};
function getPWAConfig() { try { return { ...PWA_DEFAULTS, ...JSON.parse(localStorage.getItem(PWA_CONFIG_KEY)||'{}') }; } catch { return {...PWA_DEFAULTS}; } }
function applyPWAConfig(cfg) {
  var r=document.documentElement;
  if(cfg.bgColor){r.style.setProperty('--bg',cfg.bgColor);document.body.style.background=cfg.bgColor;}
  if(cfg.colorBg2) r.style.setProperty('--bg2',cfg.colorBg2);
  if(cfg.colorSurface) r.style.setProperty('--surface',cfg.colorSurface);
  if(cfg.colorSurface2) r.style.setProperty('--surface2',cfg.colorSurface2);
  if(cfg.colorGold) r.style.setProperty('--gold',cfg.colorGold);
  if(cfg.colorGold2) r.style.setProperty('--gold2',cfg.colorGold2);
  if(cfg.colorCream) r.style.setProperty('--cream',cfg.colorCream);
  if(cfg.colorMuted) r.style.setProperty('--muted',cfg.colorMuted);
  if(cfg.fontSizeBase){r.style.setProperty('--fs-base',cfg.fontSizeBase+'px');document.body.style.fontSize=cfg.fontSizeBase+'px';}
  if(cfg.fontSizeTitle) r.style.setProperty('--fs-title',cfg.fontSizeTitle+'rem');
  if(cfg.themeColor){var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=cfg.themeColor;}
  if(cfg.shortName){document.title=cfg.name||cfg.shortName;var br=document.querySelector('.header-brand');if(br)br.textContent=cfg.shortName;var sb=document.querySelector('.header-sub');if(sb)sb.textContent=cfg.description||'';}
}
function syncColorInput(type){var t=document.getElementById('pwa-cfg-'+type+'-text'),p=document.getElementById('pwa-cfg-'+type);if(t&&p&&/^#[0-9a-fA-F]{6}$/.test(t.value)){p.value=t.value;previewPWA();}}
function previewPWA(){
  ['bg','theme','bg2','surface','surface2','gold','gold2','cream','muted'].forEach(function(k){var p=document.getElementById('pwa-cfg-'+k),t=document.getElementById('pwa-cfg-'+k+'-text');if(p&&t)t.value=p.value;});
  var fb=document.getElementById('pwa-cfg-fs-base'),fv=document.getElementById('pwa-cfg-fs-base-val');if(fb&&fv)fv.textContent=fb.value+'px';
  var ft=document.getElementById('pwa-cfg-fs-title'),ftv=document.getElementById('pwa-cfg-fs-title-val');if(ft&&ftv)ftv.textContent=ft.value+'rem';
  var pb=document.getElementById('pwa-preview-box'),bg=document.getElementById('pwa-cfg-bg');if(pb&&bg)pb.style.background=bg.value;
  var s=document.getElementById('pwa-cfg-short'),d=document.getElementById('pwa-cfg-desc');
  var pn=document.getElementById('pwa-preview-name'),pd=document.getElementById('pwa-preview-desc');
  if(pn)pn.textContent=(s?s.value.trim():'')||'Arcano';if(pd)pd.textContent=(d?d.value.trim():'')||'Complice del Sabor';
  applyPWAConfig(readPWAConfigFromUI());
}
function readPWAConfigFromUI(){
  var v=function(id){var e=document.getElementById(id);return e?e.value:'';};
  return{name:v('pwa-cfg-name').trim()||PWA_DEFAULTS.name,shortName:v('pwa-cfg-short').trim()||PWA_DEFAULTS.shortName,
    description:v('pwa-cfg-desc').trim()||PWA_DEFAULTS.description,bgColor:v('pwa-cfg-bg'),themeColor:v('pwa-cfg-theme'),
    orientation:v('pwa-cfg-orient')||'portrait-primary',colorBg2:v('pwa-cfg-bg2'),colorSurface:v('pwa-cfg-surface'),
    colorSurface2:v('pwa-cfg-surface2'),colorGold:v('pwa-cfg-gold'),colorGold2:v('pwa-cfg-gold2'),
    colorCream:v('pwa-cfg-cream'),colorMuted:v('pwa-cfg-muted'),fontSizeBase:parseInt(v('pwa-cfg-fs-base'))||15,fontSizeTitle:parseFloat(v('pwa-cfg-fs-title'))||1.9};
}
function loadPWAConfigUI(){
  var cfg=getPWAConfig(),s=function(id,val){var e=document.getElementById(id);if(e)e.value=val;};
  s('pwa-cfg-name',cfg.name);s('pwa-cfg-short',cfg.shortName);s('pwa-cfg-desc',cfg.description);
  s('pwa-cfg-bg',cfg.bgColor);s('pwa-cfg-bg-text',cfg.bgColor);s('pwa-cfg-theme',cfg.themeColor);s('pwa-cfg-theme-text',cfg.themeColor);
  s('pwa-cfg-orient',cfg.orientation||'portrait-primary');
  s('pwa-cfg-bg2',cfg.colorBg2);s('pwa-cfg-bg2-text',cfg.colorBg2);s('pwa-cfg-surface',cfg.colorSurface);s('pwa-cfg-surface-text',cfg.colorSurface);
  s('pwa-cfg-surface2',cfg.colorSurface2);s('pwa-cfg-surface2-text',cfg.colorSurface2);
  s('pwa-cfg-gold',cfg.colorGold);s('pwa-cfg-gold-text',cfg.colorGold);s('pwa-cfg-gold2',cfg.colorGold2);s('pwa-cfg-gold2-text',cfg.colorGold2);
  s('pwa-cfg-cream',cfg.colorCream);s('pwa-cfg-cream-text',cfg.colorCream);s('pwa-cfg-muted',cfg.colorMuted);s('pwa-cfg-muted-text',cfg.colorMuted);
  s('pwa-cfg-fs-base',cfg.fontSizeBase);s('pwa-cfg-fs-title',cfg.fontSizeTitle);
  var badge=document.getElementById('pwa-status-badge'),instBtn=document.getElementById('pwa-install-btn-settings');
  var isSA=window.matchMedia('(display-mode:standalone)').matches||navigator.standalone;
  if(badge){if(isSA){badge.className='badge bg';badge.textContent='Instalada';}else if(deferredPrompt){badge.className='badge ba';badge.textContent='Disponible';}else{badge.className='badge by';badge.textContent='No instalada';}}
  if(instBtn)instBtn.style.display=(!isSA&&deferredPrompt)?'':'none';
  previewPWA();
}
function guardarPWAConfig(){var c=readPWAConfigFromUI();localStorage.setItem(PWA_CONFIG_KEY,JSON.stringify(c));applyPWAConfig(c);toast('Configuracion guardada');}
function resetPWAConfig(){localStorage.removeItem(PWA_CONFIG_KEY);applyPWAConfig(PWA_DEFAULTS);loadPWAConfigUI();toast('Configuracion restaurada');}

// ===================== PIN / LOGIN =====================
function initPin() {
  var screen = document.getElementById('pin-screen'), db = getDB();
  try { var saved=JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); if(saved&&saved.userId){var u=db.usuarios.find(function(x){return x.id===saved.userId});if(u){currentUser=u;screen.style.display='none';updateUserChip();renderDashboard();return;}} } catch{}
  function showUserList() {
    screen.innerHTML = '<div style="text-align:center"><img src="icons/logo-pin.png?v=14" style="width:80px;height:80px;margin-bottom:4px;object-fit:contain"><div class="pin-logo">Arcano</div><div class="pin-sub">Complice del Sabor</div></div><div class="user-list" style="margin-top:8px">' +
      db.usuarios.map(function(u){return '<button class="user-btn" onclick="selectUser('+u.id+')"><div class="user-avatar">'+u.emoji+'</div><div><div style="font-size:.95rem;font-weight:700">'+u.nombre+'</div><div style="font-size:.7rem;color:var(--muted)">'+u.rol+'</div></div></button>';}).join('') + '</div>';
  }
  window.selectUser = function(uid) {
    var user=db.usuarios.find(function(x){return x.id===uid});if(!user)return;var entered='';
    screen.innerHTML='<div class="pin-logo">Arcano</div><div class="pin-sub">'+user.emoji+' '+user.nombre+'</div><div class="pin-display" id="pin-dots">'+[0,1,2,3].map(function(){return '<div class="pin-dot"></div>';}).join('')+'</div><div class="pin-pad">'+[1,2,3,4,5,6,7,8,9,'←',0,'OK'].map(function(k){return '<button class="pin-digit" onclick="pinKey(\''+k+'\')">'+k+'</button>';}).join('')+'</div><button class="btn btn-ghost btn-sm" onclick="initPin()" style="margin-top:4px">← Volver</button><div id="pin-err" style="color:#e07070;font-size:.8rem;min-height:18px;margin-top:4px"></div>';
    window.pinKey=function(k){if(k==='←')entered=entered.slice(0,-1);else if(k==='OK'){if(entered===user.pin){currentUser=user;localStorage.setItem(SESSION_KEY,JSON.stringify({userId:user.id}));screen.style.display='none';updateUserChip();renderDashboard();}else{entered='';document.getElementById('pin-err').textContent='PIN incorrecto';setTimeout(function(){var e=document.getElementById('pin-err');if(e)e.textContent='';},1500);}}else if(entered.length<4)entered+=k;document.querySelectorAll('.pin-dot').forEach(function(d,i){d.classList.toggle('filled',i<entered.length);});};
  };
  showUserList();
}
function updateUserChip() {
  var chip=document.getElementById('user-chip');if(chip&&currentUser)chip.innerHTML=currentUser.emoji+' '+currentUser.nombre+' <span style="color:var(--muted);font-size:.7rem">▼</span>';
  var nav=document.getElementById('nav-ajustes');if(nav)nav.style.display=(currentUser&&currentUser.rol==='admin')?'':'none';
}
function logoutUser(){currentUser=null;localStorage.removeItem(SESSION_KEY);document.getElementById('pin-screen').style.display='flex';initPin();}

// ===================== NAV =====================
function goPage(name, btn) {
  if(name==='ajustes'&&currentUser&&currentUser.rol!=='admin')return;
  document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});
  document.getElementById('page-'+name).classList.add('active');
  if(btn)btn.classList.add('active');
  var renders={dashboard:renderDashboard,costos:renderCostos,productos:renderProductos,envases:renderEnvases,blends:renderBlends,ventas:renderVentas,reportes:renderReportes,ajustes:renderAjustes};
  if(renders[name])renders[name]();
  var be=document.getElementById('btn-export-blends');if(be)be.style.display=(currentUser&&currentUser.rol==='admin'&&name==='blends')?'':'none';
  if(name==='ajustes'&&currentUser&&currentUser.rol==='admin')loadPWAConfigUI();
}

// ===================== DASHBOARD =====================
function renderDashboard() {
  var db=getDB(),c=db.costos,hoy=new Date();hoy.setHours(0,0,0,0);
  var mesStart=new Date(hoy.getFullYear(),hoy.getMonth(),1);
  var vHoy=db.ventas.filter(function(v){return new Date(v.fecha)>=hoy&&v.estado!=='cancelada';});
  var vMes=db.ventas.filter(function(v){return new Date(v.fecha)>=mesStart&&v.estado!=='cancelada';});
  var ingHoy=vHoy.reduce(function(s,v){return s+v.total;},0);
  var ingMes=vMes.reduce(function(s,v){return s+v.total;},0);
  var stockBajo=db.especias.filter(function(e){return e.stock<=e.stockMin;}).length;
  var envBajo=(db.envases||[]).filter(function(e){return e.stock<=e.stockMin;}).length;
  document.getElementById('dash-stats').innerHTML=
    '<div class="stat"><div class="stat-label">Ventas hoy</div><div class="stat-value">'+fmt(ingHoy)+'</div><div class="stat-sub">'+vHoy.length+' operaciones</div></div>'+
    '<div class="stat"><div class="stat-label">Ventas mes</div><div class="stat-value">'+fmt(ingMes)+'</div><div class="stat-sub">'+vMes.length+' operaciones</div></div>'+
    '<div class="stat"><div class="stat-label">Stock bajo</div><div class="stat-value" style="color:'+(stockBajo?'#e07070':'#7ecf7e')+'">'+stockBajo+'</div><div class="stat-sub">Especias</div></div>'+
    '<div class="stat"><div class="stat-label">Envases bajo</div><div class="stat-value" style="color:'+(envBajo?'#e07070':'#7ecf7e')+'">'+envBajo+'</div><div class="stat-sub">Unidades</div></div>';
  // Chart 7 days
  var days=[];for(var i=6;i>=0;i--){var d=new Date(hoy);d.setDate(d.getDate()-i);days.push(d);}
  var maxV=1;
  var dayTotals=days.map(function(d){var t=db.ventas.filter(function(v){var vd=new Date(v.fecha);return vd.toDateString()===d.toDateString()&&v.estado!=='cancelada';}).reduce(function(s,v){return s+v.total;},0);if(t>maxV)maxV=t;return t;});
  document.getElementById('chart-7d').innerHTML=dayTotals.map(function(t,i){var h=Math.max(2,t/maxV*90);return '<div class="bar-col"><div class="bar-val">'+fmt(t)+'</div><div class="bar" style="height:'+h+'px"></div><div class="bar-lbl">'+days[i].getDate()+'</div></div>';}).join('');
  // Stock bajo
  document.getElementById('dash-stock-bajo').innerHTML=db.especias.filter(function(e){return e.stock<=e.stockMin;}).slice(0,5).map(function(e){return '<div class="mov-row"><span class="mov-out">●</span><span>'+e.nombre+'</span><span class="stock-low" style="margin-left:auto">'+e.stock+'g</span></div>';}).join('')||'<div class="text-muted text-sm">Sin alertas</div>';
  // Ultimas ventas
  document.getElementById('dash-ventas-tabla').innerHTML=db.ventas.slice(-5).reverse().map(function(v){return '<tr><td>'+fmtDate(v.fecha)+'</td><td>'+v.items.map(function(it){return it.nombre;}).join(', ')+'</td><td class="text-gold fw7">'+fmt(v.total)+'</td><td><span class="badge '+(v.estado==='completada'?'bg':v.estado==='cancelada'?'br':'by')+'">'+v.estado+'</span></td></tr>';}).join('');
  // Top products
  var prodMap={};db.ventas.filter(function(v){return v.estado!=='cancelada';}).forEach(function(v){v.items.forEach(function(it){if(!prodMap[it.nombre])prodMap[it.nombre]={nombre:it.nombre,cant:0,total:0};prodMap[it.nombre].cant+=it.qty;prodMap[it.nombre].total+=it.precio*it.qty;});});
  var top=Object.values(prodMap).sort(function(a,b){return b.total-a.total;}).slice(0,5);
  document.getElementById('dash-top').innerHTML=top.map(function(p,i){return '<div class="mov-row"><span class="text-gold fw7">#'+(i+1)+'</span><span style="flex:1">'+p.nombre+'</span><span class="text-muted">'+p.cant+'u · '+fmt(p.total)+'</span></div>';}).join('')||'<div class="text-muted text-sm">Sin datos</div>';
}

// ===================== COSTOS =====================
function renderCostos() {
  var db=getDB(),c=db.costos;
  document.getElementById('c-env-c').value=c.envChico;document.getElementById('c-env-g').value=c.envGrande;
  document.getElementById('c-pkg-c').value=c.pkgChico;document.getElementById('c-pkg-g').value=c.pkgGrande;
  document.getElementById('c-etiq').value=c.etiqueta;document.getElementById('c-mo').value=c.mo;document.getElementById('c-otros').value=c.otros;
  var fc=c.envChico+c.pkgChico+c.etiqueta+c.mo+c.otros;
  var fg=c.envGrande+c.pkgGrande+c.etiqueta+c.mo+c.otros;
  document.getElementById('resumen-costos').innerHTML=
    '<div class="cost-box"><div class="cost-row"><span>Envase chico</span><span>'+fmt(c.envChico)+'</span></div><div class="cost-row"><span>Packaging</span><span>'+fmt(c.pkgChico)+'</span></div><div class="cost-row"><span>Etiqueta</span><span>'+fmt(c.etiqueta)+'</span></div><div class="cost-row"><span>MO</span><span>'+fmt(c.mo)+'</span></div><div class="cost-row"><span>Otros</span><span>'+fmt(c.otros)+'</span></div><div class="cost-row total"><span>Total chico</span><span>'+fmt(fc)+'</span></div></div>'+
    '<div class="cost-box"><div class="cost-row"><span>Envase grande</span><span>'+fmt(c.envGrande)+'</span></div><div class="cost-row"><span>Packaging</span><span>'+fmt(c.pkgGrande)+'</span></div><div class="cost-row"><span>Etiqueta</span><span>'+fmt(c.etiqueta)+'</span></div><div class="cost-row"><span>MO</span><span>'+fmt(c.mo)+'</span></div><div class="cost-row"><span>Otros</span><span>'+fmt(c.otros)+'</span></div><div class="cost-row total"><span>Total grande</span><span>'+fmt(fg)+'</span></div></div>';
}
function saveCostos(){var db=getDB();db.costos.envChico=+document.getElementById('c-env-c').value;db.costos.envGrande=+document.getElementById('c-env-g').value;db.costos.pkgChico=+document.getElementById('c-pkg-c').value;db.costos.pkgGrande=+document.getElementById('c-pkg-g').value;db.costos.etiqueta=+document.getElementById('c-etiq').value;db.costos.mo=+document.getElementById('c-mo').value;db.costos.otros=+document.getElementById('c-otros').value;saveDB(db);}

// ===================== PRODUCTOS (unified) =====================
let productoTab = 'especias';
function renderProductos() {
  var tabs='<div class="tabs mb-20"><button class="tab '+(productoTab==='especias'?'active':'')+'" onclick="productoTab=\'especias\';renderProductos()">Especias</button><button class="tab '+(productoTab==='blends'?'active':'')+'" onclick="productoTab=\'blends\';renderProductos()">Blends</button><button class="tab '+(productoTab==='packs'?'active':'')+'" onclick="productoTab=\'packs\';renderProductos()">Packs</button></div>';
  var search='<div class="search-wrap mb-16"><input id="search-prod" placeholder="Buscar..." oninput="renderProductos()"></div>';
  var q=(document.getElementById('search-prod')||{}).value||'';q=q.toLowerCase();
  var body='';
  if(productoTab==='especias'){
    var db=getDB();
    var list=db.especias.filter(function(e){return e.nombre.toLowerCase().includes(q);});
    body='<div class="card"><div class="tw"><table><thead><tr><th>Nombre</th><th>Precio/kg</th><th>Precio/100g</th><th>Stock</th><th>Estado</th><th></th></tr></thead><tbody>'+list.map(function(e){var p100=e.precioKg?Math.round(e.precioKg/100):0;return '<tr><td class="fw7">'+e.nombre+'</td><td>'+fmt(e.precioKg)+'</td><td>'+fmt(p100)+'</td><td>'+fmtG(e.stock)+'</td><td><span class="'+(e.stock<=e.stockMin?'stock-low':'stock-ok')+'">'+(e.stock<=e.stockMin?'Bajo':'OK')+'</span></td><td><div class="flex gap-8"><button class="btn btn-ghost btn-sm" onclick="openModalEspecia('+e.id+')">✏</button><button class="btn btn-ghost btn-sm" onclick="openModalStock('+e.id+')">📦</button>'+(currentUser&&currentUser.rol==='admin'?'<button class="btn btn-red btn-sm" onclick="eliminarEspecia('+e.id+')">🗑</button>':'')+'</div></td></tr>';}).join('')+'</tbody></table></div></div>';
  } else if(productoTab==='blends'){
    var db=getDB(),c=db.costos;
    var list=db.blends.filter(function(b){return b.nombre.toLowerCase().includes(q);});
    body='<div class="card"><div class="tw"><table><thead><tr><th>Nombre</th><th>Costo/kg</th><th>Env. Chico</th><th>Env. Grande</th><th>Prod. Chico</th><th>Prod. Grande</th><th></th></tr></thead><tbody>'+list.map(function(bl){var cd=calcBlendCostData(bl,c),pr=calcProduccion(bl,db.especias);return '<tr><td class="fw7">'+bl.nombre+'</td><td class="text-gold">'+fmt(cd.costoKg)+'</td><td>'+(bl.pVentaChico?fmt(bl.pVentaChico)+' / '+fmtG(bl.pesoChico):'—')+'</td><td>'+(bl.pVentaGrande?fmt(bl.pVentaGrande)+' / '+fmtG(bl.pesoGrande):'—')+'</td><td>'+pr.unidadesC+' u.</td><td>'+pr.unidadesG+' u.</td><td><button class="btn btn-ghost btn-sm" onclick="goPage(\'blends\')">Ver</button></td></tr>';}).join('')+'</tbody></table></div></div>';
  } else {
    body='<div class="card"><div class="empty"><div class="empty-icon">📦</div><p>Packs disponibles pronto</p></div></div>';
  }
  var adminBtn=(currentUser&&currentUser.rol==='admin'&&(productoTab==='especias'))?'<button class="btn btn-gold" onclick="openModalEspecia()">+ Nueva especia</button>':'';
  document.getElementById('lista-productos').innerHTML=tabs+'<div class="flex items-center justify-between mb-20"><div class="page-title" style="margin:0">Productos</div>'+adminBtn+'</div>'+search+body;
}

// ===================== ENVASES =====================
function renderEnvases() {
  var db=getDB(),envases=db.envases||[];
  if(!envases.length){document.getElementById('lista-envases').innerHTML='<div class="empty"><div class="empty-icon">📦</div><p>No hay envases. Crea el primero.</p></div>';return;}
  document.getElementById('lista-envases').innerHTML=
    '<div class="card"><div class="tw"><table><thead><tr><th>Nombre</th><th>Tipo</th><th>Peso</th><th>Stock</th><th>Min.</th><th>Precio</th><th>Estado</th><th></th></tr></thead><tbody>'+
    envases.map(function(e){return '<tr><td class="fw7">'+e.nombre+'</td><td><span class="badge '+(e.tipo==='chico'?'ba':'by')+'">'+e.tipo+'</span></td><td>'+(e.peso?fmtG(e.peso):'—')+'</td><td>'+e.stock+' u.</td><td>'+e.stockMin+' u.</td><td>'+fmt(e.precio)+'</td><td><span class="'+(e.stock<=e.stockMin?'stock-low':'stock-ok')+'">'+(e.stock<=e.stockMin?'Bajo':'OK')+'</span></td><td><div class="flex gap-8"><button class="btn btn-ghost btn-sm" onclick="openModalEnvStock('+e.id+')">📦 Stock</button>'+(currentUser&&currentUser.rol==='admin'?'<button class="btn btn-ghost btn-sm" onclick="openModalEnvase('+e.id+')">✏</button><button class="btn btn-red btn-sm" onclick="eliminarEnvase('+e.id+')">🗑</button>':'')+'</div></td></tr>';}).join('')+
    '</tbody></table></div></div>';
}