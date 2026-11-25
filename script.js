(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];

  const screens = $$(".screen");
  const music = $("#homeMusic");
  const storyAudio = $("#storyAudio");
  const grinchAudio = $("#grinchAudio");

  let currentMission = 1;
  let pendingUnlock = null;
  let finalPart = 1;
  let musicOn = false;

  const storeKey = "whovilleUnlockedMissions";

  function unlocked() {
    try {
      return new Set(JSON.parse(localStorage.getItem(storeKey) || "[1]"));
    } catch {
      return new Set([1]);
    }
  }

  function saveUnlocked(set) {
    localStorage.setItem(storeKey, JSON.stringify([...set]));
  }

  function nextMissionNumber() {
    const set = unlocked();
    for (let n = 2; n <= 6; n++) {
      if (!set.has(n)) return n;
    }
    return null;
  }

  function stopAudio() {
    if (storyAudio) storyAudio.pause();
    if (grinchAudio) grinchAudio.pause();
  }

  function show(name) {
    screens.forEach(s => s.classList.toggle("active", s.id === `screen-${name}`));
    $("#floatingHome")?.classList.toggle("hidden", name === "home");

    stopAudio();
    if (name === "home") {
      if (musicOn) music.play().catch(() => {});
    } else {
      music.pause();
    }
  }

  function openMission(n) {
    currentMission = n;
    finalPart = 1;
    const m = SITE_DATA.missions[n];
    $("#storyMissionLabel").textContent = `MISSION ${n} · ${m.name.toUpperCase()}`;
    $("#storyImage").src = m.image;
    storyAudio.src = m.audio;
    show("story");
  }

  function askCode(n) {
    pendingUnlock = n;
    $("#codeTitle").textContent = `Unlock Mission ${n}`;
    $("#codeInput").value = "";
    $("#codeError").textContent = "";
    $("#codeModal").classList.remove("hidden");
    setTimeout(() => $("#codeInput").focus(), 50);
  }

  function submitCode() {
    if (!pendingUnlock) return;
    const entered = $("#codeInput").value.replace(/\D/g, "");
    const expected = SITE_DATA.missionCodes[pendingUnlock];

    if (entered === expected) {
      const set = unlocked();
      set.add(pendingUnlock);
      saveUnlocked(set);
      $("#codeModal").classList.add("hidden");
      const n = pendingUnlock;
      pendingUnlock = null;

      // Cliffhanger logic: reveal next mission image, but do NOT autoplay audio.
      openMission(n);
    } else {
      $("#codeError").textContent = "Wrong code. Try again!";
    }
  }

  function renderWords(cat, target) {
    const grid = $(target);
    grid.innerHTML = "";
    (SITE_DATA.vocabulary[cat] || []).forEach(([img, word]) => {
      const b = document.createElement("button");
      b.className = "word-card";
      b.type = "button";
      b.innerHTML = `<img src="${img}" alt="${word}">`;
      grid.appendChild(b);
    });
  }

  function showWordsForMission() {
    const m = SITE_DATA.missions[currentMission];
    $("#missionWordsTitle").textContent = m.name;
    renderWords(m.wordCategory, "#missionWordGrid");
    show("mission-words");
  }

  function showTask() {
    const m = SITE_DATA.missions[currentMission];
    $("#goalText").textContent = m.goal;
    $("#needItems").innerHTML = (m.needs || [])
      .map(([i, t]) => `<div>${i} <b>${t}</b></div>`)
      .join("");
    $("#stepsRow").innerHTML = (m.steps || [])
      .map(([a, t], i) => `<div class="step-card"><b>${i + 1}. ${a}</b><p>${t}</p></div>`)
      .join("");
    show("task");
  }

  // Main nav
  $$("[data-nav]").forEach(b => b.addEventListener("click", () => {
    if (b.dataset.nav === "words") renderWords("decorations", "#wordGrid");
    show(b.dataset.nav);
  }));

  $("#floatingHome")?.addEventListener("click", () => show("home"));

  // Home music
  $("#musicToggle")?.addEventListener("click", () => {
    musicOn = !musicOn;
    $("#musicToggle").textContent = musicOn ? "♫ MUSIC ON" : "♫ MUSIC OFF";
    if (musicOn && $("#screen-home").classList.contains("active")) {
      music.play().catch(() => {});
    } else {
      music.pause();
    }
  });

  // Grinch = special choice: song OR Mission 1
  const grinchChoice = $("#grinchChoice");
  $$(".mission-hotspot").forEach(h => h.addEventListener("click", (e) => {
    const n = Number(h.dataset.mission);
    if (n === 1) {
      e.stopPropagation();
      grinchChoice?.classList.toggle("hidden");
      return;
    }
    if (unlocked().has(n)) {
      openMission(n);
      return;
    }

    const next = nextMissionNumber();
    if (n === next) {
      askCode(n);
      return;
    }

    $("#wrongWord").textContent = "Not this mission yet.";
    $("#wrongToast").classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#wrongToast").classList.add("hidden"), 2200);
  }));

  $("#grinchListen")?.addEventListener("click", () => {
    music.pause();
    storyAudio.pause();
    grinchAudio.currentTime = 0;
    grinchAudio.play().catch(() => {});
  });

  $("#grinchMission")?.addEventListener("click", () => {
    grinchChoice?.classList.add("hidden");
    openMission(1);
  });

  // Wrong Easter egg
  let toastTimer;
  $$(".vocab-hotspot").forEach(h => h.addEventListener("click", () => {
    const w = h.dataset.word;
    $("#wrongWord").textContent = `${w.charAt(0).toUpperCase() + w.slice(1)} — not this one.`;
    $("#wrongToast").classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#wrongToast").classList.add("hidden"), 2200);
  }));

  // Permanent teamwork reference
  $("#teamworkHotspot")?.addEventListener("click", () => show("teamwork"));
  $("#mission1Help")?.addEventListener("click", () => show("teamwork"));

  // Story flow
  $("#playStory")?.addEventListener("click", () => {
    music.pause();
    storyAudio.currentTime = 0;
    storyAudio.play().catch(() => {});
  });

  $("#storyNext")?.addEventListener("click", () => {
    const m = SITE_DATA.missions[currentMission];

    // Mission 1: no vocabulary. Go to Escape Room explanation.
    if (currentMission === 1) {
      show("escape");
      return;
    }

    if (currentMission === 6 && finalPart === 1) {
      finalPart = 2;
      $("#storyMissionLabel").textContent = "MISSION 6 · FINALE · PART 2";
      $("#storyImage").src = m.secondImage;
      storyAudio.src = m.secondAudio;
      return;
    }

    showWordsForMission();
  });

  $("#escapeNext")?.addEventListener("click", () => show("team-intro"));
  $("#startTeamMission")?.addEventListener("click", () => show("mission1"));

  // Mission 1 ends with a search clue. The star itself opens the code input.
  $("#backToWhovilleMission1")?.addEventListener("click", () => show("home"));

  // Other missions
  $("#missionWordsNext")?.addEventListener("click", showTask);
  $("#nextSymbolBtn")?.addEventListener("click", () => show("home"));

  $$(".word-tab").forEach(tab => tab.addEventListener("click", () => {
    $$(".word-tab").forEach(x => x.classList.toggle("active", x === tab));
    renderWords(tab.dataset.cat, "#wordGrid");
  }));

  // Code modal
  $("#submitCode")?.addEventListener("click", submitCode);
  $("#codeInput")?.addEventListener("keydown", e => {
    if (e.key === "Enter") submitCode();
  });

  // Modals / image enlarging
  $$("[data-close]").forEach(b => b.addEventListener("click", () => {
    $("#" + b.dataset.close)?.classList.add("hidden");
  }));

  $$(".zoomable").forEach(b => b.addEventListener("click", () => {
    $("#modalImage").src = b.dataset.image;
    $("#imageModal").classList.remove("hidden");
  }));

  renderWords("decorations", "#wordGrid");
})();