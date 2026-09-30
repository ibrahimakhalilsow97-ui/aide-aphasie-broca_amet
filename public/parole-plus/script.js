/* =========================================================
   Parole+ — JavaScript vanilla
   Parcours : Accueil → Échauffement/Reconnaître → Nommer →
   Répéter → Construire → Communication → Résultat
   ========================================================= */

/* ---------- 1. DONNÉES DES EXERCICES ---------- */

// Reconnaissance (5 exercices)
const reconnaissance = [
  { emoji: "🍎", reponse: "Pomme", choix: ["Pomme", "Chaise", "Voiture"] },
  { emoji: "🏠", reponse: "Maison", choix: ["Chien", "Maison", "Pain"] },
  { emoji: "🚗", reponse: "Voiture", choix: ["Voiture", "Lit", "Verre"] },
  { emoji: "🥛", reponse: "Verre", choix: ["Livre", "Porte", "Verre"] },
  { emoji: "📱", reponse: "Téléphone", choix: ["Téléphone", "Table", "Fleur"] },
];

// Nomination (5 mots)
const nomination = [
  { emoji: "🍎", mot: "pomme" },
  { emoji: "🏠", mot: "maison" },
  { emoji: "🚗", mot: "voiture" },
  { emoji: "💧", mot: "eau" },
  { emoji: "📱", mot: "téléphone" },
];

// Répétition (5 phrases, de la plus simple à la plus longue)
const repetition = [
  "Je mange.",
  "Je bois de l'eau.",
  "Je veux du pain.",
  "Je suis fatigué.",
  "Je veux rentrer à la maison.",
];

// Construction (5 phrases avec mots mélangés)
const construction = [
  { mots: ["eau", "veux", "Je", "boire", "de", "l'"], phrase: "Je veux boire de l' eau" },
  { mots: ["pain", "mange", "Je", "du"], phrase: "Je mange du pain" },
  { mots: ["dormir", "Je", "veux"], phrase: "Je veux dormir" },
  { mots: ["maison", "la", "suis", "Je", "à"], phrase: "Je suis à la maison" },
  { mots: ["téléphone", "cherche", "mon", "Je"], phrase: "Je cherche mon téléphone" },
];

// Communication du quotidien (5+ situations)
const communication = [
  { emoji: "💧", label: "Eau", phrase: "Je veux de l'eau." },
  { emoji: "🍞", label: "Pain", phrase: "Je veux du pain." },
  { emoji: "🍚", label: "Riz", phrase: "Je veux du riz." },
  { emoji: "🛏️", label: "Dormir", phrase: "Je veux dormir." },
  { emoji: "🚽", label: "Toilettes", phrase: "Je veux aller aux toilettes." },
  { emoji: "📱", label: "Téléphone", phrase: "Je veux mon téléphone." },
  { emoji: "🆘", label: "Aide", phrase: "J'ai besoin d'aide." },
];

/* ---------- 2. ÉTAT DE LA SÉANCE ---------- */

const ECRANS = ["home", "warmup", "name", "repeat", "build", "talk", "end", "progress"];
const NB_ETAPES = 7; // les écrans du parcours (hors "progression")

let currentStep = 0;        // index de l'écran affiché
let indexWarmup = 0;        // exercice de reconnaissance en cours
let indexName = 0;          // mot à nommer en cours
let indexRepeat = 0;        // phrase à répéter en cours
let indexBuild = 0;         // phrase à construire en cours
let motsChoisis = [];       // mots cliqués dans l'étape construction

let exercicesFaits = 0;
let bonnesReponses = 0;
let phrasesTravaillees = 0;
let debutSeance = null;

/* ---------- 3. OUTILS D'AFFICHAGE ---------- */

function $(id) {
  return document.getElementById(id);
}

