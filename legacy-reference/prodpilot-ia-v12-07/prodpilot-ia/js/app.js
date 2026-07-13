/* ProdPilot IA — Logique applicative */
/* ================================================================
   HELPERS
   ================================================================ */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const ICONS = {
  factory:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>',
  dash:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  list:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  cal:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
  inbox:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
  check:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  chart:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/></svg>',
  homeic:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  spark:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>',
  bell:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
  search:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  print:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>',
  alert:'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/></svg>',
  db:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>',
  doc:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
  gear:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.92 4a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 3.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.45.5.8.94 1H21a2 2 0 1 1 0 4h-.09c-.44.2-.8.55-.94 1Z"/></svg>',
};

const DEFAULT_NAV_ITEMS = [
  { id:"espace",    label:"Mon espace", icon:"homeic" },
  { id:"home",      label:"Accueil", icon:"spark" },
  { id:"tournee",   label:"Tournée atelier", icon:"factory" },
  { id:"parc",      label:"Parc machines", icon:"factory" },
  { id:"of",        label:"Ordres de fabrication", icon:"list" },
  { id:"planning",  label:"Planning machines", icon:"cal" },
  { id:"demandes",  label:"Demandes", icon:"inbox" },
  { id:"actions",   label:"Actions", icon:"check" },
  { id:"kpi",       label:"KPI & analyses", icon:"chart" },
  { id:"dataq",     label:"Qualité données ERP", icon:"db" },
  { id:"meetings",  label:"Réunions", icon:"cal" },
  { id:"settings",  label:"Réglages", icon:"gear" },
];
const TITRES = {
  espace:["Mon espace","Votre bureau numérique — toute la journée part d'ici"],
  home:["Accueil","Votre briefing quotidien — décisions, priorités et assistant IA"],
  dashboard:["Tableau de bord","Vue d'ensemble de l'atelier — juillet 2026"],
  tournee:["Tournée atelier","Saisie rapide de l’état machines et analyse des causes d’arrêt"],
  parc:["Parc machines","État du parc, fiches machines, planning maintenance et documents — aide à la décision planning"],
  of:["Ordres de fabrication","Suivi des OF et de leurs gammes opératoires"],
  planning:["Planning machines — juillet 2026","Ordonnancement mensuel (S28 → S31) — glissez-déposez les blocs pour replanifier"],
  demandes:["Centre de demandes","Créer, suivre et approuver les demandes de production — remplace les e-mails"],
  actions:["Actions","Plan d'actions lié aux OF et aux clients"],
  kpi:["KPI & analyses","Indicateurs de performance de production"],
  dataq:["Qualité des données ERP","Détection des OF incomplets ou incohérents — alertes vers les services responsables"],
  meetings:["Réunions","Choisissez le type de réunion : QRQC quotidien ou Réunion de production"],
  settings:["Réglages","Personnalisez les templates, listes et comportements sans modifier le code"],
};

/* État global */
let state = { page:"espace", selectedOF:null, printMachine:null, fStatut:"Tous", fClient:"Tous", fDept:"Tous", fSemaine:"Toutes", aiMessages:[], aiBusy:false, dailyDone:{}, commandMessages:[],
  dqSev:"Toutes", dqType:"Tous", dqClient:"Tous", dqResp:"Tous", dqHideResolved:true, dqSelected:null, dqResolus:{}, dqAssign:{}, dqMailOF:null, meetingType:null, meetingStep:0, meetingFull:false, meetingNotes:{}, meetingActions:[], meetingCompleted:{}, settingsTab:"personnalisation" };
let charts = [];

function ofByNum(n){ return OFS.find(o => o.num === n); }
function badgeOF(s){ const m={"En cours":"b-encours","En retard":"b-retard","Bloqué":"b-bloque","Planifié":"b-planifie","Terminé":"b-termine"}; return `<span class="badge ${m[s]||"b-planifie"}">${s||"—"}</span>`; }
function prio(p){ if(!p) return '<span class="prio p-normale">—</span>'; return `<span class="prio p-${p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}">${p}</span>`; }
function pbar(v,danger){ return `<div class="pbar ${danger?"danger":v>=100?"full":""}"><i style="width:${Math.min(v,100)}%"></i></div>`; }
function opDot(s){ const m={"Terminée":"d-green","En cours":"d-blue","En réglage":"d-amber","Bloquée":"d-red","Planifiée":"d-slate"}; return m[s]; }
function blockClass(s){ const m={"En cours":"bl-encours","Planifiée":"bl-planifiee","En réglage":"bl-reglage","Bloquée":"bl-bloquee","Maintenance":"bl-maintenance","Divers":"bl-divers"}; return m[s]||"bl-planifiee"; }
function chargeMachine(mid, joursIdx){ const h = PLANNING.filter(p=>p.machine===mid && joursIdx.includes(p.jour)).reduce((s,p)=>s+p.h,0); const m = getMachines().find(x=>x.id===mid); return { h, cap: m.capJour*joursIdx.length, taux: Math.round(h/(m.capJour*joursIdx.length)*100) }; }
function toast(msg){ const t=$("toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(t._to); t._to=setTimeout(()=>t.classList.remove("show"),2400); }

function go(page){ if(!canAccessModule(page)){ toast('Accès refusé pour le module '+(TITRES[page]?.[0]||page)); return; } state.page=page; state.selectedOF=null; state.printMachine=null; state.dqSelected=null; render(); }
function openOF(num){ state.selectedOF=num; state.page="of"; $("searchInput").value=""; $("searchResults").innerHTML=""; render(); }


function getNavConfigRows(){
  const cfg = getSettings ? getSettings() : null;
  const fallback = DEFAULT_NAV_ITEMS.map((n,i)=>`${n.id} | ${n.label} | visible | ${i+1} | ${n.icon}`).join("\n");
  const raw = cfg?.interface?.menuItems || DEFAULT_SETTINGS?.interface?.menuItems || fallback;
  const base = Object.fromEntries(DEFAULT_NAV_ITEMS.map(n=>[n.id,n]));
  const rows = String(raw).split("\n").filter(x=>x.trim()).map((line,idx)=>{
    const parts = line.split("|").map(x=>x.trim());
    const id = parts[0] || `custom-${idx}`;
    return {
      id,
      label: parts[1] || base[id]?.label || id || `Menu ${idx+1}`,
      visible: (parts[2]||"visible").toLowerCase() !== "hidden",
      order: Number(parts[3]||idx+1)||idx+1,
      icon: parts[4] || base[id]?.icon || "dash"
    };
  });
  // Garde la configuration compatible quand un nouveau module est ajouté dans le code.
  DEFAULT_NAV_ITEMS.forEach((n)=>{
    if(!rows.some(r=>r.id===n.id)){ rows.push({id:n.id,label:n.label,visible:true,order:rows.length+1,icon:n.icon}); }
  });
  return rows;
}
function saveNavConfigRows(rows){
  const cfg=getSettings();
  cfg.interface = cfg.interface || {};
  cfg.interface.menuItems = rows.map((r,i)=>`${r.id} | ${r.label} | ${r.visible?"visible":"hidden"} | ${i+1} | ${r.icon||"dash"}`).join("\n");
  saveSettings(cfg);
}
function getNavItems(){
  const base = Object.fromEntries(DEFAULT_NAV_ITEMS.map(n=>[n.id,n]));
  return getNavConfigRows()
    .filter(r=>r.visible && base[r.id] && canAccessModule(r.id))
    .sort((a,b)=>a.order-b.order)
    .map(r=>({ ...base[r.id], label:r.label || base[r.id].label, icon:r.icon || base[r.id].icon }));
}
function getPageTitle(page){
  const cfg = getNavConfigRows().find(x=>x.id===page);
  const base = TITRES[page] || [page,""];
  return [cfg?.label || base[0], base[1]];
}


/* ================================================================
   SÉCURITÉ — RÔLES ET ACCÈS AUX MODULES PRINCIPAUX
   ================================================================ */
const MAIN_MODULES = [
  ['espace','Mon espace'], ['home','Accueil'], ['tournee','Tournée atelier'], ['parc','Parc machines'], ['planning','Planning'],
  ['of','OF'], ['meetings','Réunions'], ['actions','Actions'], ['demandes','Demandes'],
  ['kpi','KPI & analyses'], ['dataq','Qualité ERP'], ['settings','Réglages'], ['ia','IA']
];
const ROLE_PRESETS = {
  'Administrateur': {home:'admin',tournee:'admin',dashboard:'admin',planning:'admin',of:'admin',meetings:'admin',actions:'admin',demandes:'admin',kpi:'admin',dataq:'admin',settings:'admin',ia:'admin'},
  'Responsable production': {home:'view',tournee:'admin',dashboard:'view',planning:'admin',of:'edit',meetings:'admin',actions:'admin',demandes:'edit',kpi:'view',dataq:'edit',settings:'none',ia:'view'},
  'Planificateur': {home:'view',tournee:'edit',dashboard:'view',planning:'admin',of:'edit',meetings:'edit',actions:'edit',demandes:'edit',kpi:'view',dataq:'view',settings:'none',ia:'view'},
  'Chef d’équipe': {home:'view',tournee:'edit',dashboard:'view',planning:'view',of:'edit',meetings:'edit',actions:'edit',demandes:'create',kpi:'none',dataq:'none',settings:'none',ia:'none'},
  'Atelier': {home:'view',tournee:'create',dashboard:'none',planning:'view',of:'view',meetings:'none',actions:'create',demandes:'create',kpi:'none',dataq:'none',settings:'none',ia:'none'},
  'Qualité': {home:'view',tournee:'view',dashboard:'view',planning:'view',of:'edit',meetings:'edit',actions:'edit',demandes:'view',kpi:'none',dataq:'view',settings:'none',ia:'view'},
  'Direction': {home:'view',tournee:'view',dashboard:'view',planning:'view',of:'view',meetings:'view',actions:'view',demandes:'none',kpi:'view',dataq:'view',settings:'none',ia:'view'},
  'Lecture seule': {home:'view',tournee:'view',dashboard:'view',planning:'view',of:'view',meetings:'view',actions:'view',demandes:'none',kpi:'view',dataq:'view',settings:'none',ia:'none'}
};
function getRoleNames(){
  const users = (typeof getUsersTable === 'function') ? getUsersTable() : [];
  const userRoles = users.map(u=>u.role).filter(Boolean);
  return [...new Set([...Object.keys(ROLE_PRESETS), ...userRoles])];
}
function getRolePermissions(){
  const cfg = getSettings();
  try{
    if(cfg.custom && cfg.custom.rolePermissions) return deepMergeSettings(ROLE_PRESETS, JSON.parse(cfg.custom.rolePermissions));
  }catch(e){}
  return JSON.parse(JSON.stringify(ROLE_PRESETS));
}
function saveRolePermissions(perms){
  const cfg = getSettings();
  cfg.custom = cfg.custom || {};
  cfg.custom.rolePermissions = JSON.stringify(perms);
  saveSettings(cfg);
}
function getCurrentRole(){
  const cfg = getSettings();
  return cfg.custom?.currentRolePreview || 'Administrateur';
}
function setCurrentRole(role){
  const cfg = getSettings();
  cfg.custom = cfg.custom || {};
  cfg.custom.currentRolePreview = role;
  saveSettings(cfg);
  render();
  toast('Profil actif : '+role);
}
function modulePermission(moduleId, role=getCurrentRole()){
  const perms = getRolePermissions();
  const p = perms[role]?.[moduleId];
  if(p) return p;
  if(moduleId === 'parc') return role === 'Administrateur' ? 'admin' : 'edit';
  if(moduleId === 'espace') return role === 'Administrateur' ? 'admin' : 'edit';
  return role === 'Administrateur' ? 'admin' : 'none';
}
function canAccessModule(moduleId){ return modulePermission(moduleId) !== 'none'; }
function ensureAccessiblePage(){
  if(!canAccessModule(state.page)) state.page = canAccessModule('espace') ? 'espace' : 'home';
}
function updateRolePermission(role,moduleId,value){
  const perms = getRolePermissions();
  perms[role] = perms[role] || {};
  perms[role][moduleId] = value;
  saveRolePermissions(perms);
  render();
}
function addRolePrompt(){
  const name = prompt('Nom du nouveau rôle');
  if(!name) return;
  const perms = getRolePermissions();
  if(perms[name]){ alert('Ce rôle existe déjà.'); return; }
  perms[name] = JSON.parse(JSON.stringify(ROLE_PRESETS['Lecture seule']));
  saveRolePermissions(perms); render(); toast('Rôle ajouté');
}
function duplicateRole(role){
  const name = prompt('Nom du rôle copié', role+' copie');
  if(!name) return;
  const perms = getRolePermissions();
  perms[name] = JSON.parse(JSON.stringify(perms[role] || ROLE_PRESETS['Lecture seule']));
  saveRolePermissions(perms); render(); toast('Rôle dupliqué');
}
function deleteRole(role){
  if(role==='Administrateur'){ alert('Le rôle Administrateur ne peut pas être supprimé.'); return; }
  if(!confirm('Supprimer le rôle '+role+' ?')) return;
  const perms = getRolePermissions();
  delete perms[role];
  saveRolePermissions(perms);
  if(getCurrentRole()===role) setCurrentRole('Administrateur'); else render();
  toast('Rôle supprimé');
}
function resetRolePermissions(){
  if(!confirm('Restaurer les droits par défaut ?')) return;
  const cfg = getSettings();
  cfg.custom = cfg.custom || {};
  delete cfg.custom.rolePermissions;
  saveSettings(cfg); render(); toast('Droits restaurés');
}

function getCompanyLogo(){
  try{ return getSettings()?.general?.companyLogo || ""; }catch(e){ return ""; }
}
function renderCompanyLogo(cls="company-logo"){
  const logo=getCompanyLogo();
  const name=(getSettings()?.general?.companyName)||"ProdPilot IA";
  return logo ? `<img class="${cls}" src="${logo}" alt="Logo ${esc(name)}">` : `<div class="${cls} ${cls}-placeholder">${esc(name)}</div>`;
}

/* ================================================================
   RENDER GLOBAL
   ================================================================ */
function render(){
  charts.forEach(c=>c.destroy()); charts=[];
  ensureAccessiblePage();
  /* nav */
  const demAttente = DEMANDES.filter(d=>d.statut==="En attente").length;
  const navItems = getNavItems();
  $("nav").innerHTML = navItems.map(n=>`
    <button class="${state.page===n.id?"active":""}" onclick="go('${n.id}')">${ICONS[n.icon]||ICONS.dash} ${esc(n.label)}
      ${n.id==="demandes"&&demAttente?`<span class="pill">${demAttente}</span>`:""}</button>`).join("");
  $("mobileNav").innerHTML = navItems.map(n=>`
    <button class="chip ${state.page===n.id?"on":""}" onclick="go('${n.id}')">${esc(n.label)}</button>`).join("")
    + `<button class="chip" onclick="openAI()">✨ IA</button>`;

  const roleBox = $("rolePreviewBox");
  if(roleBox){
    const roles = getRoleNames();
    roleBox.innerHTML = `<div class="role-preview-label">Profil actif</div><select onchange="setCurrentRole(this.value)">${roles.map(r=>`<option ${getCurrentRole()===r?'selected':''}>${esc(r)}</option>`).join('')}</select>`;
  }

  const c = $("content");
  const showHead = !(state.page==="of"&&state.selectedOF) && !state.printMachine && state.page!=="espace" && state.page!=="dashboard";
  let html = showHead ? `<div class="page-head"><h1>${esc(getPageTitle(state.page)[0])}</h1><p>${esc(getPageTitle(state.page)[1])}</p></div>` : "";
  if(state.page==="espace" || state.page==="dashboard") html += renderEspace(); /* Dashboard supprimé — remplacé par Mon espace */
  if(state.page==="home") html += parcAlertesBanner() + renderCommandCenter();
  if(state.page==="tournee") html += renderTourneeAtelier();
  if(state.page==="parc") html += state.parcMachine ? renderParcFiche(state.parcMachine) : renderParc();
  if(state.page==="of") html += state.selectedOF ? renderOFDetail(ofByNum(state.selectedOF)) : renderOFList();
  if(state.page==="planning") html += state.printMachine ? renderPrint(state.printMachine) : (bandeauRegroupements() + renderPlanning());
  if(state.page==="demandes") html += renderDemandes();
  if(state.page==="actions") html += renderActions();
  if(state.page==="kpi") html += renderKPIPage();
  if(state.page==="dataq") html += state.dqSelected ? renderDQDetail(state.dqSelected) : renderDQ();
  if(state.page==="meetings") html += renderMeetings();
  if(state.page==="settings") html += renderSettings();
  c.innerHTML = html;
  if(state.page==="kpi") setTimeout(mountCharts, 0);
  if(state.page==="planning" && !state.printMachine) bindDragDrop();
}


/* ================================================================
   ACCUEIL — COMMAND CENTER / DAILY BRIEFING
   ================================================================ */
function todayLabel(){ return "Mardi 7 juillet 2026"; }
function getDailyBriefingData(){
  const retard = OFS.filter(o=>o.statut==="En retard");
  const urgents = OFS.filter(o=>o.priorite==="Urgente" && o.statut!=="Terminé");
  const bloquees = OFS.flatMap(o=>(o.operations||[]).filter(op=>op.statut==="Bloquée").map(op=>({of:o,op})));
  const s28 = [0,1,2,3,4];
  const machinesSaturees = getMachines().map(m=>({m, charge:chargeMachine(m.id,s28)})).filter(x=>x.charge.taux>=95).sort((a,b)=>b.charge.taux-a.charge.taux);
  const actionsRetard = ACTIONS.filter(a=>a.statut!=="Terminée" && (a.priorite==="Urgente" || a.echeance==="07/07"));
  const demandes = DEMANDES.filter(d=>d.statut==="En attente");
  const dqCritiques = (typeof analyseAllDQ === "function") ? analyseAllDQ().filter(x=>x.sev==="Critique") : [];
  const termines = OFS.filter(o=>o.statut==="Terminé");
  return {retard, urgents, bloquees, machinesSaturees, actionsRetard, demandes, dqCritiques, termines};
}
function dailyTaskKey(label){ return label.toLowerCase().replace(/[^a-z0-9]+/gi,"_"); }
function actionForDailyTask(label, data){
  const l = String(label).toLowerCase();
  if(l.includes("qrqc")) return "startMeeting('qrqc')";
  if(l.includes("réunion") || l.includes("reunion") || l.includes("production")) return "selectMeeting('production')";
  if(l.includes("planning") || l.includes("imprimer")) return "go('planning')";
  if(l.includes("retard") || l.includes("of")) return "go('of')";
  if(l.includes("demande")) return "go('demandes')";
  if(l.includes("erp") || l.includes("donnée") || l.includes("donnee")) return "go('dataq')";
  if(l.includes("action")) return "go('actions')";
  return "toast('Fonction à relier dans Réglages')";
}
function toggleDailyTask(key){ state.dailyDone[key]=!state.dailyDone[key]; render(); }
function renderCommandCenter(){
  const d = getDailyBriefingData();
  const decisions = d.retard.length + d.bloquees.length + d.demandes.length;
  const defaultTasks = [
    "Démarrer le QRQC",
    "Traiter les OF en retard",
    "Vérifier les demandes planning",
    "Imprimer le planning machines",
    "Nettoyer les données ERP critiques",
    "Préparer la réunion production"
  ];
  const customTasks = (typeof settingsLines === "function" ? settingsLines("personnalisation","homeChecklist") : defaultTasks);
  const tasks = (customTasks.length?customTasks:defaultTasks).map(label=>({
    label,
    action: actionForDailyTask(label, d),
    tag: label.toLowerCase().includes("qrqc")||label.toLowerCase().includes("réunion")?"Réunion": label.toLowerCase().includes("erp")?`${d.dqCritiques.length} anomalies`: label.toLowerCase().includes("demande")?`${d.demandes.length} demandes`: label.toLowerCase().includes("retard")?`${d.retard.length} OF`:"À faire",
    priority: (label.toLowerCase().includes("retard")&&d.retard.length)||label.toLowerCase().includes("qrqc")?"Haute":"Normale"
  }));
  const aiText = buildDailyRecommendation(d);
  return `
  <section class="command-hero">
    <div class="command-hello">
      <div class="command-date">${todayLabel()} · Semaine 28</div>
      <h1>Bonjour Daniel 👋</h1>
      <p>Voici ce qui demande ton attention maintenant. L'objectif : savoir quoi faire, dans quel ordre, et ne rien oublier.</p>
      <div class="command-actions">
        <button class="btn btn-blue" onclick="startMeeting('qrqc')">▶ Démarrer QRQC</button>
        <button class="btn btn-ghost" onclick="selectMeeting('production')">Réunion Production</button>
        <button class="btn btn-ghost" onclick="go('planning')">Ouvrir planning</button>
      </div>
      <div class="meeting-home-status">
        <span class="${state.meetingCompleted.qrqc?'ok':'todo'}">${state.meetingCompleted.qrqc?'✓ QRQC clôturé':'□ QRQC à faire'}</span>
        <span class="${state.meetingCompleted.production?'ok':'todo'}">${state.meetingCompleted.production?'✓ Réunion production clôturée':'□ Réunion production à préparer'}</span>
      </div>
    </div>
    <div class="command-ai-brief">
      <div class="ai-pill">${ICONS.spark} Briefing IA</div>
      <p>${aiText}</p>
    </div>
  </section>

  <div class="command-kpis">
    ${commandKpi("🔴", decisions, "décisions à prendre", "Retards, blocages et demandes à arbitrer", "go('actions')")}
    ${commandKpi("🟠", d.retard.length + d.urgents.length, "OF à surveiller", "En retard ou priorité urgente", "go('of')")}
    ${commandKpi("✅", d.actionsRetard.length, "actions sensibles", "Urgentes ou à échéance aujourd'hui", "go('actions')")}
    ${commandKpi("🏭", d.machinesSaturees.length, "machines en surcharge", "Charge ≥ 95 % sur S28", "go('planning')")}
    ${commandKpi("📥", d.demandes.length, "demandes planning", "À accepter, refuser ou reporter", "go('demandes')")}
    ${commandKpi("🧹", d.dqCritiques.length, "anomalies ERP", "Données critiques à corriger", "go('dataq')")}
  </div>

  <div class="grid command-layout">
    <div class="card card-pad">
      <div class="section-title"><h3>Checklist du jour</h3><span>${tasks.filter(t=>state.dailyDone[dailyTaskKey(t.label)]).length}/${tasks.length} fait</span></div>
      <div class="daily-list">
        ${tasks.map(t=>{ const key=dailyTaskKey(t.label); return `
        <div class="daily-task ${state.dailyDone[key]?"done":""}">
          <button class="daily-check" onclick="toggleDailyTask('${key}')">${state.dailyDone[key]?"✓":""}</button>
          <div class="daily-main" onclick="${t.action}">
            <b>${esc(t.label)}</b>
            <span>${esc(t.tag)} · priorité ${esc(t.priority)}</span>
          </div>
          <button class="btn btn-ghost" onclick="${t.action}">Ouvrir</button>
        </div>`;}).join("")}
      </div>
    </div>

    <div class="card card-pad command-chat">
      <div class="section-title"><h3>Assistant IA</h3><span>mode local</span></div>
      <div class="command-msgs" id="commandMsgs">${renderCommandMessages()}</div>
      <div class="command-suggestions">
        ${["Qu'est-ce que je dois faire ce matin ?","Quels OF sont critiques ?","Prépare mon QRQC","Quelles machines sont surchargées ?"].map(q=>`<button onclick="askCommandAI(${JSON.stringify(q).replace(/"/g,"&quot;")})">${esc(q)}</button>`).join("")}
      </div>
      <div class="command-input">
        <input id="commandInput" placeholder="Demande à ProdPilot IA… ex : que dois-je faire maintenant ?" onkeydown="if(event.key==='Enter') askCommandAI()">
        <button onclick="askCommandAI()">Envoyer</button>
      </div>
    </div>
  </div>

  <div class="grid g-2" style="margin-top:14px">
    <div class="card card-pad">
      <div class="section-title"><h3>Priorités détectées</h3><span>à traiter aujourd'hui</span></div>
      <div class="priority-stack">
        ${renderPriorityItems(d)}
      </div>
    </div>
    <div class="card card-pad">
      <div class="section-title"><h3>Raccourcis opérationnels</h3><span>2 clics maximum</span></div>
      <div class="shortcut-grid">
        <button onclick="startMeeting('qrqc')">📋<b>QRQC</b><span>Lancer la réunion du matin</span></button>
        <button onclick="go('planning')">📅<b>Planning</b><span>Voir / imprimer par machine</span></button>
        <button onclick="go('of')">🏭<b>OF</b><span>Suivre les gammes</span></button>
        <button onclick="go('actions')">✅<b>Actions</b><span>Ne rien oublier</span></button>
        <button onclick="go('dataq')">🧹<b>ERP</b><span>Corriger les données</span></button>
        <button onclick="openAI()">🤖<b>IA complète</b><span>Ouvrir le panneau IA</span></button>
      </div>
    </div>
  </div>`;
}
function commandKpi(icon,val,label,sub,action){ return `<div class="card command-kpi" onclick="${action}"><div class="command-kpi-icon">${icon}</div><div><b>${val}</b><span>${label}</span><small>${sub}</small></div></div>`; }
function buildDailyRecommendation(d){
  const parts=[];
  if(d.bloquees.length) parts.push(`${d.bloquees.length} opération(s) bloquée(s) doivent être levées en priorité`);
  if(d.retard.length) parts.push(`${d.retard.length} OF sont en retard`);
  if(d.machinesSaturees.length) parts.push(`${d.machinesSaturees[0].m.id} est chargée à ${d.machinesSaturees[0].charge.taux} %`);
  if(d.demandes.length) parts.push(`${d.demandes.length} demande(s) planning attendent une décision`);
  if(!parts.length) return "La situation est maîtrisée. Je te conseille de faire le QRQC, puis de vérifier les actions ouvertes avant de lancer la journée.";
  return `Je te conseille de commencer par le QRQC : ${parts.join(", ")}. Ensuite, vérifie les actions urgentes et imprime le planning atelier si nécessaire.`;
}
function renderPriorityItems(d){
  const items=[];
  d.bloquees.slice(0,3).forEach(b=>items.push({c:"red",title:`${b.of.num} bloqué`,sub:`OP${b.op.num} — ${b.op.machine||"machine non définie"}`,act:`openOF('${b.of.num}')`}));
  d.retard.slice(0,3).forEach(o=>items.push({c:"amber",title:`${o.num} en retard`,sub:`${o.client} · échéance ${o.echeance}`,act:`openOF('${o.num}')`}));
  d.demandes.slice(0,2).forEach(x=>items.push({c:"blue",title:`${x.id} — ${x.type}`,sub:`${x.of} · demandé par ${x.demandeur}`,act:`go('demandes')`}));
  d.dqCritiques.slice(0,2).forEach(x=>items.push({c:"purple",title:`${x.of} données ERP critiques`,sub:`Score ${x.score}% · ${x.problemes.length} problème(s)`,act:`go('dataq')`}));
  if(!items.length) return `<div class="empty-meeting">Aucune priorité critique détectée pour le moment.</div>`;
  return items.map(i=>`<div class="priority-item ${i.c}" onclick="${i.act}"><b>${esc(i.title)}</b><span>${esc(i.sub)}</span></div>`).join("");
}
function renderCommandMessages(){
  if(!state.commandMessages.length) return `<div class="command-msg ai">Bonjour Daniel. Je suis prêt à t'aider à organiser ta journée, préparer le QRQC et vérifier les OF critiques.</div>`;
  return state.commandMessages.map(m=>`<div class="command-msg ${m.role}">${esc(m.text)}</div>`).join("");
}
function askCommandAI(question){
  const input=$("commandInput");
  const q=(question ?? (input?input.value:"")).trim();
  if(!q) return;
  if(input) input.value="";
  state.commandMessages.push({role:"user",text:q});
  state.commandMessages.push({role:"ai",text:localAIAnswer(q)});
  render();
  setTimeout(()=>{ const box=$("commandMsgs"); if(box) box.scrollTop=box.scrollHeight; },0);
}
function localAIAnswer(q){
  const d=getDailyBriefingData();
  const l=q.toLowerCase();
  if(l.includes("qrqc")) return `Pour le QRQC, je te propose de commencer par les OF en cours, puis les blocages. Points à aborder : ${d.bloquees.length} blocage(s), ${d.retard.length} OF en retard, ${d.demandes.length} demande(s) planning. Clique sur “Démarrer QRQC”.`;
  if(l.includes("critique")||l.includes("retard")||l.includes("of")){
    const ofs=[...d.retard,...d.urgents].slice(0,5).map(o=>`${o.num} (${o.client}, ${o.statut}, éch. ${o.echeance})`).join(" ; ");
    return ofs ? `Les OF à surveiller sont : ${ofs}. Je te conseille de les traiter dans cet ordre : bloqués, en retard, urgents.` : "Aucun OF critique détecté dans les données actuelles.";
  }
  if(l.includes("machine")||l.includes("surcharge")){
    return d.machinesSaturees.length ? `Machines en surcharge : ${d.machinesSaturees.map(x=>`${x.m.id} ${x.charge.taux}%`).join(", ")}. Ouvre le planning pour rééquilibrer.` : "Aucune machine au-dessus de 95 % sur la semaine 28.";
  }
  if(l.includes("ce matin")||l.includes("maintenant")||l.includes("faire")) return `Ordre conseillé : 1) Démarrer le QRQC, 2) traiter les ${d.bloquees.length} blocage(s), 3) vérifier les ${d.retard.length} OF en retard, 4) répondre aux ${d.demandes.length} demandes planning, 5) imprimer le planning machines.`;
  return `J'ai analysé les données actuelles : ${d.retard.length} OF en retard, ${d.bloquees.length} blocage(s), ${d.demandes.length} demande(s) planning et ${d.actionsRetard.length} action(s) sensibles. La priorité est de lever les blocages avant de modifier le planning.`;
}

/* ================================================================
   DASHBOARD
   ================================================================ */
function renderDashboard(){
  const retard = OFS.filter(o=>o.statut==="En retard").length;
  const urgents = OFS.filter(o=>o.priorite==="Urgente"&&o.statut!=="Terminé").length;
  const bloquees = OFS.flatMap(o=>o.operations.filter(op=>op.statut==="Bloquée").map(op=>({of:o,op})));
  const s28 = [0,1,2,3,4];
  const satures = getMachines().filter(m=>chargeMachine(m.id,s28).taux>=95).length;
  const demAttente = DEMANDES.filter(d=>d.statut==="En attente").length;
  const actOuv = ACTIONS.filter(a=>a.statut!=="Terminée").length;
  const actUrg = ACTIONS.filter(a=>a.priorite==="Urgente"&&a.statut!=="Terminée").length;
  const risques = OFS.filter(o=>o.statut==="En retard"||o.statut==="Bloqué"||(o.priorite==="Urgente"&&o.avancement<90));
  const chargeDept = ["Tournage","Fraisage","Découpe fil"].map(d=>{
    const ms = getMachines().filter(m=>m.dept===d);
    const taux = Math.round(ms.reduce((s,m)=>s+chargeMachine(m.id,s28).taux,0)/ms.length);
    return {dept:d,taux};
  });

  const kpi = (ic,cls,val,lbl,sub,page)=>`
    <div class="card kpi" onclick="${page?`go('${page}')`:""}">
      <div class="ic ${cls}">${ICONS[ic]}</div>
      <div><div class="val">${val}</div><div class="lbl">${lbl}</div><div class="sub">${sub}</div></div>
    </div>`;

  return `
  <div class="hero">
    <div class="eyebrow">${ICONS.spark} Priorités du jour — mardi 7 juillet · semaine 28</div>
    <div class="hero-grid">
      <div class="hero-item"><b>1. Débloquer OF-26-0498</b><span>La dérogation DER-118 bloque FRA-04 depuis 4 jours. Relance client à faire ce matin.</span></div>
      <div class="hero-item"><b>2. Sécuriser OF-26-0512</b><span>Échéance vendredi, fin estimée lundi. Livraison partielle 12 pcs à confirmer avec l'ADV.</span></div>
      <div class="hero-item"><b>3. Anticiper la matière OF-26-0545</b><span>Z100CD17 attendue le 15/07 — le tournage démarre le 20/07 sur TOU-01. Relancer le fournisseur.</span></div>
    </div>
  </div>
  <div class="grid g-kpi" style="margin-bottom:14px">
    ${kpi("alert","ic-red",retard,"OF en retard","échéance dépassée","of")}
    ${kpi("alert","ic-amber",urgents,"OF urgents","priorité 1 en cours","of")}
    ${kpi("factory","ic-indigo",satures,"Machines saturées","≥ 95 % en S28","planning")}
    ${kpi("alert","ic-red",bloquees.length,"Opérations bloquées","production arrêtée","")}
    ${kpi("chart","ic-green","87 %","OTD semaine 27","+4 pts vs S26","kpi")}
    ${kpi("inbox","ic-blue",demAttente,"Demandes en attente","à traiter","demandes")}
    ${kpi("check","ic-slate",actOuv,"Actions ouvertes",actUrg+" urgentes","actions")}
    ${kpi("list","ic-blue",OFS.filter(o=>o.statut!=="Terminé").length,"OF actifs","en atelier ou planifiés","of")}
  </div>
  <div class="grid g-2-1">
    <div class="card card-pad">
      <h3 style="display:flex;align-items:center;gap:7px;color:var(--ink)">${ICONS.alert} Ordres de fabrication à risque</h3>
      <div style="margin-top:11px;display:flex;flex-direction:column;gap:8px">
        ${risques.map(o=>`
        <div class="card" style="border-color:var(--border-soft);padding:11px 13px;display:flex;align-items:center;gap:12px;cursor:pointer" onclick="openOF('${o.num}')">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap"><b style="font-size:13px">${o.num}</b>${badgeOF(o.statut)}${prio(o.priorite)}</div>
            <div class="t-sub" style="margin-top:2px">${esc(o.designation)} — ${o.client} · échéance ${o.echeance}</div>
          </div>
          <div style="width:105px;flex-shrink:0">
            <div class="t-sub" style="text-align:right;margin-bottom:3px">${o.avancement} %</div>
            ${pbar(o.avancement,o.statut==="En retard")}
          </div>
        </div>`).join("")}
      </div>
    </div>
    <div class="card card-pad">
      <h3>Charge par département <span class="t-sub" style="font-weight:400">(S28)</span></h3>
      <div style="margin-top:13px;display:flex;flex-direction:column;gap:13px">
        ${chargeDept.map(d=>`
        <div><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
          <span style="color:var(--ink-2)">${d.dept}</span><b class="${d.taux>=95?"c-hot":""}">${d.taux} %</b></div>
          ${pbar(d.taux,d.taux>=95)}</div>`).join("")}
      </div>
      <h3 style="margin-top:20px;margin-bottom:9px">Opérations bloquées</h3>
      ${bloquees.length===0?'<div class="t-sub">Aucun blocage en cours.</div>':bloquees.map(b=>`
        <div class="card" style="background:var(--red-soft);border-color:#fecaca;padding:10px 12px;cursor:pointer" onclick="openOF('${b.of.num}')">
          <b style="font-size:12.5px;color:#991b1b">${b.of.num} · OP${b.op.num} — ${b.op.machine}</b>
          <div style="font-size:11.5px;color:var(--red);margin-top:2px">${esc(b.op.blocage)}</div>
        </div>`).join("")}
    </div>
  </div>`;
}

