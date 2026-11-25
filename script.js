(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const screens = $$(".screen");
  const music = $("#homeMusic");
  const storyAudio = $("#storyAudio");
  const grinchAudio = $("#grinchAudio");
  let currentMission = 1;
  let finalPart = 1;
  let currentWordCat = "decorations";
  let musicWanted = false;

  function showScreen(name){
    screens.forEach(s => s.classList.toggle("active", s.id === `screen-${name}`));
    if(name === "home"){
      if(musicWanted) music.play().catch(()=>{});
    }else{
      music.pause();
      $("#grinchChoice").classList.add("hidden");
    }
    storyAudio.pause();
    grinchAudio.pause();
  }

  function toggleMusic(){
    musicWanted = !musicWanted;
    if(musicWanted){
      music.play().catch(()=>{});
      $("#musicToggle").textContent = "♫ MUSIC ON";
    }else{
      music.pause();
      $("#musicToggle").textContent = "♫ MUSIC OFF";
    }
  }

  function openMission(n){
    currentMission = n;
    finalPart = 1;
    const m = SITE_DATA.missions[n];
    $("#storyMissionLabel").textContent = `MISSION ${n} · ${m.name.toUpperCase()}`;
    $("#storyImage").src = m.image;
    storyAudio.src = m.audio;
    $("#storyNext").textContent = n===6 ? "NEXT →" : "NEXT →";
    showScreen("story");
  }

  function renderWords(cat, target){
    const grid = $(target);
    grid.innerHTML = "";
    SITE_DATA.vocabulary[cat].forEach(([img,word])=>{
      const el = document.createElement("button");
      el.className = "word-card";
      el.innerHTML = `<img src="${img}" alt="${word}"><span>${word}</span>`;
      el.addEventListener("click",()=>{
        if("speechSynthesis" in window){
          speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(word);
          u.lang = "en-GB";
          speechSynthesis.speak(u);
        }
      });
      grid.appendChild(el);
    });
  }

  function showMissionWords(){
    const m = SITE_DATA.missions[currentMission];
    $("#missionWordsTitle").textContent = m.name;
    renderWords(m.wordCategory, "#missionWordGrid");
    showScreen("mission-words");
  }

  function showTask(){
    const m = SITE_DATA.missions[currentMission];
    $("#goalText").textContent = m.goal;
    const needs = $("#needItems");
    needs.innerHTML = m.needs.map(([icon,text])=>`<div class="need-item"><span class="need-icon">${icon}</span><span>${text}</span></div>`).join("");
    const row = $("#stepsRow");
    row.innerHTML = m.steps.map(([title,text],i)=>`
      <div class="step-card">
        <div class="step-number">${i+1}</div>
        <h3>${title}</h3>
        <p>${text}</p>
      </div>`).join("");
    $("#nextSymbolBtn").textContent = `🔎 ${m.nextLabel.toUpperCase()}`;
    showScreen("task");
  }

  // Navigation
  $$("[data-nav]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const dest = btn.dataset.nav;
      if(dest==="words"){
        currentWordCat="decorations";
        $$(".word-tab").forEach(b=>b.classList.toggle("active",b.dataset.cat==="decorations"));
        renderWords("decorations","#wordGrid");
      }
      showScreen(dest);
    });
  });

  // Mission hotspots
  $$(".mission-hotspot").forEach(h=>{
    h.addEventListener("click",(e)=>{
      e.stopPropagation();
      const n = Number(h.dataset.mission);
      if(n===1){
        $("#grinchChoice").classList.toggle("hidden");
      }else{
        openMission(n);
      }
    });
  });

  $("#grinchListen").addEventListener("click",()=>{
    music.pause();
    grinchAudio.currentTime=0;
    grinchAudio.play().catch(()=>{});
  });
  $("#grinchMission").addEventListener("click",()=>openMission(1));

  $("#musicToggle").addEventListener("click",toggleMusic);

  $("#playStory").addEventListener("click",()=>{
    music.pause();
    storyAudio.currentTime=0;
    storyAudio.play().catch(()=>{});
  });

  $("#storyNext").addEventListener("click",()=>{
    const m = SITE_DATA.missions[currentMission];
    if(currentMission===6 && finalPart===1){
      finalPart=2;
      $("#storyMissionLabel").textContent = "MISSION 6 · FINALE · PART 2";
      $("#storyImage").src = m.secondImage;
      storyAudio.src = m.secondAudio;
      return;
    }
    showMissionWords();
  });

  $("#missionWordsNext").addEventListener("click",showTask);

  $("#nextSymbolBtn").addEventListener("click",()=>showScreen("home"));

  $$(".word-tab").forEach(tab=>{
    tab.addEventListener("click",()=>{
      currentWordCat = tab.dataset.cat;
      $$(".word-tab").forEach(b=>b.classList.toggle("active",b===tab));
      renderWords(currentWordCat,"#wordGrid");
    });
  });

  // Initialize
  renderWords("decorations","#wordGrid");
  $("#musicToggle").textContent = "♫ MUSIC OFF";
})();