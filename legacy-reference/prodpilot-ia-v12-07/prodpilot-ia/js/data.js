/* ProdPilot IA — Données de démonstration (à remplacer par l'import ERP) */
/* ================================================================
   DONNÉES — Juillet 2026, semaines 28 à 31
   ================================================================ */

const MACHINES = [
  { id:"TOU-01", code:"MAZAK INTEGREX 300", nom:"MAZAK INTEGREX 300", dept:"Tournage", type:"Tournage/Fraisage", capJour:8 },
  { id:"TOU-02", code:"Mazak 200MSY", nom:"MAZAK NEXUS 200MSY", dept:"Tournage", type:"Tournage/Fraisage", capJour:8 },
  { id:"TOU-03", code:"GRAZIANO GT300", nom:"GRAZIANO GT300", dept:"Tournage", type:"Tournage/Fraisage", capJour:8 },
  { id:"TOU-04", code:"MAZAK INTEGREX 150", nom:"MAZAK INTEGREX 150", dept:"Tournage", type:"Tournage/Fraisage", capJour:8 },
  { id:"TOU-05", code:"OKUMA LB15 II-C", nom:"OKUMA LB15 II-C", dept:"Tournage", type:"Tournage", capJour:8 },
  { id:"TOU-06", code:"Tour CNC HYUNDAI-KIA SKT 250", nom:"Tour CNC HYUNDAI-KIA SKT 250", dept:"Tournage", type:"Tournage", capJour:8 },
  { id:"TOU-07", code:"OKUMA LB25 II-C", nom:"OKUMA LB25 II-C", dept:"Tournage", type:"Tournage", capJour:8 },
  { id:"TOU-08", code:"Mazak Quick smart 350", nom:"Mazak Quick Turn Smart 350", dept:"Tournage", type:"Tournage", capJour:8 },
  { id:"TOU-09", code:"TOUR trad. Pinacho", nom:"TOUR trad. Pinacho", dept:"Tournage", type:"Tournage", capJour:8 },
  { id:"FRA-01", code:"MAZAK VTC-200C-II", nom:"MAZAK VTC-200C-II", dept:"Fraisage", type:"Fraisage 3 axes", capJour:8 },
  { id:"FRA-02", code:"MAZAK NEXUS 410 A II", nom:"MAZAK NEXUS 410 A II", dept:"Fraisage", type:"Fraisage 3 axes", capJour:8 },
  { id:"FRA-03", code:"HEDELIUS CB70", nom:"HEDELIUS CB70", dept:"Fraisage", type:"Fraisage 3 axes", capJour:8 },
  { id:"FRA-04", code:"AKIRA SEIKI V4.5", nom:"AKIRA SEIKI V4.5", dept:"Fraisage", type:"Fraisage 3 axes", capJour:8 },
  { id:"FRA-05", code:"Fraiseuse DMC 1035 (B)", nom:"Fraiseuse DMC 1035 (B)", dept:"Fraisage", type:"Fraisage 3 axes", capJour:8 },
  { id:"FRA-06", code:"Mikron VCE 800 PRO", nom:"Mikron VCE 800 PRO", dept:"Fraisage", type:"Fraisage 3 axes", capJour:8 },
  { id:"FRA-07", code:"DMG DMC 635", nom:"DMG DMC 635", dept:"Fraisage", type:"Fraisage 3 axes", capJour:8 },
  { id:"FRA-08", code:"DECKEL MAHO DMC 1035V", nom:"DECKEL MAHO DMC 1035V", dept:"Fraisage", type:"Fraisage 3 axes", capJour:8 },
  { id:"FRA-09", code:"DECKEL MAHO DMC 64V linear", nom:"DECKEL MAHO DMC 64V linear", dept:"Fraisage", type:"Fraisage 3 axes", capJour:8 },
  { id:"FRA-10", code:"HEDELIUS ACURA 65 EL", nom:"HEDELIUS ACURA 65 EL", dept:"Fraisage", type:"Fraisage 5 axes", capJour:8 },
  { id:"FRA-11", code:"MAZAK CV5-500 + robot", nom:"MAZAK CV5-500 + robot", dept:"Fraisage", type:"Fraisage 5 axes", capJour:8 },
  { id:"FRA-12", code:"DMG MORI CMX50 U + PH150", nom:"DMG MORI CMX50 U + PH150", dept:"Fraisage", type:"Fraisage 5 axes", capJour:8 },
  { id:"FRA-13", code:"DMG MORI DMU50 + Robot", nom:"DMG MORI DMU50 + Robot", dept:"Fraisage", type:"Fraisage 5 axes", capJour:8 },
  { id:"FRA-14", code:"DECKEL MAHO DMU 60 (1)", nom:"DECKEL MAHO DMU 60 (1)", dept:"Fraisage", type:"Fraisage 5 axes", capJour:8 },
  { id:"FRA-15", code:"DECKEL MAHO DMU 60 (2)", nom:"DECKEL MAHO DMU 60 (2)", dept:"Fraisage", type:"Fraisage 5 axes", capJour:8 },
  { id:"FRA-16", code:"DMG MORI SEIKI DMU50 (Ecoline)", nom:"DMG MORI SEIKI DMU50 (Ecoline)", dept:"Fraisage", type:"Fraisage 5 axes", capJour:8 },
  { id:"FRA-17", code:"MAZAK VTC 800", nom:"MAZAK VTC 800", dept:"Fraisage", type:"Fraisage 5 axes", capJour:8 },
  { id:"FIL-01", code:"MITSHUBISHI FA30S", nom:"MITSHUBISHI FA30S", dept:"Découpe fil", type:"Découpe fil", capJour:16 },
  { id:"FIL-02", code:"MV 2400R connect", nom:"MV 2400R connect", dept:"Découpe fil", type:"Découpe fil", capJour:16 },
];