/* ================================================================
   OF : LISTE + DÉTAIL
   ================================================================ */
function setFStatut(s){ state.fStatut=s; render(); }
function setFClient(s){ state.fClient=s; render(); }

function renderOFList(){
  const clients = ["Tous",...new Set(OFS.map(o=>o.client))];
  const statuts = ["Tous","En cours","En retard","Bloqué","Planifié"];
  const list = OFS.filter(o=>(state.fStatut==="Tous"||o.statut===state.fStatut)&&(state.fClient==="Tous"||o.client===state.fClient));
  return `
  <div class="card" style="overflow:hidden">
    <div class="filters">
      ${statuts.map(s=>`<button class="chip ${state.fStatut===s?"on":""}" onclick="setFStatut('${s}')">${s}</button>`).join("")}
      <select onchange="setFClient(this.value)">${clients.map(c=>`<option ${state.fClient===c?"selected":""}>${c}</option>`).join("")}</select>
      <button class="btn btn-ghost" style="margin-left:auto" onclick="state.page='settings';state.settingsCategory='importSociete';state.settingsTab='importSociete';render()">📥 Import ERP</button>
    </div>
    <div style="overflow-x:auto"><table>
      <thead><tr><th>OF</th><th>Client</th><th>Article</th><th>Qté</th><th>Priorité</th><th>Échéance</th><th>Fin estimée</th><th>Statut</th><th style="width:150px">Avancement</th></tr></thead>
      <tbody>${list.map(o=>{
        const late = o.statut==="En retard" || o.finEstimee.slice(3,5)+o.finEstimee.slice(0,2) > o.echeance.slice(3,5)+o.echeance.slice(0,2);
        return `<tr class="row-click" onclick="openOF('${o.num}')">
          <td><b>${o.num}</b></td><td style="color:var(--ink-2)">${o.client}</td>
          <td>${o.article}${memesArticles(o.num).length?` <span class="twin-badge" title="Même article en production : ${memesArticles(o.num).map(x=>x.num).join(", ")}">⧉</span>`:""}<div class="t-sub">${esc(o.designation)}</div></td>
          <td style="color:var(--ink-2)">${o.qte}</td><td>${prio(o.priorite)}</td>
          <td style="color:var(--ink-2)">${o.echeance}</td>
          <td style="font-weight:500;color:${late?"var(--red)":"var(--green)"}">${o.finEstimee}</td>
          <td>${badgeOF(o.statut)}</td>
          <td><div style="display:flex;align-items:center;gap:7px">${pbar(o.avancement,o.statut==="En retard")}<span class="t-sub" style="width:30px">${o.avancement}%</span></div></td>
        </tr>`;}).join("")}</tbody>
    </table></div>
  </div>`;
}

function renderOFDetail(o){
  return `
  <button class="back-link" onclick="go('of')">‹ Retour à la liste</button>
  <div class="card card-pad" style="margin-bottom:14px">
    <div class="detail-head">
      <div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><h2 style="font-size:19px">${o.num}</h2>${badgeOF(o.statut)}${prio(o.priorite)}</div>
        <div style="color:var(--ink-2);margin-top:3px">${o.article} — ${esc(o.designation)}</div>
      </div>
      <div style="text-align:right"><div style="font-size:23px;font-weight:700">${o.avancement} %</div><div class="t-sub">avancement global</div></div>
    </div>
    <div class="detail-grid">
      ${[["Client",o.client],["Commande client",o.cmd],["Quantité",o.qte+" pcs"],["Échéance",o.echeance],["Fin estimée",o.finEstimee]]
        .map(([k,v])=>`<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("")}
    </div>
    ${o.notes?`<div class="note-box">${esc(o.notes)}</div>`:""}
    ${bandeauJumeaux(o.num)}
  </div>
  <div class="grid g-2-1">
    <div class="card card-pad">
      <h3 style="margin-bottom:14px">Gamme opératoire</h3>
      <div class="timeline">
        ${o.operations.map(op=>`
        <div class="tl-item">
          <div class="tl-dot ${opDot(op.statut)}"></div>
          <div class="tl-card ${op.statut==="Bloquée"?"blocked":""}">
            <div class="tl-head"><span class="tl-num">OP${op.num}</span><b style="font-size:13px">${esc(op.desc)}</b>
              <span class="badge ${ {Terminée:"b-termine","En cours":"b-encours","En réglage":"b-attente",Bloquée:"b-retard",Planifiée:"b-planifie"}[op.statut] }">${op.statut}</span></div>
            <div class="tl-meta">
              <div><span>Machine :</span> ${op.machine} (${op.dept})</div>
              <div><span>Temps :</span> ${op.tpsEstime} h${op.tpsReglage>0?` (+${op.tpsReglage} h régl.)`:""}</div>
              <div><span>Opérateur :</span> ${op.operateur||"—"}</div>
              <div><span>Prévu :</span> ${op.datePrev} · <span>Réel :</span> ${op.debutReel||"—"}${op.finReel?" → "+op.finReel:""}</div>
            </div>
            ${(op.statut==="En cours"||op.statut==="En réglage")?`<div style="display:flex;align-items:center;gap:7px;margin-top:8px">${pbar(op.avancement)}<span class="t-sub">${op.avancement}%</span></div>`:""}
            ${op.blocage?`<div class="tl-block">⛔ ${esc(op.blocage)}</div>`:""}
            ${op.commentaire?`<div class="tl-comment">${esc(op.commentaire)}</div>`:""}
          </div>
        </div>`).join("")}
      </div>
    </div>
    <div class="card card-pad">
      <h3 style="margin-bottom:11px">📎 Documents</h3>
      ${o.documents.map(d=>`<div class="doc">${ICONS.doc} <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d)}</span></div>`).join("")}
      <button class="btn btn-ghost" style="width:100%;border-style:dashed;margin-top:4px">+ Ajouter un document</button>
    </div>
  </div>`;
}

/* ================================================================
   PLANNING MENSUEL + DRAG & DROP
   ================================================================ */
function setFDept(d){ state.fDept=d; render(); }
function setFSemaine(s){ state.fSemaine=s; render(); }
function openPrint(mid){ state.printMachine=mid; render(); }

function renderPlanning(){
  const depts = ["Tous","Tournage","Fraisage","Découpe fil"];
  const machines = getMachines().filter(m=>state.fDept==="Tous"||m.dept===state.fDept);
  const jours = state.fSemaine==="Toutes" ? JOURS : JOURS.filter(j=>j.semaine===Number(state.fSemaine));
  const joursIdx = jours.map(j=>j.idx);

  /* En-têtes : groupes semaines + jours */
  const wkGroups = SEMAINES.filter(s=>jours.some(j=>j.semaine===s))
    .map(s=>`<th class="wk" colspan="${jours.filter(j=>j.semaine===s).length}">Semaine ${s}</th>`).join("");
  const dayHeads = jours.map(j=>`<th class="day ${j.label.startsWith("Ven")?"sep":""}">${j.label}<div style="font-weight:400;color:var(--ink-3)">${j.date}</div></th>`).join("");

  const rows = machines.map(m=>{
    const ch = chargeMachine(m.id, joursIdx);
    const cls = ch.taux>=95?"c-hot":ch.taux>=80?"c-warn":"c-ok";
    const cells = jours.map(j=>{
      const blocs = PLANNING.map((p,i)=>({...p,_i:i})).filter(p=>p.machine===m.id&&p.jour===j.idx);
      const somme = blocs.reduce((s,b)=>s+b.h,0);
      const surcharge = somme > m.capJour;
      return `<td class="cell ${j.label.startsWith("Ven")?"sep":""}">
        <div class="cell-inner" data-machine="${m.id}" data-jour="${j.idx}">
          ${blocs.map(b=>{ const jum = b.of ? memesArticles(b.of) : []; return `
          <div class="block ${blockClass(b.statut)}" draggable="${b.statut!=="Bloquée"}" data-idx="${b._i}"
               title="${b.of||b.label||"Tâche"} — ${esc(b.op||b.label||"")}${jum.length?" · MÊME PIÈCE que "+jum.map(x=>x.num).join(", "):""}" ${b.of?`onclick="openOF('${b.of}')"`:""}>
            <b>${b.of?b.of.slice(-4):"🔧"}${jum.length?' <span class="twin-dot" title="Même pièce en production">⧉</span>':""}</b>${esc(b.op||b.label||"")}${b.h>0?` · ${b.h} h`:""}
          </div>`;}).join("")}
          <div class="cell-foot no-print">
            <span class="cell-sum ${surcharge?"over":""}">${blocs.length?`Σ ${somme}/${m.capJour} h${surcharge?" ⚠":""}`:""}</span>
            <button class="cell-add" title="Ajouter un OF sur ${m.id} — ${j.label}" onclick="event.stopPropagation();ouvrirAjoutOp('${m.id}',${j.idx})">+</button>
          </div>
        </div></td>`;
    }).join("");
    return `<tr>
      <td class="machine-col"><b style="font-size:13px">${m.id}</b><div class="t-sub">${m.nom} · ${m.dept}</div>
        <button class="link" style="font-size:11px;margin-top:4px;display:inline-flex;align-items:center;gap:4px" onclick="openPrint('${m.id}')">${ICONS.print} Fiche imprimable</button></td>
      ${cells}
      <td class="charge-col"><div class="charge-val ${cls}">${ch.taux} %</div><div class="t-sub">${ch.h}/${ch.cap} h</div></td>
    </tr>`;
  }).join("");

  return `
  <div class="plan-toolbar no-print">
    ${depts.map(d=>`<button class="chip ${state.fDept===d?"on":""}" onclick="setFDept('${d}')">${d}</button>`).join("")}
    <select onchange="setFSemaine(this.value)" style="border:1px solid var(--border);border-radius:9px;padding:6px 9px;background:#fff">
      <option value="Toutes" ${state.fSemaine==="Toutes"?"selected":""}>Mois complet (S28–S31)</option>
      ${SEMAINES.map(s=>`<option value="${s}" ${state.fSemaine==String(s)?"selected":""}>Semaine ${s}</option>`).join("")}
    </select>
    <button class="btn btn-blue" style="margin-left:6px" onclick="ouvrirTacheLibre({})">🔧 Maintenance / tâche libre</button>
    <button class="btn btn-ghost" style="margin-left:6px" onclick="openPrint('__ALL__')">${ICONS.print} Imprimer tout</button>
    <div class="legend" style="margin-left:auto">
      <span><i style="background:var(--blue)"></i>En cours</span>
      <span><i style="background:var(--border);border:1px solid #cbd5e1"></i>Planifiée</span>
      <span><i style="background:#fbbf24"></i>Réglage</span>
      <span><i style="background:var(--red-soft);border:1px solid #fca5a5"></i>Bloquée</span>
      <span><i style="background:#7c3aed"></i>Maintenance</span>
      <span><i style="background:#0d9488"></i>Divers</span>
    </div>
  </div>
  <div class="card plan-wrap">
    <table class="plan-table" style="${state.fSemaine!=="Toutes"?"min-width:900px":""}">
      <thead>
        <tr><th class="machine-col" rowspan="2" style="vertical-align:bottom">Machine</th>${wkGroups}<th rowspan="2" class="charge-col" style="vertical-align:bottom">Charge<br>période</th></tr>
        <tr>${dayHeads}</tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <p class="t-sub no-print" style="margin-top:9px">Glissez un bloc vers une autre case (machine / jour) pour le replanifier — la charge est recalculée immédiatement. Les opérations bloquées ne sont pas déplaçables.</p>`;
}

function bindDragDrop(){
  let dragIdx = null;
  document.querySelectorAll(".block[draggable=true]").forEach(el=>{
    el.addEventListener("dragstart", e=>{ dragIdx = Number(el.dataset.idx); e.dataTransfer.effectAllowed="move"; });
  });
  document.querySelectorAll(".cell-inner").forEach(cell=>{
    cell.addEventListener("dragover", e=>{ e.preventDefault(); cell.classList.add("dragover"); });
    cell.addEventListener("dragleave", ()=>cell.classList.remove("dragover"));
    cell.addEventListener("drop", e=>{
      e.preventDefault(); cell.classList.remove("dragover");
      if(dragIdx===null) return;
      const p = PLANNING[dragIdx];
      const nm = cell.dataset.machine, nj = Number(cell.dataset.jour);
      if(p.machine===nm && p.jour===nj){ dragIdx=null; return; }
      dragIdx=null;
      const deplacer = () => {
        const old = p.machine+" "+JOURS[p.jour].label;
        p.machine=nm; p.jour=nj;
        render();
        toast(`${p.of||p.label||"Tâche"} replanifié(e) : ${old} → ${nm} ${JOURS[nj].label}`);
      };
      const c = (p.statut!=="Maintenance"&&p.statut!=="Divers") ? maintenanceConflit(nm, nj) : null;
      if(c){ modalConflitMaint(c, deplacer); return; }
      deplacer();
    });
  });
}

/* Fiche machine imprimable (mois, groupée par semaine) */
function getPrintColumns(){
  const raw = (getSettings().impressions && getSettings().impressions.columns) || DEFAULT_SETTINGS.impressions.columns;
  return String(raw).split("\n").filter(x=>x.trim()).map((line,idx)=>{
    const p=line.split("|").map(x=>x.trim());
    return { key:p[0]||`col${idx}`, label:p[1]||p[0]||`Colonne ${idx+1}`, visible:(p[2]||"true").toLowerCase()!=="false" };
  });
}
function savePrintColumns(cols){
  const cfg=getSettings();
  cfg.impressions.columns = cols.map(c=>`${c.key} | ${c.label} | ${c.visible?"true":"false"}`).join("\n");
  saveSettings(cfg);
}
function updatePrintColumn(idx, field, value){ const cols=getPrintColumns(); if(!cols[idx]) return; cols[idx][field]=field==='visible'?!!value:value; savePrintColumns(cols); }
function movePrintColumn(idx,dir){ const cols=getPrintColumns(); const j=idx+dir; if(j<0||j>=cols.length) return; [cols[idx],cols[j]]=[cols[j],cols[idx]]; savePrintColumns(cols); render(); }
function resetPrintTemplate(){ if(confirm("Restaurer le modèle d'impression planning par défaut ?")){ const cfg=getSettings(); cfg.impressions=JSON.parse(JSON.stringify(DEFAULT_SETTINGS.impressions)); saveSettings(cfg); render(); toast("Modèle restauré"); } }
function printBool(key){ return String(getSettings().impressions?.[key] ?? DEFAULT_SETTINGS.impressions[key]) === "true"; }
function renderPrintCell(key,b,o){
  const day = JOURS[b.jour];
  const vals = {
    jour: day.label,
    of: `<b>${b.of||"🔧 Tâche"}</b>`,
    operation: esc(b.op||b.label||""),
    client: o ? esc(o.client) : "",
    article: o ? esc(o.article || "") : "",
    quantite: o ? esc(o.qte) : "",
    temps: `${b.h} h`,
    priorite: o ? prio(o.priorite) : "",
    delai: o ? esc(o.delai || "") : "",
    remarque: esc(b.note || o?.note || "")
  };
  return vals[key] ?? "";
}
/* Fiche machine imprimable (mois, groupée par semaine) */
function renderPrint(mid){
  const toolbar = `
  <div class="no-print" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:10px;flex-wrap:wrap">
    <button class="back-link" style="margin:0" onclick="state.printMachine=null;render()">‹ Retour au planning</button>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn btn-ghost" onclick="state.page='settings';state.settingsTab='impressions';state.printMachine=null;render()">⚙ Modifier le modèle</button>
      <button class="btn btn-blue" onclick="window.print()">${ICONS.print} Imprimer</button>
    </div>
  </div>`;
  if(mid === "__ALL__"){
    const sheets = getMachines()
      .filter(m => PLANNING.some(p=>p.machine===m.id))
      .map(m => renderPrintSheet(m.id)).join("");
    return toolbar + (sheets || '<p class="t-sub">Aucune opération planifiée sur ce mois.</p>');
  }
  return toolbar + renderPrintSheet(mid);
}
function renderPrintSheet(mid){
  const m = getMachines().find(x=>x.id===mid);
  if(!m) return "";
  const cfg = getSettings();
  const cols = getPrintColumns().filter(c=>c.visible);
  const blocs = PLANNING.filter(p=>p.machine===mid).sort((a,b)=>a.jour-b.jour);
  const parSemaine = SEMAINES.map(s=>({ s, items: blocs.filter(b=>JOURS[b.jour].semaine===s) })).filter(g=>g.items.length);
  const title = cfg.impressions?.planningTitle || "Planning machine";
  const sheetClasses = `print-sheet print-${cfg.impressions?.orientation || "portrait"}`;
  return `
  <div class="card ${sheetClasses}">
    <div class="print-head">
      <div class="print-brand">
        ${printBool('showLogo') ? renderCompanyLogo("print-logo") : ""}
        <div>
          <div class="print-eyebrow">${esc(title)} — ${cfg.impressions?.paperFormat || "A4"}</div>
          ${printBool('showMachineName') ? `<h2>${m.id} — ${esc(m.nom)}</h2>` : `<h2>${esc(title)}</h2>`}
          <div style="font-size:12.5px;color:var(--ink-2)">${esc(m.dept)}${printBool('showDatePrint') ? ' · Édité le 07/07/2026' : ''}${printBool('showCompanyName') ? ` · ${esc(cfg.general.companyName)}` : ''}</div>
        </div>
      </div>
      <div class="print-note">Document de travail<br>non contractuel</div>
    </div>
    ${parSemaine.length===0?'<p style="margin-top:18px;color:var(--ink-3)">Aucune opération planifiée sur ce mois.</p>':parSemaine.map(g=>`
    ${printBool('showWeek') ? `<h3 style="margin:20px 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-2)">Semaine ${g.s}</h3>` : ''}
    <table class="print-planning-table">
      <thead><tr>${cols.map(c=>`<th>${esc(c.label)}</th>`).join("")}${printBool('showCheckboxDone')?'<th style="text-align:center">Terminé</th>':''}${printBool('showCheckboxProblem')?'<th style="text-align:center">Problème</th>':''}</tr></thead>
      <tbody>${g.items.map(b=>{ const o=ofByNum(b.of); return `
        <tr>
          ${cols.map(c=>`<td>${renderPrintCell(c.key,b,o)}</td>`).join("")}
          ${printBool('showCheckboxDone')?'<td style="text-align:center"><span class="pcheck"></span></td>':''}
          ${printBool('showCheckboxProblem')?'<td style="text-align:center"><span class="pcheck"></span></td>':''}
        </tr>`;}).join("")}</tbody>
    </table>`).join("")}
    ${printBool('showFooter') ? `<div class="print-foot">${esc(cfg.personnalisation.machinePrintFooter || "Notes / aléas :")}</div>` : ''}
  </div>`;
}

/* ================================================================
   DEMANDES & ACTIONS
   ================================================================ */
function decideDemande(id, statut){
  const d = DEMANDES.find(x=>x.id===id); if(d) d.statut=statut;
  render(); toast(`${id} ${statut.toLowerCase()} — e-mail de confirmation envoyé au demandeur`);
}
const TYPES_DEMANDE = ["Planification OF","Passage en urgence","Avance de production","Changement de priorité","Blocage / dérogation","Autre"];
function setDemStatut(s){ state.demStatut=s; render(); }
function setDemType(t){ state.demType=t; render(); }
function ouvrirNouvelleDemande(){
  $("modalRoot").innerHTML = `
  <div class="overlay" onclick="if(event.target===this)fermerModal()">
    <div class="modal">
      <div class="modal-head">
        <b>Nouvelle demande</b>
        <span class="t-sub">Elle entrera dans le circuit d'approbation (traçabilité EN 9100)</span>
        <button class="icon-btn" style="margin-left:auto" onclick="fermerModal()">✕</button>
      </div>
      <div class="modal-body">
        <label class="t-sub">Type de demande</label>
        <select id="demType" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:9px">${TYPES_DEMANDE.map(t=>`<option>${t}</option>`).join("")}</select>
        <label class="t-sub" style="margin-top:9px">OF concerné</label>
        <select id="demOF" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:9px">${OFS.map(o=>`<option value="${o.num}">${o.num} — ${esc(o.client)} · ${esc(o.designation)}</option>`).join("")}</select>
        <label class="t-sub" style="margin-top:9px">Priorité</label>
        <select id="demPrio" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:9px"><option>Normale</option><option>Haute</option><option>Urgente</option></select>
        <label class="t-sub" style="margin-top:9px">Demandeur</label>
        <input id="demDemandeur" value="${esc(getSettings().general.userName||"Daniel")} (${esc(getSettings().general.roleName||"Flux & Production")})" style="width:100%">
        <label class="t-sub" style="margin-top:9px">Commentaire / justification</label>
        <textarea id="demComment" placeholder="Décrivez la demande, le besoin client, l'impact planning…"></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="fermerModal()">Annuler</button>
        <button class="btn btn-blue" onclick="creerDemande()">Créer la demande</button>
      </div>
    </div>
  </div>`;
}
function creerDemande(){
  const comment = $("demComment").value.trim();
  if(!comment){ toast("Ajoutez un commentaire pour justifier la demande"); return; }
  const maxNum = DEMANDES.reduce((mx,d)=>Math.max(mx, Number(String(d.id).replace(/\D/g,""))||0), 0);
  DEMANDES.unshift({
    id: "DEM-" + String(maxNum+1).padStart(3,"0"),
    type: $("demType").value, demandeur: $("demDemandeur").value || "—",
    date: new Date().toLocaleDateString("fr-BE",{day:"2-digit",month:"2-digit"}),
    of: $("demOF").value, priorite: $("demPrio").value,
    statut: "En attente", commentaire: comment
  });
  fermerModal(); render(); toast("Demande créée — en attente d'approbation");
}
function renderDemandes(){
  const badge = s=>({"En attente":"b-attente","Approuvée":"b-approuvee","Refusée":"b-refusee","Planifiée":"b-encours"})[s]||"b-planifie";
  const tab = state.demTab || "production";
  const CATLIST = DEMANDES.filter(d=>(d.categorie||"production")===tab);
  const stAtt = CATLIST.filter(d=>d.statut==="En attente").length;
  const stApp = CATLIST.filter(d=>d.statut==="Approuvée").length;
  const stRef = CATLIST.filter(d=>d.statut==="Refusée").length;
  const fStatut = state.demStatut || "Toutes";
  const fType = state.demType || "Tous";
  const types = ["Tous", ...new Set(tab==="maintenance" ? CATLIST.map(d=>d.type) : [...TYPES_DEMANDE, ...CATLIST.map(d=>d.type)])];
  const list = CATLIST.filter(d=>(fStatut==="Toutes"||d.statut===fStatut)&&(fType==="Tous"||d.type===fType));
  const entete = `
  <div class="card card-pad" style="margin-bottom:14px">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
      <button class="chip ${tab==="production"?"on":""}" onclick="state.demTab='production';render()">Production (${DEMANDES.filter(d=>(d.categorie||"production")==="production").length})</button>
      <button class="chip ${tab==="maintenance"?"on":""}" onclick="state.demTab='maintenance';render()">🔧 Maintenance machine (${DEMANDES.filter(d=>d.categorie==="maintenance").length})</button>
    </div>
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="display:flex;gap:18px;flex-wrap:wrap">
        <div><b style="font-size:22px">${stAtt}</b><div class="t-sub">En attente</div></div>
        <div><b style="font-size:22px;color:var(--green)">${stApp}</b><div class="t-sub">Approuvées</div></div>
        <div><b style="font-size:22px;color:var(--ink-3)">${stRef}</b><div class="t-sub">Refusées</div></div>
      </div>
      <button class="btn btn-blue" style="margin-left:auto" onclick="${tab==='maintenance'?'ouvrirDemandeMaint()':'ouvrirNouvelleDemande()'}">＋ Nouvelle demande</button>
    </div>
    <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center">
      ${["Toutes","En attente","Approuvée","Planifiée","Refusée"].map(s=>`<button class="chip ${fStatut===s?"on":""}" onclick="setDemStatut('${s}')">${s}</button>`).join("")}
      <select onchange="setDemType(this.value)" style="border:1px solid var(--border);border-radius:9px;padding:6px 9px;background:#fff">${types.map(t=>`<option ${fType===t?"selected":""}>${t}</option>`).join("")}</select>
    </div>
  </div>`;
  if(!list.length) return entete + `<div class="card card-pad"><p class="t-sub">Aucune demande ne correspond aux filtres.</p></div>`;
  return entete + list.map(d=>`
  <div class="card dem">
    <div class="dem-head">
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <b>${d.id}</b><span style="color:var(--ink-2);font-size:13px">${d.type}</span>${prio(d.priorite)}<span class="badge ${badge(d.statut)}">${d.statut}</span>
        </div>
        <div class="dem-meta">${esc(d.demandeur)} · ${d.date} · concerne ${d.machine?`<b>${d.machine}</b>`:`<span class="link" onclick="openOF('${d.of}')">${d.of}</span>`}</div>
        <div class="dem-body">${esc(d.commentaire)}</div>
      </div>
      <div style="display:flex;gap:8px;flex-shrink:0;flex-wrap:wrap">
        ${d.statut==="En attente"?`
        <button class="btn btn-green" onclick="decideDemande('${d.id}','Approuvée')">Approuver</button>
        <button class="btn btn-ghost" onclick="decideDemande('${d.id}','Refusée')">Refuser</button>`:""}
        ${d.categorie==="maintenance"&&(d.statut==="En attente"||d.statut==="Approuvée")?`
        <button class="btn btn-blue" onclick="planifierDemandeMaint('${d.id}')">📅 Planifier</button>`:""}
      </div>
    </div>
  </div>`).join("") + `<p class="t-sub">Chaque décision est historisée avec horodatage et visa (traçabilité EN 9100). Un e-mail de confirmation est envoyé au demandeur.</p>`;
}

function toggleAction(id){
  const a = ACTIONS.find(x=>x.id===id); if(a) a.statut = a.statut==="Terminée"?"À faire":"Terminée";
  render();
}
function renderActions(){
  return `<div style="display:flex;justify-content:flex-end;margin-bottom:11px"><button class="btn btn-blue" onclick="dialogAction({})">＋ Nouvelle action</button></div><div class="card">${ACTIONS.map(a=>`
    <div class="action-row ${a.statut==="Terminée"?"done":""}">
      <button class="check ${a.statut==="Terminée"?"on":""}" onclick="toggleAction('${a.id}')"></button>
      <div style="flex:1;min-width:0">
        <div class="a-title">${esc(a.titre)}</div>
        <div class="a-meta">${a.type?`<span class="badge b-planifie">${a.type}</span> · `:""}${a.resp} · échéance ${a.echeance}${a.of&&a.of!=="—"?` · <span class="link" onclick="openOF('${a.of}')">${a.of}</span>`:""}${a.client?` (${a.client})`:""}</div>
      </div>
      ${prio(a.priorite)}
    </div>`).join("")}</div>`;
}

/* ================================================================
   KPI (Chart.js)
   ================================================================ */
function renderKPIPage(){
  return `
  <div class="grid g-2">
    <div class="card card-pad"><h3>OTD — livraisons à l'heure</h3><div class="sub">6 dernières semaines · objectif 90 %</div><canvas id="chOtd" height="170"></canvas></div>
    <div class="card card-pad"><h3>Taux d'occupation par département</h3><div class="sub">Semaine 27 vs cible</div><canvas id="chTaux" height="170"></canvas></div>
    <div class="card card-pad"><h3>Causes d'arrêt — semaine 27</h3><div class="sub">Heures perdues par cause (Pareto)</div><canvas id="chCauses" height="170"></canvas></div>
    <div class="card card-pad"><h3>Indicateurs de la semaine</h3><div class="sub">Consolidation import ERP + pointages atelier</div>
      <div class="grid g-2" style="gap:10px">
        ${[["Fiabilité du planning","78 %","opérations démarrées au jour prévu"],["Lead time moyen","12,4 j","de lancement à contrôle final"],["Temps de réglage","14 h","−3 h vs S26"],["Retard moyen","2,1 j","sur les OF en retard"]]
          .map(([k,v,s])=>`<div class="kpi-mini"><div class="v">${v}</div><div class="k">${k}</div><div class="s">${s}</div></div>`).join("")}
      </div>
    </div>
  </div>`;
}
function mountCharts(){
  if(typeof Chart==="undefined") return;
  const grid={color:"#f1f5f9"}, ticks={color:"#94a3b8",font:{size:11}};
  charts.push(new Chart($("chOtd"),{type:"line",data:{labels:KPI_OTD.map(k=>k.sem),datasets:[
    {label:"OTD %",data:KPI_OTD.map(k=>k.otd),borderColor:"#1d4ed8",backgroundColor:"#1d4ed8",tension:.35,pointRadius:4},
    {label:"Objectif",data:KPI_OTD.map(()=>90),borderColor:"#10b981",borderDash:[5,5],pointRadius:0}]},
    options:{plugins:{legend:{labels:{font:{size:11}}}},scales:{y:{min:70,max:100,grid,ticks},x:{grid,ticks}}}}));
  charts.push(new Chart($("chTaux"),{type:"bar",data:{labels:KPI_TAUX.map(k=>k.dept),datasets:[
    {label:"Réalisé %",data:KPI_TAUX.map(k=>k.taux),backgroundColor:"#1d4ed8",borderRadius:6},
    {label:"Cible %",data:KPI_TAUX.map(k=>k.cible),backgroundColor:"#cbd5e1",borderRadius:6}]},
    options:{plugins:{legend:{labels:{font:{size:11}}}},scales:{y:{min:0,max:100,grid,ticks},x:{grid,ticks}}}}));
  charts.push(new Chart($("chCauses"),{type:"bar",data:{labels:KPI_CAUSES.map(k=>k.cause),datasets:[
    {label:"Heures",data:KPI_CAUSES.map(k=>k.h),backgroundColor:"#f59e0b",borderRadius:6}]},
    options:{indexAxis:"y",plugins:{legend:{display:false}},scales:{x:{grid,ticks},y:{grid:{display:false},ticks}}}}));
}

/* ================================================================
   RECHERCHE, NOTIFICATIONS, ASSISTANT IA
   ================================================================ */
$("searchInput").addEventListener("input", e=>{
  const q = e.target.value.trim().toLowerCase();
  const box = $("searchResults");
  if(q.length<2){ box.innerHTML=""; return; }
  const r = [];
  OFS.forEach(o=>{ if((o.num+" "+o.client+" "+o.article+" "+o.designation).toLowerCase().includes(q))
    r.push({type:"OF",label:`${o.num} — ${o.designation}`,sub:o.client,act:`openOF('${o.num}')`}); });
  getMachines().forEach(m=>{ if((m.id+" "+m.nom).toLowerCase().includes(q))
    r.push({type:"Machine",label:`${m.id} — ${m.nom}`,sub:m.dept,act:`go('planning')`}); });
  ACTIONS.forEach(a=>{ if(a.titre.toLowerCase().includes(q))
    r.push({type:"Action",label:a.titre,sub:`${a.resp} · ${a.echeance}`,act:`go('actions')`}); });
  box.innerHTML = r.length ? `<div class="search-results">${r.slice(0,8).map(x=>
    `<button onclick="${x.act};document.getElementById('searchInput').value='';document.getElementById('searchResults').innerHTML=''">
      <span class="sr-type">${x.type}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(x.label)}</span><span class="sr-sub">${esc(x.sub)}</span></button>`).join("")}</div>` : "";
});

function toggleNotif(){
  const p = $("notifPanel");
  if(p.innerHTML){ p.innerHTML=""; return; }
  const ic = {alerte:"⚠️",demande:"📥",charge:"🏭",ok:"✅"};
  p.innerHTML = `<div class="notif-panel"><h4>NOTIFICATIONS</h4>
    ${NOTIFICATIONS.map(n=>`<div class="notif"><span>${ic[n.type]}</span><div>${esc(n.texte)}<br><small>${n.quand}</small></div></div>`).join("")}</div>`;
}
document.addEventListener("click", e=>{
  if(!e.target.closest(".icon-btn") && !e.target.closest(".notif-panel")) $("notifPanel").innerHTML="";
});

/* Assistant IA — branché sur l'API Anthropic (fonctionne dans l'aperçu Claude) */
const AI_SUGGESTIONS = [
  "Quels OF sont en retard et pourquoi ?",
  "Prépare la réunion de production de demain matin.",
  "Rédige un e-mail au client Altair Aero sur l'OF-26-0512.",
  "Où sont les goulots sur le mois de juillet ?",
];
function buildContexte(){
  return JSON.stringify({
    date:"mardi 07/07/2026, semaine 28",
    machines: getMachines().map(m=>({id:m.id,dept:m.dept,chargeS28: chargeMachine(m.id,[0,1,2,3,4]).taux+"%", chargeMois: chargeMachine(m.id,JOURS.map(j=>j.idx)).taux+"%"})),
    ofs: OFS.map(o=>({num:o.num,client:o.client,article:o.article,designation:o.designation,qte:o.qte,priorite:o.priorite,echeance:o.echeance,finEstimee:o.finEstimee,statut:o.statut,avancement:o.avancement+"%",notes:o.notes,
      operations:o.operations.map(op=>({op:op.num,desc:op.desc,machine:op.machine,statut:op.statut,blocage:op.blocage||null}))})),
    planningJuillet: PLANNING.map(p=>({machine:p.machine,jour:JOURS[p.jour].label+"/07 S"+JOURS[p.jour].semaine,of:p.of||("TÂCHE: "+(p.label||"")),op:p.op||p.label||"",h:p.h,statut:p.statut})),
    demandes: DEMANDES, actions: ACTIONS, otdSemaine27:"87%",
    regroupementsPossibles: regroupements().map(r=>({article:r.article, designation:r.designation, atelier:r.dept, ofs:r.ofs, operations:r.ops.map(x=>x.of+" "+x.op)})),
    parcMachines: getMachines().map(m=>({id:m.id, etat:etatMachine(m).txt})),
    maintenancesPlanifiees: ensureParcStore().interventions.filter(i=>i.etat!=="Terminée").map(i=>({machine:i.machineId, type:i.type, date:i.date, etat:i.etat, duree:i.duree+" h", resp:i.resp})),
    qualiteDonneesERP: OFS.map(o=>({of:o.num, score:dqScore(analyseOF(o)), problemes:analyseOF(o).map(p=>p.label)})).filter(x=>x.problemes.length),
  });
}
function openAI(){ $("aiPanel").classList.add("open"); renderAIMsgs(); }
function closeAI(){ $("aiPanel").classList.remove("open"); }
function renderAIMsgs(){
  const box = $("aiMsgs");
  let h = "";
  if(state.aiMessages.length===0){
    h += `<div class="t-sub" style="margin-bottom:4px">Essayez par exemple :</div>` +
      AI_SUGGESTIONS.map(s=>`<button class="sugg" onclick="askAI(${JSON.stringify(s).replace(/"/g,"&quot;")})">${s}</button>`).join("");
  }
  h += state.aiMessages.map(m=>`<div class="msg ${m.role==="user"?"user":"ai"}">${esc(m.content)}</div>`).join("");
  if(state.aiBusy) h += `<div class="typing">⏳ Analyse des données de production…</div>`;
  box.innerHTML = h;
  box.scrollTop = box.scrollHeight;
}
async function askAI(question){
  const q = (question ?? $("aiInput").value).trim();
  if(!q || state.aiBusy) return;
  $("aiInput").value = "";
  state.aiMessages.push({role:"user",content:q});
  state.aiBusy = true; $("aiSend").disabled = true; renderAIMsgs();
  try{
    const res = await fetch("https://api.anthropic.com/v1/messages",{
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-6", max_tokens:1000,
        system:"Tu es l'assistant IA de ProdPilot, plateforme de pilotage de production d'un atelier de mécanique de précision (environnement EN 9100). "
          +"Tu réponds UNIQUEMENT à partir des données de production ci-dessous, en français, de façon concise, structurée et orientée décision. "
          +"Si une information n'est pas dans les données, dis-le. Données : "+buildContexte(),
        messages: state.aiMessages.map(m=>({role:m.role,content:m.content})),
      }),
    });
    const data = await res.json();
    const text = (data.content||[]).map(c=>c.text||"").join("\n").trim();
    state.aiMessages.push({role:"assistant",content: text || "Réponse vide — réessayez."});
  }catch(err){
    state.aiMessages.push({role:"assistant",content:"Connexion à l'IA impossible depuis ce contexte. L'assistant fonctionne dans l'aperçu Claude ; en local, il faudra brancher une clé API Anthropic (phase 2)."});
  }finally{
    state.aiBusy = false; $("aiSend").disabled = false; renderAIMsgs();
  }
}
$("aiInput").addEventListener("keydown", e=>{ if(e.key==="Enter") askAI(); });