// Affiche un écran et met à jour les points de progression
function showScreen(nom) {
  ECRANS.forEach(function (e) {
    $("screen-" + e).classList.remove("active");
  });
  $("screen-" + nom).classList.add("active");
  currentStep = ECRANS.indexOf(nom);
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Dessine les petits points d'étapes en bas de page
function updateProgress() {
  const bar = $("steps-bar");
  bar.innerHTML = "";
  for (let i = 1; i < NB_ETAPES; i++) {
    const d = document.createElement("span");
    d.className = "dot" + (i <= currentStep ? " on" : "");
    bar.appendChild(d);
  }
}

function feedback(el, texte, type) {
  el.textContent = texte;
  el.className = "feedback " + (type || "");
}

/* ---------- 4. VOIX : SYNTHÈSE ET RECONNAISSANCE ---------- */

// Lit un texte à voix haute
function speakText(texte) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const voix = new SpeechSynthesisUtterance(texte);
  voix.lang = "fr-FR";
  voix.rate = 0.85; // un peu lent, plus facile à suivre
  window.speechSynthesis.speak(voix);
}

// Vrai si le navigateur sait écouter le micro
function recognitionDisponible() {
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

// Écoute le micro puis renvoie le texte entendu
function startRecognition(surResultat, surErreur) {
  if (!recognitionDisponible()) {
    if (surErreur) surErreur();
    return;
  }
  const Reco = window.SpeechRecognition || window.webkitSpeechRecognition;
  const reco = new Reco();
  reco.lang = "fr-FR";
  reco.interimResults = false;
  reco.maxAlternatives = 1;
  reco.onresult = function (e) {
    surResultat(e.results[0][0].transcript.trim());
  };
  reco.onerror = function () {
    if (surErreur) surErreur();
  };
  reco.start();
}

// Compare deux textes sans tenir compte des accents ni de la ponctuation
function memeMot(a, b) {
  function nettoie(t) {
    return t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z ]/g, "")
      .trim();
  }
  return nettoie(a) === nettoie(b);
}

/* ---------- 5. ÉTAPE : ÉCHAUFFEMENT / RECONNAÎTRE ---------- */

function showWarmup() {
  const ex = reconnaissance[indexWarmup];
  $("warmup-title").textContent = indexWarmup < 2 ? "🔥 Échauffement" : "🖼️ Je reconnais";
  $("warmup-sub").textContent = indexWarmup < 2 ? "Commençons doucement." : "Très bien, on continue.";
  $("warmup-emoji").textContent = ex.emoji;
  feedback($("warmup-feedback"), "");
  $("warmup-next").classList.add("hidden");

  const zone = $("warmup-choices");
  zone.innerHTML = "";
  ex.choix.forEach(function (choix) {
    const b = document.createElement("button");
    b.className = "btn btn-ghost";
    b.textContent = choix;
    b.onclick = function () {
      checkAnswer(choix, ex.reponse, b);
    };
    zone.appendChild(b);
  });
}

// Vérifie une réponse de reconnaissance
function checkAnswer(choix, bonne, bouton) {
  exercicesFaits++;
  if (memeMot(choix, bonne)) {
    bonnesReponses++;
    bouton.classList.add("correct");
    feedback($("warmup-feedback"), "✅ Bravo !", "ok");
    speakText(bonne);
    $("warmup-next").classList.remove("hidden");
  } else {
    // On n'enlève jamais de point : on encourage simplement à réessayer
    feedback($("warmup-feedback"), "💡 Essaie encore.", "retry");
  }
}

function nextWarmup() {
  indexWarmup++;
  if (indexWarmup < reconnaissance.length) {
    showWarmup();
  } else {
    showName();
    showScreen("name");
  }
}

/* ---------- 6. ÉTAPE : NOMMER L'OBJET ---------- */

function showName() {
  const ex = nomination[indexName];
  $("name-emoji").textContent = ex.emoji;
  feedback($("name-feedback"), "");
  $("name-mic").classList.toggle("hidden", !recognitionDisponible());
}

function ecouterNomination() {
  const ex = nomination[indexName];
  feedback($("name-feedback"), "🎤 J'écoute...", "");
  startRecognition(
    function (texte) {
      exercicesFaits++;
      if (memeMot(texte, ex.mot)) {
        bonnesReponses++;
        feedback($("name-feedback"), "Tu as dit : " + texte + " — ✅ Bravo !", "ok");
      } else {
        feedback($("name-feedback"), "Tu as dit : " + texte + " — 💡 Essaie encore.", "retry");
      }
    },
    function () {
      feedback($("name-feedback"), "Le micro n'est pas disponible. Utilise « Voir la réponse ».", "retry");
    }
  );
}