/* 20 jours ouvrés : S28 (06–10/07) → S31 (27–31/07) */
const JOURS = (() => {
  const noms = ["Lun","Mar","Mer","Jeu","Ven"];
  const dates = [6,7,8,9,10, 13,14,15,16,17, 20,21,22,23,24, 27,28,29,30,31];
  return dates.map((d,i) => ({
    label: noms[i%5] + " " + String(d).padStart(2,"0"),
    date: String(d).padStart(2,"0") + "/07",
    semaine: 28 + Math.floor(i/5),
    idx: i,
  }));
})();
const SEMAINES = [28,29,30,31];

const OFS = [
  { num:"OF-26-0512", client:"Altair Aero", cmd:"CMD-8841", article:"745-2201",
    designation:"Bride de fixation turbine", qte:24, priorite:"Urgente",
    echeance:"10/07/2026", finEstimee:"13/07/2026", statut:"En retard", avancement:62,
    notes:"Client relance quotidienne — livraison partielle possible (12 pcs).",
    operations:[
      { num:10, desc:"Débit matière", machine:"—", dept:"Logistique", tpsEstime:1, tpsReglage:0, operateur:"S. Denis", statut:"Terminée", datePrev:"01/07", debutReel:"01/07", finReel:"01/07", avancement:100 },
      { num:20, desc:"Tournage ébauche + finition", machine:"TOU-02", dept:"Tournage", tpsEstime:9, tpsReglage:1.5, operateur:"M. Lambert", statut:"Terminée", datePrev:"02/07", debutReel:"02/07", finReel:"03/07", avancement:100 },
      { num:30, desc:"Fraisage 5 axes — lamages + perçages", machine:"FRA-01", dept:"Fraisage", tpsEstime:12, tpsReglage:2, operateur:"K. Moreau", statut:"En cours", datePrev:"06/07", debutReel:"06/07", finReel:null, avancement:55, commentaire:"Reprise après casse d'outil lundi matin." },
      { num:40, desc:"Découpe fil — rainure de clavette", machine:"FIL-02", dept:"Découpe fil", tpsEstime:6, tpsReglage:0.5, operateur:null, statut:"Planifiée", datePrev:"09/07", debutReel:null, finReel:null, avancement:0 },
      { num:50, desc:"Contrôle final + rapport dimensionnel", machine:"—", dept:"Qualité", tpsEstime:2, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"10/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 745-2201 ind. C.pdf","Gamme de contrôle.pdf","Certificat matière 42CrMo4.pdf"] },

  { num:"OF-26-0498", client:"CryoTech", cmd:"CMD-8790", article:"512-0087",
    designation:"Corps de vanne cryogénique", qte:8, priorite:"Haute",
    echeance:"17/07/2026", finEstimee:"16/07/2026", statut:"Bloqué", avancement:40,
    notes:"Attente dérogation qualité sur brut de fonderie.",
    operations:[
      { num:10, desc:"Contrôle réception bruts", machine:"—", dept:"Qualité", tpsEstime:1.5, tpsReglage:0, operateur:"A. Peters", statut:"Terminée", datePrev:"29/06", debutReel:"29/06", finReel:"30/06", avancement:100 },
      { num:20, desc:"Fraisage — plan de joint", machine:"FRA-04", dept:"Fraisage", tpsEstime:10, tpsReglage:2.5, operateur:"J. Simon", statut:"Bloquée", datePrev:"03/07", debutReel:"03/07", finReel:null, avancement:35, blocage:"Porosité détectée sur 2 bruts — dérogation en attente", commentaire:"Machine libérée pour OF-26-0530 en attendant." },
      { num:30, desc:"Tournage — alésage Ø62 H7", machine:"TOU-01", dept:"Tournage", tpsEstime:7, tpsReglage:1, operateur:null, statut:"Planifiée", datePrev:"10/07", debutReel:null, finReel:null, avancement:0 },
      { num:40, desc:"Contrôle tridimensionnel", machine:"—", dept:"Qualité", tpsEstime:3, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"15/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 512-0087 ind. B.pdf","Demande de dérogation DER-118.pdf"] },

  { num:"OF-26-0530", client:"Nivelair", cmd:"CMD-8902", article:"330-1145",
    designation:"Axe de commande — lot série", qte:120, priorite:"Normale",
    echeance:"24/07/2026", finEstimee:"22/07/2026", statut:"En cours", avancement:45,
    notes:"",
    operations:[
      { num:10, desc:"Tournage complet bi-broche", machine:"TOU-01", dept:"Tournage", tpsEstime:18, tpsReglage:2, operateur:"M. Lambert", statut:"En cours", datePrev:"04/07", debutReel:"04/07", finReel:null, avancement:70 },
      { num:20, desc:"Fraisage — méplats", machine:"FRA-03", dept:"Fraisage", tpsEstime:8, tpsReglage:1, operateur:null, statut:"Planifiée", datePrev:"09/07", debutReel:null, finReel:null, avancement:0 },
      { num:30, desc:"Contrôle par échantillonnage", machine:"—", dept:"Qualité", tpsEstime:1.5, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"13/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 330-1145 ind. A.pdf"] },

  { num:"OF-26-0535", client:"MecaJet", cmd:"CMD-8917", article:"601-3320",
    designation:"Flasque palier", qte:16, priorite:"Haute",
    echeance:"15/07/2026", finEstimee:"15/07/2026", statut:"En cours", avancement:30,
    notes:"Réglage long prévu sur FRA-01 (posage spécifique).",
    operations:[
      { num:10, desc:"Tournage ébauche", machine:"TOU-03", dept:"Tournage", tpsEstime:6, tpsReglage:1, operateur:"R. Dubois", statut:"Terminée", datePrev:"03/07", debutReel:"03/07", finReel:"04/07", avancement:100 },
      { num:20, desc:"Fraisage 5 axes — profil", machine:"FRA-01", dept:"Fraisage", tpsEstime:11, tpsReglage:3, operateur:"K. Moreau", statut:"En réglage", datePrev:"07/07", debutReel:"07/07", finReel:null, avancement:10, commentaire:"Posage spécifique — réglage estimé à 3 h." },
      { num:30, desc:"Tournage finition", machine:"TOU-03", dept:"Tournage", tpsEstime:5, tpsReglage:0.5, operateur:null, statut:"Planifiée", datePrev:"10/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 601-3320 ind. D.pdf","Instruction de montage posage P-77.pdf"] },

  { num:"OF-26-0541", client:"Altair Aero", cmd:"CMD-8933", article:"745-2318",
    designation:"Entretoise de carter", qte:40, priorite:"Normale",
    echeance:"31/07/2026", finEstimee:"28/07/2026", statut:"Planifié", avancement:0,
    notes:"",
    operations:[
      { num:10, desc:"Débit matière", machine:"—", dept:"Logistique", tpsEstime:1, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"13/07", debutReel:null, finReel:null, avancement:0 },
      { num:20, desc:"Tournage complet", machine:"TOU-02", dept:"Tournage", tpsEstime:10, tpsReglage:1.5, operateur:null, statut:"Planifiée", datePrev:"15/07", debutReel:null, finReel:null, avancement:0 },
      { num:30, desc:"Découpe fil — encoches", machine:"FIL-01", dept:"Découpe fil", tpsEstime:9, tpsReglage:1, operateur:null, statut:"Planifiée", datePrev:"20/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 745-2318 ind. A.pdf"] },

  { num:"OF-26-0522", client:"Nivelair", cmd:"CMD-8875", article:"330-0990",
    designation:"Boîtier capteur", qte:60, priorite:"Urgente",
    echeance:"09/07/2026", finEstimee:"09/07/2026", statut:"En cours", avancement:85,
    notes:"Passage en priorité 1 suite demande DEM-041 approuvée.",
    operations:[
      { num:10, desc:"Fraisage 3 axes — usinage complet", machine:"FRA-04", dept:"Fraisage", tpsEstime:14, tpsReglage:1.5, operateur:"J. Simon", statut:"Terminée", datePrev:"01/07", debutReel:"01/07", finReel:"05/07", avancement:100 },
      { num:20, desc:"Découpe fil — fentes 0,3 mm", machine:"FIL-02", dept:"Découpe fil", tpsEstime:10, tpsReglage:0.5, operateur:"P. Girard", statut:"En cours", datePrev:"06/07", debutReel:"06/07", finReel:null, avancement:60 },
      { num:30, desc:"Contrôle final", machine:"—", dept:"Qualité", tpsEstime:2, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"09/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 330-0990 ind. B.pdf","Rapport de contrôle RC-2210.pdf"] },

  { num:"OF-26-0488", client:"MecaJet", cmd:"CMD-8752", article:"601-2287",
    designation:"Support injecteur", qte:32, priorite:"Normale",
    echeance:"03/07/2026", finEstimee:"08/07/2026", statut:"En retard", avancement:90,
    notes:"Retard hérité de la panne broche FRA-02 (S26).",
    operations:[
      { num:10, desc:"Tournage", machine:"TOU-02", dept:"Tournage", tpsEstime:8, tpsReglage:1, operateur:"M. Lambert", statut:"Terminée", datePrev:"24/06", debutReel:"24/06", finReel:"25/06", avancement:100 },
      { num:20, desc:"Fraisage 5 axes", machine:"FRA-02", dept:"Fraisage", tpsEstime:12, tpsReglage:2, operateur:"K. Moreau", statut:"Terminée", datePrev:"26/06", debutReel:"30/06", finReel:"04/07", avancement:100, commentaire:"Décalé de 3 jours — panne broche." },
      { num:30, desc:"Contrôle final + FAI", machine:"—", dept:"Qualité", tpsEstime:4, tpsReglage:0, operateur:"A. Peters", statut:"En cours", datePrev:"07/07", debutReel:"07/07", finReel:null, avancement:50 },
    ],
    documents:["Plan 601-2287 ind. C.pdf","Dossier FAI.pdf"] },

  { num:"OF-26-0545", client:"CryoTech", cmd:"CMD-8951", article:"512-0210",
    designation:"Piston de servovalve", qte:50, priorite:"Haute",
    echeance:"31/07/2026", finEstimee:"30/07/2026", statut:"Planifié", avancement:0,
    notes:"Matière (Z100CD17) attendue le 15/07.",
    operations:[
      { num:10, desc:"Tournage complet", machine:"TOU-01", dept:"Tournage", tpsEstime:16, tpsReglage:2, operateur:null, statut:"Planifiée", datePrev:"20/07", debutReel:null, finReel:null, avancement:0 },
      { num:20, desc:"Rectification — sous-traitance", machine:"—", dept:"Sous-traitance", tpsEstime:0, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"24/07", debutReel:null, finReel:null, avancement:0 },
      { num:30, desc:"Découpe fil — gorge", machine:"FIL-01", dept:"Découpe fil", tpsEstime:12, tpsReglage:1, operateur:null, statut:"Planifiée", datePrev:"28/07", debutReel:null, finReel:null, avancement:0 },
      { num:40, desc:"Contrôle final", machine:"—", dept:"Qualité", tpsEstime:2, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"30/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 512-0210 ind. A.pdf"] },

  { num:"OF-26-0548", client:"Altair Aero", cmd:"CMD-8960", article:"745-2440",
    designation:"Couvercle de pompe", qte:18, priorite:"Normale",
    echeance:"07/08/2026", finEstimee:"05/08/2026", statut:"Planifié", avancement:0,
    notes:"",
    operations:[
      { num:10, desc:"Fraisage 5 axes — usinage complet", machine:"FRA-02", dept:"Fraisage", tpsEstime:20, tpsReglage:2.5, operateur:null, statut:"Planifiée", datePrev:"22/07", debutReel:null, finReel:null, avancement:0 },
      { num:20, desc:"Tournage reprise", machine:"TOU-03", dept:"Tournage", tpsEstime:6, tpsReglage:1, operateur:null, statut:"Planifiée", datePrev:"29/07", debutReel:null, finReel:null, avancement:0 },
      { num:30, desc:"Contrôle final", machine:"—", dept:"Qualité", tpsEstime:2, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"31/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 745-2440 ind. B.pdf"] },
];

/* Planning mensuel : jour = index 0..19 (S28→S31) */
let PLANNING = [
  { machine:"TOU-01", jour:0,  of:"OF-26-0530", op:"OP10 Tournage bi-broche", h:8,  statut:"En cours" },
  { machine:"TOU-01", jour:1,  of:"OF-26-0530", op:"OP10 Tournage bi-broche", h:8,  statut:"En cours" },
  { machine:"TOU-01", jour:2,  of:"OF-26-0530", op:"OP10 Tournage bi-broche", h:4,  statut:"En cours" },
  { machine:"TOU-01", jour:3,  of:"OF-26-0498", op:"OP30 Alésage Ø62 H7", h:7,  statut:"Planifiée" },
  { machine:"TOU-01", jour:10, of:"OF-26-0545", op:"OP10 Tournage complet", h:8,  statut:"Planifiée" },
  { machine:"TOU-01", jour:11, of:"OF-26-0545", op:"OP10 Tournage complet", h:8,  statut:"Planifiée" },
  { machine:"TOU-01", jour:12, of:"OF-26-0545", op:"OP10 Tournage complet (+ réglage)", h:2,  statut:"Planifiée" },
  { machine:"TOU-02", jour:2,  of:"OF-26-0541", op:"OP20 Tournage complet", h:6,  statut:"Planifiée" },
  { machine:"TOU-02", jour:3,  of:"OF-26-0541", op:"OP20 Tournage complet", h:5.5,statut:"Planifiée" },
  { machine:"TOU-03", jour:3,  of:"OF-26-0535", op:"OP30 Tournage finition", h:5.5,statut:"Planifiée" },
  { machine:"TOU-03", jour:17, of:"OF-26-0548", op:"OP20 Tournage reprise", h:7,  statut:"Planifiée" },
  { machine:"FRA-01", jour:0,  of:"OF-26-0512", op:"OP30 Fraisage 5 axes", h:8,  statut:"En cours" },
  { machine:"FRA-01", jour:1,  of:"OF-26-0535", op:"OP20 Réglage posage P-77", h:3,  statut:"En réglage" },
  { machine:"FRA-01", jour:1,  of:"OF-26-0535", op:"OP20 Fraisage profil", h:5,  statut:"Planifiée" },
  { machine:"FRA-01", jour:2,  of:"OF-26-0535", op:"OP20 Fraisage profil", h:6,  statut:"Planifiée" },
  { machine:"FRA-02", jour:12, of:"OF-26-0548", op:"OP10 Fraisage 5 axes", h:8,  statut:"Planifiée" },
  { machine:"FRA-02", jour:13, of:"OF-26-0548", op:"OP10 Fraisage 5 axes", h:8,  statut:"Planifiée" },
  { machine:"FRA-02", jour:14, of:"OF-26-0548", op:"OP10 Fraisage 5 axes", h:6.5,statut:"Planifiée" },
  { machine:"FRA-03", jour:2,  of:"OF-26-0530", op:"OP20 Méplats", h:8,  statut:"Planifiée" },
  { machine:"FRA-03", jour:3,  of:"OF-26-0530", op:"OP20 Méplats", h:1,  statut:"Planifiée" },
  { machine:"FRA-04", jour:0,  of:"OF-26-0498", op:"OP20 Plan de joint (bloquée)", h:0, statut:"Bloquée" },
  { machine:"FIL-01", jour:9,  of:"OF-26-0541", op:"OP30 Encoches", h:9,  statut:"Planifiée" },
  { machine:"FIL-01", jour:16, of:"OF-26-0545", op:"OP30 Gorge", h:8,  statut:"Planifiée" },
  { machine:"FIL-01", jour:17, of:"OF-26-0545", op:"OP30 Gorge", h:5,  statut:"Planifiée" },
  { machine:"FIL-02", jour:0,  of:"OF-26-0522", op:"OP20 Fentes 0,3 mm", h:14, statut:"En cours" },
  { machine:"FIL-02", jour:1,  of:"OF-26-0522", op:"OP20 Fentes 0,3 mm", h:10, statut:"En cours" },
  { machine:"FIL-02", jour:3,  of:"OF-26-0512", op:"OP40 Rainure de clavette", h:6, statut:"Planifiée" },
];

const KPI_OTD = [{sem:"S22",otd:84},{sem:"S23",otd:81},{sem:"S24",otd:86},{sem:"S25",otd:79},{sem:"S26",otd:83},{sem:"S27",otd:87}];
const KPI_TAUX = [{dept:"Tournage",taux:87,cible:85},{dept:"Fraisage",taux:82,cible:85},{dept:"Découpe fil",taux:91,cible:80}];
const KPI_CAUSES = [{cause:"Réglage",h:14},{cause:"Attente OF",h:9},{cause:"Panne",h:8},{cause:"Attente contrôle",h:6},{cause:"Manque matière",h:4},{cause:"Casse outil",h:3}];

let DEMANDES = [
  { id:"DEM-044", type:"Passage en urgence", demandeur:"V. Colin (ADV)", date:"07/07", of:"OF-26-0512", priorite:"Urgente", statut:"En attente", commentaire:"Client Altair menace de pénalités — demande livraison partielle 12 pcs vendredi." },
  { id:"DEM-043", type:"Planification OF", demandeur:"T. Marchal (Méthodes)", date:"06/07", of:"OF-26-0541", priorite:"Normale", statut:"En attente", commentaire:"Gamme validée, matière disponible S29." },
  { id:"DEM-042", type:"Avance de production", demandeur:"V. Colin (ADV)", date:"05/07", of:"OF-26-0535", priorite:"Haute", statut:"Approuvée", commentaire:"Client MecaJet avance son besoin d'une semaine." },
  { id:"DEM-041", type:"Changement de priorité", demandeur:"Direction", date:"03/07", of:"OF-26-0522", priorite:"Urgente", statut:"Approuvée", commentaire:"Passage en priorité 1 — engagement commercial." },
];

let ACTIONS = [
  { id:"ACT-118", type:"Qualité", titre:"Relancer la dérogation DER-118 auprès du client", resp:"A. Peters", echeance:"08/07", priorite:"Urgente", statut:"En cours", of:"OF-26-0498", client:"CryoTech" },
  { id:"ACT-117", type:"Production", titre:"Préparer livraison partielle 12 pcs (bride turbine)", resp:"S. Denis", echeance:"09/07", priorite:"Urgente", statut:"À faire", of:"OF-26-0512", client:"Altair Aero" },
  { id:"ACT-116", type:"Outillage", titre:"Commander outil de reprise Ø8 (casse FRA-01)", resp:"K. Moreau", echeance:"08/07", priorite:"Haute", statut:"En cours", of:"OF-26-0512", client:"Altair Aero" },
  { id:"ACT-114", type:"Programmation", titre:"Valider le posage P-77 avec les méthodes", resp:"T. Marchal", echeance:"07/07", priorite:"Haute", statut:"À faire", of:"OF-26-0535", client:"MecaJet" },
  { id:"ACT-110", type:"Qualité", titre:"Clôturer le dossier FAI support injecteur", resp:"A. Peters", echeance:"10/07", priorite:"Normale", statut:"À faire", of:"OF-26-0488", client:"MecaJet" },
];

const NOTIFICATIONS = [
  { texte:"OF-26-0498 : opération 20 bloquée — dérogation en attente", type:"alerte", quand:"il y a 25 min" },
  { texte:"DEM-044 : nouvelle demande urgente de l'ADV", type:"demande", quand:"il y a 1 h" },
  { texte:"FIL-02 chargée à 94 % en S28", type:"charge", quand:"il y a 2 h" },
  { texte:"OF-26-0522 : OP10 terminée sur FRA-04", type:"ok", quand:"hier, 17:42" },
];

/* ================================================================
   MODULE QUALITÉ DES DONNÉES ERP — configuration & données
   ================================================================ */

/* Responsables configurables : modifier ici les noms / e-mails */
const RESPONSABLES = {
  "Méthodes":       { nom: "T. Marchal", email: "t.marchal@entreprise.fr" },
  "Planification":  { nom: "Daniel",     email: "planning@entreprise.fr" },
  "ADV":            { nom: "V. Colin",   email: "v.colin@entreprise.fr" },
  "Atelier":        { nom: "K. Moreau",  email: "atelier@entreprise.fr" },
  "Qualité":        { nom: "A. Peters",  email: "qualite@entreprise.fr" },
};

/* Affectation type de problème → service responsable (configurable) */
const PROBLEME_RESPONSABLE = {
  machine_manquante:    "Méthodes",
  machine_inconnue:     "Méthodes",
  temps_manquant:       "Méthodes",
  gamme_incomplete:     "Méthodes",
  desc_manquante:       "Méthodes",
  date_planifiee:       "Planification",
  priorite_manquante:   "Planification",
  op_apres_echeance:    "Planification",
  client_manquant:      "ADV",
  article_manquant:     "ADV",
  qte_invalide:         "ADV",
  echeance_depassee:    "ADV",
  doublon:              "ADV",
  statut_incoherent:    "Atelier",
  responsable_manquant: "Atelier",
};

/* Historique des alertes qualité données */
let ALERTES = [
  { date:"04/07 09:12", of:"OF-26-0488", probleme:"Échéance client dépassée", responsable:"ADV (V. Colin)", envoye:true, resolu:false, commentaire:"Relance client faite — nouvelle date en attente." },
];

/* OF de démonstration avec problèmes de données ERP */
OFS.push(
  { num:"OF-26-0550", client:"MecaJet", cmd:"CMD-8971", article:"601-3401",
    designation:"Chape de vérin", qte:25, priorite:"",
    echeance:"24/07/2026", finEstimee:"23/07/2026", statut:"Planifié", avancement:0,
    notes:"", importe:"07/07 06:00",
    operations:[
      { num:10, desc:"Tournage ébauche", machine:"TOU-02", dept:"Tournage", tpsEstime:6, tpsReglage:1, operateur:null, statut:"Planifiée", datePrev:"13/07", debutReel:null, finReel:null, avancement:0 },
      { num:20, desc:"Fraisage perçages", machine:"", dept:"Fraisage", tpsEstime:8, tpsReglage:1, operateur:null, statut:"Planifiée", datePrev:"", debutReel:null, finReel:null, avancement:0 },
      { num:30, desc:"Découpe fil — encoche", machine:"FIL-01", dept:"Découpe fil", tpsEstime:null, tpsReglage:0.5, operateur:null, statut:"Planifiée", datePrev:"27/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 601-3401 ind. A.pdf"] },

  { num:"OF-26-0551", client:"", cmd:"", article:"",
    designation:"Pièce non référencée", qte:0, priorite:"Normale",
    echeance:"20/07/2026", finEstimee:"18/07/2026", statut:"Planifié", avancement:0,
    notes:"", importe:"07/07 06:00",
    operations:[
      { num:10, desc:"Usinage", machine:"FRA-09", dept:"Fraisage", tpsEstime:5, tpsReglage:1, operateur:null, statut:"Planifiée", datePrev:"16/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:[] },

  { num:"OF-26-0552", client:"Nivelair", cmd:"CMD-8902", article:"330-1145",
    designation:"Axe de commande — lot série", qte:120, priorite:"Normale",
    echeance:"24/07/2026", finEstimee:"22/07/2026", statut:"Planifié", avancement:0,
    notes:"Import ERP du 07/07 — probable doublon de l'OF-26-0530.", importe:"07/07 06:00",
    operations:[
      { num:10, desc:"Tournage complet bi-broche", machine:"TOU-01", dept:"Tournage", tpsEstime:18, tpsReglage:2, operateur:null, statut:"Terminée", datePrev:"04/07", debutReel:"04/07", finReel:null, avancement:100 },
      { num:20, desc:"", machine:"FRA-03", dept:"Fraisage", tpsEstime:8, tpsReglage:1, operateur:null, statut:"Planifiée", datePrev:"09/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:[] }
);

/* ================================================================
   OF "jumeau" de démonstration : même article que OF-26-0512
   (2e lot de brides — illustre le regroupement des mêmes pièces)
   ================================================================ */
OFS.push(
  { num:"OF-26-0555", client:"Altair Aero", cmd:"CMD-9011", article:"745-2201",
    designation:"Bride de fixation turbine", qte:30, priorite:"Normale",
    echeance:"21/08/2026", finEstimee:"14/08/2026", statut:"Planifié", avancement:0,
    notes:"2e lot — même plan que l'OF-26-0512 (lot en cours).", importe:"07/07 06:00",
    operations:[
      { num:10, desc:"Débit matière", machine:"—", dept:"Logistique", tpsEstime:1, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"15/07", debutReel:null, finReel:null, avancement:0 },
      { num:20, desc:"Tournage ébauche + finition", machine:"TOU-02", dept:"Tournage", tpsEstime:11, tpsReglage:1.5, operateur:null, statut:"Planifiée", datePrev:"17/07", debutReel:null, finReel:null, avancement:0 },
      { num:30, desc:"Fraisage 5 axes — lamages + perçages", machine:"FRA-01", dept:"Fraisage", tpsEstime:14, tpsReglage:2, operateur:null, statut:"Planifiée", datePrev:"21/07", debutReel:null, finReel:null, avancement:0 },
      { num:40, desc:"Découpe fil — rainure de clavette", machine:"FIL-02", dept:"Découpe fil", tpsEstime:7, tpsReglage:0.5, operateur:null, statut:"Planifiée", datePrev:"23/07", debutReel:null, finReel:null, avancement:0 },
      { num:50, desc:"Contrôle final + rapport dimensionnel", machine:"—", dept:"Qualité", tpsEstime:2, tpsReglage:0, operateur:null, statut:"Planifiée", datePrev:"27/07", debutReel:null, finReel:null, avancement:0 },
    ],
    documents:["Plan 745-2201 ind. C.pdf"] }
);

PLANNING.push(
  { machine:"TOU-02", jour:9,  of:"OF-26-0555", op:"OP20 Tournage complet", h:8,   statut:"Planifiée" },
  { machine:"TOU-02", jour:10, of:"OF-26-0555", op:"OP20 Tournage complet", h:4.5, statut:"Planifiée" },
  { machine:"FRA-01", jour:11, of:"OF-26-0555", op:"OP30 Fraisage 5 axes", h:8,   statut:"Planifiée" },
  { machine:"FRA-01", jour:12, of:"OF-26-0555", op:"OP30 Fraisage 5 axes", h:8,   statut:"Planifiée" },
  { machine:"FIL-02", jour:13, of:"OF-26-0555", op:"OP40 Rainure de clavette", h:7, statut:"Planifiée" }
);


/* ================================================================
   MAINTENANCE MACHINE — demandes + tâche planifiée de démonstration
   ================================================================ */
DEMANDES.push(
  { id:"MNT-012", categorie:"maintenance", type:"Maintenance préventive", machine:"FRA-02",
    demandeur:"K. Moreau (Atelier)", date:"06/07", priorite:"Haute", statut:"En attente",
    commentaire:"Vibrations broche détectées — révision à planifier avant fin S29." },
  { id:"MNT-011", categorie:"maintenance", type:"Maintenance curative", machine:"TOU-03",
    demandeur:"R. Dubois (Atelier)", date:"03/07", priorite:"Normale", statut:"Approuvée",
    commentaire:"Fuite d'arrosage à reprendre — 2 h estimées." }
);
/* Tâche hors OF déjà planifiée (couleur maintenance dans le planning) */
PLANNING.push(
  { machine:"FRA-03", jour:14, of:"", label:"Maintenance préventive — graissage axes", h:3, statut:"Maintenance", resp:"K. Moreau" }
);