/* (initialisation déplacée en fin de fichier) */

/* ================================================================
   MODULE QUALITÉ DES DONNÉES ERP
   ================================================================ */

const DQ_TYPES = {
  date_planifiee:"Date planifiée manquante",
  machine_manquante:"Machine manquante",
  machine_inconnue:"Machine inconnue",
  temps_manquant:"Temps estimé manquant",
  desc_manquante:"Description d'opération manquante",
  client_manquant:"Client manquant",
  article_manquant:"Référence article manquante",
  gamme_incomplete:"Gamme incomplète",
  statut_incoherent:"Statut d'opération incohérent",
  echeance_depassee:"Échéance client dépassée",
  op_apres_echeance:"Opération planifiée après l'échéance",
  doublon:"OF en doublon",
  responsable_manquant:"Opérateur non affecté",
  priorite_manquante:"Priorité manquante",
  qte_invalide:"Quantité manquante ou nulle",
};
const DQ_SEV = {
  machine_manquante:"Critique", machine_inconnue:"Critique", temps_manquant:"Critique",
  client_manquant:"Critique", article_manquant:"Critique", qte_invalide:"Critique", doublon:"Critique",
  gamme_incomplete:"Majeur", date_planifiee:"Majeur", desc_manquante:"Majeur",
  statut_incoherent:"Majeur", echeance_depassee:"Majeur", op_apres_echeance:"Majeur",
  responsable_manquant:"Mineur", priorite_manquante:"Mineur",
};
const DQ_CORRECTIONS = {
  date_planifiee:"Renseigner la date planifiée de l'opération dans l'ERP.",
  machine_manquante:"Affecter un poste de charge (machine) à l'opération.",
  machine_inconnue:"Corriger le code machine : il n'existe pas dans le parc.",
  temps_manquant:"Saisir le temps estimé (gamme) pour permettre le calcul de charge.",
  desc_manquante:"Compléter le libellé de l'opération dans la gamme.",
  client_manquant:"Renseigner le client sur l'en-tête de l'OF.",
  article_manquant:"Renseigner la référence article (N° de plan).",
  gamme_incomplete:"Compléter la gamme opératoire (au moins usinage + contrôle).",
  statut_incoherent:"Corriger le pointage : dates réelles et statut ne concordent pas.",
  echeance_depassee:"Confirmer une nouvelle date de livraison avec le client.",
  op_apres_echeance:"Replanifier l'opération avant l'échéance client ou renégocier la date.",
  doublon:"Vérifier et supprimer / fusionner l'OF en double dans l'ERP.",
  responsable_manquant:"Affecter un opérateur à l'opération en cours.",
  priorite_manquante:"Définir la priorité de l'OF (Urgente / Haute / Normale).",
  qte_invalide:"Saisir la quantité à produire (actuellement vide ou nulle).",
};
const SEV_POIDS = { Critique:18, Majeur:10, Mineur:4 };
const SEV_ORDRE = { Critique:3, Majeur:2, Mineur:1 };
const MACH_DEPTS = ["Tournage","Fraisage","Découpe fil"];
const TODAY_KEY = 707; /* 07/07 */

function dateKey(s){ if(!s) return null; const p = s.split("/"); return Number(p[1])*100 + Number(p[0]); }

/* Moteur de détection : analyse un OF et retourne la liste des problèmes */
function analyseOF(of){
  const probs = [];
  const add = (code, op, detail) => probs.push({
    code, label: DQ_TYPES[code], sev: DQ_SEV[code], op: op ? "OP"+op.num : "OF",
    detail: detail||"", correction: DQ_CORRECTIONS[code],
    role: PROBLEME_RESPONSABLE[code],
  });

  /* Niveau OF */
  if(!of.client) add("client_manquant", null);
  if(!of.article) add("article_manquant", null);
  if(!of.qte || of.qte <= 0) add("qte_invalide", null);
  if(!of.priorite) add("priorite_manquante", null);
  if(of.statut !== "Terminé" && dateKey(of.echeance) !== null && dateKey(of.echeance) < TODAY_KEY)
    add("echeance_depassee", null, "Échéance " + of.echeance);
  if((of.operations||[]).length < 2) add("gamme_incomplete", null, (of.operations||[]).length + " opération(s) en gamme");

  /* Doublons : même client + même article sur un autre OF */
  if(of.client && of.article){
    const dbl = OFS.filter(o => o.num !== of.num && o.client === of.client && o.article === of.article && o.cmd === of.cmd && o.statut !== "Terminé");
    if(dbl.length) add("doublon", null, "Même article / client que " + dbl.map(d=>d.num).join(", "));
  }

  /* Niveau opérations */
  let prevNonTerminee = false;
  (of.operations||[]).forEach(op => {
    const usinage = MACH_DEPTS.includes(op.dept);
    if(!op.desc) add("desc_manquante", op);
    if(!op.datePrev) add("date_planifiee", op);
    if(usinage && (!op.machine || op.machine === "—")) add("machine_manquante", op);
    if(op.machine && op.machine !== "—" && !getMachines().find(m => m.id === op.machine))
      add("machine_inconnue", op, "Code « " + op.machine + " » absent du parc machines");
    if(usinage && (op.tpsEstime == null || op.tpsEstime === 0)) add("temps_manquant", op);
    if(op.statut === "Terminée" && !op.finReel) add("statut_incoherent", op, "Terminée sans date de fin réelle");
    else if(op.statut === "En cours" && !op.debutReel) add("statut_incoherent", op, "En cours sans date de début réelle");
    else if(op.statut === "Terminée" && prevNonTerminee) add("statut_incoherent", op, "Terminée alors qu'une opération amont ne l'est pas");
    if((op.statut === "En cours" || op.statut === "En réglage") && !op.operateur) add("responsable_manquant", op);
    if(op.datePrev && of.echeance && dateKey(op.datePrev) > dateKey(of.echeance))
      add("op_apres_echeance", op, "Prévue le " + op.datePrev + ", échéance " + of.echeance.slice(0,5));
    if(op.statut !== "Terminée") prevNonTerminee = true;
  });
  return probs;
}

function dqScore(probs){ return Math.max(0, 100 - probs.reduce((s,p)=>s+SEV_POIDS[p.sev],0)); }
function dqNiveau(score){ return score>=90 ? {txt:"Bon",cls:"b-termine"} : score>=70 ? {txt:"À surveiller",cls:"b-attente"} : {txt:"Critique",cls:"b-retard"}; }
function sevBadge(s){ return `<span class="badge ${ {Critique:"b-critique",Majeur:"b-majeur",Mineur:"b-mineur"}[s] }">${s}</span>`; }
function dqPireSev(probs){ return probs.reduce((m,p)=>SEV_ORDRE[p.sev]>SEV_ORDRE[m]?p.sev:m,"Mineur"); }
function dqRole(num, probs){
  if(state.dqAssign[num]) return state.dqAssign[num];
  const pire = probs.slice().sort((a,b)=>SEV_ORDRE[b.sev]-SEV_ORDRE[a.sev])[0];
  return pire ? pire.role : "Planification";
}
function dqEnvoye(num){ return ALERTES.some(a=>a.of===num && a.envoye && !a.resolu); }
function dqListe(){ return OFS.map(o=>({o, probs:analyseOF(o)})).filter(x=>x.probs.length); }
function setDQ(field, val){ state[field]=val; render(); }
function openDQ(num){ state.dqSelected=num; state.page="dataq"; render(); }

/* ---------- Page principale ---------- */
function renderDQ(){
  let liste = dqListe();
  const tousTypes = [...new Set(liste.flatMap(x=>x.probs.map(p=>p.code)))];
  const tousClients = [...new Set(liste.map(x=>x.o.client||"(sans client)"))];
  const tousRoles = Object.keys(RESPONSABLES);

  /* KPI (avant filtres) */
  const nbCrit = liste.filter(x=>dqScore(x.probs)<70).length;
  const nbMachine = liste.reduce((s,x)=>s+x.probs.filter(p=>p.code==="machine_manquante"||p.code==="machine_inconnue").length,0);
  const nbDate = liste.reduce((s,x)=>s+x.probs.filter(p=>p.code==="date_planifiee").length,0);
  const nbTemps = liste.reduce((s,x)=>s+x.probs.filter(p=>p.code==="temps_manquant").length,0);
  const nbMails = liste.filter(x=>!state.dqResolus[x.o.num] && !dqEnvoye(x.o.num)).length;

  /* Filtres */
  if(state.dqHideResolved) liste = liste.filter(x=>!state.dqResolus[x.o.num]);
  if(state.dqSev!=="Toutes") liste = liste.filter(x=>x.probs.some(p=>p.sev===state.dqSev));
  if(state.dqType!=="Tous") liste = liste.filter(x=>x.probs.some(p=>p.code===state.dqType));
  if(state.dqClient!=="Tous") liste = liste.filter(x=>(x.o.client||"(sans client)")===state.dqClient);
  if(state.dqResp!=="Tous") liste = liste.filter(x=>dqRole(x.o.num,x.probs)===state.dqResp);
  liste.sort((a,b)=>dqScore(a.probs)-dqScore(b.probs));

  const kpi = (ic,cls,val,lbl,sub)=>`
    <div class="card kpi" style="cursor:default"><div class="ic ${cls}">${ICONS[ic]}</div>
    <div><div class="val">${val}</div><div class="lbl">${lbl}</div><div class="sub">${sub}</div></div></div>`;

  return `
  <div class="grid" style="grid-template-columns:repeat(6,1fr);margin-bottom:14px" id="dqKpis">
    ${kpi("alert","ic-blue",dqListe().length,"OF avec problèmes","détectés à l'import")}
    ${kpi("alert","ic-red",nbCrit,"OF critiques","score < 70 %")}
    ${kpi("factory","ic-red",nbMachine,"Machine manquante","ou inconnue")}
    ${kpi("cal","ic-amber",nbDate,"Date planifiée","manquante")}
    ${kpi("chart","ic-amber",nbTemps,"Temps estimé","manquant")}
    ${kpi("inbox","ic-blue",nbMails,"E-mails à envoyer","alertes en attente")}
  </div>

  <div class="card" style="overflow:hidden">
    <div class="filters">
      <select onchange="setDQ('dqSev',this.value)">
        ${["Toutes","Critique","Majeur","Mineur"].map(s=>`<option value="${s}" ${state.dqSev===s?"selected":""}>${s==="Toutes"?"Toutes sévérités":s}</option>`).join("")}
      </select>
      <select onchange="setDQ('dqType',this.value)">
        <option value="Tous">Tous les problèmes</option>
        ${tousTypes.map(t=>`<option value="${t}" ${state.dqType===t?"selected":""}>${DQ_TYPES[t]}</option>`).join("")}
      </select>
      <select onchange="setDQ('dqClient',this.value)">
        <option value="Tous">Tous les clients</option>
        ${tousClients.map(c=>`<option ${state.dqClient===c?"selected":""}>${c}</option>`).join("")}
      </select>
      <select onchange="setDQ('dqResp',this.value)">
        <option value="Tous">Tous les responsables</option>
        ${tousRoles.map(r=>`<option value="${r}" ${state.dqResp===r?"selected":""}>${r} (${RESPONSABLES[r].nom})</option>`).join("")}
      </select>
      <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-2)">
        <input type="checkbox" ${state.dqHideResolved?"checked":""} onchange="setDQ('dqHideResolved',this.checked)"> Masquer les résolus
      </label>
      <button class="btn btn-ghost" style="margin-left:auto" onclick="exportDQ()">⭳ Exporter la liste (CSV)</button>
    </div>
    <div style="overflow-x:auto"><table>
      <thead><tr><th>OF</th><th>Client</th><th>Article</th><th>Problèmes détectés</th><th>Sévérité</th><th>Responsable</th><th style="width:150px">Score qualité</th><th>Import</th><th></th></tr></thead>
      <tbody>
      ${liste.length===0?'<tr><td colspan="9" style="text-align:center;color:var(--ink-3);padding:26px">Aucun OF ne correspond aux filtres. 🎉</td></tr>':""}
      ${liste.map(x=>{
        const score = dqScore(x.probs), niv = dqNiveau(score);
        const role = dqRole(x.o.num, x.probs);
        const resolu = state.dqResolus[x.o.num];
        return `<tr class="row-click" style="${resolu?"opacity:.45":""}" onclick="openDQ('${x.o.num}')">
          <td><b>${x.o.num}</b>${resolu?' <span class="badge b-termine">Résolu</span>':dqEnvoye(x.o.num)?' <span class="badge b-encours">Alerte envoyée</span>':""}</td>
          <td style="color:var(--ink-2)">${x.o.client||'<span style="color:var(--red)">manquant</span>'}</td>
          <td>${x.o.article||'<span style="color:var(--red)">manquant</span>'}<div class="t-sub">${esc(x.o.designation||"")}</div></td>
          <td><b style="font-size:12.5px">${x.probs.length}</b> <span class="t-sub">— ${x.probs.slice(0,2).map(p=>p.label).join(" · ")}${x.probs.length>2?"…":""}</span></td>
          <td>${sevBadge(dqPireSev(x.probs))}</td>
          <td style="font-size:12.5px;color:var(--ink-2)">${role}<div class="t-sub">${RESPONSABLES[role].nom}</div></td>
          <td><div style="display:flex;align-items:center;gap:7px">${pbar(score,score<70)}<span class="badge ${niv.cls}">${score}%</span></div></td>
          <td class="t-sub">${x.o.importe||"07/07 05:30"}</td>
          <td><button class="btn btn-blue" style="padding:5px 11px" onclick="event.stopPropagation();genEmail('${x.o.num}')">E-mail</button></td>
        </tr>`;}).join("")}
      </tbody>
    </table></div>
  </div>
  <p class="t-sub" style="margin-top:9px">Score qualité : 100 % − pénalités (Critique −18, Majeur −10, Mineur −4). Les responsables par type de problème se configurent dans <b>js/data.js</b> (objets RESPONSABLES et PROBLEME_RESPONSABLE).</p>`;
}

/* ---------- Détail OF ---------- */
function renderDQDetail(num){
  const o = ofByNum(num);
  const probs = analyseOF(o);
  const score = dqScore(probs), niv = dqNiveau(score);
  const role = dqRole(num, probs);
  const resolu = state.dqResolus[num];
  const histo = ALERTES.filter(a=>a.of===num);

  return `
  <button class="back-link" onclick="state.dqSelected=null;render()">‹ Retour à la liste</button>
  <div class="card card-pad" style="margin-bottom:14px">
    <div class="detail-head">
      <div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <h2 style="font-size:19px">${o.num}</h2>${badgeOF(o.statut)}${prio(o.priorite)}
          ${resolu?'<span class="badge b-termine">Résolu</span>':dqEnvoye(num)?'<span class="badge b-encours">Alerte envoyée</span>':""}
        </div>
        <div style="color:var(--ink-2);margin-top:3px">${o.article||"(article manquant)"} — ${esc(o.designation||"")}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:23px;font-weight:700" class="${score<70?"c-hot":score<90?"c-warn":"c-ok"}">${score} %</div>
        <span class="badge ${niv.cls}">${niv.txt}</span>
      </div>
    </div>
    <div class="detail-grid">
      ${[["Client",o.client||"—"],["Commande",o.cmd||"—"],["Quantité",(o.qte||0)+" pcs"],["Échéance",o.echeance||"—"],["Dernier import",o.importe||"07/07 05:30"]]
        .map(([k,v])=>`<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("")}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px" class="no-print">
      <button class="btn btn-blue" onclick="genEmail('${num}')">✉ Générer l'e-mail d'alerte</button>
      ${resolu
        ? `<button class="btn btn-ghost" onclick="reouvrirDQ('${num}')">Rouvrir</button>`
        : `<button class="btn btn-green" onclick="resoudreDQ('${num}')">✓ Marquer comme résolu</button>`}
      <label style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--ink-2)">Responsable :
        <select onchange="assignerDQ('${num}',this.value)" style="border:1px solid var(--border);border-radius:9px;padding:6px 9px;background:#fff">
          ${Object.keys(RESPONSABLES).map(r=>`<option value="${r}" ${role===r?"selected":""}>${r} — ${RESPONSABLES[r].nom}</option>`).join("")}
        </select>
      </label>
    </div>
  </div>

  <div class="grid g-2-1">
    <div class="card card-pad">
      <h3 style="margin-bottom:12px">Problèmes détectés (${probs.length})</h3>
      ${probs.map(p=>`
      <div class="dq-prob">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          ${sevBadge(p.sev)}<b style="font-size:13px">${p.label}</b>
          <span class="t-sub">· ${p.op}</span>
          <span class="t-sub" style="margin-left:auto">→ ${p.role} (${RESPONSABLES[p.role].nom})</span>
        </div>
        ${p.detail?`<div class="t-sub" style="margin-top:3px">${esc(p.detail)}</div>`:""}
        <div style="font-size:12px;color:var(--green);margin-top:4px">✎ ${p.correction}</div>
      </div>`).join("")}

      <h3 style="margin:18px 0 9px">Gamme opératoire (état import)</h3>
      <table>
        <thead><tr><th style="padding-left:0">OP</th><th>Description</th><th>Machine</th><th>Temps</th><th>Date prévue</th><th>Statut</th></tr></thead>
        <tbody>${(o.operations||[]).map(op=>`
          <tr>
            <td style="padding-left:0"><b>OP${op.num}</b></td>
            <td>${op.desc||'<span style="color:var(--red)">manquante</span>'}</td>
            <td>${MACH_DEPTS.includes(op.dept) ? (op.machine&&op.machine!=="—" ? (getMachines().find(m=>m.id===op.machine)?op.machine:`<span style="color:var(--red)">${op.machine} ?</span>`) : '<span style="color:var(--red)">manquante</span>') : (op.machine||"—")}</td>
            <td>${op.tpsEstime!=null&&op.tpsEstime!==0 ? op.tpsEstime+" h" : (MACH_DEPTS.includes(op.dept)?'<span style="color:var(--red)">manquant</span>':"—")}</td>
            <td>${op.datePrev||'<span style="color:var(--red)">manquante</span>'}</td>
            <td><span class="badge ${ {Terminée:"b-termine","En cours":"b-encours","En réglage":"b-attente",Bloquée:"b-retard",Planifiée:"b-planifie"}[op.statut]||"b-planifie" }">${op.statut}</span></td>
          </tr>`).join("")}</tbody>
      </table>
    </div>

    <div class="card card-pad">
      <h3 style="margin-bottom:11px">Historique des alertes</h3>
      ${histo.length===0?'<div class="t-sub">Aucune alerte envoyée pour cet OF.</div>':histo.map(a=>`
        <div class="dq-prob">
          <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
            <b style="font-size:12.5px">${a.date}</b>
            ${a.envoye?'<span class="badge b-encours">Envoyée</span>':""}
            ${a.resolu?'<span class="badge b-termine">Résolue</span>':""}
          </div>
          <div style="font-size:12.5px;color:var(--ink-2);margin-top:3px">${esc(a.probleme)}</div>
          <div class="t-sub">Responsable : ${esc(a.responsable)}${a.commentaire?" · "+esc(a.commentaire):""}</div>
        </div>`).join("")}
    </div>
  </div>`;
}

/* ---------- Actions : résoudre / rouvrir / assigner / exporter ---------- */
function resoudreDQ(num){
  state.dqResolus[num] = true;
  const probs = analyseOF(ofByNum(num));
  ALERTES.push({ date:"07/07 "+new Date().toTimeString().slice(0,5), of:num,
    probleme:"Clôture : "+probs.map(p=>p.label).join(", "),
    responsable: dqRole(num,probs)+" ("+RESPONSABLES[dqRole(num,probs)].nom+")",
    envoye:false, resolu:true, commentaire:"Marqué résolu depuis ProdPilot" });
  render(); toast(num+" marqué comme résolu");
}
function reouvrirDQ(num){ delete state.dqResolus[num]; render(); toast(num+" rouvert"); }
function assignerDQ(num, role){ state.dqAssign[num]=role; render(); toast("Responsable de l'alerte "+num+" : "+role+" ("+RESPONSABLES[role].nom+")"); }

function exportDQ(){
  let csv = "\uFEFFOF;Client;Article;Severite;Probleme;Operation;Detail;Correction;Responsable;Score\n";
  dqListe().forEach(x=>{
    const score = dqScore(x.probs);
    x.probs.forEach(p=>{
      csv += [x.o.num, x.o.client||"", x.o.article||"", p.sev, p.label, p.op, p.detail, p.correction,
        p.role+" ("+RESPONSABLES[p.role].nom+")", score+"%"].map(v=>String(v).replace(/;/g,",")).join(";")+"\n";
    });
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
  a.download = "problemes-donnees-erp.csv";
  a.click(); URL.revokeObjectURL(a.href);
  toast("Liste des problèmes exportée (CSV)");
}

/* ---------- Génération d'e-mail + modale ---------- */
function genEmail(num){
  const o = ofByNum(num);
  const probs = analyseOF(o);
  const role = dqRole(num, probs);
  const resp = RESPONSABLES[role];
  state.dqMailOF = num;

  const sujet = `[ProdPilot] Données ERP à corriger — ${o.num}${o.client?" ("+o.client+")":""}`;
  const corps =
`Bonjour ${resp.nom.split(" ").slice(-1)[0]},

L'OF suivant présente des informations manquantes ou incohérentes dans l'ERP.

OF : ${o.num}
Client : ${o.client||"(non renseigné)"}
Article : ${o.article||"(non renseigné)"} — ${o.designation||""}
Échéance client : ${o.echeance||"(non renseignée)"}
Score qualité données : ${dqScore(probs)} %

Problèmes détectés :
${probs.map(p=>"- "+p.label+" ("+p.op+")"+(p.detail?" — "+p.detail:"")).join("\n")}

Corrections attendues :
${[...new Set(probs.map(p=>"- "+p.correction))].join("\n")}

Peux-tu corriger ces informations dans l'ERP sous 48 h (avant le jeudi 09/07) afin que le planning reste fiable ?

Merci d'avance,