function revelerNomination() {
  const ex = nomination[indexName];
  exercicesFaits++;
  bonnesReponses++;
  feedback($("name-feedback"), ex.mot.charAt(0).toUpperCase() + ex.mot.slice(1), "ok");
  speakText(ex.mot);
}

function nextName() {
  indexName++;
  if (indexName < nomination.length) {
    showName();
  } else {
    showRepeat();
    showScreen("repeat");
  }
}

/* ---------- 7. ÉTAPE : ÉCOUTER ET RÉPÉTER ---------- */

function showRepeat() {
  $("repeat-sentence").textContent = repetition[indexRepeat];
  feedback($("repeat-feedback"), "");
  $("repeat-mic").classList.toggle("hidden", !recognitionDisponible());
}

function ecouterRepetition() {
  const phrase = repetition[indexRepeat];
  feedback($("repeat-feedback"), "🎤 J'écoute...", "");
  startRecognition(
    function (texte) {
      exercicesFaits++;
      phrasesTravaillees++;
      if (memeMot(texte, phrase)) {
        bonnesReponses++;
        feedback($("repeat-feedback"), "Tu as dit : " + texte + " — ✅ Très bien !", "ok");
      } else {
        feedback($("repeat-feedback"), "Tu as dit : " + texte + " — 💡 Essaie encore.", "retry");
      }
    },
    function () {
      feedback($("repeat-feedback"), "Le micro n'est pas disponible. Répète à voix haute, c'est très bien.", "retry");
    }
  );
}

function nextRepeat() {
  // Même sans micro, la phrase a été travaillée
  exercicesFaits++;
  bonnesReponses++;
  phrasesTravaillees++;
  indexRepeat++;
  if (indexRepeat < repetition.length) {
    showRepeat();
  } else {
    showBuild();
    showScreen("build");
  }
}

/* ---------- 8. ÉTAPE : CONSTRUIRE UNE PHRASE ---------- */

function showBuild() {
  motsChoisis = [];
  const ex = construction[indexBuild];
  feedback($("build-feedback"), "");
  $("build-next").classList.add("hidden");
  $("build-zone").textContent = "";

  const zone = $("build-words");
  zone.innerHTML = "";
  ex.mots.forEach(function (mot, i) {
    const b = document.createElement("button");
    b.className = "word";
    b.textContent = mot;
    b.dataset.index = i;
    b.onclick = function () {
      if (b.classList.contains("used")) return;
      b.classList.add("used");
      motsChoisis.push({ mot: mot, bouton: b });
      afficherConstruction();
    };
    zone.appendChild(b);
  });
}

function afficherConstruction() {
  $("build-zone").textContent = motsChoisis
    .map(function (m) { return m.mot; })
    .join(" ");
}

function effacerConstruction() {
  motsChoisis.forEach(function (m) { m.bouton.classList.remove("used"); });
  motsChoisis = [];
  afficherConstruction();
  feedback($("build-feedback"), "");
}

function verifierConstruction() {
  const ex = construction[indexBuild];
  const propose = motsChoisis.map(function (m) { return m.mot; }).join(" ");
  exercicesFaits++;
  if (memeMot(propose, ex.phrase)) {
    bonnesReponses++;
    phrasesTravaillees++;
    feedback($("build-feedback"), "🎉 Très bien !", "ok");
    speakText(ex.phrase);
    $("build-next").classList.remove("hidden");
  } else {
    feedback($("build-feedback"), "🔄 Essaie encore.", "retry");
  }
}

function nextBuild() {
  indexBuild++;
  if (indexBuild < construction.length) {
    showBuild();
  } else {
    showTalk();
    showScreen("talk");
  }
}

/* ---------- 9. ÉTAPE : COMMUNICATION DU QUOTIDIEN ---------- */

let phraseTalk = "";

function showTalk() {
  const zone = $("talk-choices");
  zone.innerHTML = "";
  communication.forEach(function (item) {
    const b = document.createElement("button");
    b.className = "btn btn-ghost";
    b.textContent = item.emoji + " " + item.label;
    b.onclick = function () {
      phraseTalk = item.phrase;
      $("talk-sentence").textContent = item.phrase;
      $("talk-listen").classList.remove("hidden");
      $("talk-mic").classList.toggle("hidden", !recognitionDisponible());
      feedback($("talk-feedback"), "");
      speakText(item.phrase);
      exercicesFaits++;
      bonnesReponses++;
      phrasesTravaillees++;
    };
    zone.appendChild(b);
  });
  zone.classList.add("grid");
  $("talk-sentence").textContent = "";
}