Daniel
Responsable flux & production`;

  $("modalRoot").innerHTML = `
  <div class="overlay" onclick="if(event.target===this)fermerModal()">
    <div class="modal">
      <div class="modal-head">
        <b>E-mail d'alerte — ${o.num}</b>
        <span class="t-sub">À : ${resp.nom} &lt;${resp.email}&gt; · ${role}</span>
        <button class="icon-btn" style="margin-left:auto" onclick="fermerModal()">✕</button>
      </div>
      <div class="modal-body">
        <label class="t-sub">Objet</label>
        <input id="mailSujet" value="${esc(sujet)}">
        <label class="t-sub" style="margin-top:9px">Message (modifiable)</label>
        <textarea id="mailCorps">${esc(corps)}</textarea>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="copierMail()">⧉ Copier</button>
        <button class="btn btn-ghost" onclick="ouvrirOutlook('${resp.email}')">✉ Ouvrir dans Outlook</button>
        <button class="btn btn-blue" onclick="marquerEnvoye('${num}')">✓ Marquer comme envoyé</button>
      </div>
      <div class="t-sub" style="padding:0 16px 13px">Aucun e-mail n'est envoyé automatiquement : vous gardez la main sur l'envoi.</div>
    </div>
  </div>`;
}
function fermerModal(){ $("modalRoot").innerHTML=""; }
function copierMail(){
  const txt = "Objet : "+$("mailSujet").value+"\n\n"+$("mailCorps").value;
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(()=>toast("E-mail copié dans le presse-papiers"));
  } else {
    const ta = $("mailCorps"); ta.select(); document.execCommand("copy"); toast("E-mail copié");
  }
}
function ouvrirOutlook(email){
  const url = "mailto:"+email+"?subject="+encodeURIComponent($("mailSujet").value)+"&body="+encodeURIComponent($("mailCorps").value);
  window.location.href = url;
}
function marquerEnvoye(num){
  const probs = analyseOF(ofByNum(num));
  const role = dqRole(num, probs);
  ALERTES.push({ date:"07/07 "+new Date().toTimeString().slice(0,5), of:num,
    probleme: probs.map(p=>p.label).join(", "),
    responsable: role+" ("+RESPONSABLES[role].nom+")",
    envoye:true, resolu:false, commentaire:"E-mail généré depuis ProdPilot" });
  fermerModal(); render(); toast("Alerte "+num+" marquée comme envoyée");
}

/* Conteneur de modale */
document.body.insertAdjacentHTML("beforeend", '<div id="modalRoot"></div>');

/* ================================================================
   MÊMES PIÈCES EN PRODUCTION — regroupements & multi-OF par jour
   ================================================================ */

/* Autres OF actifs portant le même article (même plan = même pièce) */
function memesArticles(num){
  const of = ofByNum(num);
  if(!of || !of.article) return [];
  return OFS.filter(o => o.num !== num && o.article === of.article && o.statut !== "Terminé");
}

/* Bandeau dans le détail d'un OF */
function bandeauJumeaux(num){
  const jum = memesArticles(num);
  if(!jum.length) return "";
  return `<div class="twin-banner">⧉ <b>Même pièce en production :</b>
    ${jum.map(j=>`<span class="link" onclick="openOF('${j.num}')">${j.num}</span> (${j.statut}, ${j.avancement} %, qté ${j.qte||"?"}, éch. ${j.echeance||"—"})`).join(" · ")}
    — vérifier si des opérations peuvent être <b>usinées ensemble</b> (un seul réglage).</div>`;
}

/* Suggestions de regroupement : même article, opérations restantes dans le même atelier */
function regroupements(){
  const parArticle = {};
  OFS.filter(o => o.statut !== "Terminé" && o.article).forEach(o => {
    (parArticle[o.article] = parArticle[o.article] || []).push(o);
  });
  const out = [];
  Object.values(parArticle).filter(g => g.length > 1).forEach(g => {
    const parDept = {};
    g.forEach(o => (o.operations || []).forEach(op => {
      if(op.statut === "Planifiée" && MACH_DEPTS.includes(op.dept))
        (parDept[op.dept] = parDept[op.dept] || []).push({ of:o.num, op:"OP"+op.num+" — "+(op.desc||"?"), machine:op.machine, h:op.tpsEstime });
    }));
    Object.entries(parDept).forEach(([dept, ops]) => {
      const ofsD = [...new Set(ops.map(x => x.of))];
      if(ofsD.length > 1) out.push({ article:g[0].article, designation:g[0].designation, dept, ops, ofs:ofsD });
    });
  });
  return out;
}

/* Carte "Regroupements possibles" (tableau de bord) */
function renderRegroupements(){
  const rgs = regroupements();
  if(!rgs.length) return "";
  return `
  <div class="card card-pad" style="margin-top:14px">
    <h3 style="display:flex;align-items:center;gap:7px">⧉ Regroupements possibles — mêmes pièces en production</h3>
    <p class="t-sub" style="margin-top:2px">Ces OF portent le même article : usiner leurs opérations ensemble économise un réglage.</p>
    <div style="margin-top:11px;display:flex;flex-direction:column;gap:8px">
      ${rgs.map(r=>`
      <div class="rg-item">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <b style="font-size:13px">${r.article}</b><span class="t-sub">${esc(r.designation||"")}</span>
          <span class="badge b-encours">${r.dept}</span>
        </div>
        <div style="font-size:12.5px;color:var(--ink-2);margin-top:4px">
          ${r.ops.map(x=>`<span class="link" onclick="openOF('${x.of}')">${x.of}</span> (${esc(x.op)}${x.h?", "+x.h+" h":""})`).join(" + ")}
          <span style="color:var(--green);font-weight:600"> → usinables ensemble, un seul réglage</span>
        </div>
      </div>`).join("")}
    </div>
  </div>`;
}

/* Bandeau compact au-dessus du planning */
function bandeauRegroupements(){
  const rgs = regroupements();
  if(!rgs.length) return "";
  return `<div class="twin-banner no-print" style="margin-bottom:13px">⧉ <b>${rgs.length} regroupement(s) possible(s) :</b>
    ${rgs.map(r=>`${r.article} en ${r.dept} (${r.ofs.map(n=>`<span class="link" onclick="openOF('${n}')">${n}</span>`).join(" + ")})`).join(" · ")}
    — détail sur le tableau de bord.</div>`;
}

/* ---------- Ajouter un OF sur une case du planning ---------- */
function ouvrirAjoutOp(mid, jour){
  const m = getMachines().find(x => x.id === mid);
  const dejaLa = PLANNING.filter(p => p.machine === mid && p.jour === jour);
  const chargeJour = dejaLa.reduce((s,p)=>s+p.h,0);

  /* Candidates : opérations planifiées du même atelier (ou affectées à cette machine) */
  const candidats = [];
  OFS.filter(o => o.statut !== "Terminé").forEach(o => (o.operations||[]).forEach(op => {
    if(op.statut !== "Planifiée") return;
    if(op.machine === mid || (MACH_DEPTS.includes(op.dept) && op.dept === m.dept)){
      const artJour = dejaLa.find(p => { const po = ofByNum(p.of); return po && po.article && po.article === o.article && p.of !== o.num; });
      candidats.push({ o, op, artJour });
    }
  }));
  /* Regroupables d'abord, puis par priorité */
  const pOrdre = { Urgente:0, Haute:1, Normale:2 };
  candidats.sort((a,b)=>(a.artJour?0:1)-(b.artJour?0:1) || (pOrdre[a.o.priorite]??2)-(pOrdre[b.o.priorite]??2));

  $("modalRoot").innerHTML = `
  <div class="overlay" onclick="if(event.target===this)fermerModal()">
    <div class="modal">
      <div class="modal-head">
        <b>Ajouter un OF — ${mid} · ${JOURS[jour].label}/07</b>
        <span class="t-sub">Charge actuelle du jour : ${chargeJour}/${m.capJour} h</span>
        <button class="icon-btn" style="margin-left:auto" onclick="fermerModal()">✕</button>
      </div>
      <div class="modal-body" style="gap:7px">
        ${candidats.length===0?'<div class="t-sub">Aucune opération planifiée compatible avec cet atelier.</div>':""}
        ${candidats.map((c,i)=>`
        <div class="rg-item ${c.artJour?"rg-match":""}">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <b style="font-size:13px">${c.o.num}</b>${prio(c.o.priorite)}
            <span class="t-sub">${c.o.article||"?"} — ${esc(c.o.designation||"")}</span>
            ${c.artJour?`<span class="badge b-termine">⧉ Même pièce que ${c.artJour.of} déjà ce jour — à regrouper !</span>`
              : memesArticles(c.o.num).length?`<span class="badge b-encours">⧉ même pièce que ${memesArticles(c.o.num).map(x=>x.num).join(", ")}</span>`:""}
          </div>
          <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:5px;font-size:12.5px;color:var(--ink-2)">
            <span>OP${c.op.num} — ${esc(c.op.desc||"?")}</span>
            <span class="t-sub">gamme : ${c.op.tpsEstime!=null?c.op.tpsEstime+" h":"?"}${c.op.machine&&c.op.machine!==mid?" · machine gamme "+c.op.machine:""} · éch. ${c.o.echeance||"—"}</span>
            <span style="margin-left:auto;display:flex;align-items:center;gap:6px">
              <input type="number" id="hAdd${i}" value="${Math.min(c.op.tpsEstime||2, m.capJour)}" min="0.5" step="0.5"
                     style="width:64px;padding:6px 8px;border:1px solid var(--border);border-radius:9px"> h
              <button class="btn btn-blue" style="padding:6px 12px"
                onclick="ajouterBloc('${mid}',${jour},'${c.o.num}',${c.op.num},'hAdd${i}')">Ajouter</button>
            </span>
          </div>
        </div>`).join("")}
      </div>
      <div style="padding:0 16px 12px"><button class="btn btn-ghost" style="width:100%" onclick="ouvrirTacheLibre({machine:'${mid}',jour:${jour}})">🔧 Planifier une maintenance / tâche libre sur cette case</button></div>
      <div class="t-sub" style="padding:0 16px 13px">Plusieurs OF peuvent partager la même journée : le total d'heures de la case est recalculé et signalé en rouge s'il dépasse la capacité machine.</div>
    </div>
  </div>`;
}

function ajouterBloc(mid, jour, ofNum, opNum, inputId){
  const h = Math.max(0.5, Number($(inputId).value) || 1);
  const c = maintenanceConflit(mid, jour);
  if(c){ modalConflitMaint(c, () => poserBlocOF(mid, jour, ofNum, opNum, h)); return; }
  poserBlocOF(mid, jour, ofNum, opNum, h);
}
function poserBlocOF(mid, jour, ofNum, opNum, h){
  const of = ofByNum(ofNum);
  const op = (of.operations||[]).find(x => x.num === opNum);
  PLANNING.push({ machine:mid, jour, of:ofNum, op:"OP"+opNum+" "+(op?op.desc:""), h, statut:"Planifiée" });
  fermerModal(); render();
  const m = getMachines().find(x=>x.id===mid);
  const somme = PLANNING.filter(p=>p.machine===mid&&p.jour===jour).reduce((s,p)=>s+p.h,0);
  toast(`${ofNum} ajouté sur ${mid} ${JOURS[jour].label} (${h} h) — jour à ${somme}/${m.capJour} h${somme>m.capJour?" ⚠ surcharge":""}`);
}



/* ================================================================
   RÉUNIONS — QRQC + RÉUNION PRODUCTION
   ================================================================ */
const MEETING_TYPES = {
  qrqc:{
    label:"QRQC quotidien",
    short:"QRQC",
    duration:"10–15 min",
    intro:"Lever les blocages atelier, vérifier les OF en cours et préparer les prochaines opérations.",
    color:"green",
    steps:["Accueil","OF en cours","Prochaines OF","Blocages","Besoins services","Actions","Synthèse"],
    departments:["Tournage","Fraisage","Contrôle / Qualité","Programmation","Méthodes","Achats","Maintenance","Magasin"]
  },
  production:{
    label:"Réunion de production",
    short:"Production",
    duration:"30–45 min",
    intro:"Piloter les projets prioritaires, arbitrer le planning, collecter les urgences et créer les actions.",
    color:"blue",
    steps:["Accueil","Actions précédentes","Projets critiques","Planning","OF urgents","Tour services","Décisions","Compte rendu"],
    departments:["Tournage","Fraisage","Contrôle / Qualité","Programmation","Montage","Achats","Méthodes","Maintenance","Logistique"]
  }
};
const CRITICAL_PROJECTS = [
  {name:"EXAIL", progress:82, due:"15/07/2026", risk:"Moyen", text:"Suivre les flasques et valider la capacité fraisage."},
  {name:"FNH", progress:61, due:"12/07/2026", risk:"Élevé", text:"OF urgents et besoin de contrôle prioritaire."},
  {name:"SAB", progress:74, due:"18/07/2026", risk:"Moyen", text:"Retour d’expérience et actions techniques à clôturer."},
  {name:"CryoTech", progress:55, due:"31/07/2026", risk:"Élevé", text:"Matière et sous-traitance à surveiller."},
  {name:"MecaJet", progress:90, due:"08/07/2026", risk:"Faible", text:"Contrôle final à terminer."}
];
function meetingStats(){
  return {
    running: PLANNING.filter(p=>p.statut==="En cours"||p.statut==="En réglage").length,
    blocked: PLANNING.filter(p=>p.statut==="Bloquée").length + OFS.filter(o=>o.statut==="Bloqué").length,
    actions: ACTIONS.filter(a=>a.statut!=="Terminée").length,
    urgent: OFS.filter(o=>o.priorite==="Urgente"||o.statut==="En retard").length,
    alerts: (typeof analyseAllDQ === "function") ? analyseAllDQ().filter(x=>x.sev==="Critique").length : 0
  };
}
function startMeeting(type){
  state.page = "meetings";
  state.meetingType = type;
  state.meetingStep = 0;
  state.meetingFull = true;
  state.meetingActions = [];
  render();
  toast(`${MEETING_TYPES[type].label} démarrée`);
}
function selectMeeting(type){
  state.page = "meetings";
  state.meetingType = type;
  state.meetingStep = 0;
  state.meetingFull = false;
  render();
}
function nextMeetingStep(){ const t=MEETING_TYPES[state.meetingType]; state.meetingStep=Math.min(state.meetingStep+1,t.steps.length-1); render(); }
function prevMeetingStep(){ state.meetingStep=Math.max(state.meetingStep-1,0); render(); }
function exitMeeting(){ state.meetingFull=false; state.meetingStep=0; render(); }
function finishMeeting(){
  const type = state.meetingType;
  if(type){
    state.meetingCompleted[type] = true;
    if(type === "qrqc") state.dailyDone[dailyTaskKey("Démarrer le QRQC")] = true;
    if(type === "production") state.dailyDone[dailyTaskKey("Préparer la réunion production")] = true;
    const label = MEETING_TYPES[type].label;
    state.commandMessages.push({role:"ai", text:`${label} clôturée. J’ai mis à jour ta checklist d’accueil et les actions créées pendant la réunion restent disponibles dans le module Actions.`});
    toast(`${label} clôturée — accueil mis à jour`);
  }
  state.meetingFull=false;
  state.meetingStep=0;
  state.meetingType=null;
  state.page="home";
  render();
}
function addMeetingAction(title, resp="À définir", dept="Production", of=""){
  /* Ouvre la fenêtre de saisie (type + description) au lieu de créer l'action à l'aveugle */
  dialogAction({ titre:title, resp, dept, of:(of&&of!=="—")?of:"", meeting:true });
}
function saveMeetingNote(key, val){ state.meetingNotes[key]=val; }
function renderMeetings(){
  if(state.meetingType) return renderMeetingWorkspace(state.meetingType);
  const st=meetingStats();
  return `<div class="meeting-home-grid">
    ${Object.entries(MEETING_TYPES).map(([id,m])=>`
    <div class="card meeting-choice">
      <div class="meeting-choice-top"><span class="meeting-badge ${m.color}">${m.short}</span><span class="t-sub">${m.duration}</span></div>
      <h2>${m.label}</h2>
      <p>${m.intro}</p>
      <div class="meeting-mini-kpis">
        <div><b>${id==='qrqc'?st.running:CRITICAL_PROJECTS.length}</b><span>${id==='qrqc'?'OF en cours':'projets'}</span></div>
        <div><b>${id==='qrqc'?st.blocked:st.urgent}</b><span>${id==='qrqc'?'blocages':'OF urgents'}</span></div>
        <div><b>${st.actions}</b><span>actions ouvertes</span></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn btn-blue" onclick="startMeeting('${id}')">▶ Démarrer</button>
        <button class="btn btn-ghost" onclick="selectMeeting('${id}')">Préparer / Aperçu</button>
      </div>
    </div>`).join("")}
  </div>
  <div class="card card-pad" style="margin-top:14px">
    <h3>Principe</h3>
    <p class="t-sub" style="line-height:1.65;margin-top:6px">Le module Réunions permet de choisir le type de réunion, puis ProdPilot IA guide l’animateur écran par écran. Chaque besoin exprimé peut devenir une action, et la synthèse est prête à copier ou imprimer.</p>
  </div>`;
}
function renderMeetingWorkspace(type){
  const m=MEETING_TYPES[type];
  const st=meetingStats();
  const cls = state.meetingFull ? "meeting-full" : "";
  return `<div class="${cls}">
    <div class="meeting-shell">
      <div class="meeting-top">
        <div><button class="back-link no-print" onclick="state.meetingType=null;state.meetingFull=false;render()">‹ Retour au choix des réunions</button>
          <h2>${m.label}</h2><p>${m.intro}</p></div>
        <div class="meeting-timer"><b>${m.duration}</b><span>durée cible</span></div>
      </div>
      ${renderMeetingProgress(m)}
      <div class="meeting-stage">${type==='qrqc'?renderQRQCStep():renderProductionStep()}</div>
      <div class="meeting-nav no-print">
        <button class="btn btn-ghost" onclick="prevMeetingStep()" ${state.meetingStep===0?'disabled':''}>← Précédent</button>
        <button class="btn btn-ghost" onclick="state.meetingFull=!state.meetingFull;render()">${state.meetingFull?'Quitter plein écran':'Mode réunion plein écran'}</button>
        ${state.meetingStep<m.steps.length-1?`<button class="btn btn-blue" onclick="nextMeetingStep()">Suivant →</button>`:`<button class="btn btn-green" onclick="finishMeeting()">Clôturer la réunion</button>`}
      </div>
    </div>
  </div>`;
}
function renderMeetingProgress(m){
  return `<div class="meeting-progress">${m.steps.map((s,i)=>`<div class="mp-step ${i<state.meetingStep?'done':i===state.meetingStep?'current':''}"><span>${i<state.meetingStep?'✓':i+1}</span>${s}</div>`).join("")}</div>`;
}
function noteArea(key){
  return `<label class="meeting-label">Notes rapides</label><textarea class="meeting-note" oninput="saveMeetingNote('${key}',this.value)" placeholder="Notez ici les décisions, besoins ou remarques…">${esc(state.meetingNotes[key]||"")}</textarea>`;
}
function discussionGuide(items){ return `<div class="discussion-guide"><b>Guide de discussion</b>${items.map(i=>`<div>• ${i}</div>`).join("")}</div>`; }
function renderQRQCStep(){
  const step=state.meetingStep;
  const running = PLANNING.filter(p=>p.statut==="En cours"||p.statut==="En réglage").slice(0,6);
  const next = PLANNING.filter(p=>p.statut==="Planifiée").sort((a,b)=>a.jour-b.jour).slice(0,6);
  const blocked = [...PLANNING.filter(p=>p.statut==="Bloquée"), ...OFS.filter(o=>o.statut==="Bloqué").map(o=>({of:o.num, machine:"—", op:o.notes||"Blocage OF", statut:"Bloquée"}))];
  if(step===0) return meetingIntro("QRQC quotidien", "Objectif : aller vite, lever les blocages et vérifier les besoins atelier.", [
    [running.length,"OF en cours"],[blocked.length,"blocages"],[ACTIONS.filter(a=>a.statut!=="Terminée").length,"actions ouvertes"]
  ]);
  if(step===1) return meetingCards("OF en cours sur machines", running.map(p=>({title:p.of, sub:`${p.machine} · ${p.op}`, meta:`${p.h} h · ${p.statut}`, of:p.of})), "Est-ce que cet OF a besoin de quelque chose ?", ["Contrôle nécessaire ?","Programme / outil disponible ?","Matière et pièces trouvées ?","Prochaine opération prête ?"], "Besoin sur OF en cours");
  if(step===2) return meetingCards("Prochaines OF à lancer", next.map(p=>({title:p.of, sub:`${p.machine} · ${JOURS[p.jour].label} · ${p.op}`, meta:`${p.h} h`, of:p.of})), "Tout est-il prêt pour lancer ?", ["Matière disponible ?","Outillage / bridage prêt ?","Plan et programme disponibles ?","Contrôle premier article prévu ?"], "Préparation prochaine OF");
  if(step===3) return meetingCards("Blocages actifs", blocked.map(p=>({title:p.of, sub:`${p.machine} · ${p.op}`, meta:p.statut, of:p.of})), "Quel blocage doit être levé aujourd’hui ?", ["Qui doit intervenir ?","Quelle échéance ?","Impact sur le client ?","Faut-il changer le planning ?"], "Blocage QRQC");
  if(step===4) return renderDepartmentTour("qrqc");
  if(step===5) return renderMeetingActions("Actions QRQC");
  return renderMeetingSummary("QRQC");
}
function renderProductionStep(){
  const step=state.meetingStep;
  const urgent=OFS.filter(o=>o.priorite==="Urgente"||o.statut==="En retard").slice(0,8);
  if(step===0) return meetingIntro("Réunion de production", "Objectif : suivre les projets importants, arbitrer le planning et collecter les besoins des équipes.", [[CRITICAL_PROJECTS.length,"projets critiques"],[urgent.length,"OF urgents"],[ACTIONS.filter(a=>a.statut!=="Terminée").length,"actions ouvertes"]]);
  if(step===1) return renderMeetingActions("Actions précédentes", true);
  if(step===2) return `<div class="meeting-panel"><h2>Projets critiques</h2><div class="meeting-card-list">${CRITICAL_PROJECTS.map(p=>`<div class="meeting-item"><div><b>${p.name}</b><div class="t-sub">Échéance ${p.due} · risque ${p.risk}</div><p>${p.text}</p>${pbar(p.progress,p.risk==='Élevé')}</div><button class="btn btn-blue" onclick="addMeetingAction('Action projet ${p.name}','À définir','Projet ${p.name}')">Créer action</button></div>`).join("")}</div>${discussionGuide(["Le projet est-il dans le délai ?","Quel est le prochain blocage possible ?","Quel arbitrage planning faut-il faire ?"])}${noteArea('prod_projects')}</div>`;
  if(step===3) return renderPlanningMeetingOverview();
  if(step===4) return meetingCards("OF urgents à arbitrer", urgent.map(o=>({title:o.num, sub:`${o.client} · ${o.designation}`, meta:`Éch. ${o.echeance} · ${o.statut}`, of:o.num})), "Quelle décision planning faut-il prendre ?", ["Faut-il avancer l’OF ?","Quelle machine est concernée ?","Quel client est à risque ?","Qui valide la priorité ?"], "Arbitrage OF urgent");
  if(step===5) return renderDepartmentTour("production");
  if(step===6) return renderMeetingActions("Décisions prises pendant la réunion");
  return renderMeetingSummary("Réunion production");
}
function meetingIntro(title, text, kpis){ return `<div class="meeting-panel meeting-welcome"><h1>${title}</h1><p>${text}</p><div class="meeting-big-kpis">${kpis.map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join("")}</div>${discussionGuide(["Traiter uniquement les sujets qui nécessitent une décision.","Créer une action dès qu’un responsable ou une échéance est nécessaire.","Mettre les sujets trop longs dans le parking lot."])}${noteArea('intro_'+state.meetingType)}</div>`; }
function meetingCards(title, items, question, guide, actionPrefix){ return `<div class="meeting-panel"><h2>${title}</h2><p class="meeting-question">${question}</p><div class="meeting-card-list">${items.length?items.map(x=>`<div class="meeting-item"><div><b>${x.title}</b><div class="t-sub">${x.sub}</div><p>${x.meta}</p></div><div class="meeting-actions-inline"><button class="btn btn-ghost" onclick="toast('Sujet ignoré')">OK / pas de besoin</button><button class="btn btn-blue" onclick="addMeetingAction('${actionPrefix} - ${x.title}','À définir','Production','${x.of||''}')">Créer action</button><button class="btn btn-ghost" onclick="addMeetingAction('Parking lot - ${x.title}','À définir','Parking lot','${x.of||''}')">Parking lot</button></div></div>`).join(""):'<div class="empty-meeting">Aucun élément à traiter.</div>'}</div>${discussionGuide(guide)}${noteArea('cards_'+state.meetingType+'_'+state.meetingStep)}</div>`; }
function renderDepartmentTour(type){ const deps=(typeof getDepartments === "function" ? getDepartments() : MEETING_TYPES[type].departments); return `<div class="meeting-panel"><h2>Tour des services</h2><p class="meeting-question">Pour chaque service : “De quoi avez-vous besoin aujourd’hui ?”</p><div class="dept-grid">${deps.map(d=>{ const open=ACTIONS.filter(a=>a.client===d||a.resp===d).length; return `<div class="dept-card"><b>${d}</b><span>${open} action(s) ouverte(s)</span><textarea placeholder="Besoin exprimé par ${d}…" oninput="saveMeetingNote('dept_${type}_${d}',this.value)">${esc(state.meetingNotes['dept_'+type+'_'+d]||'')}</textarea><button class="btn btn-blue" onclick="addMeetingAction('Besoin ${d}','À définir','${d}')">Créer action</button></div>`; }).join("")}</div>${discussionGuide(["Quel service bloque un autre service ?","Y a-t-il un contrôle urgent ?","Une OF planifiée n’est-elle pas prête ?","Qui prend l’action et pour quand ?"])}</div>`; }
function renderMeetingActions(title, previous=false){ const items = previous ? ACTIONS.filter(a=>a.statut!=="Terminée").slice(0,8) : state.meetingActions; return `<div class="meeting-panel"><h2>${title}</h2><div class="meeting-card-list">${items.length?items.map(a=>`<div class="meeting-item"><div><b>${a.titre}</b><div class="t-sub">${a.resp} · ${a.echeance} · ${a.of}</div><p>${a.statut}</p></div><button class="btn btn-green" onclick="toggleAction('${a.id}')">Terminée</button></div>`).join(""):'<div class="empty-meeting">Aucune action créée pendant cette réunion.</div>'}</div><button class="btn btn-blue" onclick="addMeetingAction('Nouvelle action réunion','À définir','Production')">+ Créer une action</button>${noteArea('actions_'+state.meetingType)}</div>`; }
function renderPlanningMeetingOverview(){ const overload=getMachines().map(m=>({m,ch:chargeMachine(m.id,[0,1,2,3,4])})).filter(x=>x.ch.taux>=80); return `<div class="meeting-panel"><h2>Point planning</h2><div class="meeting-card-list">${overload.map(x=>`<div class="meeting-item"><div><b>${x.m.id} — ${x.m.nom}</b><div class="t-sub">${x.m.dept}</div><p>Charge S28 : ${x.ch.taux}% (${x.ch.h}/${x.ch.cap} h)</p></div><button class="btn btn-blue" onclick="go('planning')">Ouvrir planning</button></div>`).join("")}</div>${discussionGuide(["Quelles machines sont en surcharge ?","Quels OF doivent changer de priorité ?","Quelles sous-traitances ou matières sont critiques ?"])}${noteArea('prod_planning')}</div>`; }
function renderMeetingSummary(label){ const notes=Object.entries(state.meetingNotes).filter(([k,v])=>v&&String(v).trim()).map(([k,v])=>`<li>${esc(v)}</li>`).join(""); return `<div class="meeting-panel"><h2>Synthèse — ${label}</h2><div class="meeting-summary"><div><b>${state.meetingActions.length}</b><span>actions créées</span></div><div><b>${Object.keys(state.meetingNotes).length}</b><span>notes prises</span></div><div><b>${ACTIONS.filter(a=>a.statut!=="Terminée").length}</b><span>actions ouvertes</span></div></div><h3>Compte rendu automatique</h3><div class="report-box"><div class="report-brand">${renderCompanyLogo("report-logo")}<div><p><b>${label}</b> du 07/07/2026</p><small>${esc(getSettings().general.companyName)}</small></div></div><p>Actions créées : ${state.meetingActions.length}</p><ul>${state.meetingActions.map(a=>`<li>${esc(a.titre)} — ${esc(a.resp)} — ${esc(a.echeance)}</li>`).join("")}</ul>${notes?`<p><b>Notes :</b></p><ul>${notes}</ul>`:""}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-blue" onclick="navigator.clipboard&&navigator.clipboard.writeText(document.querySelector('.report-box').innerText);toast('Compte rendu copié')">Copier</button><button class="btn btn-ghost" onclick="window.print()">Imprimer</button><button class="btn btn-green" onclick="finishMeeting()">Clôturer et retour accueil</button></div></div>`; }
document.addEventListener('keydown', e=>{
  if(state.page!=="meetings"||!state.meetingType) return;
  if(e.key==='ArrowRight') nextMeetingStep();
  if(e.key==='ArrowLeft') prevMeetingStep();
  if(e.key==='Escape') exitMeeting();
});



/* ================================================================
   RÉGLAGES — CENTRE DE CONFIGURATION LOCAL
   ================================================================ */
const DEFAULT_SETTINGS = {
  interface: {
    menuItems: DEFAULT_NAV_ITEMS.map((n,i)=>`${n.id} | ${n.label} | visible | ${i+1}`).join("\n")
  },
  general: {
    companyName: "ProdPilot IA",
    userName: "Daniel",
    roleName: "Responsable flux & production",
    defaultWeek: "S28",
    companyLogo: "",
  },
  personnalisation: {
    dailyBriefingIntro: "Bonjour {user}. Voici ce qui demande ton attention aujourd'hui.",
    homeChecklist: [
      "Démarrer le QRQC",
      "Traiter les OF en retard",
      "Vérifier les demandes planning",
      "Imprimer le planning machines",
      "Nettoyer les données ERP critiques",
      "Préparer la réunion production"
    ].join("\n"),
    machinePrintFooter: "À cocher par l'opérateur : fait / problème / commentaire.",
  },
  impressions: {
    planningTitle: "Planning machine",
    paperFormat: "A4",
    orientation: "portrait",
    showLogo: "true",
    showCompanyName: "true",
    showMachineName: "true",
    showDatePrint: "true",
    showWeek: "true",
    showFooter: "true",
    showCheckboxDone: "true",
    showCheckboxProblem: "true",
    columns: "jour | Jour | true\nof | OF | true\noperation | Opération | true\nclient | Client | true\narticle | Article | false\nquantite | Quantité | true\ntemps | Temps prévu | true\npriorite | Priorité | true\ndelai | Délai client | false\nremarque | Remarque | false"
  },
  templates: {
    mailAction: [
      "Bonjour {responsable},",
      "",
      "Une action t'a été attribuée dans ProdPilot IA.",
      "",
      "Action : {titre}",
      "OF : {of}",
      "Priorité : {priorite}",
      "Échéance : {echeance}",
      "",
      "Peux-tu me faire un retour dès que c'est traité ?",
      "",
      "Merci,",
      "Daniel"
    ].join("\n"),
    mailDataQuality: [
      "Bonjour {responsable},",
      "",
      "L'OF {of} présente des informations manquantes ou incohérentes dans l'ERP.",
      "",
      "Client : {client}",
      "Article : {article}",
      "Problèmes détectés :",
      "{problemes}",
      "",
      "Peux-tu corriger ces informations afin que le planning soit fiable ?",
      "",
      "Merci,",
      "Daniel"
    ].join("\n"),
    meetingReport: [
      "Compte rendu {meetingType} - {date}",
      "",
      "Actions créées : {actionsCount}",
      "Actions ouvertes : {openActions}",
      "",
      "Décisions / notes :",
      "{notes}",
      "",
      "Actions :",
      "{actions}"
    ].join("\n"),
    qrqcSummary: "QRQC : {runningCount} OF en cours, {blockedCount} blocage(s), {actionsCount} action(s) ouverte(s)."
  },
  production: {
    departments: "Tournage\nFraisage\nProgrammation\nQualité\nAssemblage\nAchats\nMéthodes\nMaintenance\nLogistique",
    machines: [
      "MAZAK INTEGREX 300 | MAZAK INTEGREX 300 | Tournage | Tournage/Fraisage | 8",
      "Mazak 200MSY | MAZAK NEXUS 200MSY | Tournage | Tournage/Fraisage | 8",
      "GRAZIANO GT300 | GRAZIANO GT300 | Tournage | Tournage/Fraisage | 8",
      "MAZAK INTEGREX 150 | MAZAK INTEGREX 150 | Tournage | Tournage/Fraisage | 8",
      "OKUMA LB15 II-C | OKUMA LB15 II-C | Tournage | Tournage | 8",
      "Tour CNC HYUNDAI-KIA SKT 250 | Tour CNC HYUNDAI-KIA SKT 250 | Tournage | Tournage | 8",
      "OKUMA LB25 II-C | OKUMA LB25 II-C | Tournage | Tournage | 8",
      "Mazak Quick smart 350 | Mazak Quick Turn Smart 350 | Tournage | Tournage | 8",
      "TOUR trad. Pinacho | TOUR trad. Pinacho | Tournage | Tournage | 8",
      "MAZAK VTC-200C-II | MAZAK VTC-200C-II | Fraisage | Fraisage 3 axes | 8",
      "MAZAK NEXUS 410 A II | MAZAK NEXUS 410 A II | Fraisage | Fraisage 3 axes | 8",
      "HEDELIUS CB70 | HEDELIUS CB70 | Fraisage | Fraisage 3 axes | 8",
      "AKIRA SEIKI V4.5 | AKIRA SEIKI V4.5 | Fraisage | Fraisage 3 axes | 8",
      "Fraiseuse DMC 1035 (B) | Fraiseuse DMC 1035 (B) | Fraisage | Fraisage 3 axes | 8",
      "Mikron VCE 800 PRO | Mikron VCE 800 PRO | Fraisage | Fraisage 3 axes | 8",
      "DMG DMC 635 | DMG DMC 635 | Fraisage | Fraisage 3 axes | 8",
      "DECKEL MAHO DMC 1035V | DECKEL MAHO DMC 1035V | Fraisage | Fraisage 3 axes | 8",
      "DECKEL MAHO DMC 64V linear | DECKEL MAHO DMC 64V linear | Fraisage | Fraisage 3 axes | 8",
      "HEDELIUS ACURA 65 EL | HEDELIUS ACURA 65 EL | Fraisage | Fraisage 5 axes | 8",
      "MAZAK CV5-500 + robot | MAZAK CV5-500 + robot | Fraisage | Fraisage 5 axes | 8",
      "DMG MORI CMX50 U + PH150 | DMG MORI CMX50 U + PH150 | Fraisage | Fraisage 5 axes | 8",
      "DMG MORI DMU50 + Robot | DMG MORI DMU50 + Robot | Fraisage | Fraisage 5 axes | 8",
      "DECKEL MAHO DMU 60 (1) | DECKEL MAHO DMU 60 (1) | Fraisage | Fraisage 5 axes | 8",
      "DECKEL MAHO DMU 60 (2) | DECKEL MAHO DMU 60 (2) | Fraisage | Fraisage 5 axes | 8",
      "DMG MORI SEIKI DMU50 (Ecoline) | DMG MORI SEIKI DMU50 (Ecoline) | Fraisage | Fraisage 5 axes | 8",
      "MAZAK VTC 800 | MAZAK VTC 800 | Fraisage | Fraisage 5 axes | 8",
      "MITSHUBISHI FA30S | MITSHUBISHI FA30S | Découpe fil | Découpe fil | 16",
      "MV 2400R connect | MV 2400R connect | Découpe fil | Découpe fil | 16"
    ].join("\n"),
    priorities: "Normale\nHaute\nUrgente\nBloquante",
    problemTypes: "Contrôle\nProgramme\nMatière\nOutillage\nMaintenance\nAchat\nMéthodes\nPlanning\nSous-traitance",
    stopReasons: "Panne\nManque matière\nManque programme\nManque outillage\nAbsence opérateur\nAttente de contrôle\nEn réglage\nAutre"
  },
  reunions: {
    qrqcSteps: "Introduction\nOF en cours\nProchaines OF\nBlocages\nTour des services\nActions\nSynthèse",
    productionSteps: "Introduction\nActions précédentes\nProjets critiques\nPoint planning\nOF urgents\nTour des services\nDécisions\nSynthèse",
    discussionQuestions: "Quel est le blocage ?\nQui est responsable ?\nQuelle échéance ?\nQuel impact client ?\nFaut-il modifier le planning ?"
  },
  ia: {
    systemPrompt: "Tu es ProdPilot IA, le copilote du responsable de production. Tu dois aider à décider quoi faire maintenant, sans inventer de données.",
    dailyPrompt: "Prépare un briefing court avec les retards, blocages, actions urgentes et recommandations du jour.",
    recommendationPrompt: "Propose uniquement des actions concrètes, avec responsable et échéance si possible."
  },
  erp: {
    importMode: "CSV / Excel manuel",
    syncFrequency: "Toutes les heures",
    rawDataRule: "Toujours conserver les données ERP brutes avant nettoyage.",
    mappingNotes: "OF -> Work Order, Poste -> Machine, Opération -> Operation, Date prévue -> Planned Date"
  }
};

function deepMergeSettings(base, saved){
  const out = JSON.parse(JSON.stringify(base));
  if(!saved || typeof saved !== "object") return out;
  Object.keys(saved).forEach(k=>{
    if(saved[k] && typeof saved[k] === "object" && !Array.isArray(saved[k]) && out[k]) out[k] = {...out[k], ...saved[k]};
    else out[k] = saved[k];
  });
  return out;
}
/* [ancienne version conservée pour référence — remplacée par la version avancée plus bas] */
function getSettings_legacy(){
  try{ return deepMergeSettings(DEFAULT_SETTINGS, JSON.parse(localStorage.getItem("prodpilot_settings")||"{}")); }
  catch(e){ return JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); }
}
function saveSettings(cfg){ localStorage.setItem("prodpilot_settings", JSON.stringify(cfg)); }
function updateSetting_legacy(section, key, value){ const cfg=getSettings(); cfg[section][key]=value; saveSettings(cfg); toast("Réglage enregistré"); }
function resetSettings(){ if(confirm("Réinitialiser tous les réglages locaux ?")){ localStorage.removeItem("prodpilot_settings"); render(); toast("Réglages réinitialisés"); } }
function setSettingsTab(tab){ state.settingsTab=tab; render(); }
function settingsLines(section,key){ return String(getSettings()[section][key]||"").split("\n").filter(x=>x.trim()); }
function getDepartments(){ return settingsLines("production","departments"); }

function machineIdFromLine(code, dept, index){
  const p = dept === "Tournage" ? "TOU" : dept === "Fraisage" ? "FRA" : dept === "Découpe fil" ? "FIL" : "MAC";
  return `${p}-${String(index).padStart(2,"0")}`;
}
function parseMachineLines(){
  const rows = settingsLines("production","machines");
  const counters = {};
  const parsed = rows.map((line, idx)=>{
    const parts = line.split("|").map(x=>x.trim());
    const code = parts[0] || `Machine ${idx+1}`;
    const nom = parts[1] || code;
    const dept = parts[2] || "Production";
    const type = parts[3] || dept;
    const capJour = Number(parts[4] || 8) || 8;
    counters[dept] = (counters[dept] || 0) + 1;
    return { id: machineIdFromLine(code, dept, counters[dept]), code, nom, dept, type, capJour };
  });
  return parsed.length ? parsed : MACHINES;
}
function getMachines(){ return parseMachineLines(); }
function addMachineFromSettings_legacy(){
  const code = prompt("Nom court de la machine ? Exemple : DMG DMU50"); if(!code) return;
  const nom = prompt("Nom complet ?", code) || code;
  const dept = prompt("Département ? Exemple : Tournage, Fraisage, Découpe fil", "Fraisage") || "Production";
  const type = prompt("Type ? Exemple : Fraisage 5 axes", dept) || dept;
  const cap = prompt("Capacité par jour en heures ?", dept==="Découpe fil"?"16":"8") || "8";
  const cfg=getSettings();
  cfg.production.machines = String(cfg.production.machines||"").trim() + `\n${code} | ${nom} | ${dept} | ${type} | ${cap}`;
  saveSettings(cfg); render(); toast("Machine ajoutée");
}
function resetMachinesFromFactory(){
  if(confirm("Restaurer la liste machines par défaut ?")){
    const cfg=getSettings(); cfg.production.machines = DEFAULT_SETTINGS.production.machines; saveSettings(cfg); render(); toast("Liste machines restaurée");
  }
}

function renderSettings_legacy(){
  const tabs = [
    ["general","Général","Nom, utilisateur, semaine par défaut"],
    ["identite","Identité société","Logo et image de marque"],
    ["interface","Interface","Menu principal, ordre et affichage"],
    ["personnalisation","Personnalisation","Accueil et checklist"],
    ["impressions","Impressions","Colonnes, logo, modèles planning"],
    ["templates","Templates","Mails, comptes rendus, QRQC"],
    ["production","Production","Départements, priorités, problèmes"],
    ["reunions","Réunions","Étapes et questions"],
    ["ia","IA","Prompts et recommandations"],
    ["erp","ERP","Import, mapping, synchronisation"],
  ];
  const cfg=getSettings();
  const current=state.settingsTab||"personnalisation";
  return `<div class="settings-layout">
    <aside class="settings-sidebar card">
      <h3>Réglages</h3>
      <p>Modifiez les modèles sans toucher au code.</p>
      ${tabs.map(([id,label,desc])=>`<button class="settings-tab ${current===id?'active':''}" onclick="setSettingsTab('${id}')"><b>${label}</b><span>${desc}</span></button>`).join("")}
      <button class="btn btn-ghost" onclick="resetSettings()">Réinitialiser</button>
    </aside>
    <section class="settings-content card card-pad">
      ${renderSettingsSection(current,cfg)}
    </section>
  </div>`;
}
function renderSettingsSection(tab,cfg){
  if(tab==="general") return settingsForm("Général", "Informations de base utilisées dans l'accueil et les documents.", "general", [
    ["companyName","Nom du logiciel / société","input"],
    ["userName","Nom affiché","input"],
    ["roleName","Fonction affichée","input"],
    ["defaultWeek","Semaine par défaut","input"],
  ], cfg);

  if(tab==="identite") return renderIdentitySettings(cfg);

  if(tab==="interface") return renderInterfaceSettings(cfg);
  if(tab==="personnalisation") return settingsForm("Personnalisation", "Templates d'accueil et checklist.", "personnalisation", [
    ["dailyBriefingIntro","Phrase d'introduction du briefing","textarea"],
    ["homeChecklist","Checklist accueil — une ligne par tâche","textarea"],
  ], cfg);
  if(tab==="impressions") return renderPrintSettings(cfg);
  if(tab==="templates") return settingsForm("Templates", "Modèles modifiables pour éviter de recoder les mails et comptes rendus.", "templates", [
    ["mailAction","Mail action","textarea"],
    ["mailDataQuality","Mail qualité données ERP","textarea"],
    ["meetingReport","Compte rendu réunion","textarea"],
    ["qrqcSummary","Résumé QRQC","textarea"],
  ], cfg) + renderTemplateVariables();
  if(tab==="production") return renderProductionSettings(cfg);
  if(tab==="reunions") return settingsForm("Réunions", "Étapes et questions qui guideront les réunions.", "reunions", [
    ["qrqcSteps","Étapes QRQC — une ligne par étape","textarea"],
    ["productionSteps","Étapes réunion production — une ligne par étape","textarea"],
    ["discussionQuestions","Questions guide — une ligne par question","textarea"],
  ], cfg);
  if(tab==="ia") return settingsForm("IA", "Prompts de base utilisés par l'assistant IA.", "ia", [
    ["systemPrompt","Prompt système","textarea"],
    ["dailyPrompt","Prompt briefing quotidien","textarea"],
    ["recommendationPrompt","Prompt recommandations","textarea"],
  ], cfg);
  if(tab==="erp") return settingsForm("ERP", "Paramètres de préparation pour l'import et la synchronisation ERP.", "erp", [
    ["importMode","Mode d'import","input"],
    ["syncFrequency","Fréquence de synchronisation","input"],
    ["rawDataRule","Règle données brutes","textarea"],
    ["mappingNotes","Notes mapping colonnes","textarea"],
  ], cfg);
  return "";
}

function machineLinesArray(){ return settingsLines("production","machines"); }
function machineLineToParts(line){ const p=line.split("|").map(x=>x.trim()); return {code:p[0]||"", nom:p[1]||p[0]||"", dept:p[2]||"Production", type:p[3]||p[2]||"Production", cap:p[4]||"8"}; }
function saveMachineRows(rows){ const cfg=getSettings(); cfg.production.machines = rows.map(r=>`${r.code} | ${r.nom} | ${r.dept} | ${r.type} | ${r.cap}`).join("\n"); saveSettings(cfg); }
function updateMachineField(index, field, value){ const rows=machineLinesArray().map(machineLineToParts); if(!rows[index]) return; rows[index][field]=value; saveMachineRows(rows); }
function deleteMachine(index){ const rows=machineLinesArray().map(machineLineToParts); const m=rows[index]; if(!m) return; if(confirm(`Supprimer la machine ${m.code || m.nom} ?`)){ rows.splice(index,1); saveMachineRows(rows); render(); toast("Machine supprimée"); } }
function addMachineFromSettings(){ const rows=machineLinesArray().map(machineLineToParts); rows.push({code:"Nouvelle machine", nom:"Nouvelle machine", dept:"Fraisage", type:"Fraisage 3 axes", cap:"8"}); saveMachineRows(rows); render(); toast("Machine ajoutée — modifiez la ligne"); }

function renderIdentitySettings(cfg){
  const logo = cfg.general.companyLogo || "";
  return `<div class="settings-head"><div><h2>Identité société</h2><p>Ajoutez le logo de la société. Il sera réutilisé automatiquement dans les impressions, comptes rendus et futurs templates.</p></div><span class="settings-save-pill">Logo global</span></div>
  <div class="identity-grid">
    <div class="identity-preview">
      <div class="identity-logo-box">${logo ? `<img src="${logo}" alt="Logo société">` : `<span>Aucun logo</span>`}</div>
      <div>
        <h3>${esc(cfg.general.companyName)}</h3>
        <p>Ce logo sera utilisé dans les documents imprimables et les comptes rendus générés.</p>
      </div>
    </div>
    <div class="settings-form">
      <label class="settings-field"><span>Importer un logo / image</span><input type="file" accept="image/*" onchange="uploadCompanyLogo(this)"></label>
      <label class="settings-field"><span>Nom affiché sur les documents</span><input value="${esc(cfg.general.companyName)}" oninput="updateSetting('general','companyName',this.value)"></label>
      <div class="settings-actions-row">
        <button class="btn btn-red" onclick="removeCompanyLogo()">Supprimer le logo</button>
      </div>
    </div>
  </div>
  <div class="settings-help"><b>Information</b><div>Le logo est sauvegardé dans ce navigateur. Plus tard, il sera stocké dans la base de données pour être partagé avec tous les utilisateurs.</div></div>`;
}
function uploadCompanyLogo(input){
  const file=input.files && input.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{ const cfg=getSettings(); cfg.general.companyLogo=reader.result; saveSettings(cfg); render(); toast("Logo enregistré"); };
  reader.readAsDataURL(file);
}
function removeCompanyLogo(){
  const cfg=getSettings(); cfg.general.companyLogo=""; saveSettings(cfg); render(); toast("Logo supprimé");
}

function renderInterfaceSettings(cfg){
  const rows = getNavConfigRows().sort((a,b)=>a.order-b.order);
  return `<div class="settings-head"><div><h2>Interface</h2><p>Modifiez le menu principal sans toucher au code. Vous pouvez renommer, masquer ou réordonner les modules.</p></div><span class="settings-save-pill">Menu configurable</span></div>
  <div class="settings-help"><b>Conseil</b><div>Pour mettre Réunions en deuxième : utilisez les flèches ↑ / ↓ jusqu'à placer Réunions juste après Accueil.</div></div>
  <div class="settings-actions-row">
    <button class="btn btn-ghost" onclick="resetMenuConfig()">Restaurer menu par défaut</button>
  </div>
  <div class="settings-machine-table-wrap">
    <table class="settings-machine-table settings-edit-table"><thead><tr><th>Ordre</th><th>Module</th><th>Nom affiché</th><th>Visible</th><th>Déplacer</th></tr></thead><tbody>
      ${rows.map((r,i)=>`<tr><td>${i+1}</td><td><b>${esc(r.id)}</b></td><td><input value="${esc(r.label)}" oninput="updateMenuLabel('${r.id}',this.value)"></td><td><label class="settings-check"><input type="checkbox" ${r.visible?'checked':''} onchange="toggleMenuVisible('${r.id}',this.checked)"> Afficher</label></td><td><button class="btn btn-ghost btn-small" onclick="moveMenu('${r.id}',-1)">↑</button> <button class="btn btn-ghost btn-small" onclick="moveMenu('${r.id}',1)">↓</button></td></tr>`).join("")}
    </tbody></table>
  </div>`;
}
function updateMenuLabel(id,label){ const rows=getNavConfigRows().sort((a,b)=>a.order-b.order); const r=rows.find(x=>x.id===id); if(r){ r.label=label; saveNavConfigRows(rows); toast("Menu enregistré"); render(); } }
function toggleMenuVisible(id,visible){ const rows=getNavConfigRows().sort((a,b)=>a.order-b.order); const r=rows.find(x=>x.id===id); if(r){ r.visible=visible; saveNavConfigRows(rows); render(); } }
function moveMenu(id,dir){ const rows=getNavConfigRows().sort((a,b)=>a.order-b.order); const i=rows.findIndex(x=>x.id===id); const j=i+dir; if(i<0||j<0||j>=rows.length) return; [rows[i],rows[j]]=[rows[j],rows[i]]; rows.forEach((r,k)=>r.order=k+1); saveNavConfigRows(rows); render(); }
function resetMenuConfig(){ if(confirm("Restaurer l'ordre du menu par défaut ?")){ const cfg=getSettings(); cfg.interface.menuItems = DEFAULT_SETTINGS.interface.menuItems; saveSettings(cfg); render(); toast("Menu restauré"); } }


function renderInterfaceDesigner(cfg){
  const rows = getNavConfigRows().sort((a,b)=>a.order-b.order);
  const roles = getRoleNames();
  const currentRole = getCurrentRole();
  const iconOptions = ['spark','dash','list','cal','inbox','check','chart','db','gear','factory','bell','doc'];
  return `<div class="settings-section-title"><h3>Designer d’interface</h3><p>Modifiez le menu principal sans coder : ordre, nom, icône et visibilité. Les droits par rôle restent prioritaires.</p></div>
  <div class="settings-help"><b>Comment ça fonctionne</b><div>Un module est affiché uniquement si <b>Visible</b> est coché ET si le rôle actif a le droit de le voir. Pour régler les droits, allez dans <b>Réglages > Utilisateurs</b>.</div></div>
  <div class="settings-actions-row">
    <label class="settings-field inline-field"><span>Tester avec le rôle</span><select onchange="setCurrentRole(this.value)">${roles.map(r=>`<option ${r===currentRole?'selected':''}>${esc(r)}</option>`).join('')}</select></label>
    <button class="btn btn-ghost" onclick="resetMenuConfigAdvanced()">Restaurer menu par défaut</button>
    <button class="btn btn-blue" onclick="saveInterfaceDesigner()">Enregistrer l’ordre</button>
  </div>
  <div class="interface-designer-list">
    ${rows.map((r,i)=>{
      const perm = modulePermission(r.id,currentRole);
      const access = perm==='none' ? '<span class="access-badge denied">Bloqué par rôle</span>' : `<span class="access-badge allowed">Accès : ${esc(perm)}</span>`;
      return `<div class="interface-row ${!r.visible?'muted':''}" data-menu-id="${esc(r.id)}">
        <div class="drag-handle">☰</div>
        <div class="interface-order">${i+1}</div>
        <label class="switch-line"><input type="checkbox" ${r.visible?'checked':''} onchange="interfaceUpdate('${r.id}','visible',this.checked)"><span>Visible</span></label>
        <select class="icon-select" onchange="interfaceUpdate('${r.id}','icon',this.value)">${iconOptions.map(ic=>`<option value="${ic}" ${r.icon===ic?'selected':''}>${ic}</option>`).join('')}</select>
        <input class="interface-label-input" value="${esc(r.label)}" oninput="interfaceUpdate('${r.id}','label',this.value)">
        <code>${esc(r.id)}</code>
        ${access}
        <div class="interface-actions">
          <button class="btn btn-ghost btn-small" onclick="moveInterfaceMenu('${r.id}',-1)">↑</button>
          <button class="btn btn-ghost btn-small" onclick="moveInterfaceMenu('${r.id}',1)">↓</button>
        </div>
      </div>`;
    }).join('')}
  </div>
  <div class="settings-help"><b>Exemple</b><div>Pour mettre Réunions en deuxième : utilisez la flèche ↑ sur Réunions jusqu’à ce qu’il soit juste après Accueil. Le menu à gauche se mettra à jour automatiquement.</div></div>`;
}
function interfaceRowsSorted(){ return getNavConfigRows().sort((a,b)=>a.order-b.order); }
function interfaceUpdate(id,field,value){
  const rows = interfaceRowsSorted();
  const r = rows.find(x=>x.id===id); if(!r) return;
  r[field] = value;
  rows.forEach((x,i)=>x.order=i+1);
  saveNavConfigRows(rows);
  if(field==='visible') render(); else { saveNavConfigRows(rows); render(); }
}
function moveInterfaceMenu(id,dir){
  const rows = interfaceRowsSorted();
  const i=rows.findIndex(x=>x.id===id), j=i+dir;
  if(i<0||j<0||j>=rows.length) return;
  [rows[i],rows[j]]=[rows[j],rows[i]];
  rows.forEach((r,k)=>r.order=k+1);
  saveNavConfigRows(rows); render(); toast('Menu déplacé');
}
function saveInterfaceDesigner(){
  const rows = interfaceRowsSorted();
  rows.forEach((r,i)=>r.order=i+1);
  saveNavConfigRows(rows); render(); toast('Interface enregistrée');
}
function resetMenuConfigAdvanced(){
  if(confirm('Restaurer le menu principal par défaut ?')){
    const cfg=getSettings();
    cfg.interface = cfg.interface || {};
    cfg.interface.menuItems = DEFAULT_NAV_ITEMS.map((n,i)=>`${n.id} | ${n.label} | visible | ${i+1} | ${n.icon}`).join("\n");
    saveSettings(cfg); render(); toast('Menu restauré');
  }
}

function renderPrintSettings(cfg){
  const cols=getPrintColumns();
  const sampleMachine=getMachines()[0]?.id || "";
  return `<div class="settings-head"><div><h2>Impressions</h2><p>Configurez les modèles imprimables sans toucher au code. Le modèle est utilisé par le planning machine.</p></div><span class="settings-save-pill">Moteur d'impression</span></div>
  <div class="settings-grid-2">
    <div class="settings-form">
      <label class="settings-field"><span>Titre du planning</span><input value="${esc(cfg.impressions.planningTitle)}" oninput="updateSetting('impressions','planningTitle',this.value)"></label>
      <label class="settings-field"><span>Format papier</span><select onchange="updateSetting('impressions','paperFormat',this.value)"><option ${cfg.impressions.paperFormat==='A4'?'selected':''}>A4</option><option ${cfg.impressions.paperFormat==='A3'?'selected':''}>A3</option></select></label>
      <label class="settings-field"><span>Orientation</span><select onchange="updateSetting('impressions','orientation',this.value)"><option value="portrait" ${cfg.impressions.orientation==='portrait'?'selected':''}>Portrait</option><option value="landscape" ${cfg.impressions.orientation==='landscape'?'selected':''}>Paysage</option></select></label>
      <div class="settings-check-grid">
        ${[
          ['showLogo','Logo'],['showCompanyName','Nom société'],['showMachineName','Nom machine'],['showDatePrint','Date impression'],['showWeek','Semaine'],['showFooter','Pied de page'],['showCheckboxDone','Case terminé'],['showCheckboxProblem','Case problème']
        ].map(([key,label])=>`<label class="settings-check"><input type="checkbox" ${printBool(key)?'checked':''} onchange="updateSetting('impressions','${key}',this.checked?'true':'false')"> ${label}</label>`).join("")}
      </div>
      <label class="settings-field"><span>Pied de page planning machine</span><textarea oninput="updateSetting('personnalisation','machinePrintFooter',this.value)">${esc(cfg.personnalisation.machinePrintFooter)}</textarea></label>
      <div class="settings-actions-row"><button class="btn btn-ghost" onclick="resetPrintTemplate()">Restaurer le modèle</button>${sampleMachine?`<button class="btn btn-blue" onclick="openPrint('${sampleMachine}')">Aperçu imprimable</button>`:""}</div>
    </div>
    <div class="print-preview-card">
      <div class="print-preview-head">Aperçu rapide</div>
      <div class="mini-print-preview">
        <div class="mini-print-logo">${printBool('showLogo') ? renderCompanyLogo("mini-logo") : ''}</div>
        <b>${esc(cfg.impressions.planningTitle)}</b>
        <span>${printBool('showMachineName') ? 'Machine + département' : 'Titre uniquement'}</span>
        <table><thead><tr>${cols.filter(c=>c.visible).slice(0,6).map(c=>`<th>${esc(c.label)}</th>`).join("")}</tr></thead><tbody><tr>${cols.filter(c=>c.visible).slice(0,6).map(c=>`<td>...</td>`).join("")}</tr></tbody></table>
      </div>
    </div>
  </div>
  <h3 style="margin-top:20px">Colonnes du planning machine</h3>
  <p class="t-sub">Cochez les informations à imprimer et utilisez les flèches pour modifier l'ordre.</p>
  <div class="settings-machine-table-wrap"><table class="settings-machine-table settings-edit-table"><thead><tr><th>Afficher</th><th>Champ</th><th>Nom imprimé</th><th>Ordre</th></tr></thead><tbody>
    ${cols.map((c,i)=>`<tr><td><label class="settings-check"><input type="checkbox" ${c.visible?'checked':''} onchange="updatePrintColumn(${i},'visible',this.checked);render()"> Afficher</label></td><td><b>${esc(c.key)}</b></td><td><input value="${esc(c.label)}" oninput="updatePrintColumn(${i},'label',this.value)"></td><td><button class="btn btn-ghost btn-small" onclick="movePrintColumn(${i},-1)">↑</button> <button class="btn btn-ghost btn-small" onclick="movePrintColumn(${i},1)">↓</button></td></tr>`).join("")}
  </tbody></table></div>
  <div class="settings-help"><b>Objectif</b><div>Chaque société pourra choisir ses colonnes, son logo et son format. Plus tard, ce moteur servira aussi aux QRQC, réunions, actions et fiches OF.</div></div>`;
}

function renderProductionSettings(cfg){
  const machines = getMachines();
  const rows = machineLinesArray().map(machineLineToParts);
  const byDept = [...new Set(machines.map(m=>m.dept))].map(dept=>({dept, count:machines.filter(m=>m.dept===dept).length}));
  return `<div class="settings-head"><div><h2>Production</h2><p>Gérez les départements, priorités, types de problèmes et machines sans modifier le code.</p></div><span class="settings-save-pill">${machines.length} machines</span></div>
  <div class="settings-kpis">
    ${byDept.map(x=>`<div class="settings-mini-kpi"><b>${x.count}</b><span>${esc(x.dept)}</span></div>`).join("")}
  </div>
  <div class="settings-form">
    <label class="settings-field"><span>Départements — une ligne par service</span><textarea oninput="updateSetting('production','departments',this.value)">${esc(cfg.production.departments)}</textarea></label>
    <label class="settings-field"><span>Priorités — une ligne par priorité</span><textarea oninput="updateSetting('production','priorities',this.value)">${esc(cfg.production.priorities)}</textarea></label>
    <label class="settings-field"><span>Types de problèmes — une ligne par type</span><textarea oninput="updateSetting('production','problemTypes',this.value)">${esc(cfg.production.problemTypes)}</textarea></label>
  </div>
  <div class="settings-actions-row">
    <button class="btn btn-blue" onclick="addMachineFromSettings()">+ Ajouter une machine</button>
    <button class="btn btn-ghost" onclick="resetMachinesFromFactory()">Restaurer la liste machines</button>
  </div>
  <div class="settings-machine-table-wrap">
    <table class="settings-machine-table settings-edit-table"><thead><tr><th>Nom court</th><th>Nom complet</th><th>Département</th><th>Type</th><th>Capacité/jour</th><th>Action</th></tr></thead><tbody>
      ${rows.map((m,i)=>`<tr><td><input value="${esc(m.code)}" oninput="updateMachineField(${i},'code',this.value)"></td><td><input value="${esc(m.nom)}" oninput="updateMachineField(${i},'nom',this.value)"></td><td><input value="${esc(m.dept)}" oninput="updateMachineField(${i},'dept',this.value)"></td><td><input value="${esc(m.type)}" oninput="updateMachineField(${i},'type',this.value)"></td><td><input type="number" min="1" step="0.5" value="${esc(m.cap)}" oninput="updateMachineField(${i},'cap',this.value)"></td><td><button class="btn btn-red btn-small" onclick="deleteMachine(${i})">Supprimer</button></td></tr>`).join("")}
    </tbody></table>
  </div>
  <div class="settings-help"><b>Important</b><div>Les modifications sont sauvegardées dans le navigateur. Plus tard, elles iront dans la base de données pour être partagées entre utilisateurs.</div></div>`;
}
function settingsForm(title, subtitle, section, fields, cfg){
  return `<div class="settings-head"><div><h2>${title}</h2><p>${subtitle}</p></div><span class="settings-save-pill">Sauvegarde locale automatique</span></div>
  <div class="settings-form">
    ${fields.map(([key,label,type])=>`<label class="settings-field"><span>${label}</span>${type==="textarea"?`<textarea oninput="updateSetting('${section}','${key}',this.value)">${esc(cfg[section][key])}</textarea>`:`<input value="${esc(cfg[section][key])}" oninput="updateSetting('${section}','${key}',this.value)">`}</label>`).join("")}
  </div>`;
}
function renderTemplateVariables(){
  return `<div class="settings-help"><b>Variables disponibles dans les templates</b><div>{user}, {responsable}, {titre}, {of}, {client}, {article}, {priorite}, {echeance}, {problemes}, {meetingType}, {date}, {actionsCount}, {openActions}, {notes}, {actions}</div></div>`;
}



/* ================================================================
   RÉGLAGES AVANCÉS — ARBORESCENCE COMPLÈTE
   ================================================================ */
const ADVANCED_SETTINGS_TREE = {
  espace:{icon:'🏠',label:'Mon espace',desc:'Routines et étapes de votre journée',subs:{routines:'Routines & étapes'}},
  general:{label:'Général', icon:'⚙️', desc:'Informations globales'},
  importSociete:{label:'Import société', icon:'📥', desc:'Logo, machines et configuration client'},
  personnalisation:{label:'Personnalisation', icon:'🎨', desc:'Interface, templates, couleurs', subs:{interface:'Interface', dashboard:'Dashboard', accueil:'Accueil', templatesMails:'Templates mails', templatesQRQC:'Templates QRQC', templatesReunion:'Templates Réunion', comptesRendus:'Comptes rendus', ia:'IA', impression:'Impression', couleurs:'Couleurs'}},
  erp:{label:'ERP', icon:'🔌', desc:'Connexion et import', subs:{connexion:'Connexion', import:'Import', mapping:'Mapping', synchronisation:'Synchronisation', qualite:'Contrôle qualité'}},
  production:{label:'Production', icon:'🏭', desc:'Machines et règles atelier', subs:{machines:'Machines', departements:'Départements', capacites:'Capacités', priorites:'Priorités', typesOF:"Types d'OF"}},
  reunions:{label:'Réunions', icon:'👥', desc:'QRQC et Production', subs:{qrqc:'QRQC', production:'Réunion Production', etapes:'Étapes', questions:'Questions', parking:'Parking Lot', comptesRendus:'Comptes rendus'}},
  ia:{label:'IA', icon:'🤖', desc:'Prompts et commandes', subs:{systeme:'Prompt système', daily:'Daily Briefing', recommandations:'Recommandations', emails:'Emails', resumes:'Résumés', commandes:'Commandes'}},
  notifications:{label:'Notifications', icon:'🔔', desc:'Alertes et rappels'},
  utilisateurs:{label:'Utilisateurs', icon:'👤', desc:'Rôles et accès'},
  sauvegardes:{label:'Sauvegardes', icon:'💾', desc:'Export/import config'},
  journal:{label:'Journal', icon:'📜', desc:'Historique des changements'}
};

function ensureAdvancedDefaults(cfg){
  cfg.custom = cfg.custom || {};
  const defs = {
    dashboardCards:'OF en retard\nMachines en surcharge\nActions ouvertes\nDemandes planning\nQualité ERP',
    dashboardMessage:'Afficher uniquement les indicateurs qui aident à prendre une décision.',
    accueilBlocks:'Priorités du jour\nChecklist\nAssistant IA\nRéunions\nPlanning rapide',
    mailUrgent:'Bonjour {responsable},\n\nPeux-tu traiter le sujet suivant en priorité ?\n\nOF : {of}\nSujet : {titre}\nÉchéance : {echeance}\n\nMerci,\nDaniel',
    qrqcTemplate:'QRQC du {date}\n\nOF en cours : {runningCount}\nBlocages : {blockedCount}\nActions créées : {actionsCount}',
    prodMeetingTemplate:'Réunion production du {date}\n\nProjets abordés : {projects}\nDécisions : {decisions}\nActions : {actions}',
    reportFooter:'Document généré par ProdPilot IA',
    aiTone:'Direct, professionnel, orienté action.',
    colors:'Rouge = Critique\nOrange = Attention\nVert = OK\nBleu = Information\nViolet = IA',
    erpConnection:'Type : à définir\nServeur : à définir\nBase : à définir\nMode : lecture seule',
    erpImportRules:'Conserver import brut\nNettoyer dans ProdPilot\nNe jamais écrire dans ERP sans validation',
    erpMapping:'N° OF -> Work Order\nClient -> Customer\nPoste -> Machine\nOpération -> Operation\nDate prévue -> Planned Date\nTemps -> Estimated Time',
    erpSync:'Fréquence cible : toutes les heures\nMéthode V1 : fichier CSV/Excel\nMéthode V2 : SQL/API',
    erpQualityRules:'OF sans machine\nOF sans date prévue\nOpération sans temps\nMachine inconnue\nDélai dépassé',
    capacities:'Tournage | 8 h/jour\nFraisage | 8 h/jour\nDécoupe fil | 16 h/jour',
    typesOF:'Production\nRetouche\nUrgence client\nPrototype\nSous-traitance',
    qrqcParking:'Sujets trop longs à traiter après la réunion.',
    aiEmailPrompt:'Rédige un mail court, clair et professionnel en français.',
    aiSummaryPrompt:'Résume uniquement les faits importants, actions et risques.',
    aiCommands:'Où est l’OF {of} ?\nPrépare mon QRQC\nQuels OF sont critiques ?\nDéplace {of} vers {machine} après confirmation',
    notificationRules:'Action en retard\nOF critique\nMachine surchargée\nDonnée ERP manquante\nRéunion à préparer',
    users:'Daniel | Administrateur | Responsable production\nOpérateur | Lecture | Atelier\nQualité | Actions | Contrôle',
  };
  Object.keys(defs).forEach(k=>{ if(cfg.custom[k] === undefined) cfg.custom[k]=defs[k]; });
  return cfg;
}

function getSettings(){
  let cfg;
  try{ cfg = deepMergeSettings(DEFAULT_SETTINGS, JSON.parse(localStorage.getItem('prodpilot_settings')||'{}')); }
  catch(e){ cfg = JSON.parse(JSON.stringify(DEFAULT_SETTINGS)); }
  return ensureAdvancedDefaults(cfg);
}
function updateSetting(section, key, value){
  const cfg=getSettings();
  cfg[section]=cfg[section]||{};
  cfg[section][key]=value;
  const j=cfg.journal||[];
  j.unshift({date:new Date().toLocaleString('fr-BE'), section, key});
  cfg.journal=j.slice(0,50);
  saveSettings(cfg);
  if(!window.__settingsSaveSilent){ window.__settingsSaveSilent=true; setTimeout(()=>{window.__settingsSaveSilent=false},400); toast('Réglage enregistré'); }
}
function setSettingsCategory(cat){
  state.settingsCategory=cat;
  const subs=ADVANCED_SETTINGS_TREE[cat]?.subs;
  state.settingsSub=subs?Object.keys(subs)[0]:null;
  state.settingsTab=cat;
  render();
}
function setSettingsSub(sub){ state.settingsSub=sub; render(); }

function renderSettings(){
  const cfg=getSettings();
  const cat=state.settingsCategory || state.settingsTab || 'personnalisation';
  if(!ADVANCED_SETTINGS_TREE[cat]) state.settingsCategory='personnalisation';
  const current=state.settingsCategory || 'personnalisation';
  const node=ADVANCED_SETTINGS_TREE[current];
  if(node.subs && !state.settingsSub) state.settingsSub=Object.keys(node.subs)[0];
  return `<div class="settings-advanced">
    <aside class="settings-main-nav card">
      <div class="settings-brand-title"><h3>Réglages</h3><p>Centre de configuration ProdPilot IA</p></div>
      ${Object.entries(ADVANCED_SETTINGS_TREE).map(([id,n])=>`<button class="settings-main-tab ${current===id?'active':''}" onclick="setSettingsCategory('${id}')"><span>${n.icon}</span><div><b>${n.label}</b><small>${n.desc}</small></div></button>`).join('')}
      <button class="btn btn-ghost" onclick="resetSettings()">Réinitialiser tout</button>
    </aside>
    <section class="settings-workspace">
      <div class="settings-workspace-head card card-pad">
        <div><h2>${node.icon} ${node.label}</h2><p>${node.desc}</p></div>
        <span class="settings-save-pill">Sauvegarde locale automatique</span>
      </div>
      ${node.subs?`<div class="settings-sub-nav card">${Object.entries(node.subs).map(([sid,label])=>`<button class="settings-sub-tab ${state.settingsSub===sid?'active':''}" onclick="setSettingsSub('${sid}')">${label}</button>`).join('')}</div>`:''}
      <div class="settings-panel card card-pad">${renderAdvancedSettingsSection(current, state.settingsSub, cfg)}</div>
    </section>
  </div>`;
}

function renderAdvancedSettingsSection(cat, sub, cfg){
  if(cat==='espace') return renderEspaceSettings(cfg);
  if(cat==='general') return renderGeneralAdvanced(cfg);
  if(cat==='importSociete') return renderCompanyImportCenter(cfg);
  if(cat==='personnalisation') return renderPersonnalisationAdvanced(sub,cfg);
  if(cat==='erp') return renderERPAdvanced(sub,cfg);
  if(cat==='production') return renderProductionAdvanced(sub,cfg);
  if(cat==='reunions') return renderReunionsAdvanced(sub,cfg);
  if(cat==='ia') return renderIAAdvanced(sub,cfg);
  if(cat==='notifications') return renderSingleAdvanced('Notifications','Règles d’alerte et rappels automatiques.','custom','notificationRules',cfg,'textarea');
  if(cat==='utilisateurs') return renderUsersSettings(cfg);
  if(cat==='sauvegardes') return renderBackupSettings(cfg);
  if(cat==='journal') return renderJournalSettings(cfg);
  return '<p>Section à configurer.</p>';
}