function ecouterTalk() {
  if (!phraseTalk) return;
  feedback($("talk-feedback"), "🎤 J'écoute...", "");
  startRecognition(
    function (texte) {
      if (memeMot(texte, phraseTalk)) {
        feedback($("talk-feedback"), "Tu as dit : " + texte + " — ✅ Bravo !", "ok");
      } else {
        feedback($("talk-feedback"), "Tu as dit : " + texte + " — 💡 Essaie encore.", "retry");
      }
    },
    function () {
      feedback($("talk-feedback"), "Le micro n'est pas disponible.", "retry");
    }
  );
}

/* ---------- 10. FIN DE SÉANCE ET PROGRESSION ---------- */

function finishSession() {
  const minutes = Math.max(1, Math.round((Date.now() - debutSeance) / 60000));
  const pourcent = exercicesFaits > 0
    ? Math.round((bonnesReponses / exercicesFaits) * 100)
    : 0;

  $("end-stats").innerHTML =
    ligne("Exercices réalisés", exercicesFaits) +
    ligne("Bonnes réponses", bonnesReponses) +
    ligne("Phrases travaillées", phrasesTravaillees) +
    ligne("Temps de séance", minutes + " min");

  $("end-percent").textContent = pourcent + " %";
  setTimeout(function () { $("end-bar").style.width = pourcent + "%"; }, 100);

  saveProgress(pourcent);
  showScreen("end");
}

function ligne(titre, valeur) {
  return "<li><span>" + titre + "</span><b>" + valeur + "</b></li>";
}

// Sauvegarde cumulée dans le navigateur
function saveProgress(pourcent) {
  const d = chargerProgression();
  d.seances += 1;
  d.exercices += exercicesFaits;
  d.bonnes += bonnesReponses;
  d.phrases += phrasesTravaillees;
  d.meilleur = Math.max(d.meilleur, pourcent);
  localStorage.setItem("parolePlus", JSON.stringify(d));
}

function chargerProgression() {
  const base = { seances: 0, exercices: 0, bonnes: 0, phrases: 0, meilleur: 0 };
  try {
    return Object.assign(base, JSON.parse(localStorage.getItem("parolePlus") || "{}"));
  } catch (e) {
    return base;
  }
}

function afficherProgression() {
  const d = chargerProgression();
  $("progress-list").innerHTML =
    ligne("Séances réalisées", d.seances) +
    ligne("Exercices réalisés", d.exercices) +
    ligne("Bonnes réponses", d.bonnes) +
    ligne("Phrases travaillées", d.phrases) +
    ligne("Meilleur score de séance", d.meilleur + " %");
  showScreen("progress");
}

/* ---------- 11. DÉMARRAGE ---------- */

function startSession() {
  indexWarmup = 0;
  indexName = 0;
  indexRepeat = 0;
  indexBuild = 0;
  exercicesFaits = 0;
  bonnesReponses = 0;
  phrasesTravaillees = 0;
  phraseTalk = "";
  debutSeance = Date.now();
  showWarmup();
  showScreen("warmup");
}

// Branchement des boutons
$("btn-start").onclick = startSession;
$("btn-progress").onclick = afficherProgression;
$("btn-progress-back").onclick = function () { showScreen("home"); };

$("warmup-next").onclick = nextWarmup;

$("name-mic").onclick = ecouterNomination;
$("name-reveal").onclick = revelerNomination;
$("name-next").onclick = nextName;

$("repeat-listen").onclick = function () { speakText(repetition[indexRepeat]); };
$("repeat-mic").onclick = ecouterRepetition;
$("repeat-next").onclick = nextRepeat;

$("build-clear").onclick = effacerConstruction;
$("build-check").onclick = verifierConstruction;
$("build-next").onclick = nextBuild;

$("talk-listen").onclick = ecouterTalk;
$("talk-mic").onclick = ecouterTalk;
$("talk-next").onclick = finishSession;

$("end-restart").onclick = startSession;
$("end-home").onclick = function () { showScreen("home"); };

showScreen("home");