function renderGeneralAdvanced(cfg){
  return `<div class="settings-section-title"><h3>Général</h3><p>Informations utilisées dans l’accueil, les documents et impressions.</p></div>
  ${settingsForm('', '', 'general', [['companyName','Nom société / logiciel','input'],['userName','Utilisateur principal','input'],['roleName','Fonction','input'],['defaultWeek','Semaine par défaut','input']], cfg)}
  <div style="margin-top:18px">${renderIdentitySettings(cfg)}</div>`;
}
function renderPersonnalisationAdvanced(sub,cfg){
  if(sub==='interface') return renderInterfaceDesigner(cfg);
  const map={
    dashboard:['Dashboard','Cartes et message du tableau de bord.','custom',[['dashboardCards','Cartes à afficher — une ligne par carte','textarea'],['dashboardMessage','Message / règle dashboard','textarea']]],
    accueil:['Accueil','Command Center, checklist et briefing du matin.','personnalisation',[['dailyBriefingIntro','Introduction briefing','textarea'],['homeChecklist','Checklist accueil — une ligne par tâche','textarea']]],
    templatesMails:['Templates mails','Modèles de mails réutilisables.','templates',[['mailAction','Mail action','textarea'],['mailDataQuality','Mail qualité ERP','textarea'],['mailUrgent','Mail urgence','textarea']]],
    templatesQRQC:['Templates QRQC','Texte et résumé QRQC.','custom',[['qrqcTemplate','Template QRQC','textarea']]],
    templatesReunion:['Templates Réunion','Modèle de réunion production.','custom',[['prodMeetingTemplate','Template réunion production','textarea']]],
    comptesRendus:['Comptes rendus','Pied de page et modèle global.','templates',[['meetingReport','Compte rendu réunion','textarea'],['reportFooter','Pied de page rapport','textarea']]],
    ia:['IA','Tonalité et textes IA visibles.','custom',[['aiTone','Tonalité IA','textarea']]],
    impression:['Impression','Moteur d’impression planning machine.','impressions',[['planningTitle','Titre planning machine','input'],['columns','Colonnes planning — champ | libellé | true/false','textarea']]],
    couleurs:['Couleurs','Codes couleur et légende métier.','custom',[['colors','Légende couleurs','textarea']]],
  };
  const m=map[sub]||map.accueil;
  return renderFormBlock(m[0],m[1],m[2],m[3],cfg)+(sub==='impression'?'<div style="margin-top:16px">'+renderPrintSettings(cfg)+'</div>':'');
}
function renderERPAdvanced(sub,cfg){
  const map={
    connexion:['Connexion','Préparation de la future connexion ERP en lecture seule.','custom',[['erpConnection','Paramètres connexion','textarea']]],
    import:['Import','Règles d’import CSV/Excel.','custom',[['erpImportRules','Règles import','textarea']]],
    mapping:['Mapping','Correspondance entre colonnes ERP et champs ProdPilot.','custom',[['erpMapping','Mapping colonnes','textarea']]],
    synchronisation:['Synchronisation','Fréquence et méthode de mise à jour.','custom',[['erpSync','Règles synchronisation','textarea']]],
    qualite:['Contrôle qualité','Règles de détection des données ERP incohérentes.','custom',[['erpQualityRules','Contrôles automatiques','textarea']]],
  }; const m=map[sub]||map.connexion; return renderFormBlock(m[0],m[1],m[2],m[3],cfg);
}
function renderProductionAdvanced(sub,cfg){
  if(sub==='machines') return renderProductionSettings(cfg);
  if(sub==='departements') return renderFormBlock('Départements','Services disponibles dans QRQC, réunions et actions.','production',[['departments','Départements — une ligne par service','textarea']],cfg);
  if(sub==='capacites') return renderFormBlock('Capacités','Capacités par département ou machine.','custom',[['capacities','Capacités','textarea']],cfg);
  if(sub==='priorites') return renderFormBlock('Priorités','Niveaux de priorité disponibles.','production',[['priorities','Priorités — une ligne par priorité','textarea']],cfg);
  if(sub==='typesOF') return renderFormBlock('Types d’OF','Typologie des OF.','custom',[['typesOF','Types d’OF — une ligne par type','textarea']],cfg);
  return renderProductionSettings(cfg);
}
function renderReunionsAdvanced(sub,cfg){
  if(sub==='qrqc') return renderFormBlock('QRQC','Configuration du QRQC quotidien.','reunions',[['qrqcSteps','Étapes QRQC','textarea'],['discussionQuestions','Questions guide','textarea']],cfg);
  if(sub==='production') return renderFormBlock('Réunion Production','Configuration de la réunion de production.','reunions',[['productionSteps','Étapes réunion production','textarea'],['discussionQuestions','Questions guide','textarea']],cfg);
  if(sub==='etapes') return renderFormBlock('Étapes','Toutes les étapes configurables.','reunions',[['qrqcSteps','Étapes QRQC','textarea'],['productionSteps','Étapes réunion production','textarea']],cfg);
  if(sub==='questions') return renderFormBlock('Questions','Questions utilisées dans les guides de discussion.','reunions',[['discussionQuestions','Questions — une ligne par question','textarea']],cfg);
  if(sub==='parking') return renderFormBlock('Parking Lot','Règles pour les sujets trop longs.','custom',[['qrqcParking','Texte / règle parking lot','textarea']],cfg);
  if(sub==='comptesRendus') return renderFormBlock('Comptes rendus','Templates des comptes rendus de réunion.','templates',[['meetingReport','Compte rendu réunion','textarea']],cfg);
  return '';
}
function renderIAAdvanced(sub,cfg){
  const map={
    systeme:['Prompt système','Comportement général de l’assistant.','ia',[['systemPrompt','Prompt système','textarea']]],
    daily:['Daily Briefing','Prompt du briefing quotidien.','ia',[['dailyPrompt','Prompt daily briefing','textarea']]],
    recommandations:['Recommandations','Prompt pour proposer les priorités.','ia',[['recommendationPrompt','Prompt recommandations','textarea']]],
    emails:['Emails','Prompt de rédaction e-mails.','custom',[['aiEmailPrompt','Prompt emails','textarea']]],
    resumes:['Résumés','Prompt de résumé réunion/journée.','custom',[['aiSummaryPrompt','Prompt résumés','textarea']]],
    commandes:['Commandes','Commandes IA prévues.','custom',[['aiCommands','Commandes — une ligne par commande','textarea']]],
  }; const m=map[sub]||map.systeme; return renderFormBlock(m[0],m[1],m[2],m[3],cfg);
}
function renderFormBlock(title,subtitle,section,fields,cfg){
  return `<div class="settings-section-title"><h3>${title}</h3><p>${subtitle}</p></div><div class="settings-form advanced-form">${fields.map(([key,label,type])=>`<label class="settings-field"><span>${label}</span>${type==='textarea'?`<textarea oninput="updateSetting('${section}','${key}',this.value)">${esc((cfg[section]||{})[key]||'')}</textarea>`:`<input value="${esc((cfg[section]||{})[key]||'')}" oninput="updateSetting('${section}','${key}',this.value)">`}</label>`).join('')}</div>${renderTemplateVariables()}`;
}
function renderSingleAdvanced(title,subtitle,section,key,cfg,type){ return renderFormBlock(title,subtitle,section,[[key,title,type||'textarea']],cfg); }


/* ================================================================
   IMPORT SOCIÉTÉ — LOGO, MACHINES, CONFIGURATION CLIENT
   ================================================================ */
function renderCompanyImportCenter(cfg){
  const machines = getMachines();
  const depts = [...new Set(machines.map(m=>m.dept))];
  return `<div class="settings-section-title"><h3>Import société</h3><p>Chargez rapidement les données propres à une entreprise : logo, machines, départements et configuration de base.</p></div>
  <div class="import-company-grid">
    <div class="company-import-card">
      <h3>1. Identité société</h3>
      <p class="t-sub">Importez un logo. Il sera réutilisé dans les impressions, comptes rendus et templates.</p>
      <div class="company-import-logo-preview">${renderCompanyLogo('company-logo-preview')}</div>
      <label class="btn btn-blue">Importer un logo / image
        <input type="file" accept="image/*" style="display:none" onchange="importCompanyLogoFile(this)">
      </label>
      <label class="settings-field"><span>Nom société</span><input value="${esc(cfg.general.companyName||'')}" oninput="updateSetting('general','companyName',this.value)"></label>
    </div>

    <div class="company-import-card">
      <h3>2. Machines</h3>
      <p class="t-sub">Import CSV/TXT avec colonnes : Code ; Nom ; Département ; Type ; Capacité.</p>
      <label class="btn btn-blue">Importer fichier machines CSV/TXT
        <input type="file" accept=".csv,.txt" style="display:none" onchange="importMachinesFile(this)">
      </label>
      <button class="btn btn-ghost" onclick="downloadMachinesTemplate()">Télécharger modèle machines</button>
      <div class="import-help-box"><b>Format accepté :</b><br>MAZAK VTC 800 ; MAZAK VTC 800 ; Fraisage ; Fraisage 5 axes ; 8</div>
    </div>

    <div class="company-import-card">
      <h3>3. Configuration complète</h3>
      <p class="t-sub">Importez ou exportez toute la configuration société : logo, machines, départements, templates, rôles, impressions.</p>
      <label class="btn btn-blue">Importer configuration JSON
        <input type="file" accept=".json" style="display:none" onchange="importCompanyConfigFile(this)">
      </label>
      <button class="btn btn-ghost" onclick="exportCompanyConfig()">Exporter configuration société</button>
      <button class="btn btn-ghost" onclick="downloadCompanyTemplate()">Télécharger modèle JSON</button>
    </div>

    <div class="company-import-card">
      <h3>Résumé société</h3>
      <div class="import-summary-row"><span>Machines</span><b>${machines.length}</b></div>
      <div class="import-summary-row"><span>Départements</span><b>${depts.length}</b></div>
      <div class="import-summary-row"><span>Logo</span><b>${cfg.general.companyLogo?'OK':'Non défini'}</b></div>
      <div class="import-summary-row"><span>Templates</span><b>${Object.keys(cfg.templates||{}).length}</b></div>
      <p class="t-sub" style="margin-top:12px">Cette page sert à préparer ProdPilot IA pour une autre société sans modifier le code.</p>
    </div>
  </div>
  <div class="card card-pad" style="margin-top:16px">
    <h3>Importer machines par copier-coller</h3>
    <p class="t-sub">Collez une liste avec séparateur point-virgule, tabulation ou pipe. Une machine par ligne.</p>
    <textarea id="machinesPasteBox" class="import-paste-box" placeholder="Code ; Nom ; Département ; Type ; Capacité"></textarea>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn btn-blue" onclick="importMachinesFromTextarea()">Importer la liste collée</button><button class="btn btn-ghost" onclick="$('machinesPasteBox').value=''">Vider</button></div>
  </div>
  <div class="card card-pad" style="margin-top:16px">
    <h3>4. Import ERP — Ordres de fabrication</h3>
    <p class="t-sub">Importez les OF depuis un export CSV/TXT de l'ERP, ou collez-les directement. Colonnes : <b>Num ; Client ; Article ; Désignation ; Qté ; Échéance ; Statut ; Priorité ; Commande</b> (les 2 premières sont obligatoires). En mode « Ajouter / mettre à jour », un OF existant portant le même numéro est mis à jour sans perdre sa gamme ni son planning.</p>
    <div style="display:flex;gap:8px;margin:10px 0;flex-wrap:wrap">
      <label class="btn btn-blue">Importer fichier OF (ajouter / mettre à jour)
        <input type="file" accept=".csv,.txt" style="display:none" onchange="importOFFile(this,'fusion')">
      </label>
      <label class="btn btn-ghost">Importer fichier OF (remplacer tout)
        <input type="file" accept=".csv,.txt" style="display:none" onchange="importOFFile(this,'remplacer')">
      </label>
      <button class="btn btn-ghost" onclick="downloadOFTemplate()">Télécharger modèle OF</button>
    </div>
    <textarea id="ofPasteBox" class="import-paste-box" placeholder="OF-26-0600 ; Altair Aero ; 745-2210 ; Support palier ; 12 ; 28/07/2026 ; Planifié ; Haute ; CMD-9001"></textarea>
    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
      <button class="btn btn-blue" onclick="importOFFromTextarea('fusion')">Importer (ajouter / mettre à jour)</button>
      <button class="btn btn-ghost" onclick="importOFFromTextarea('remplacer')">Remplacer tous les OF</button>
      <button class="btn btn-ghost" onclick="$('ofPasteBox').value=''">Vider</button>
    </div>
    <div class="import-help-box" style="margin-top:10px"><b>Statuts acceptés :</b> En cours, En retard, Bloqué, Planifié, Terminé · <b>Priorités :</b> Urgente, Haute, Normale.<br>Les OF importés apparaissent immédiatement dans la liste des OF, le tableau de bord et le contrôle Qualité données ERP.</div>
  </div>`;
}
function parseImportedMachineText(text){
  return String(text||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean).map(line=>{
    let parts = line.includes('|') ? line.split('|') : line.includes(';') ? line.split(';') : line.split(/\t|,/);
    parts = parts.map(x=>String(x||'').trim()).filter((x,i)=>x || i<4);
    const [code, nom, dept, type, cap] = parts;
    if(!code || !nom || !dept) return null;
    return `${code} | ${nom} | ${dept} | ${type||dept} | ${Number(cap)||8}`;
  }).filter(Boolean);
}
function applyImportedMachines(lines){
  if(!lines.length){ alert('Aucune machine valide trouvée.'); return; }
  const cfg=getSettings();
  cfg.production = cfg.production || {};
  cfg.production.machines = lines.join('\n');
  const depts=[...new Set(lines.map(l=>l.split('|')[2].trim()))];
  cfg.production.departments = depts.join('\n');
  saveSettings(cfg); render(); toast(lines.length+' machine(s) importée(s)');
}
function importMachinesFromTextarea(){ applyImportedMachines(parseImportedMachineText($('machinesPasteBox').value)); }
function importMachinesFile(input){
  const file=input.files&&input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>applyImportedMachines(parseImportedMachineText(reader.result));
  reader.readAsText(file,'utf-8');
}

/* ---------- IMPORT ERP — ORDRES DE FABRICATION ---------- */
const OF_STATUTS_VALIDES = ["En cours","En retard","Bloqué","Planifié","Terminé"];
const OF_PRIORITES_VALIDES = ["Urgente","Haute","Normale"];
function parseImportedOFText(text){
  const lignes = String(text||'').split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const out = []; const erreurs = [];
  lignes.forEach((line, idx)=>{
    // Ignorer une éventuelle ligne d'en-tête
    if(idx===0 && /^num/i.test(line.replace(/[;|\t,]/g,';').split(';')[0]||'')) return;
    let parts = line.includes(';') ? line.split(';') : line.includes('|') ? line.split('|') : line.split(/\t/);
    parts = parts.map(x=>String(x||'').trim());
    const [num, client, article, designation, qte, echeance, statut, priorite, cmd] = parts;
    if(!num || !client){ erreurs.push(`Ligne ${idx+1} : n° OF ou client manquant`); return; }
    const st = OF_STATUTS_VALIDES.find(s=>s.toLowerCase()===(statut||'').toLowerCase()) || "Planifié";
    const pr = OF_PRIORITES_VALIDES.find(p=>p.toLowerCase()===(priorite||'').toLowerCase()) || "Normale";
    out.push({
      num, client, cmd: cmd||"", article: article||"",
      designation: designation||"", qte: Number(qte)||0, priorite: pr,
      echeance: echeance||"", finEstimee: "", statut: st,
      avancement: st==="Terminé"?100:0, notes: "Importé ERP le "+new Date().toLocaleDateString('fr-BE'),
      operations: [], documents: []
    });
  });
  return { ofs: out, erreurs };
}
function applyImportedOFs(parsed, mode){
  if(!parsed.ofs.length){ alert("Aucun OF valide trouvé.\n"+(parsed.erreurs.slice(0,5).join('\n')||"Vérifiez le format : Num ; Client ; Article ; Désignation ; Qté ; Échéance ; Statut ; Priorité")); return; }
  let ajoutes=0, maj=0;
  if(mode==="remplacer"){
    if(!confirm(`Remplacer les ${OFS.length} OF actuels par les ${parsed.ofs.length} OF importés ?\nLe planning des OF supprimés sera vidé.`)) return;
    OFS.length = 0;
    PLANNING = PLANNING.filter(p=>parsed.ofs.some(o=>o.num===p.of));
    parsed.ofs.forEach(o=>{ OFS.push(o); ajoutes++; });
  } else {
    parsed.ofs.forEach(o=>{
      const existant = OFS.find(x=>x.num===o.num);
      if(existant){
        // Mise à jour des champs ERP sans écraser la gamme ni les documents existants
        Object.assign(existant, {client:o.client, article:o.article, designation:o.designation, qte:o.qte, priorite:o.priorite, echeance:o.echeance, statut:o.statut});
        if(o.cmd) existant.cmd=o.cmd;
        maj++;
      } else { OFS.push(o); ajoutes++; }
    });
  }
  render();
  toast(`Import ERP : ${ajoutes} OF ajouté(s), ${maj} mis à jour${parsed.erreurs.length?` · ${parsed.erreurs.length} ligne(s) ignorée(s)`:''}`);
}
function importOFFromTextarea(mode){ applyImportedOFs(parseImportedOFText($('ofPasteBox').value), mode); }
function importOFFile(input, mode){
  const file=input.files&&input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>applyImportedOFs(parseImportedOFText(reader.result), mode);
  reader.readAsText(file,'utf-8');
  input.value='';
}
function downloadOFTemplate(){
  const contenu = "Num ; Client ; Article ; Désignation ; Qté ; Échéance ; Statut ; Priorité ; Commande\n"
    + "OF-26-0600 ; Altair Aero ; 745-2210 ; Support palier ; 12 ; 28/07/2026 ; Planifié ; Haute ; CMD-9001\n"
    + "OF-26-0601 ; CryoTech ; 512-0090 ; Bague d'étanchéité ; 40 ; 31/07/2026 ; Planifié ; Normale ; CMD-9002";
  downloadTextFile("modele_import_of_erp.csv", contenu, "text/csv;charset=utf-8");
}
function importCompanyLogoFile(input){
  const file=input.files&&input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{ const cfg=getSettings(); cfg.general=cfg.general||{}; cfg.general.companyLogo=reader.result; saveSettings(cfg); render(); toast('Logo société importé'); };
  reader.readAsDataURL(file);
}
function importCompanyConfigFile(input){
  const file=input.files&&input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const imported=JSON.parse(reader.result);
      const cfg=deepMergeSettings(getSettings(), imported);
      saveSettings(cfg); render(); toast('Configuration société importée');
    }catch(e){ alert('Fichier JSON invalide.'); }
  };
  reader.readAsText(file,'utf-8');
}
function downloadTextFile(filename, content, type='text/plain;charset=utf-8'){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=filename; a.click(); URL.revokeObjectURL(a.href);
}
function exportCompanyConfig(){
  const cfg=getSettings();
  const exportObj={
    general:cfg.general, production:cfg.production, templates:cfg.templates,
    personnalisation:cfg.personnalisation, interface:cfg.interface,
    impressions:cfg.impressions, reunions:cfg.reunions, ia:cfg.ia,
    erp:cfg.erp, custom:cfg.custom
  };
  downloadTextFile('prodpilot-configuration-societe.json', JSON.stringify(exportObj,null,2), 'application/json;charset=utf-8');
  toast('Configuration société exportée');
}
function downloadMachinesTemplate(){
  const txt='Code;Nom;Département;Type;Capacité\nMAZAK VTC 800;MAZAK VTC 800;Fraisage;Fraisage 5 axes;8\nOKUMA LB25 II-C;OKUMA LB25 II-C;Tournage;Tournage;8\nMV 2400R connect;MV 2400R connect;Découpe fil;Découpe fil;16\n';
  downloadTextFile('modele-import-machines.csv', '\uFEFF'+txt, 'text/csv;charset=utf-8');
}
function downloadCompanyTemplate(){
  const tpl={
    general:{companyName:'Nom de la société', userName:'Utilisateur principal', roleName:'Fonction', companyLogo:''},
    production:{departments:'Tournage\nFraisage\nDécoupe fil', machines:'Code | Nom | Département | Type | Capacité', priorities:'Normale\nHaute\nUrgente'},
    templates:{mailAction:'Bonjour {responsable},\n\nAction : {titre}\nÉchéance : {echeance}\n\nMerci'},
    impressions:{planningTitle:'Planning machine', columns:'of | OF | true\nclient | Client | true\nqte | Quantité | true'}
  };
  downloadTextFile('modele-configuration-societe.json', JSON.stringify(tpl,null,2), 'application/json;charset=utf-8');
}


/* ================================================================
   UTILISATEURS — TABLEAU + DROITS
   ================================================================ */
function defaultUsersTable(){
  return [
    {active:true,lastName:'Mülverstedt',firstName:'Daniel',function:'Responsable flux et production',department:'Planning',email:'',phone:'',role:'Administrateur',permissions:{accueil:'admin',planning:'admin',of:'admin',reunions:'admin',actions:'admin',reglages:'admin',ia:'admin'}},
    {active:true,lastName:'Atelier',firstName:'Opérateur',function:'Opérateur',department:'Atelier',email:'',phone:'',role:'Atelier',permissions:{accueil:'view',planning:'view',of:'view',reunions:'none',actions:'create',reglages:'none',ia:'none'}},
    {active:true,lastName:'Qualité',firstName:'Contrôle',function:'Contrôleur',department:'Qualité',email:'',phone:'',role:'Qualité',permissions:{accueil:'view',planning:'view',of:'edit',reunions:'edit',actions:'edit',reglages:'none',ia:'view'}}
  ];
}
function getUsersTable(){
  const cfg=getSettings();
  try{
    if(cfg.custom && cfg.custom.usersTable) return JSON.parse(cfg.custom.usersTable);
  }catch(e){}
  return defaultUsersTable();
}
function saveUsersTable(users){
  const cfg=getSettings();
  cfg.custom=cfg.custom||{};
  cfg.custom.usersTable=JSON.stringify(users);
  saveSettings(cfg);
}
function updateUserRow(index,key,value){
  const users=getUsersTable();
  if(!users[index]) return;
  if(key==='active') users[index][key]=!!value;
  else users[index][key]=value;
  saveUsersTable(users);
  if(!window.__settingsSaveSilent){ window.__settingsSaveSilent=true; setTimeout(()=>window.__settingsSaveSilent=false,400); toast('Utilisateur mis à jour'); }
}
function updateUserPermission(index,module,value){
  const users=getUsersTable();
  if(!users[index]) return;
  users[index].permissions=users[index].permissions||{};
  users[index].permissions[module]=value;
  saveUsersTable(users);
}
function addUserRow(){
  const users=getUsersTable();
  users.push({active:true,lastName:'',firstName:'',function:'',department:'',email:'',phone:'',role:'Utilisateur',permissions:{accueil:'view',planning:'view',of:'view',reunions:'view',actions:'view',reglages:'none',ia:'none'}});
  saveUsersTable(users); render(); toast('Utilisateur ajouté');
}
function duplicateUserRow(index){
  const users=getUsersTable();
  if(!users[index]) return;
  const copy=JSON.parse(JSON.stringify(users[index]));
  copy.lastName = (copy.lastName||'Utilisateur') + ' copie';
  users.splice(index+1,0,copy);
  saveUsersTable(users); render(); toast('Utilisateur dupliqué');
}
function deleteUserRow(index){
  const users=getUsersTable();
  if(!users[index]) return;
  if(!confirm('Supprimer cet utilisateur ?')) return;
  users.splice(index,1);
  saveUsersTable(users); render(); toast('Utilisateur supprimé');
}
function applyRolePreset(index,role){
  const presets={
    'Administrateur':{accueil:'admin',dashboard:'admin',planning:'admin',of:'admin',meetings:'admin',reunions:'admin',actions:'admin',demandes:'admin',kpi:'admin',dataq:'admin',settings:'admin',reglages:'admin',ia:'admin'},
    'Responsable production':{accueil:'view',dashboard:'view',planning:'admin',of:'edit',meetings:'admin',reunions:'admin',actions:'admin',demandes:'edit',kpi:'view',dataq:'edit',settings:'none',reglages:'none',ia:'admin'},
    'Planificateur':{accueil:'view',dashboard:'view',planning:'admin',of:'edit',meetings:'edit',reunions:'edit',actions:'edit',demandes:'edit',kpi:'view',dataq:'view',settings:'none',reglages:'none',ia:'view'},
    'Atelier':{accueil:'view',dashboard:'none',planning:'view',of:'view',meetings:'none',reunions:'none',actions:'create',demandes:'create',kpi:'none',dataq:'none',settings:'none',reglages:'none',ia:'none'},
    'Qualité':{accueil:'view',dashboard:'view',planning:'view',of:'edit',meetings:'edit',reunions:'edit',actions:'edit',demandes:'view',kpi:'none',dataq:'view',settings:'none',reglages:'none',ia:'view'},
    'Direction':{accueil:'view',dashboard:'view',planning:'view',of:'view',meetings:'view',reunions:'view',actions:'view',demandes:'none',kpi:'view',dataq:'view',settings:'none',reglages:'none',ia:'view'},
    'Lecture seule':{accueil:'view',dashboard:'view',planning:'view',of:'view',meetings:'view',reunions:'view',actions:'view',demandes:'none',kpi:'view',dataq:'view',settings:'none',reglages:'none',ia:'none'},
  };
  const users=getUsersTable();
  if(!users[index]) return;
  users[index].role=role;
  users[index].permissions=JSON.parse(JSON.stringify(presets[role]||presets['Lecture seule']));
  saveUsersTable(users); render(); toast('Rôle appliqué');
}
function renderUsersSettings(cfg){
  const users=getUsersTable();
  const roles=getRoleNames();
  const modules=MAIN_MODULES;
  const rights=[['none','Aucun'],['view','Voir'],['create','Créer'],['edit','Modifier'],['admin','Admin']];
  const departs=getDepartments();
  const rolePerms=getRolePermissions();
  const currentRole=getCurrentRole();
  return `<div class="settings-section-title"><h3>Utilisateurs, rôles & accès modules</h3><p>L’administrateur définit quels modules principaux sont visibles et utilisables selon le rôle. Si un module est sur <b>Aucun</b>, il disparaît du menu.</p></div>
  <div class="settings-actions-row">
    <label class="settings-field inline-field"><span>Prévisualiser l’application comme</span><select onchange="setCurrentRole(this.value)">${roles.map(r=>`<option ${currentRole===r?'selected':''}>${esc(r)}</option>`).join('')}</select></label>
    <button class="btn btn-blue" onclick="addUserRow()">➕ Ajouter un utilisateur</button>
    <button class="btn btn-ghost" onclick="exportUsersCSV()">Exporter utilisateurs CSV</button>
  </div>

  <h3>Tableau des utilisateurs</h3>
  <div class="settings-machine-table-wrap users-table-wrap">
    <table class="settings-machine-table settings-edit-table users-settings-table">
      <thead><tr><th>Actif</th><th>Nom</th><th>Prénom</th><th>Fonction</th><th>Département</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th>Actions</th></tr></thead>
      <tbody>${users.map((u,i)=>`<tr>
        <td><label class="settings-check"><input type="checkbox" ${u.active?'checked':''} onchange="updateUserRow(${i},'active',this.checked)"></label></td>
        <td><input value="${esc(u.lastName||'')}" oninput="updateUserRow(${i},'lastName',this.value)"></td>
        <td><input value="${esc(u.firstName||'')}" oninput="updateUserRow(${i},'firstName',this.value)"></td>
        <td><input value="${esc(u.function||'')}" oninput="updateUserRow(${i},'function',this.value)"></td>
        <td><select onchange="updateUserRow(${i},'department',this.value)"><option value="">—</option>${departs.map(d=>`<option ${u.department===d?'selected':''}>${esc(d)}</option>`).join('')}</select></td>
        <td><input type="email" value="${esc(u.email||'')}" oninput="updateUserRow(${i},'email',this.value)"></td>
        <td><input value="${esc(u.phone||'')}" oninput="updateUserRow(${i},'phone',this.value)"></td>
        <td><select onchange="applyRolePreset(${i},this.value)">${roles.map(r=>`<option ${u.role===r?'selected':''}>${esc(r)}</option>`).join('')}</select></td>
        <td><button class="btn btn-ghost btn-small" onclick="duplicateUserRow(${i})">Dupliquer</button> <button class="btn btn-danger btn-small" onclick="deleteUserRow(${i})">Supprimer</button></td>
      </tr>`).join('')}</tbody>
    </table>
  </div>

  <div class="settings-section-title" style="margin-top:22px"><h3>Rôles et permissions par module principal</h3><p>Choisissez le niveau d’accès pour chaque module. <b>Aucun</b> masque le module dans le menu.</p></div>
  <div class="settings-actions-row">
    <button class="btn btn-blue" onclick="addRolePrompt()">➕ Ajouter un rôle</button>
    <button class="btn btn-ghost" onclick="resetRolePermissions()">Restaurer droits par défaut</button>
  </div>
  <div class="settings-machine-table-wrap users-table-wrap">
    <table class="settings-machine-table settings-edit-table permissions-matrix">
      <thead><tr><th>Rôle</th>${modules.map(m=>`<th>${esc(m[1])}</th>`).join('')}<th>Gestion</th></tr></thead>
      <tbody>${roles.map(role=>`<tr class="${role===currentRole?'active-role-row':''}">
        <td><b>${esc(role)}</b>${role===currentRole?'<div class="t-sub">Profil actif</div>':''}</td>
        ${modules.map(([mid])=>`<td><select class="rights-select right-${(rolePerms[role]?.[mid]||'none')}" onchange="updateRolePermission('${esc(role).replace(/'/g,"&#39;")}','${mid}',this.value)">${rights.map(([val,label])=>`<option value="${val}" ${(rolePerms[role]?.[mid]||'none')===val?'selected':''}>${label}</option>`).join('')}</select></td>`).join('')}
        <td><button class="btn btn-ghost btn-small" onclick="duplicateRole('${esc(role).replace(/'/g,"&#39;")}')">Dupliquer</button> <button class="btn btn-danger btn-small" onclick="deleteRole('${esc(role).replace(/'/g,"&#39;")}')">Supprimer</button></td>
      </tr>`).join('')}</tbody>
    </table>
  </div>
  <div class="settings-help"><b>Fonctionnement actuel</b><div>Le profil actif sert à tester l’affichage : le menu principal se met à jour immédiatement selon les permissions du rôle. Dans la future version avec connexion, ProdPilot utilisera automatiquement le rôle de l’utilisateur connecté.</div></div>`;
}
function exportUsersCSV(){
  const users=getUsersTable();
  const modules=['accueil','planning','of','reunions','actions','reglages','ia'];
  const header=['Actif','Nom','Prénom','Fonction','Département','Email','Téléphone','Rôle',...modules];
  const lines=[header.join(';')];
  users.forEach(u=>lines.push([u.active?'Oui':'Non',u.lastName||'',u.firstName||'',u.function||'',u.department||'',u.email||'',u.phone||'',u.role||'',...modules.map(m=>(u.permissions||{})[m]||'')].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')));
  const blob=new Blob([lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='prodpilot-utilisateurs.csv'; a.click(); URL.revokeObjectURL(a.href); toast('Utilisateurs exportés');
}

function renderBackupSettings(cfg){
  return `<div class="settings-section-title"><h3>Sauvegardes</h3><p>Exportez ou importez votre configuration locale.</p></div>
  <div class="settings-actions-row"><button class="btn btn-blue" onclick="exportSettingsJSON()">Exporter les réglages JSON</button><label class="btn btn-ghost" style="cursor:pointer">Importer JSON<input type="file" accept="application/json" style="display:none" onchange="importSettingsJSON(this.files[0])"></label><button class="btn btn-ghost" onclick="resetSettings()">Réinitialiser</button></div>
  <div class="settings-help"><b>Conseil</b><div>Garde une copie JSON avant de tester de gros changements. Plus tard, ces réglages seront stockés dans la base de données.</div></div>`;
}
function exportSettingsJSON(){ const blob=new Blob([JSON.stringify(getSettings(),null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='prodpilot-settings.json'; a.click(); URL.revokeObjectURL(a.href); toast('Réglages exportés'); }
function importSettingsJSON(file){ if(!file) return; const r=new FileReader(); r.onload=()=>{ try{ saveSettings(JSON.parse(r.result)); toast('Réglages importés'); render(); }catch(e){ alert('Fichier JSON invalide'); } }; r.readAsText(file); }
function renderJournalSettings(cfg){ const j=cfg.journal||[]; return `<div class="settings-section-title"><h3>Journal</h3><p>Historique local des modifications de réglages.</p></div><div class="settings-journal">${j.length?j.map(x=>`<div><b>${esc(x.date)}</b><span>${esc(x.section)} → ${esc(x.key)}</span></div>`).join(''):'<p class="t-sub">Aucune modification enregistrée.</p>'}</div>`; }




/* ================================================================
   TOURNÉE ATELIER — ÉTAT MACHINES
   ================================================================ */
function getStopReasons(){ return settingsLines("production","stopReasons").length ? settingsLines("production","stopReasons") : ["Panne","Manque matière","Manque programme","Manque outillage","Absence opérateur","Attente de contrôle","En réglage","Autre"]; }
function getTourneeStore(){
  try{ return JSON.parse(localStorage.getItem('prodpilot_tournee')||'{}'); }catch(e){ return {}; }
}
function saveTourneeStore(store){ localStorage.setItem('prodpilot_tournee', JSON.stringify(store)); }
function ensureTourneeStore(){ const s=getTourneeStore(); s.history=s.history||[]; s.photos=s.photos||{}; s.specs=s.specs||{}; if(s.active && !s.active.records) s.active=null; saveTourneeStore(s); return s; }
function startTournee(){
  const machines=getMachines();
  const store=ensureTourneeStore();
  store.active={ id:'tour-'+Date.now(), startedAt:new Date().toISOString(), records:machines.map(m=>({machineId:m.id,status:'',reason:'',note:''})) };
  saveTourneeStore(store); state.tourneeGroup='Tous'; state.tourneeMachine=null; render(); toast('Tournée démarrée');
}
function getActiveTournee(){ return ensureTourneeStore().active || null; }
function updateTourneeMachine(machineId,status,reason=''){
  const store=ensureTourneeStore(); if(!store.active) return;
  const rec=store.active.records.find(r=>r.machineId===machineId); if(!rec) return;
  rec.status=status; if(status==='En production') rec.reason=''; else if(reason) rec.reason=reason;
  rec.updatedAt=new Date().toISOString(); saveTourneeStore(store); render();
}
function updateTourneeNote(machineId,note){ const store=ensureTourneeStore(); const rec=store.active?.records.find(r=>r.machineId===machineId); if(rec){ rec.note=note; saveTourneeStore(store); } }
function finishTournee(){
  const store=ensureTourneeStore(); if(!store.active) return;
  const unanswered=store.active.records.filter(r=>!r.status).length;
  if(unanswered && !confirm(`${unanswered} machine(s) n'ont pas encore d'état. Clôturer quand même ?`)) return;
  store.active.finishedAt=new Date().toISOString();
  store.history.unshift(store.active); store.history=store.history.slice(0,300); store.active=null; saveTourneeStore(store);
  state.tourneeMachine=null; render(); toast('Tournée clôturée et enregistrée');
}
function cancelTournee(){ if(confirm('Annuler la tournée en cours ?')){ const s=ensureTourneeStore(); s.active=null; saveTourneeStore(s); render(); } }
function uploadMachinePhoto(machineId,input){ const file=input.files&&input.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{ const s=ensureTourneeStore(); s.photos[machineId]=reader.result; saveTourneeStore(s); render(); toast('Photo machine enregistrée'); }; reader.readAsDataURL(file); }
function updateMachineSpec(machineId,val){ const s=ensureTourneeStore(); s.specs[machineId]=val; saveTourneeStore(s); }
function setTourneeGroup(g){ state.tourneeGroup=g; render(); }
function setTourneeMachine(mid){ state.tourneeMachine=mid; render(); }
function tourneeStats(records){
  const total=records.length||1; const prod=records.filter(r=>r.status==='En production').length; const arret=records.filter(r=>r.status==="À l'arrêt").length; const unknown=records.filter(r=>!r.status).length;
  const reasons={}; records.filter(r=>r.status==="À l'arrêt").forEach(r=>{ reasons[r.reason||'Autre']=(reasons[r.reason||'Autre']||0)+1; });
  return {total,prod,arret,unknown,prodPct:Math.round(prod/total*100),arretPct:Math.round(arret/total*100),reasons};
}
function renderTourneeAtelier(){
  const store=ensureTourneeStore(); const active=store.active; const machines=getMachines(); const groups=['Tous',...new Set(machines.map(m=>m.dept))]; const g=state.tourneeGroup||'Tous';
  const currentRecords=active ? active.records : (store.history[0]?.records || machines.map(m=>({machineId:m.id,status:'',reason:''})));
  const filteredMachines=machines.filter(m=>g==='Tous'||m.dept===g);
  const records=filteredMachines.map(m=>currentRecords.find(r=>r.machineId===m.id)||{machineId:m.id,status:'',reason:''}); const stats=tourneeStats(records);
  return `<div class="tournee-layout">
    <section class="tournee-hero card card-pad">
      <div class="tournee-title"><div><h2>🚶 Tournée atelier</h2><p>Saisie rapide sur téléphone : production ou arrêt, puis motif fermé si arrêt.</p></div><div class="tournee-actions">${active?`<button class="btn btn-green" onclick="finishTournee()">Clôturer la tournée</button><button class="btn btn-ghost" onclick="cancelTournee()">Annuler</button>`:`<button class="btn btn-blue" onclick="startTournee()">Démarrer une tournée</button>`}</div></div>
      <div class="tournee-kpis">
        <div><b>${stats.prodPct}%</b><span>En production</span></div><div><b>${stats.arretPct}%</b><span>À l’arrêt</span></div><div><b>${stats.prod}</b><span>Machines OK</span></div><div><b>${stats.arret}</b><span>Machines arrêtées</span></div><div><b>${stats.unknown}</b><span>Non saisies</span></div>
      </div>
      <div class="tournee-filter">${groups.map(x=>`<button class="chip ${g===x?'on':''}" onclick="setTourneeGroup('${esc(x).replace(/'/g,"&#39;")}')">${esc(x)}</button>`).join('')}</div>
    </section>
    ${active?renderTourneeSaisie(active,filteredMachines,store):renderTourneeDashboard(store,filteredMachines,records,stats)}
  </div>`;
}
function renderTourneeSaisie(active,machines,store){
  const reasons=getStopReasons();
  return `<section class="tournee-mobile-list">
    ${machines.map(m=>{ const r=active.records.find(x=>x.machineId===m.id)||{}; const photo=store.photos[m.id]||''; const spec=store.specs[m.id]||''; return `<article class="machine-tour-card card ${r.status==='En production'?'is-prod':r.status==="À l'arrêt"?'is-stop':''}">
      <div class="machine-tour-head">
        <div class="machine-photo-box">${photo?`<img src="${photo}" alt="${esc(m.nom)}">`:'<span>📷</span>'}</div>
        <div><h3>${esc(m.nom)}</h3><p>${esc(m.dept)} · ${esc(m.type)}</p></div>
        <button class="btn btn-ghost btn-small" onclick="setTourneeMachine('${m.id}')">Fiche</button>
      </div>
      <div class="state-buttons"><button class="state-prod ${r.status==='En production'?'active':''}" onclick="updateTourneeMachine('${m.id}','En production')">En production</button><button class="state-stop ${r.status==="À l'arrêt"?'active':''}" onclick="updateTourneeMachine('${m.id}',\"À l'arrêt\")">À l'arrêt</button></div>
      ${r.status==="À l'arrêt"?`<div class="reason-grid">${reasons.map(reason=>`<button class="reason-btn ${r.reason===reason?'active':''}" onclick="updateTourneeMachine('${m.id}',\"À l'arrêt\",'${esc(reason).replace(/'/g,"&#39;")}')">${esc(reason)}</button>`).join('')}</div>`:''}
      <textarea class="tour-note" placeholder="Note rapide facultative…" oninput="updateTourneeNote('${m.id}',this.value)">${esc(r.note||'')}</textarea>
      ${state.tourneeMachine===m.id?renderMachineMiniFiche(m,photo,spec):''}
    </article>`; }).join('')}
  </section>`;
}
function renderMachineMiniFiche(m,photo,spec){ return `<div class="machine-mini-fiche"><div class="settings-actions-row"><label class="btn btn-ghost btn-small">Ajouter photo<input type="file" accept="image/*" style="display:none" onchange="uploadMachinePhoto('${m.id}',this)"></label><button class="btn btn-ghost btn-small" onclick="openParcFiche('${m.id}')">🏭 Fiche parc & documents</button></div><label class="settings-field"><span>Fiche technique machine</span><textarea placeholder="Exemple : CN, courses, capacité, remarques maintenance, contacts…" oninput="updateMachineSpec('${m.id}',this.value)">${esc(spec||'')}</textarea></label></div>`; }
function renderTourneeDashboard(store,machines,records,stats){
  const byDept=[...new Set(machines.map(m=>m.dept))].map(dept=>{ const rec=machines.filter(m=>m.dept===dept).map(m=>records.find(r=>r.machineId===m.id)||{}); const st=tourneeStats(rec); return {dept,...st}; });
  const reasons=Object.entries(stats.reasons).sort((a,b)=>b[1]-a[1]);
  const today=new Date().toISOString().slice(0,10); const todayTours=(store.history||[]).filter(t=>(t.finishedAt||t.startedAt||'').slice(0,10)===today); const avg=todayTours.length?Math.round(todayTours.reduce((s,t)=>s+tourneeStats(t.records).prodPct,0)/todayTours.length):0;
  return `<section class="tournee-analysis card card-pad"><div class="settings-head"><div><h2>Analyse dernière tournée</h2><p>Global, par groupe et Pareto des causes d’arrêt.</p></div><span class="settings-save-pill">${store.history?.length||0} tournée(s)</span></div>
    <div class="tournee-kpis wide"><div><b>${avg}%</b><span>Moyenne jour fonctionnement</span></div><div><b>${todayTours.length}</b><span>Tournées aujourd’hui</span></div><div><b>${stats.prodPct}%</b><span>Dernière tournée OK</span></div><div><b>${stats.arret}</b><span>Arrêts</span></div></div>
    <h3>Par groupe</h3><div class="dept-bars">${byDept.map(x=>`<div><div class="bar-head"><b>${esc(x.dept)}</b><span>${x.prodPct}% production · ${x.arret} arrêt(s)</span></div><div class="stack-bar"><i style="width:${x.prodPct}%"></i></div></div>`).join('')}</div>
    <h3>Pareto causes d’arrêt</h3><div class="pareto-list">${reasons.length?reasons.map(([reason,n])=>{ const pct=Math.round(n/(stats.arret||1)*100); return `<div><div class="bar-head"><b>${esc(reason)}</b><span>${n} machine(s) · ${pct}%</span></div><div class="stop-bar"><i style="width:${pct}%"></i></div></div>`; }).join(''):'<p class="t-sub">Aucun arrêt sur la dernière tournée.</p>'}</div>
    <h3>Historique récent</h3><div class="tour-history">${(store.history||[]).slice(0,8).map(t=>{ const st=tourneeStats(t.records); return `<div><b>${new Date(t.finishedAt||t.startedAt).toLocaleString('fr-BE')}</b><span>${st.prodPct}% production · ${st.arret} arrêt(s)</span></div>`; }).join('')||'<p class="t-sub">Aucune tournée clôturée.</p>'}</div>
  </section>`;
}

/* ================================================================
   AJOUTS 10/07 : FENÊTRE D'ACTION TYPÉE + TÂCHES LIBRES + DEMANDES
   MAINTENANCE (greffés sur la version du 09/07, rien de réécrit)
   ================================================================ */

const ACTION_TYPES = ["Qualité","Planification","Programmation","Outillage","Matière","Maintenance","Achats","Production","Autre"];
const TYPES_DEMANDE_MAINT = ["Maintenance préventive","Maintenance curative","Amélioration","Contrôle réglementaire"];

function personnesSuggerees(){
  const set = new Set();
  Object.values(RESPONSABLES).forEach(r=>set.add(r.nom));
  ACTIONS.forEach(a=>{ if(a.resp && a.resp!=="À définir") set.add(a.resp); });
  if(typeof getDepartments === "function") getDepartments().forEach(d=>set.add(d));
  return [...set];
}

/* ---------- Fenêtre générique de création d'action (type + description) ---------- */
function dialogAction(opts){
  state.actCtx = opts || {};
  const o = state.actCtx;
  $("modalRoot").innerHTML = `
  <div class="overlay" onclick="if(event.target===this)fermerModal()">
    <div class="modal" style="max-width:540px">
      <div class="modal-head"><b>Créer une action</b>
        ${o.of?`<span class="t-sub">liée à ${o.of}</span>`:o.dept?`<span class="t-sub">${esc(o.dept)}</span>`:""}
        <button class="icon-btn" style="margin-left:auto" onclick="fermerModal()">✕</button></div>
      <div class="modal-body">
        <label class="t-sub">Type d'action</label>
        <select id="qType" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
          ${ACTION_TYPES.map(t=>`<option ${(o.type||"Autre")===t?"selected":""}>${t}</option>`).join("")}
        </select>
        <label class="t-sub" style="margin-top:9px;display:block">Description de l'action</label>
        <input id="qDesc" value="${esc(o.titre||"")}" placeholder="Ex. : relancer la dérogation, commander l'outil Ø8…" style="width:100%">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:9px">
          <div><label class="t-sub">Responsable</label>
            <input id="qResp" list="listePersonnes" value="${esc(o.resp&&o.resp!=="À définir"?o.resp:"")}" placeholder="Nom ou service" style="width:100%">
            <datalist id="listePersonnes">${personnesSuggerees().map(p=>`<option value="${esc(p)}">`).join("")}</datalist></div>
          <div><label class="t-sub">Échéance</label>
            <input id="qEch" value="${esc(o.echeance||"09/07")}" placeholder="jj/mm" style="width:100%"></div>
        </div>
        <label class="t-sub" style="margin-top:9px;display:block">Priorité</label>
        <select id="qPrio" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
          ${["Urgente","Haute","Normale"].map(p=>`<option ${(o.priorite||"Haute")===p?"selected":""}>${p}</option>`).join("")}
        </select>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="fermerModal()">Annuler</button>
        <button class="btn btn-blue" style="margin-left:auto" onclick="creerActionDialog()">✓ Créer l'action</button>
      </div>
    </div>
  </div>`;
  setTimeout(()=>{ const d=$("qDesc"); if(d){ d.focus(); d.select(); } }, 50);
}
function creerActionDialog(){
  const o = state.actCtx || {};
  const titre = $("qDesc").value.trim();
  if(!titre){ toast("Décrivez l'action à réaliser"); return; }
  const id = (o.meeting ? "ACT-M" : "ACT-") + String(Date.now()).slice(-5);
  const ofNum = o.of || "";
  const a = { id, type:$("qType").value, titre, resp:$("qResp").value.trim()||"À définir",
    echeance:$("qEch").value.trim()||"Aujourd'hui", priorite:$("qPrio").value, statut:"À faire",
    of: ofNum || "—", client: ofNum && ofByNum(ofNum) ? ofByNum(ofNum).client : (o.dept||"") };
  ACTIONS.unshift(a);
  if(o.meeting && state.meetingActions) state.meetingActions.unshift(a);
  fermerModal(); render();
  toast("Action créée (" + a.type + ") → " + a.resp);
}

/* ---------- Tâche libre dans le planning (maintenance / divers, hors OF) ---------- */
function ouvrirTacheLibre(opts){
  state.tlCtx = opts || {};
  const o = state.tlCtx;
  const machines = getMachines();
  $("modalRoot").innerHTML = `
  <div class="overlay" onclick="if(event.target===this)fermerModal()">
    <div class="modal" style="max-width:560px">
      <div class="modal-head"><b>🔧 Planifier une tâche hors OF</b>
        ${o.demId?`<span class="t-sub">depuis la demande ${o.demId}</span>`:""}
        <button class="icon-btn" style="margin-left:auto" onclick="fermerModal()">✕</button></div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label class="t-sub">Type</label>
            <select id="tlType" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
              <option>Maintenance</option><option>Divers</option>
            </select></div>
          <div><label class="t-sub">Machine</label>
            <select id="tlMachine" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
              ${machines.map(m=>`<option value="${m.id}" ${o.machine===m.id?"selected":""}>${m.id} — ${esc(m.nom)}</option>`).join("")}
            </select></div>
        </div>
        <label class="t-sub" style="margin-top:9px;display:block">Libellé de la tâche</label>
        <input id="tlLib" value="${esc(o.libelle||"")}" placeholder="Ex. : révision broche, inventaire outillage, formation…" style="width:100%">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px;margin-top:9px">
          <div><label class="t-sub">Jour</label>
            <select id="tlJour" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
              ${JOURS.map(j=>`<option value="${j.idx}" ${o.jour===j.idx?"selected":""}>${j.label}/07 — S${j.semaine}</option>`).join("")}
            </select></div>
          <div><label class="t-sub">Durée (h)</label>
            <input id="tlH" type="number" value="${o.h||4}" min="0.5" step="0.5" style="width:100%"></div>
          <div><label class="t-sub">Responsable</label>
            <input id="tlResp" list="listePersonnes2" value="${esc(o.resp||"")}" placeholder="Nom" style="width:100%">
            <datalist id="listePersonnes2">${personnesSuggerees().map(p=>`<option value="${esc(p)}">`).join("")}</datalist></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="fermerModal()">Annuler</button>
        <button class="btn btn-blue" style="margin-left:auto" onclick="creerTacheLibre()">✓ Planifier</button>
      </div>
    </div>
  </div>`;
}
function creerTacheLibre(){
  const o = state.tlCtx || {};
  const mid = $("tlMachine").value, jour = Number($("tlJour").value);
  const lib = $("tlLib").value.trim() || ($("tlType").value==="Maintenance" ? "Maintenance machine" : "Tâche diverse");
  const h = Math.max(0.5, Number($("tlH").value) || 1);
  PLANNING.push({ machine:mid, jour, of:"", label:lib, h, statut:$("tlType").value, resp:$("tlResp").value.trim()||"" });
  if(o.demId){ const d = DEMANDES.find(x=>x.id===o.demId); if(d) d.statut = "Planifiée"; }
  fermerModal();
  state.page = "planning"; state.printMachine = null; render();
  const m = getMachines().find(x=>x.id===mid);
  const somme = PLANNING.filter(p=>p.machine===mid&&p.jour===jour).reduce((s,p)=>s+p.h,0);
  toast("« "+lib+" » planifiée sur "+mid+" — "+JOURS[jour].label+"/07 ("+h+" h)"+(m&&somme>m.capJour?" ⚠ surcharge":""));
}

/* ---------- Demandes de maintenance machine ---------- */
function planifierDemandeMaint(id){
  const d = DEMANDES.find(x=>x.id===id); if(!d) return;
  ouvrirTacheLibre({ demId:id, machine:d.machine||"", libelle:(d.type||"Maintenance")+" — "+id, resp:"K. Moreau" });
}
function ouvrirDemandeMaint(){
  const machines = getMachines();
  $("modalRoot").innerHTML = `
  <div class="overlay" onclick="if(event.target===this)fermerModal()">
    <div class="modal" style="max-width:540px">
      <div class="modal-head"><b>🔧 Nouvelle demande de maintenance</b>
        <span class="t-sub">Circuit : demande → décision → planification</span>
        <button class="icon-btn" style="margin-left:auto" onclick="fermerModal()">✕</button></div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label class="t-sub">Machine</label>
            <select id="dmMachine" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
              ${machines.map(m=>`<option value="${m.id}">${m.id} — ${esc(m.nom)}</option>`).join("")}
            </select></div>
          <div><label class="t-sub">Type</label>
            <select id="dmType" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
              ${TYPES_DEMANDE_MAINT.map(t=>`<option>${t}</option>`).join("")}
            </select></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:9px">
          <div><label class="t-sub">Priorité</label>
            <select id="dmPrio" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
              <option>Normale</option><option>Haute</option><option>Urgente</option>
            </select></div>
          <div><label class="t-sub">Demandeur</label>
            <input id="dmQui" value="${esc(getSettings().general.userName||"Atelier")}" style="width:100%"></div>
        </div>
        <label class="t-sub" style="margin-top:9px;display:block">Description du besoin</label>
        <textarea id="dmDesc" placeholder="Ex. : bruit anormal sur l'axe Z, à vérifier avant le lot suivant…"></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="fermerModal()">Annuler</button>
        <button class="btn btn-blue" style="margin-left:auto" onclick="creerDemandeMaint()">✓ Envoyer la demande</button>
      </div>
    </div>
  </div>`;
}
function creerDemandeMaint(){
  const desc = $("dmDesc").value.trim();
  if(!desc){ toast("Décrivez le besoin de maintenance"); return; }
  const maxNum = DEMANDES.filter(d=>d.categorie==="maintenance")
    .reduce((mx,d)=>Math.max(mx, Number(String(d.id).replace(/\D/g,""))||0), 10);
  DEMANDES.unshift({ id:"MNT-"+String(maxNum+1).padStart(3,"0"), categorie:"maintenance",
    type:$("dmType").value, machine:$("dmMachine").value, demandeur:$("dmQui").value||"Atelier",
    date:new Date().toLocaleDateString("fr-BE",{day:"2-digit",month:"2-digit"}),
    priorite:$("dmPrio").value, statut:"En attente", commentaire:desc });
  fermerModal(); state.demTab="maintenance"; if(state.page!=="demandes") state.page="demandes"; render();
  toast("Demande de maintenance créée — en attente de décision");
}

/* ================================================================
   MODULE PARC MACHINES — état du parc, fiches, maintenance, documents
   (aide à la décision planning — volontairement PAS une GMAO complète)
   ================================================================ */

const INTERVENTION_TYPES = ["Maintenance préventive","Nettoyage","Graissage","Calibration","Contrôle","Intervention","Autre"];
const INTERVENTION_ETATS = ["Prévue","En cours","Terminée","Reportée"];

/* ---------- Stockage local (persistant, comme les Réglages) ---------- */
function ensureParcStore(){
  let s;
  try{ s = JSON.parse(localStorage.getItem("prodpilot_parc")||"null"); }catch(e){ s = null; }
  if(!s){
    s = { fiches:{}, docs:{},
      interventions:[
        { id:"INT-001", machineId:"FRA-02", type:"Graissage", date:"07/07", duree:1.5, resp:"K. Moreau", commentaire:"Graissage hebdomadaire axes X/Y/Z", etat:"Prévue" },
        { id:"INT-002", machineId:"TOU-02", type:"Contrôle", date:"04/07", duree:2, resp:"K. Moreau", commentaire:"Contrôle géométrie broche (reporté de S27)", etat:"Prévue" },
        { id:"INT-003", machineId:"FIL-01", type:"Maintenance préventive", date:"15/07", duree:4, resp:"K. Moreau", commentaire:"Révision annuelle générateur", etat:"Prévue" },
        { id:"INT-000", machineId:"TOU-01", type:"Nettoyage", date:"03/07", duree:1, resp:"M. Lambert", commentaire:"Nettoyage complet + niveau lubrifiant", etat:"Terminée" },
      ] };
    saveParcStore(s);
  }
  s.fiches = s.fiches||{}; s.docs = s.docs||{}; s.interventions = s.interventions||[];
  return s;
}
function saveParcStore(s){ try{ localStorage.setItem("prodpilot_parc", JSON.stringify(s)); }catch(e){ toast("Stockage local plein — document non conservé"); } }
function ficheDe(id){ const s = ensureParcStore(); return s.fiches[id] || {}; }
function majFiche(id, champ, val){ const s = ensureParcStore(); s.fiches[id] = s.fiches[id]||{}; s.fiches[id][champ] = val; saveParcStore(s); }
function photoDe(id){ const t = (typeof ensureTourneeStore==="function") ? ensureTourneeStore() : null; return (t && t.photos && t.photos[id]) || ficheDe(id).photo || null; }

/* ---------- État machine (dérivé, pas de saisie en double) ---------- */
function etatMachine(m){
  const f = ficheDe(m.id);
  if(f.panne) return { ico:"🔴", txt:"En panne", cls:"et-panne" };
  const s = ensureParcStore();
  const maint = s.interventions.some(i=>i.machineId===m.id && (i.etat==="En cours" || (i.etat==="Prévue" && dateKey(i.date)!==null && dateKey(i.date) <= TODAY_KEY+7)));
  if(s.interventions.some(i=>i.machineId===m.id && i.etat==="En cours")) return { ico:"🟠", txt:"Maintenance en cours", cls:"et-maint" };
  const prod = PLANNING.some(p=>p.machine===m.id && p.jour===1 && (p.statut==="En cours"||p.statut==="En réglage"));
  if(prod) return { ico:"🔵", txt:"En production", cls:"et-prod" };
  if(maint) return { ico:"🟠", txt:"Maintenance prévue", cls:"et-maint" };
  return { ico:"🟢", txt:"Disponible", cls:"et-dispo" };
}
function etatBadge(m){ const e = etatMachine(m); return `<span class="et-chip ${e.cls}">${e.ico} ${e.txt}</span>`; }

/* ---------- Alertes maintenance (accueil) ---------- */
function parcAlertes(){
  const s = ensureParcStore();
  const actifs = s.interventions.filter(i=>i.etat==="Prévue"||i.etat==="En cours");
  return {
    auj: actifs.filter(i=>dateKey(i.date)===TODAY_KEY),
    retard: actifs.filter(i=>dateKey(i.date)!==null && dateKey(i.date)<TODAY_KEY),
  };
}
function parcAlertesBanner(){
  const a = parcAlertes();
  let h = "";
  if(a.retard.length) h += `<div class="parc-alert parc-alert-red" onclick="state.page='parc';state.parcTab='maintenance';state.parcMachine=null;render()">
    🔴 <b>${a.retard.length} maintenance(s) en retard</b> — ${a.retard.map(i=>i.machineId+" ("+i.type+", prévue le "+i.date+")").join(" · ")} — cliquer pour traiter</div>`;
  if(a.auj.length) h += `<div class="parc-alert parc-alert-amber" onclick="state.page='parc';state.parcTab='maintenance';state.parcMachine=null;render()">
    🟠 <b>Maintenance prévue aujourd'hui</b> — ${a.auj.map(i=>i.machineId+" : "+i.type+" ("+i.duree+" h, "+i.resp+")").join(" · ")}</div>`;
  return h;
}

/* ---------- Liaison planning : conflit OF / maintenance ---------- */
function maintenanceConflit(mid, jourIdx){
  const s = ensureParcStore();
  const jd = JOURS[jourIdx] ? JOURS[jourIdx].date : null;
  if(!jd) return null;
  return s.interventions.find(i=>i.machineId===mid && (i.etat==="Prévue"||i.etat==="En cours") && i.date===jd) || null;
}
function modalConflitMaint(interv, onContinue){
  state._maintCb = onContinue;
  $("modalRoot").innerHTML = `
  <div class="overlay" onclick="if(event.target===this)fermerModal()">
    <div class="modal" style="max-width:480px">
      <div class="modal-head"><b>⚠ Maintenance prévue</b>
        <button class="icon-btn" style="margin-left:auto" onclick="fermerModal()">✕</button></div>
      <div class="modal-body">
        <p style="font-size:13.5px;line-height:1.6"><b>Attention, une maintenance est prévue sur cette machine pendant cette période.</b></p>
        <div class="rg-item" style="margin-top:10px">
          <b>${interv.machineId}</b> — ${esc(interv.type)}<br>
          <span class="t-sub">Le ${interv.date} · ${interv.duree} h · ${esc(interv.resp)} · statut ${interv.etat}</span>
          ${interv.commentaire?`<div class="t-sub" style="margin-top:4px">${esc(interv.commentaire)}</div>`:""}
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="fermerModal()">Choisir une autre machine</button>
        <button class="btn btn-blue" style="margin-left:auto" onclick="continuerMalgreMaint()">Continuer quand même</button>
      </div>
    </div>
  </div>`;
}
function continuerMalgreMaint(){ const cb = state._maintCb; state._maintCb = null; fermerModal(); if(cb) cb(); }

/* ---------- Page principale : sous-menus ---------- */
function openParcFiche(id){ state.page="parc"; state.parcMachine=id; render(); }
function renderParc(){
  const tab = state.parcTab || "atelier";
  const tabs = [["atelier","Vue atelier"],["machines","Machines"],["maintenance","Planning maintenance"],["documents","Documents"]];
  let h = `<div class="filters" style="border:none;padding:0 0 13px 0;background:none">
    ${tabs.map(([id,l])=>`<button class="chip ${tab===id?"on":""}" onclick="state.parcTab='${id}';render()">${l}</button>`).join("")}
  </div>`;
  if(tab==="atelier") h += renderParcAtelier();
  else if(tab==="machines") h += renderParcMachines();
  else if(tab==="maintenance") h += renderParcMaintenance();
  else h += renderParcDocuments();
  return h;
}

/* ---------- 1. Vue atelier : cartes ---------- */
function renderParcAtelier(){
  const parDept = {};
  getMachines().forEach(m=>{ (parDept[m.dept]=parDept[m.dept]||[]).push(m); });
  return Object.entries(parDept).map(([dept,ms])=>`
  <h3 style="margin:6px 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-2)">${esc(dept)}</h3>
  <div class="parc-grid">
    ${ms.map(m=>{ const ph = photoDe(m.id); return `
    <div class="card parc-card" onclick="openParcFiche('${m.id}')">
      <div class="parc-photo">${ph?`<img src="${ph}" alt="${m.id}">`:`<span>${ICONS.factory}</span>`}</div>
      <div class="parc-card-body">
        <b>${m.id}</b>
        <div class="t-sub">${esc(m.nom)}</div>
        ${etatBadge(m)}
      </div>
    </div>`;}).join("")}
  </div>`).join("");
}

/* ---------- 2. Liste machines ---------- */
function renderParcMachines(){
  const s = ensureParcStore();
  return `<div class="card" style="overflow:hidden"><div style="overflow-x:auto"><table>
    <thead><tr><th>Machine</th><th>Département</th><th>Type</th><th>Constructeur / modèle</th><th>État</th><th>Prochaine maintenance</th><th>Docs</th></tr></thead>
    <tbody>${getMachines().map(m=>{
      const f = ficheDe(m.id);
      const next = s.interventions.filter(i=>i.machineId===m.id && i.etat!=="Terminée").sort((a,b)=>(dateKey(a.date)||999)-(dateKey(b.date)||999))[0];
      const docs = (s.docs[m.id]||[]).length;
      return `<tr class="row-click" onclick="openParcFiche('${m.id}')">
        <td><b>${m.id}</b><div class="t-sub">${esc(m.nom)}</div></td>
        <td style="color:var(--ink-2)">${esc(m.dept)}</td>
        <td style="color:var(--ink-2)">${esc(m.type||"")}</td>
        <td style="color:var(--ink-2)">${esc(f.constructeur||"—")}${f.modele?" · "+esc(f.modele):""}</td>
        <td>${etatBadge(m)}</td>
        <td style="color:var(--ink-2)">${next?`${next.date} — ${esc(next.type)} <span class="t-sub">(${next.etat})</span>`:"—"}</td>
        <td style="color:var(--ink-2)">${docs||"—"}</td>
      </tr>`;}).join("")}</tbody>
  </table></div></div>`;
}

/* ---------- 3. Planning maintenance + 4. Historique ---------- */
function renderParcMaintenance(){
  const s = ensureParcStore();
  const a = parcAlertes();
  const actives = s.interventions.filter(i=>i.etat!=="Terminée").sort((x,y)=>(dateKey(x.date)||999)-(dateKey(y.date)||999));
  const histo = s.interventions.filter(i=>i.etat==="Terminée").sort((x,y)=>(dateKey(y.date)||0)-(dateKey(x.date)||0));
  return `
  ${a.retard.length?`<div class="parc-alert parc-alert-red">🔴 <b>${a.retard.length} maintenance(s) en retard</b> — à traiter ou à reporter.</div>`:""}
  <div class="card card-pad" style="margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:11px">
      <h3>Interventions à venir (${actives.length})</h3>
      <button class="btn btn-blue" style="margin-left:auto" onclick="ouvrirIntervention()">＋ Nouvelle intervention</button>
    </div>
    ${actives.length===0?'<p class="t-sub">Aucune intervention planifiée.</p>':actives.map(i=>{
      const retard = dateKey(i.date)!==null && dateKey(i.date)<TODAY_KEY;
      const auj = dateKey(i.date)===TODAY_KEY;
      const jourP = JOURS.find(j=>j.date===i.date);
      return `
      <div class="rg-item" style="${retard?"border-color:#fecaca;background:var(--red-soft)":auj?"border-color:#fde68a;background:var(--amber-soft)":""}">
        <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap">
          <b>${i.machineId}</b><span style="font-size:13px;color:var(--ink-2)">${esc(i.type)}</span>
          <span class="t-sub">${retard?"⚠ prévue le":"le"} ${i.date} · ${i.duree} h · ${esc(i.resp)}</span>
          <span style="margin-left:auto;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
            <select onchange="setEtatIntervention('${i.id}',this.value)" style="padding:5px 8px;border:1px solid var(--border);border-radius:8px;background:#fff;font-size:12px">
              ${INTERVENTION_ETATS.map(e=>`<option ${i.etat===e?"selected":""}>${e}</option>`).join("")}
            </select>
            ${jourP?`<button class="btn btn-ghost" style="padding:5px 10px" title="Poser un bloc maintenance dans le planning production" onclick="poserInterventionPlanning('${i.id}')">📅 → Planning</button>`:""}
            <button class="btn btn-ghost" style="padding:5px 10px;color:var(--red)" onclick="supprimerIntervention('${i.id}')">🗑</button>
          </span>
        </div>
        ${i.commentaire?`<div class="t-sub" style="margin-top:4px">${esc(i.commentaire)}</div>`:""}
      </div>`;}).join("")}
  </div>
  <div class="card card-pad">
    <h3 style="margin-bottom:10px">Historique des interventions (${histo.length})</h3>
    ${histo.length===0?'<p class="t-sub">Aucune intervention terminée.</p>':`
    <div style="overflow-x:auto"><table>
      <thead><tr><th style="padding-left:0">Date</th><th>Machine</th><th>Type</th><th>Responsable</th><th>Durée</th><th>Commentaire</th></tr></thead>
      <tbody>${histo.map(i=>`<tr>
        <td style="padding-left:0;color:var(--ink-2)">${i.date}</td><td><b>${i.machineId}</b></td>
        <td>${esc(i.type)}</td><td style="color:var(--ink-2)">${esc(i.resp)}</td>
        <td style="color:var(--ink-2)">${i.duree} h</td><td class="t-sub">${esc(i.commentaire||"")}</td>
      </tr>`).join("")}</tbody>
    </table></div>`}
  </div>`;
}
function ouvrirIntervention(machineId){
  const machines = getMachines();
  $("modalRoot").innerHTML = `
  <div class="overlay" onclick="if(event.target===this)fermerModal()">
    <div class="modal" style="max-width:560px">
      <div class="modal-head"><b>🔧 Nouvelle intervention</b>
        <button class="icon-btn" style="margin-left:auto" onclick="fermerModal()">✕</button></div>
      <div class="modal-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label class="t-sub">Machine</label>
            <select id="itMachine" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
              ${machines.map(m=>`<option value="${m.id}" ${machineId===m.id?"selected":""}>${m.id} — ${esc(m.nom)}</option>`).join("")}
            </select></div>
          <div><label class="t-sub">Type</label>
            <select id="itType" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
              ${INTERVENTION_TYPES.map(t=>`<option>${t}</option>`).join("")}
            </select></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:9px">
          <div><label class="t-sub">Date prévue</label>
            <input id="itDate" value="14/07" placeholder="jj/mm" style="width:100%"></div>
          <div><label class="t-sub">Durée (h)</label>
            <input id="itDuree" type="number" value="2" min="0.5" step="0.5" style="width:100%"></div>
          <div><label class="t-sub">État</label>
            <select id="itEtat" style="width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;margin-top:4px;background:#fff">
              ${INTERVENTION_ETATS.filter(e=>e!=="Terminée").map(e=>`<option>${e}</option>`).join("")}
            </select></div>
        </div>
        <label class="t-sub" style="margin-top:9px;display:block">Responsable</label>
        <input id="itResp" list="listePersonnes3" value="K. Moreau" style="width:100%">
        <datalist id="listePersonnes3">${personnesSuggerees().map(p=>`<option value="${esc(p)}">`).join("")}</datalist>
        <label class="t-sub" style="margin-top:9px;display:block">Commentaire</label>
        <textarea id="itComment" placeholder="Nature de l'intervention, pièces nécessaires…"></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" onclick="fermerModal()">Annuler</button>
        <button class="btn btn-blue" style="margin-left:auto" onclick="creerIntervention()">✓ Enregistrer</button>
      </div>
    </div>
  </div>`;
}
function creerIntervention(){
  const s = ensureParcStore();
  s.interventions.unshift({ id:"INT-"+String(Date.now()).slice(-6), machineId:$("itMachine").value,
    type:$("itType").value, date:$("itDate").value.trim()||"—", duree:Number($("itDuree").value)||1,
    resp:$("itResp").value.trim()||"—", commentaire:$("itComment").value.trim(), etat:$("itEtat").value });
  saveParcStore(s); fermerModal();
  state.page="parc"; if(!state.parcMachine) state.parcTab="maintenance";
  render(); toast("Intervention enregistrée");
}
function setEtatIntervention(id, etat){
  const s = ensureParcStore();
  const i = s.interventions.find(x=>x.id===id); if(!i) return;
  i.etat = etat;
  saveParcStore(s); render();
  toast(etat==="Terminée" ? "Intervention terminée — déplacée dans l'historique" : "Intervention → "+etat);
}
function supprimerIntervention(id){
  const s = ensureParcStore();
  const k = s.interventions.findIndex(x=>x.id===id); if(k<0) return;
  if(!confirm("Supprimer cette intervention ?")) return;
  s.interventions.splice(k,1); saveParcStore(s); render(); toast("Intervention supprimée");
}
function poserInterventionPlanning(id){
  const s = ensureParcStore();
  const i = s.interventions.find(x=>x.id===id); if(!i) return;
  const j = JOURS.find(x=>x.date===i.date); if(!j){ toast("Date hors de la fenêtre du planning (juillet)"); return; }
  PLANNING.push({ machine:i.machineId, jour:j.idx, of:"", label:i.type+" — "+i.id, h:i.duree, statut:"Maintenance", resp:i.resp });
  state.page="planning"; render();
  toast("Bloc maintenance posé sur "+i.machineId+" le "+i.date);
}

/* ---------- 5. Documents ---------- */
function docsDe(id){ return ensureParcStore().docs[id]||[]; }
function importerDocMachine(id, input){
  const files = [...(input.files||[])];
  if(!files.length) return;
  const s = ensureParcStore();
  s.docs[id] = s.docs[id]||[];
  let restants = files.length;
  files.forEach(f=>{
    const meta = { nom:f.name, mime:f.type||"fichier", taille:Math.round(f.size/1024)+" Ko", date:"07/07" };
    if(f.size < 1500000 && (f.type.startsWith("image/")||f.type==="application/pdf")){
      const r = new FileReader();
      r.onload = ()=>{ meta.dataURL = r.result; s.docs[id].push(meta); saveParcStore(s); if(--restants===0){ render(); toast(files.length+" document(s) ajouté(s)"); } };
      r.readAsDataURL(f);
    } else {
      s.docs[id].push(meta); saveParcStore(s);
      if(--restants===0){ render(); toast(files.length+" document(s) ajouté(s) — les fichiers volumineux/vidéos sont référencés sans copie locale"); }
    }
  });
}
function supprimerDoc(id, idx){
  const s = ensureParcStore();
  (s.docs[id]||[]).splice(idx,1); saveParcStore(s); render(); toast("Document supprimé");
}
function ligneDoc(id, d, idx){
  const ico = d.mime.startsWith("image/")?"🖼":d.mime==="application/pdf"?"📄":d.mime.startsWith("video/")?"🎬":"📎";
  return `<div class="doc" style="cursor:default">
    ${ico} <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.nom)}</span>
    <span class="t-sub">${d.taille}</span>
    ${d.dataURL?`<a class="link" href="${d.dataURL}" target="_blank" download="${esc(d.nom)}">Ouvrir</a>`:""}
    <button class="link" style="color:var(--red)" onclick="supprimerDoc('${id}',${idx})">✕</button>
  </div>`;
}
function renderParcDocuments(){
  const s = ensureParcStore();
  return getMachines().map(m=>{
    const docs = s.docs[m.id]||[];
    return `<div class="card card-pad" style="margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <b>${m.id}</b><span class="t-sub">${esc(m.nom)} · ${esc(m.dept)}</span>
        <label class="btn btn-ghost" style="margin-left:auto;cursor:pointer">＋ Importer (PDF, notice, schéma, photo, vidéo…)
          <input type="file" multiple style="display:none" onchange="importerDocMachine('${m.id}',this)"></label>
      </div>
      ${docs.length?`<div style="margin-top:10px">${docs.map((d,i)=>ligneDoc(m.id,d,i)).join("")}</div>`:'<p class="t-sub" style="margin-top:8px">Aucun document.</p>'}
    </div>`;
  }).join("");
}

/* ---------- Fiche machine ---------- */
function togglePanne(id){
  const f = ficheDe(id);
  majFiche(id, "panne", !f.panne);
  render(); toast(!f.panne ? "Machine déclarée EN PANNE" : "Machine remise en service");
}
function ajouterPhotoSupp(id, input){
  const file = input.files && input.files[0]; if(!file) return;
  const r = new FileReader();
  r.onload = ()=>{ const s=ensureParcStore(); s.fiches[id]=s.fiches[id]||{}; s.fiches[id].photos=(s.fiches[id].photos||[]).concat(r.result); saveParcStore(s); render(); toast("Photo ajoutée"); };
  r.readAsDataURL(file);
}
function renderParcFiche(id){
  const m = getMachines().find(x=>x.id===id);
  if(!m){ state.parcMachine=null; return renderParc(); }
  const f = ficheDe(id);
  const s = ensureParcStore();
  const interv = s.interventions.filter(i=>i.machineId===id && i.etat!=="Terminée").sort((x,y)=>(dateKey(x.date)||999)-(dateKey(y.date)||999));
  const histo = s.interventions.filter(i=>i.machineId===id && i.etat==="Terminée");
  const ph = photoDe(id);
  const champ = (label, key, val, ph2) => `
    <div><div class="k" style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--ink-3)">${label}</div>
    <input value="${esc(val||"")}" placeholder="${ph2||"—"}" oninput="majFiche('${id}','${key}',this.value)"
      style="width:100%;margin-top:3px;padding:8px 10px;border:1px solid var(--border);border-radius:9px;font-size:13px"></div>`;
  return `
  <button class="back-link" onclick="state.parcMachine=null;render()">‹ Retour au parc machines</button>
  <div class="card card-pad" style="margin-bottom:14px">
    <div style="display:flex;gap:18px;flex-wrap:wrap">
      <div>
        <div class="parc-photo parc-photo-lg">${ph?`<img src="${ph}" alt="${m.id}">`:`<span>${ICONS.factory}</span>`}</div>
        <label class="btn btn-ghost btn-small" style="margin-top:8px;width:100%;text-align:center;cursor:pointer">Changer la photo
          <input type="file" accept="image/*" style="display:none" onchange="uploadMachinePhoto('${id}',this)"></label>
      </div>
      <div style="flex:1;min-width:260px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <h2 style="font-size:19px">${m.id} — ${esc(m.nom)}</h2>${etatBadge(m)}
          <button class="btn ${f.panne?"btn-green":"btn-ghost"}" style="margin-left:auto${f.panne?"":";color:var(--red);border-color:#fecaca"}" onclick="togglePanne('${id}')">${f.panne?"✓ Remettre en service":"⚠ Déclarer en panne"}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:11px;margin-top:14px">
          ${champ("Département","dept",m.dept)}
          ${champ("Type","typeM",f.typeM||m.type)}
          ${champ("Constructeur","constructeur",f.constructeur,"DMG, Mazak…")}
          ${champ("Modèle","modele",f.modele)}
          ${champ("Année","annee",f.annee)}
          ${champ("N° de série","serie",f.serie)}
          ${champ("Robot associé","robot",f.robot,"aucun")}
        </div>
        <div style="margin-top:11px"><div class="k" style="font-size:10px;text-transform:uppercase;color:var(--ink-3)">Commentaires</div>
        <textarea oninput="majFiche('${id}','commentaires',this.value)" placeholder="Remarques, contacts SAV, consignes…"
          style="width:100%;margin-top:3px;min-height:64px;padding:9px 11px;border:1px solid var(--border);border-radius:10px;font-size:13px;font-family:inherit;resize:vertical">${esc(f.commentaires||"")}</textarea></div>
      </div>
    </div>
  </div>

  <div class="grid g-2">
    <div class="card card-pad">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <h3>Planning maintenance</h3>
        <button class="btn btn-blue" style="margin-left:auto" onclick="ouvrirIntervention('${id}')">＋ Intervention</button>
      </div>
      ${interv.length?interv.map(i=>`
      <div class="rg-item">
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <b>${esc(i.type)}</b><span class="t-sub">le ${i.date} · ${i.duree} h · ${esc(i.resp)}</span>
          <select onchange="setEtatIntervention('${i.id}',this.value)" style="margin-left:auto;padding:4px 7px;border:1px solid var(--border);border-radius:8px;background:#fff;font-size:12px">
            ${INTERVENTION_ETATS.map(e=>`<option ${i.etat===e?"selected":""}>${e}</option>`).join("")}
          </select>
        </div>
        ${i.commentaire?`<div class="t-sub" style="margin-top:3px">${esc(i.commentaire)}</div>`:""}
      </div>`).join(""):'<p class="t-sub">Aucune intervention planifiée.</p>'}
      ${histo.length?`<h3 style="margin:14px 0 8px">Historique (${histo.length})</h3>
        ${histo.map(i=>`<div class="t-sub" style="padding:4px 0;border-bottom:1px solid var(--border-soft)">${i.date} — ${esc(i.type)} · ${i.duree} h · ${esc(i.resp)}${i.commentaire?" · "+esc(i.commentaire):""}</div>`).join("")}`:""}
    </div>
    <div class="card card-pad">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <h3>Documents</h3>
        <label class="btn btn-ghost" style="margin-left:auto;cursor:pointer">＋ Importer
          <input type="file" multiple style="display:none" onchange="importerDocMachine('${id}',this)"></label>
      </div>
      ${docsDe(id).length?docsDe(id).map((d,i)=>ligneDoc(id,d,i)).join(""):'<p class="t-sub">Aucun document (notice, schéma électrique, photos…).</p>'}
      <h3 style="margin:14px 0 8px">Photos supplémentaires</h3>
      <div class="parc-photos-supp">
        ${(f.photos||[]).map(p=>`<img src="${p}">`).join("")}
        <label class="parc-photo-add" title="Ajouter une photo">＋<input type="file" accept="image/*" style="display:none" onchange="ajouterPhotoSupp('${id}',this)"></label>
      </div>
    </div>
  </div>`;
}

/* ================================================================
   MON ESPACE — bureau numérique quotidien (remplace le Dashboard)
   ================================================================ */

/* Types d'étapes disponibles : chaque type sait calculer son résumé */
const ESPACE_TYPES = {
  mails:    { ico:"📥", label:"Mails",              cible:null },
  actions:  { ico:"✅", label:"Actions ouvertes",   cible:"actions" },
  planning: { ico:"📅", label:"Planning",           cible:"planning" },
  qrqc:     { ico:"👥", label:"QRQC",               cible:"meetings" },
  reunion:  { ico:"📊", label:"Réunion Production", cible:"meetings" },
  parc:     { ico:"🏭", label:"Parc Machines",      cible:"parc" },
  demandes: { ico:"📨", label:"Centre de demandes", cible:"demandes" },
  libre:    { ico:"⭐", label:"Étape libre",        cible:null },
};
const MAILS_DEMO = { nouveaux:6, reponses:3, urgents:1 }; /* messagerie : connexion Outlook en phase 2 */

const ROUTINES_DEFAUT = {
  "Responsable Production": ["mails","actions","planning","qrqc","reunion","parc","demandes"],
  "Maintenance":            ["parc","planning","actions"],
  "Direction":              ["reunion","actions","demandes"],
  "Atelier":                ["planning","actions","parc"],
};
function espStepDefaut(type, i){
  const t = ESPACE_TYPES[type]||ESPACE_TYPES.libre;
  return { id:type+"_"+i, type, label:t.label, icon:t.ico, color:"#1d4ed8", size:"n", visible:true, cible:t.cible||"", note:"" };
}
function ensureEspaceCfg(){
  const cfg = getSettings();
  if(!cfg.espace || !cfg.espace.routines || !Object.keys(cfg.espace.routines).length){
    cfg.espace = { routines:{}, activeByRole:{} };
    Object.entries(ROUTINES_DEFAUT).forEach(([nom,types])=>{
      cfg.espace.routines[nom] = { steps: types.map((t,i)=>espStepDefaut(t,i)) };
    });
    saveSettings(cfg);
  }
  return cfg;
}
function routineNoms(){ return Object.keys(ensureEspaceCfg().espace.routines); }
function routineActiveNom(){
  const cfg = ensureEspaceCfg();
  const role = getCurrentRole();
  if(cfg.espace.activeByRole[role] && cfg.espace.routines[cfg.espace.activeByRole[role]]) return cfg.espace.activeByRole[role];
  const auto = routineNoms().find(n=>role.toLowerCase().includes(n.toLowerCase().split(" ")[0]));
  return auto || routineNoms()[0];
}
function setRoutineActive(nom){
  const cfg = ensureEspaceCfg();
  cfg.espace.activeByRole[getCurrentRole()] = nom;
  saveSettings(cfg); render();
  toast("Routine active : "+nom);
}

/* ---------- États des étapes (réinitialisés chaque jour) ---------- */
function espEtatsJour(){
  let s; try{ s = JSON.parse(localStorage.getItem("prodpilot_espace")||"null"); }catch(e){ s=null; }
  if(!s || s.date!=="07/07/2026"){ s = { date:"07/07/2026", etats:{} }; }
  return s;
}
function espEtat(id){ return espEtatsJour().etats[id] || "Non commencé"; }
function cycleEtat(id){
  const s = espEtatsJour();
  const suivant = { "Non commencé":"En cours", "En cours":"Terminé", "Terminé":"Non commencé" };
  s.etats[id] = suivant[espEtat(id)];
  try{ localStorage.setItem("prodpilot_espace", JSON.stringify(s)); }catch(e){}
  render();
}

/* ---------- Statistiques par type d'étape ---------- */
function espStats(step){
  const t = step.type;
  if(t==="mails") return { lignes:[MAILS_DEMO.nouveaux+" nouveaux mails", MAILS_DEMO.reponses+" réponses à préparer", MAILS_DEMO.urgents+" urgent"], compteur:MAILS_DEMO.nouveaux, alerte:MAILS_DEMO.urgents>0 };
  if(t==="actions"){
    const ouv = ACTIONS.filter(a=>a.statut!=="Terminée");
    const retard = ouv.filter(a=>dateKey(a.echeance)!==null && dateKey(a.echeance)<TODAY_KEY);
    const auj = ouv.filter(a=>a.echeance==="07/07"||a.echeance==="Aujourd'hui");
    return { lignes:[ouv.length+" actions ouvertes", retard.length+" en retard", auj.length+" pour aujourd'hui"], compteur:ouv.length, alerte:retard.length>0 };
  }
  if(t==="planning"){
    const dec = regroupements().length;
    const surch = getMachines().filter(m=>chargeMachine(m.id,[0,1,2,3,4]).taux>=95).length;
    const conflits = PLANNING.filter(p=>p.of && maintenanceConflit(p.machine,p.jour)).length;
    const maints = ensureParcStore().interventions.filter(i=>i.etat!=="Terminée" && dateKey(i.date)!==null && dateKey(i.date)<=TODAY_KEY+3).length;
    return { lignes:[dec+" décision(s) à prendre", (conflits||surch)+" OF/machines à arbitrer", maints+" maintenance(s) cette semaine"], compteur:dec+surch+conflits, alerte:surch>0 };
  }
  if(t==="qrqc"){
    const d = getDailyBriefingData();
    return { lignes:["Réunion prête ✓", ACTIONS.filter(a=>a.statut!=="Terminée").length+" actions ouvertes", (d.retard.length+d.bloquees.length)+" OF critiques"], compteur:d.retard.length+d.bloquees.length, alerte:d.bloquees.length>0 };
  }
  if(t==="reunion"){
    const d = getDailyBriefingData();
    return { lignes:[(typeof CRITICAL_PROJECTS!=="undefined"?CRITICAL_PROJECTS.length:0)+" projets à l'ordre du jour", ACTIONS.filter(a=>a.statut!=="Terminée").length+" actions ouvertes", d.urgents.length+" décision(s) à préparer"], compteur:d.urgents.length, alerte:false };
  }
  if(t==="parc"){
    const pannes = getMachines().filter(m=>ficheDe(m.id).panne).length;
    const a = parcAlertes();
    return { lignes:[pannes+" machine(s) arrêtée(s)", a.auj.length+" maintenance(s) aujourd'hui", a.retard.length+" alerte(s) en retard"], compteur:pannes+a.auj.length+a.retard.length, alerte:(pannes+a.retard.length)>0 };
  }
  if(t==="demandes"){
    const att = DEMANDES.filter(d=>d.statut==="En attente");
    const urg = att.filter(d=>d.priorite==="Urgente");
    const nouv = att.filter(d=>d.date==="07/07");
    return { lignes:[nouv.length+" nouvelle(s) demande(s)", att.length+" en attente", urg.length+" urgente(s)"], compteur:att.length, alerte:urg.length>0 };
  }
  return { lignes:[step.note||"Étape personnalisée"], compteur:0, alerte:false };
}
function espOuvrir(step){
  const cible = step.cible || (ESPACE_TYPES[step.type]||{}).cible;
  if(step.type==="mails" && !step.cible){ toast("Messagerie : la connexion Outlook / Exchange arrive en phase 2"); return; }
  if(!cible){ toast("Aucune cible définie pour cette étape (Réglages → Mon espace)"); return; }
  if(step.type==="qrqc"){ go("meetings"); startMeeting("qrqc"); return; }
  if(step.type==="reunion"){ go("meetings"); selectMeeting("production"); return; }
  go(cible);
}

/* ---------- Message IA du jour + notifications ---------- */
function espMessageIA(){
  const d = getDailyBriefingData();
  const prenom = (getSettings().general.userName||"Daniel").split(" ")[0];
  const debut = d.demandes.length>2 ? "les demandes en attente" : "les mails fournisseurs";
  const crit = d.retard.length + d.bloquees.length;
  return `Bonjour ${prenom}. Aujourd'hui je te conseille de commencer par ${debut}, puis le QRQC. `
    + (crit?`${crit} OF ${crit>1?"sont critiques":"est critique"} (${[...d.retard.map(o=>o.num), ...d.bloquees.map(b=>b.of.num)].slice(0,3).join(", ")}).`:"Aucun OF critique ce matin.")
    + (parcAlertes().retard.length?` Une maintenance est en retard sur ${parcAlertes().retard[0].machineId}.`:"");
}
function espNotifications(){
  const items = [];
  const a = parcAlertes();
  DEMANDES.filter(d=>d.statut==="En attente" && d.date==="07/07").slice(0,2).forEach(d=>items.push({ico:"📨", txt:"Nouvelle demande "+d.id+" ("+d.type+")", act:"go('demandes')"}));
  a.retard.forEach(i=>items.push({ico:"🔴", txt:"Maintenance en retard : "+i.machineId+" ("+i.type+", "+i.date+")", act:"state.page='parc';state.parcTab='maintenance';render()"}));
  a.auj.forEach(i=>items.push({ico:"🟠", txt:"Maintenance aujourd'hui : "+i.machineId+" — "+i.type, act:"state.page='parc';state.parcTab='maintenance';render()"}));
  getMachines().filter(m=>ficheDe(m.id).panne).forEach(m=>items.push({ico:"⛔", txt:m.id+" à l'arrêt (panne déclarée)", act:"openParcFiche('"+m.id+"')"}));
  if(MAILS_DEMO.urgents) items.push({ico:"✉️", txt:MAILS_DEMO.urgents+" mail urgent à traiter", act:""});
  items.push({ico:"⏰", txt:"QRQC dans 30 minutes (08h00)", act:"go('meetings')"});
  return items;
}

/* ---------- Page Mon espace ---------- */
function renderEspace(){
  ensureEspaceCfg();
  const nomRoutine = routineActiveNom();
  const steps = ensureEspaceCfg().espace.routines[nomRoutine].steps.filter(s=>s.visible);
  const notifs = espNotifications();
  if(!window.__espClock){ window.__espClock = setInterval(()=>{ const e=$("espHeure"); if(e) e.textContent=new Date().toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"}); },10000); }

  const cartes = steps.map(step=>{
    const st = espStats(step);
    const etat = espEtat(step.id);
    const done = etat==="Terminé";
    return `
    <div class="card esp-card ${done?"done":""} ${step.size==="g"?"esp-large":""}" style="border-left:4px solid ${step.color||"#1d4ed8"}">
      <div class="esp-card-head">
        <span class="esp-ico">${step.icon||"⭐"}</span>
        <b>${esc(step.label)}</b>
        ${st.compteur?`<span class="esp-count ${st.alerte?"hot":""}">${st.compteur}</span>`:""}
      </div>
      <div class="esp-lines">${st.lignes.map(l=>`<div>${esc(l)}</div>`).join("")}</div>
      <div class="esp-card-foot">
        <button class="esp-etat ${done?"ok":etat==="En cours"?"run":""}" onclick="cycleEtat('${step.id}')" title="Cliquer pour changer l'état">
          ${done?"✔ Terminé":etat}
        </button>
        <button class="btn btn-blue" style="margin-left:auto" onclick='espOuvrir(${JSON.stringify(step).replace(/'/g,"&#39;")})'>Ouvrir</button>
      </div>
    </div>`;
  }).join("");

  return `
  <div class="esp-header card">
    <div style="flex:1;min-width:240px">
      <h1>Bonjour ${esc((getSettings().general.userName||"Daniel").split(" ")[0])} 👋</h1>
      <div class="t-sub" style="font-size:13px">${todayLabel()} · <span id="espHeure">${new Date().toLocaleTimeString("fr-BE",{hour:"2-digit",minute:"2-digit"})}</span></div>
      <div class="esp-ia-msg">✨ ${esc(espMessageIA())}</div>
    </div>
    <div class="esp-header-right">
      <select onchange="setRoutineActive(this.value)" title="Routine active">
        ${routineNoms().map(n=>`<option ${n===nomRoutine?"selected":""}>${esc(n)}</option>`).join("")}
      </select>
      <button class="btn btn-ghost btn-small" onclick="setSettingsCategory('espace');go('settings')">⚙ Personnaliser</button>
    </div>
  </div>

  ${notifs.length?`<div class="esp-notifs">${notifs.map(nf=>`<button class="esp-notif" onclick="${nf.act}">${nf.ico} ${esc(nf.txt)}</button>`).join("")}</div>`:""}

  <div class="esp-grid">${cartes}</div>

  <div class="card esp-ia">
    <div class="esp-ia-head">✨ <b>Assistant IA</b><span class="t-sub">— il connaît toute ta journée : OF, planning, demandes, parc machines</span></div>
    <div class="command-msgs" id="commandMsgs" style="max-height:220px;overflow-y:auto">${renderCommandMessages()}</div>
    <div class="esp-ia-chips">
      ${[["Résume ma journée","askCommandAI('Que dois-je faire ce matin ?')"],
         ["Prépare le QRQC","go('meetings');startMeeting('qrqc')"],
         ["Montre mes actions","go('actions')"],
         ["Pourquoi cet OF est en retard ?","askCommandAI('Quels OF sont en retard et pourquoi ?')"],
         ["Machines arrêtées","state.page='parc';state.parcTab='atelier';render()"],
         ["Créer une action","dialogAction({})"],
         ["Créer une réunion","go('meetings')"]]
        .map(([l,act])=>`<button class="chip" onclick="${act}">${l}</button>`).join("")}
    </div>
    <div class="ai-input" style="border:none;padding:10px 0 0">
      <input id="commandInput" placeholder="Écris ce que tu veux faire : « prépare la réunion », « montre les machines arrêtées »…"
        onkeydown="if(event.key==='Enter')askCommandAI()">
      <button onclick="askCommandAI()">➤</button>
    </div>
  </div>`;
}

/* ---------- Réglages → Mon espace : routines personnalisables ---------- */
function espEdition(){ return state.espEdit && ensureEspaceCfg().espace.routines[state.espEdit] ? state.espEdit : routineNoms()[0]; }
function espSaveSteps(nom, steps){ const cfg=ensureEspaceCfg(); cfg.espace.routines[nom].steps=steps; saveSettings(cfg); }
function espUpdateStep(nom,i,champ,val){ const s=ensureEspaceCfg().espace.routines[nom].steps; if(!s[i]) return; s[i][champ]=(champ==="visible")?!!val:val; espSaveSteps(nom,s); if(champ==="visible"||champ==="type") render(); }
function espMoveStep(nom,i,dir){ const s=ensureEspaceCfg().espace.routines[nom].steps; const j=i+dir; if(j<0||j>=s.length) return; [s[i],s[j]]=[s[j],s[i]]; espSaveSteps(nom,s); render(); }
function espDelStep(nom,i){ const s=ensureEspaceCfg().espace.routines[nom].steps; s.splice(i,1); espSaveSteps(nom,s); render(); }
function espAddStep(nom){ const s=ensureEspaceCfg().espace.routines[nom].steps; s.push({...espStepDefaut("libre",Date.now()%10000), label:"Nouvelle étape"}); espSaveSteps(nom,s); render(); }
function espAddRoutine(){ const nom=prompt("Nom de la nouvelle routine :","Ma routine"); if(!nom) return; const cfg=ensureEspaceCfg(); if(cfg.espace.routines[nom]){ toast("Cette routine existe déjà"); return; } cfg.espace.routines[nom]={steps:ROUTINES_DEFAUT["Responsable Production"].map((t,i)=>espStepDefaut(t,i))}; saveSettings(cfg); state.espEdit=nom; render(); toast("Routine « "+nom+" » créée"); }
function espDupRoutine(nom){ const cfg=ensureEspaceCfg(); const nn=nom+" (copie)"; cfg.espace.routines[nn]=JSON.parse(JSON.stringify(cfg.espace.routines[nom])); saveSettings(cfg); state.espEdit=nn; render(); }
function espDelRoutine(nom){ if(routineNoms().length<=1){ toast("Impossible : il faut au moins une routine"); return; } if(!confirm("Supprimer la routine « "+nom+" » ?")) return; const cfg=ensureEspaceCfg(); delete cfg.espace.routines[nom]; Object.keys(cfg.espace.activeByRole).forEach(r=>{ if(cfg.espace.activeByRole[r]===nom) delete cfg.espace.activeByRole[r]; }); saveSettings(cfg); state.espEdit=null; render(); }

function renderEspaceSettings(cfg){
  ensureEspaceCfg();
  const nom = espEdition();
  const steps = ensureEspaceCfg().espace.routines[nom].steps;
  const modules = [["","(aucune)"],["actions","Actions"],["planning","Planning"],["meetings","Réunions"],["parc","Parc machines"],["demandes","Demandes"],["of","OF"],["dataq","Qualité ERP"],["kpi","KPI"],["tournee","Tournée atelier"]];
  return `
  <div class="settings-head"><div><h2>Mon espace — routines</h2><p>Composez les étapes de votre journée. Chaque profil peut avoir sa propre routine.</p></div><span class="settings-save-pill">${routineNoms().length} routine(s)</span></div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:13px">
    ${routineNoms().map(n=>`<button class="chip ${n===nom?"on":""}" onclick="state.espEdit='${esc(n)}';render()">${esc(n)}</button>`).join("")}
    <button class="btn btn-ghost btn-small" onclick="espAddRoutine()">＋ Routine</button>
    <button class="btn btn-ghost btn-small" onclick="espDupRoutine('${esc(nom)}')">⧉ Dupliquer</button>
    <button class="btn btn-ghost btn-small" style="color:var(--red)" onclick="espDelRoutine('${esc(nom)}')">🗑 Supprimer</button>
  </div>
  <div class="settings-machine-table-wrap"><table class="settings-machine-table settings-edit-table">
    <thead><tr><th>Afficher</th><th>Icône</th><th>Nom de l'étape</th><th>Type</th><th>Couleur</th><th>Taille</th><th>Cible</th><th>Ordre</th><th></th></tr></thead>
    <tbody>${steps.map((s,i)=>`<tr>
      <td><label class="settings-check"><input type="checkbox" ${s.visible?"checked":""} onchange="espUpdateStep('${esc(nom)}',${i},'visible',this.checked)"> Visible</label></td>
      <td><input value="${esc(s.icon)}" style="width:52px;text-align:center" oninput="espUpdateStep('${esc(nom)}',${i},'icon',this.value)"></td>
      <td><input value="${esc(s.label)}" oninput="espUpdateStep('${esc(nom)}',${i},'label',this.value)"></td>
      <td><select onchange="espUpdateStep('${esc(nom)}',${i},'type',this.value)">${Object.entries(ESPACE_TYPES).map(([id,t])=>`<option value="${id}" ${s.type===id?"selected":""}>${t.ico} ${t.label}</option>`).join("")}</select></td>
      <td><input type="color" value="${s.color||"#1d4ed8"}" onchange="espUpdateStep('${esc(nom)}',${i},'color',this.value);render()"></td>
      <td><select onchange="espUpdateStep('${esc(nom)}',${i},'size',this.value)"><option value="n" ${s.size!=="g"?"selected":""}>Normale</option><option value="g" ${s.size==="g"?"selected":""}>Grande</option></select></td>
      <td><select onchange="espUpdateStep('${esc(nom)}',${i},'cible',this.value)">${modules.map(([id,l])=>`<option value="${id}" ${s.cible===id?"selected":""}>${l}</option>`).join("")}</select></td>
      <td><button class="btn btn-ghost btn-small" onclick="espMoveStep('${esc(nom)}',${i},-1)">↑</button> <button class="btn btn-ghost btn-small" onclick="espMoveStep('${esc(nom)}',${i},1)">↓</button></td>
      <td><button class="btn btn-red btn-small" onclick="espDelStep('${esc(nom)}',${i})">✕</button></td>
    </tr>`).join("")}</tbody>
  </table></div>
  <div style="margin-top:10px"><button class="btn btn-blue" onclick="espAddStep('${esc(nom)}')">＋ Ajouter une étape</button></div>
  <div class="settings-help"><b>Astuce</b><div>L'ordre se règle avec les flèches ↑↓ (comme le menu). La routine affichée sur « Mon espace » dépend du profil actif (sélecteur en bas de la barre latérale) — chaque profil mémorise son choix.</div></div>`;
}


/* Init icônes + premier rendu — toujours en dernier */
/* Init icônes + premier rendu */
$("logoIcon").innerHTML = ICONS.factory;
$("aiIcon1").innerHTML = ICONS.spark;
$("aiIcon2").innerHTML = ICONS.spark;
$("bellIcon").innerHTML = ICONS.bell;
$("searchIcon").innerHTML = ICONS.search;
render();
