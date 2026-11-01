(() => {
  const canvas = document.getElementById("game-canvas");
  const context = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const panel = document.getElementById("panel");
  const hud = document.getElementById("hud");
  const scoreElement = document.getElementById("score");
  const modeChip = document.getElementById("mode-chip");
  const controls = document.getElementById("controls");
  const musicTracks = {
    menu: "assets/fonts/Color%20Switch%20Soundtrack%20-%20Main%20Menu.mp3",
    classic: "assets/fonts/Color%20Switch%20Soundtrack%20-%20Main%20Menu.mp3",
    bounce: "assets/fonts/Color%20Switch%20Soundtrack%20-%20Bounce%20_%20Fidget%20Tap.mp3",
    hop: "assets/fonts/Color%20Switch%20Soundtrack%20-%20Hop%20Hop.mp3",
    slime: "assets/fonts/Color%20Switch%20Soundtrack%20-%20Line%20_%20Slime.mp3"
  };
  const backgroundMusic = new Audio();
  backgroundMusic.autoplay = true;
  backgroundMusic.loop = true;
  backgroundMusic.preload = "auto";
  backgroundMusic.volume = 0.3;
  let currentMusicTrack = "";
  const jumpSound = new Audio("assets/fonts/jump.wav");
  jumpSound.preload = "auto";
  jumpSound.volume = 0.24;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const soundContext = AudioContextClass ? new AudioContextClass() : null;
  const soundEffects = {
    star: { path: "assets/fonts/star.wav", volume: 0.3 },
    colorSwitch: { path: "assets/fonts/colorswitch.wav", volume: 0.35 },
    button: { path: "assets/fonts/button.wav", volume: 0.25 }
  };
  const endlessModeEnabled = new Map([["classic", true], ["bounce", true], ["hop", true], ["slime", true]]);
  // Mode-browser catalog: featured first, remaining modes alphabetically.
  const featuredModes = ["classic", "run", "kite", "galaxy", "invader"];
  const modeBannerColors = {
    autumn: "#C66B32",
    avalanche: "#B8E9FA",
    bee: "#FFE80F",
    "black and white": "#E8E8E8",
    bling: "#F5C842",
    block: "#8C12FB",
    bounce: "#32E2F1",
    break: "#F24958",
    brick: "#B84B3C",
    castle: "#5B0878",
    cave: "#566477",
    christmas: "#D83B4F",
    circle: "#FF0080",
    circular: "#25B99A",
    classic: "#010101",
    climb: "#63B95D",
    clock: "#F4A62A",
    "color fly": "#23B9CD",
    "color swap": "#8C12FB",
    compass: "#348CC5",
    control: "#8260C8",
    dodge: "#E75083",
    "fidget spinner": "#35BDD2",
    "fidget tap": "#F5CA45",
    fruit: "#F36D64",
    galaxy: "#17285F",
    gravity: "#5865F2",
    hop: "#FF0080",
    ice: "#AEEBFF",
    invader: "#42103F",
    jump: "#51B76B",
    kite: "#7341A5",
    lava: "#F15B32",
    line: "#E2C94C",
    loop: "#39BFA1",
    magma: "#B73048",
    "mini golf": "#62A957",
    ocean: "#168FC4",
    punch: "#EF635B",
    reverse: "#9A68E8",
    rocket: "#E75D68",
    run: "#B51C38",
    shoot: "#F4C842",
    ski: "#8AD8F5",
    sled: "#DF5365",
    slide: "#48BCE3",
    slime: "#75B943",
    spin: "#BD6AED",
    summer: "#FDBB3F",
    swoop: "#27B9AE",
    target: "#F06565",
    tower: "#9370DB",
    track: "#45A992",
    turn: "#EF8F45",
    "up and down": "#64C8E8",
    volcano: "#EC4D3D",
    warp: "#7A52E8",
    zigzag: "#EAA13C"
  };
  const darkBannerTextModes = new Set([
    "avalanche", "bee", "black and white", "bling", "bounce", "clock", "fidget tap",
    "ice", "line", "shoot", "ski", "summer", "up and down", "zigzag"
  ]);
  const modeLevelCounts = { classic: 122, run: 100, kite: 72, galaxy: 60, invader: 50, zigzag: 44 };
  for (const effect of Object.values(soundEffects)) {
    effect.buffer = soundContext
      ? fetch(effect.path)
        .then((response) => {
          if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
          return response.arrayBuffer();
        })
        .then((data) => soundContext.decodeAudioData(data))
        .catch((error) => {
          console.error(`Could not load ${effect.path}`, error);
          return null;
        })
      : Promise.resolve(null);
  }
  const colors = ["#32E2F1", "#FFE80F", "#8C12FB", "#FF0080"];
  const spinSpeed = 0.65;
  const trailLifetime = 0.32;
  const world = {
    rings: [],
    stars: [],
    pickups: [],
    trail: [],
    spawnPlatform: null,
    finishLine: null,
    levelMode: false,
    castle: { floorIndex: 0, completing: false, flagLowerProgress: 0 },
    bounceFloorY: 0,
    bounceSpikes: [],
    bounceDirection: 1,
    bounceNextHazardY: 0,
    bounceHazardIndex: 0,
    hopGroundY: 0,
    hopObstacles: [],
    hopHoles: [],
    hopSaws: [],
    hopPlatforms: [],
    hopNextObstacleX: 0,
    hopDistance: 0,
    slimeRails: [],
    slimeBlades: [],
    slimeSaws: [],
    slimeNextY: 0,
    slimeAimX: 0,
    slimeAimY: 0,
    slimeShot: null,
    slimeJumpHeight: 0,
    slimeDistance: 0,
    score: 0,
    mode: "classic",
    elapsed: 0,
    running: false,
    lastTime: 0,
    trailClock: 0
  };
  const playableModes = new Set(["classic", "bounce", "hop", "slime", "castle"]);
  const player = {
    x: 0,
    y: 0,
    velocity: 0,
    velocityX: 0,
    color: 0,
    radius: 11,
    grounded: false,
    wallSide: null,
    wallHangRemaining: 0,
    wallSlipSpeed: 0,
    coyoteTime: 0,
    airJumpAvailable: true,
    hopSlammed: false,
    hopPlatform: null,
    rotation: 0
  };
  const baseStarRadius = 18;
  const basePickupRadius = 14;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  const gravity = 1180;
  const jumpVelocity = -420;
  // Bounce mode physics.
  const bounceSpeed = 320;
  const bounceJumpVelocity = -700;
  const bounceGravity = 900;
  const bounceWallHangDuration = 0.75;
  const bounceWallSlipAcceleration = 2.4;
  const bounceWallSlipMaxSpeed = 900;
  const coyoteDuration = 0.13;
  // Castle mode course layout.
  const castleHazardLayouts = [[0.35, 0.67], [0.48], [0.32, 0.67], [0.45, 0.72], []];
  // Hop mode physics.
  const hopSpeed = 185;
  const hopTrailLifetime = 0.42;
  const hopJumpVelocity = -430;
  const hopGravity = 360;
  const hopSlamSpeed = 1050;
  // Slime mode physics.
  const slimeGravity = 820;
  const shapeTypes = ["circle", "triangle", "square", "hexagon"];
  function ringRadius() {
    return Math.min(width * 0.29, 122 * gameScale());
  }

  function gameScale() {
    return Math.min(width / 460, 1);
  }

  function castleLeftWall() {
    return width * 0.18;
  }

  function castleRightWall() {
    return width * 0.82;
  }

  function castleFloorY(floorIndex) {
    return height * (0.82 - floorIndex * 0.135);
  }

  function castleFlagX() {
    return castleLeftWall() + (castleRightWall() - castleLeftWall()) * 0.78;
  }

  function starRadius() {
    return baseStarRadius * gameScale();
  }

  function pickupRadius() {
    return basePickupRadius * gameScale();
  }

  function playSound(sound, name) {
    const playback = sound.cloneNode();
    playback.volume = sound.volume;
    playback.play().catch((error) => console.error(`Could not play ${name}`, error));
  }

  function setBackgroundMusic(track) {
    const source = musicTracks[track];
    if (currentMusicTrack !== track) {
      currentMusicTrack = track;
      backgroundMusic.src = source;
      backgroundMusic.load();
    }
    if (backgroundMusic.paused) {
      backgroundMusic.play().catch((error) => {
        if (currentMusicTrack === track && error.name !== "NotAllowedError") {
          console.error(`Could not play the ${track} soundtrack`, error);
        }
      });
    }
  }

  function setBackgroundMusicForMode(mode) {
    setBackgroundMusic(musicTracks[mode] ? mode : "menu");
  }

  function unlockSoundEffects() {
    if (soundContext?.state === "suspended") {
      soundContext.resume().catch((error) => console.error("Could not start sound effects", error));
    }
  }

  function playSoundEffect(name) {
    const effect = soundEffects[name];
    if (!soundContext) {
      const sound = new Audio(effect.path);
      sound.volume = effect.volume;
      sound.play().catch((error) => console.error(`Could not play ${effect.path}`, error));
      return;
    }
    effect.buffer.then((buffer) => {
      if (!buffer) {
        const sound = new Audio(effect.path);
        sound.volume = effect.volume;
        sound.play().catch((error) => console.error(`Could not play ${effect.path}`, error));
        return;
      }
      const startPlayback = soundContext.state === "running"
        ? Promise.resolve()
        : soundContext.resume();
      startPlayback.then(() => {
        const source = soundContext.createBufferSource();
        const gain = soundContext.createGain();
        source.buffer = buffer;
        gain.gain.value = effect.volume;
        source.connect(gain);
        gain.connect(soundContext.destination);
        source.start();
      }).catch((error) => console.error(`Could not play ${effect.path}`, error));
    });
  }

  function ringSpacing() {
    const difficulty = world.mode === "classic" && !world.levelMode ? Math.min(1, world.elapsed / 90) : 0;
    return Math.min(height * (0.66 - difficulty * 0.04), width * 1.25);
  }

  function hopDifficulty() {
    return world.levelMode ? 0 : Math.min(1, world.hopDistance / Math.max(1, width * 12));
  }

  function setCanvasSize() {
    const bounds = canvas.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = bounds.width;
    height = bounds.height;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    player.radius = 11 * gameScale();
    player.x = world.running && world.mode === "hop"
      ? width * 0.26
      : world.running && world.mode === "castle"
      ? castleLeftWall() + player.radius
      : width / 2;
    if (!world.running) player.y = height * 0.72;
    if (world.running && world.mode === "castle" && player.grounded) {
      player.y = castleFloorY(world.castle.floorIndex) - player.radius;
    }
    world.bounceFloorY = height * 0.78;
    if (world.running && world.mode === "bounce" && player.grounded) player.y = world.bounceFloorY - player.radius;
    for (const ring of world.rings) {
      ring.x = width / 2;
      ring.radius = ringRadius();
    }
    for (const item of [...world.stars, ...world.pickups]) item.x = width / 2;
  }

  // Screen: main menu.
  function showMenu() {
    world.running = false;
    setBackgroundMusic("menu");
    panel.className = "panel main-menu";
    controls.setAttribute("aria-label", "Jump controls");
    controls.classList.remove("castle-controls");
    hud.classList.remove("castle-hud");
    document.getElementById("jump-button").textContent = "TAP TO BOUNCE";
    document.getElementById("jump-button").setAttribute("aria-label", "Jump");
    controls.querySelector(".hint").textContent = "Tap, click, or press SPACE";
    hud.classList.remove("visible");
    controls.classList.remove("visible");
    overlay.classList.remove("hidden");
    panel.innerHTML = `
      <h1 class="home-brand"><span class="home-brand-color">C<span class="home-brand-o clockwise">O</span>L<span class="home-brand-o counterclockwise">O</span>R</span><span class="home-brand-switch">SWITCH</span><small>REVAMPED</small></h1>
      <div class="home-play-stack">
        <span class="home-ring outer" aria-hidden="true"></span>
        <span class="home-ring middle" aria-hidden="true"></span>
        <button class="home-play-button" data-action="start-classic" aria-label="Play Classic">
          <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" transform="translate(-4.75 0)" d="M14 7.5Q14 4 17.2 6L42 22.2Q45 24 42 25.8L17.2 42Q14 44 14 40.5Z"/></svg>
        </button>
      </div>
      <div class="home-menu-actions">
        <div class="home-modes-banner">
          <span class="home-banner-star" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="M 16.12 4.61 Q 18 0 19.88 4.61 L 20.82 6.92 Q 22.7 11.53 27.67 11.89 L 30.15 12.07 Q 35.12 12.44 31.31 15.65 L 29.41 17.26 Q 25.61 20.47 26.8 25.31 L 27.39 27.73 Q 28.58 32.56 24.35 29.94 L 22.23 28.62 Q 18 26 13.77 28.62 L 11.65 29.94 Q 7.42 32.56 8.61 27.73 L 9.2 25.31 Q 10.39 20.47 6.59 17.26 L 4.69 15.65 Q .88 12.44 5.85 12.07 L 8.33 11.89 Q 13.3 11.53 15.18 6.92 Z"/></svg></span>
          <button class="action-button home-modes-button" data-action="modes">GAME MODES</button>
          <span class="home-banner-star" aria-hidden="true"><svg viewBox="0 0 36 36"><path d="M 16.12 4.61 Q 18 0 19.88 4.61 L 20.82 6.92 Q 22.7 11.53 27.67 11.89 L 30.15 12.07 Q 35.12 12.44 31.31 15.65 L 29.41 17.26 Q 25.61 20.47 26.8 25.31 L 27.39 27.73 Q 28.58 32.56 24.35 29.94 L 22.23 28.62 Q 18 26 13.77 28.62 L 11.65 29.94 Q 7.42 32.56 8.61 27.73 L 9.2 25.31 Q 10.39 20.47 6.59 17.26 L 4.69 15.65 Q .88 12.44 5.85 12.07 L 8.33 11.89 Q 13.3 11.53 15.18 6.92 Z"/></svg></span>
        </div>
        <nav class="home-mode-links" aria-label="Quick mode selection">
          <button class="home-mode-button" data-home-mode="classic" aria-label="Classic" title="Classic"><span class="home-mode-icon" style="--mode-color:#35bd52"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 5h14v5a7 7 0 0 1-5.5 6.84V21h4v4H10v-4h4v-4.16A7 7 0 0 1 9 10V5z"/><path d="M9 7H5v3a6 6 0 0 0 5 5.92M23 7h4v3a6 6 0 0 1-5 5.92" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8 27h16v2H8z"/></svg></span></button>
          <button class="home-mode-button" data-home-mode="bounce" aria-label="Bounce" title="Bounce"><span class="home-mode-icon" style="--mode-color:#ed3f5d"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 24h22v3H5zM7 17h5v7H7zM14 11h5v13h-5zM21 5h5v19h-5z"/></svg></span></button>
          <button class="home-mode-button" data-home-mode="hop" aria-label="Hop" title="Hop"><span class="home-mode-icon" style="--mode-color:#f3a13d"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m16 2.5 4.1 8.3 9.2 1.3-6.65 6.48 1.57 9.15L16 23.4l-8.22 4.33 1.57-9.15L2.7 12.1l9.2-1.3L16 2.5z"/></svg></span></button>
          <button class="home-mode-button" data-home-mode="slime" aria-label="Slime" title="Slime"><span class="home-mode-icon" style="--mode-color:#8b31e8"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 7h3l2 14h14l4-10H11l-.5-3H5zm8 16a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm11 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/></svg></span></button>
          <button class="home-mode-button" data-home-action="modes" aria-label="All game modes" title="All game modes"><span class="home-mode-icon" style="--mode-color:#3479e8"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 14 16.8 4.5c.8-1.1 2.5-.6 2.5.8v6.2h5.4c2.4 0 4 2.3 3.2 4.5l-3.3 9.1a3.5 3.5 0 0 1-3.3 2.4H10V14zM4 13h4v16H4z"/></svg></span></button>
        </nav>
      </div>
    `;
    panel.querySelector('[data-action="start-classic"]').addEventListener("click", () => startGame("classic"));
    panel.querySelector('[data-action="modes"]').addEventListener("click", showModes);
    panel.querySelectorAll("[data-home-mode]").forEach((button) => {
      button.addEventListener("click", () => showLevelSelect(button.dataset.homeMode));
    });
    panel.querySelector('[data-home-action="modes"]').addEventListener("click", showModes);
  }

  // Screen: mode browser.
  function showModes() {
    setBackgroundMusic("menu");
    const modeRows = [
      ...featuredModes,
      ...Object.keys(modeBannerColors)
        .filter((name) => !featuredModes.includes(name))
        .sort()
    ].map((name) => ({ name, levels: modeLevelCounts[name] ?? 45 }));
    const totalLevels = modeRows.reduce((total, mode) => total + mode.levels, 0);
    const renderModeEntry = ({ name, levels }, index) => {
      const color = modeBannerColors[name];
      const ink = darkBannerTextModes.has(name) ? "#272727" : "#fff";
      const classicLoop = name === "classic"
        ? '<span class="mode-classic-loop" aria-hidden="true"></span>'
        : "";
      const modeName = name === "castle"
        ? '<span class="castle-mode-title">CA<span class="castle-letter-s">S</span><span class="castle-letter-t">T</span>LE</span>'
        : name;
      const castleBall = name === "castle"
        ? '<span class="castle-mode-ball" aria-hidden="true"></span>'
        : "";
      const nameScale = Math.min(1, 10 / name.length);
      return `
        <div class="mode-entry" style="--entry-order:${index};--banner-color:${color};--banner-ink:${ink};--banner-shadow:${ink === "#272727" ? "none" : "0 1px 2px rgba(0,0,0,.3)"};--mode-name-scale:${nameScale}">
          <button class="mode-banner" data-select-mode="${name}"><span class="mode-name">${modeName}</span>${castleBall}${classicLoop}</button>
          <div class="mode-progress" aria-label="${name}: 0 percent complete, 0 of ${levels} levels completed">
            <strong>0%</strong><span>0 / ${levels}</span>
          </div>
        </div>
      `;
    };
    panel.className = "panel mode-browser";
    panel.innerHTML = `
      <header class="mode-header">
        <button class="mode-home" data-action="home" aria-label="Main menu">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 2 11h2v9h6v-6h4v6h6v-9h2L12 3z"/></svg>
        </button>
        <h1 class="mode-heading">GAME MODES</h1>
      </header>
      <div class="mode-total"><span>TOTAL:</span><strong>0&nbsp; / &nbsp;${totalLevels.toLocaleString("en-US")}</strong></div>
      <div class="mode-list">
        ${modeRows.map(renderModeEntry).join("")}
      </div>
    `;
    panel.querySelectorAll("[data-select-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        const modeName = button.dataset.selectMode;
        if (playableModes.has(modeName)) {
          showLevelSelect(modeName);
          return;
        }
        showWipMode(modeName, endlessModeEnabled.get(modeName) === true);
      });
    });
    panel.querySelector('[data-action="home"]').addEventListener("click", showMenu);
  }

  // Screen: level selection.
  function showLevelSelect(modeName) {
    setBackgroundMusic("menu");
    const modeTitle = modeName[0].toUpperCase() + modeName.slice(1);
    const endlessAvailable = endlessModeEnabled.get(modeName) === true;
    panel.className = "panel";
    panel.innerHTML = `
      <div class="level-select">
        <p class="eyebrow">${modeTitle} MODE</p>
        <h1>CHOOSE<br><span class="title-accent">A RUN</span></h1>
        <p class="subtitle">${modeName === "castle"
          ? "Roll across each floor, leap over spikes, and reach the flag at the top."
          : "Level 1 is a basic, easy course. Reach the finish line to complete it."}</p>
        <button class="action-button level-choice" data-start-level>
          <strong>LEVEL 1</strong><small>BASIC · EASY</small>
        </button>
        ${endlessAvailable ? '<button class="action-button secondary level-choice" data-start-endless>ENDLESS MODE</button>' : ""}
        <button class="mode-back" data-action="back-modes">BACK TO MODES</button>
      </div>
    `;
    panel.querySelector("[data-start-level]").addEventListener("click", () => startGame(modeName, true));
    panel.querySelector("[data-start-endless]")?.addEventListener("click", () => startGame(modeName));
    panel.querySelector('[data-action="back-modes"]').addEventListener("click", showModes);
  }

  // Screen: work-in-progress and result overlays.
  function showWipMode(modeName, endlessEnabled) {
    setBackgroundMusic("menu");
    const modeTitle = modeName === "classic" ? "Classic" : modeName;
    panel.className = "panel";
    panel.innerHTML = `
      <div class="wip-screen">
        <div class="wip-mark" aria-hidden="true">✦</div>
        <p class="eyebrow">More color, coming soon</p>
        <h1>${modeTitle}<br><span class="title-accent">WIP</span></h1>
        <p class="subtitle">${modeName === "classic"
          ? "Classic is currently available only with Endless enabled."
          : `The ${endlessEnabled ? "Endless " : ""}${modeTitle} mode is still being built. Check back soon!`}</p>
        <button class="mode-back" data-action="back-modes">BACK TO MODES</button>
      </div>
    `;
    panel.querySelector('[data-action="back-modes"]').addEventListener("click", showModes);
  }

  function showGameOver() {
    world.running = false;
    setBackgroundMusic("menu");
    panel.className = "panel";
    hud.classList.remove("visible");
    controls.classList.remove("visible");
    overlay.classList.remove("hidden");
    panel.innerHTML = `
      <p class="eyebrow">${world.mode[0].toUpperCase() + world.mode.slice(1)}${world.levelMode ? " · Level 1" : ""}</p>
      <h1>NICE<br>TRY</h1>
      <p class="result-score">Stars collected<br><strong>${world.score}</strong></p>
      <div class="button-stack">
        <button class="action-button" data-action="retry">PLAY AGAIN</button>
        <button class="action-button secondary" data-action="menu">MAIN MENU</button>
      </div>
    `;
    panel.querySelector('[data-action="retry"]').addEventListener("click", () => startGame(world.mode, world.levelMode));
    panel.querySelector('[data-action="menu"]').addEventListener("click", showMenu);
  }

  function showLevelComplete() {
    world.running = false;
    setBackgroundMusic("menu");
    panel.className = "panel";
    hud.classList.remove("visible");
    controls.classList.remove("visible");
    overlay.classList.remove("hidden");
    panel.innerHTML = `
      <p class="eyebrow">${world.mode[0].toUpperCase() + world.mode.slice(1)} · LEVEL 1</p>
      <h1>LEVEL<br><span class="title-accent">COMPLETE</span></h1>
      <p class="result-score">Stars collected<br><strong>${world.score}</strong></p>
      <div class="button-stack">
        <button class="action-button" data-action="retry">PLAY AGAIN</button>
        <button class="action-button secondary" data-action="modes">GAME MODES</button>
        <button class="mode-back" data-action="menu">MAIN MENU</button>
      </div>
    `;
    panel.querySelector('[data-action="retry"]').addEventListener("click", () => startGame(world.mode, true));
    panel.querySelector('[data-action="modes"]').addEventListener("click", showModes);
    panel.querySelector('[data-action="menu"]').addEventListener("click", showMenu);
  }

  // Shared gameplay setup and level initialization.
  function makeRing(y) {
    const shape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const sides = shape === "hexagon" ? 6 : shape === "triangle" ? 3 : 4;
    const sequence = makeColorSequence(sides);
    const angle = Math.random() * Math.PI * 2;
    const ring = {
      x: width / 2,
      y,
      radius: ringRadius(),
      shape,
      sides,
      colors: sequence,
      angle,
      spin: spinSpeed,
      thickness: 18 * gameScale(),
      cornerCut: 0.1
    };
    world.rings.push(ring);
    world.stars.push({ x: ring.x, y, collected: false, rotation: Math.random() * 0.5, pulse: Math.random() * Math.PI * 2 });

    const pickupY = y + ring.radius + 45;
    const pickupColor = ringSurfaceAt(ring, ring.x, ring.y + ring.radius).color;
    world.pickups.push({ x: width / 2, y: pickupY, color: pickupColor, collected: false });
  }

  function makeColorSequence(length) {
    if (length === colors.length) {
      const sequence = colors.map((_, index) => index);
      for (let i = sequence.length - 1; i > 0; i -= 1) {
        const swapIndex = Math.floor(Math.random() * (i + 1));
        [sequence[i], sequence[swapIndex]] = [sequence[swapIndex], sequence[i]];
      }
      return sequence;
    }

    if (length === 3) return [0, 3, 1];

    if (length === 6) {
      const firstColor = Math.floor(Math.random() * colors.length);
      const remainingColors = colors
        .map((_, index) => index)
        .filter((index) => index !== firstColor);
      const secondColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];
      return Array.from({ length }, (_, index) => index % 2 === 0 ? firstColor : secondColor);
    }

    const sequence = [];
    for (let i = 0; i < length; i += 1) {
      const previousColor = sequence[i - 1];
      const firstColor = sequence[0];
      const candidates = colors
        .map((_, index) => index)
        .filter((index) => index !== previousColor && (i !== length - 1 || index !== firstColor));
      sequence.push(candidates[Math.floor(Math.random() * candidates.length)]);
    }
    return sequence;
  }

  function chooseDifferentColor(currentColor) {
    const availableColors = colors
      .map((_, index) => index)
      .filter((index) => index !== currentColor);
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  function startGame(mode, levelMode = false) {
    unlockSoundEffects();
    setBackgroundMusicForMode(mode);
    panel.className = "panel";
    world.mode = mode;
    world.levelMode = levelMode;
    world.finishLine = null;
    world.rings = [];
    world.stars = [];
    world.pickups = [];
    world.trail = [];
    world.trailClock = 0;
    world.spawnPlatform = null;
    world.score = 0;
    world.elapsed = 0;
    world.running = true;
    world.lastTime = performance.now();
    world.castle = { floorIndex: 0, completing: false, flagLowerProgress: 0 };
    player.x = mode === "castle" ? castleLeftWall() + player.radius : width / 2;
    world.bounceFloorY = height * 0.78;
    world.bounceDirection = 1;
    player.y = mode === "castle"
      ? castleFloorY(0) - player.radius
      : mode === "bounce"
      ? world.bounceFloorY - player.radius
      : height * 0.72;
    player.velocity = 0;
    player.velocityX = 0;
    player.grounded = mode === "bounce" || mode === "castle";
    player.wallSide = null;
    player.wallHangRemaining = 0;
    player.wallSlipSpeed = 0;
    player.coyoteTime = 0;
    player.airJumpAvailable = true;
    world.bounceSpikes = [];
    world.bounceHazardIndex = 0;
    world.bounceNextHazardY = mode === "bounce"
      ? world.bounceFloorY - (levelMode ? 680 : 520) * gameScale()
      : 0;
    if (mode === "classic") {
      world.spawnPlatform = {
        x: player.x,
        y: player.y + player.radius,
        width: ringRadius() * 1.1,
        height: 6 * gameScale(),
        active: true
      };
    }
    world.hopGroundY = height * 0.78;
    world.hopObstacles = [];
    world.hopHoles = [];
    world.hopSaws = [];
    world.hopPlatforms = [];
    world.hopNextObstacleX = width + 190 * gameScale();
    world.hopDistance = 0;
    world.slimeRails = [];
    world.slimeBlades = [];
    world.slimeSaws = [];
    world.slimeNextY = height * 0.48;
    world.slimeDistance = 0;
    world.slimeJumpHeight = Math.min(height * 0.3, 285 * gameScale());
    world.slimeShot = null;
    player.hopSlammed = false;
    player.hopPlatform = null;
    player.rotation = 0;
    if (mode === "hop") {
      player.x = width * 0.26;
      player.y = world.hopGroundY - player.radius;
      player.grounded = true;
    }
    if (mode === "slime") {
      world.bounceFloorY = height * 0.82;
      player.x = width / 2;
      player.y = world.bounceFloorY - player.radius;
      player.grounded = true;
      world.slimeAimX = width * 0.82;
      world.slimeAimY = height * 0.53;
      ensureSlimeCourse();
    }
    if (levelMode && mode !== "castle") {
      const verticalDistance = height * (mode === "slime" ? 3.6 : mode === "bounce" ? 3.8 : 4.4);
      world.finishLine = mode === "hop"
        ? { orientation: "vertical", x: player.x + width * 6, y: null, thickness: 28 * gameScale() }
        : { orientation: "horizontal", x: null, y: height * 0.43 - verticalDistance, thickness: 28 * gameScale() };
    }
    player.color = Math.floor(Math.random() * colors.length);
    if (mode === "classic") {
      for (let i = 0; i < 4; i += 1) makeRing(player.y - width * 0.5 - i * ringSpacing());
      const firstRing = world.rings[0];
      firstRing.shape = "circle";
      firstRing.sides = 4;
      firstRing.colors = makeColorSequence(4);
      firstRing.angle = Math.PI / 4;
      player.color = firstRing.colors[0];
      world.pickups[0].collected = true;
    }
    scoreElement.textContent = "0";
    scoreElement.parentElement.querySelector(".score-label").textContent = "Stars collected";
    const modeTitle = mode[0].toUpperCase() + mode.slice(1);
    modeChip.textContent = levelMode ? `${modeTitle} · Level 1` : mode === "classic" ? "Classic ∞" : `${modeTitle} ∞`;
    controls.setAttribute("aria-label", mode === "slime" ? "Slime aiming controls" : mode === "bounce" ? "Bounce controls" : mode === "hop" ? "Hop controls" : mode === "castle" ? "Castle controls" : "Jump controls");
    controls.classList.toggle("castle-controls", mode === "castle");
    hud.classList.toggle("castle-hud", mode === "castle");
    const jumpButton = document.getElementById("jump-button");
    jumpButton.textContent = mode === "slime" ? "AIM & LEAP" : mode === "hop" ? "TAP TO JUMP / SLAM" : mode === "bounce" || mode === "castle" ? "TAP TO JUMP" : "TAP TO BOUNCE";
    jumpButton.setAttribute("aria-label", "Jump");
    controls.querySelector(".hint").textContent = mode === "slime"
      ? "Aim and launch · Space to shoot"
      : mode === "hop"
      ? "Auto-roll · tap to leap, tap again to slam"
      : mode === "bounce"
      ? "Leap wall to wall · hold, then slide · chain jumps"
      : mode === "castle"
      ? "Roll across each floor · tap to leap over spikes"
      : "Tap, click, or press SPACE";
    if (mode === "hop") scoreElement.parentElement.querySelector(".score-label").textContent = "Stars collected";
    if (mode === "hop") {
      world.stars = [];
      ensureHopCourse();
    }
    if (mode === "bounce") {
      world.stars = [];
      ensureBounceCourse();
    }
    if (mode === "castle") {
      const starPositions = [0.52, 0.8, 0.52, 0.2, 0.52];
      world.stars = Array.from({ length: 5 }, (_, floorIndex) => ({
        x: castleLeftWall() + (castleRightWall() - castleLeftWall()) * starPositions[floorIndex],
        y: castleFloorY(floorIndex) - player.radius - 24 * gameScale(),
        collected: false,
        rotation: 0,
        pulse: Math.random() * Math.PI * 2
      }));
    }
    hud.classList.add("visible");
    controls.classList.add("visible");
    overlay.classList.add("hidden");
    draw();
    requestAnimationFrame(gameFrame);
  }

  function jump() {
    if (!world.running) return;
    unlockSoundEffects();
    if (world.mode === "castle") {
      if (world.castle.completing || !player.grounded) return;
      player.velocity = jumpVelocity * gameScale();
      player.grounded = false;
      playSound(jumpSound, "jump.wav");
      return;
    }
    if (world.mode === "slime") {
      if (world.slimeShot || (player.wallSide === null && !player.grounded)) return;
      const plan = getSlimeShotPlan(player.x, player.y);
      world.slimeShot = {
        startX: player.x,
        startY: player.y,
        targetX: plan.target.x,
        targetY: plan.target.y,
        targetSide: plan.target.side,
        velocityX: plan.velocityX,
        velocityY: plan.velocityY,
        gravity: plan.gravity,
        duration: plan.duration,
        elapsed: 0
      };
      player.velocityX = plan.velocityX;
      player.velocity = plan.velocityY;
      player.grounded = false;
      player.wallSide = null;
      playSound(jumpSound, "jump.wav");
      return;
    }
    if (world.mode === "bounce") {
      const jumpedFromWall = player.wallSide !== null;
      const canGroundJump = player.grounded || player.coyoteTime > 0 || jumpedFromWall;
      if (!canGroundJump && !player.airJumpAvailable) return;
      if (!canGroundJump) player.airJumpAvailable = false;
      if (jumpedFromWall) player.airJumpAvailable = true;
      player.wallSide = null;
      player.wallHangRemaining = 0;
      player.wallSlipSpeed = 0;
      player.grounded = false;
      player.coyoteTime = 0;
    }
    if (world.mode === "hop") {
      if (player.grounded) {
        player.velocity = hopJumpVelocity * gameScale();
        player.grounded = false;
        player.hopSlammed = false;
      } else if (!player.hopSlammed) {
        player.velocity = hopSlamSpeed * gameScale();
        player.hopSlammed = true;
      } else {
        return;
      }
      player.hopPlatform = null;
      playSound(jumpSound, "jump.wav");
      return;
    }
    if (world.spawnPlatform) world.spawnPlatform.active = false;
    player.velocity = world.mode === "bounce"
      ? bounceJumpVelocity * gameScale()
      : jumpVelocity * gameScale();
    playSound(jumpSound, "jump.wav");
  }

  // Gameplay input and mode-specific arenas.
  function handleInput(event) {
    if (world.running && world.mode === "slime") {
      if (event.code === "ArrowUp" || event.code === "ArrowDown") {
        event.preventDefault();
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat) jump();
        return;
      }
    }
    if (event.code === "Space" || event.code === "ArrowUp" || event.code === "KeyW") {
      event.preventDefault();
      if (!event.repeat) jump();
    }
  }

  function drawBackground() {
    context.fillStyle = "#272727";
    context.fillRect(0, 0, width, height);
  }

  // Castle mode arena.
  function drawCastleArena() {
    const scale = gameScale();
    const leftWall = castleLeftWall();
    const rightWall = castleRightWall();
    const wallWidth = 5 * scale;
    const floorColors = ["#FFE80F", "#32E2F1", "#8C12FB", "#FF0080", "#8C12FB"];
    const castle = world.castle;

    context.fillStyle = "#29292b";
    context.fillRect(leftWall, 0, rightWall - leftWall, height);

    context.save();
    context.globalAlpha = 0.1;
    context.strokeStyle = "#8b8790";
    context.lineWidth = scale;
    for (let row = 0; row < 12; row += 1) {
      const y = row * 36 * scale;
      const offset = row % 2 ? 18 * scale : 0;
      for (let x = leftWall + offset; x < rightWall; x += 36 * scale) {
        context.strokeRect(x, y, 34 * scale, 16 * scale);
      }
    }
    context.restore();

    context.fillStyle = "#FFFFFF";
    context.fillRect(leftWall - wallWidth / 2, 0, wallWidth, height);
    context.fillRect(rightWall - wallWidth / 2, 0, wallWidth, height);
    for (let y = 4 * scale; y < height; y += 14 * scale) {
      context.beginPath();
      context.arc(rightWall, y, 3 * scale, -Math.PI / 2, Math.PI / 2);
      context.fill();
    }

    for (let floorIndex = 0; floorIndex < 5; floorIndex += 1) {
      const floorY = castleFloorY(floorIndex);
      const tileHeight = 11 * scale;
      const tileWidth = 22 * scale;
      const tileGap = 2 * scale;
      context.fillStyle = "#171719";
      for (let tileX = leftWall; tileX < rightWall; tileX += tileWidth) {
        const currentWidth = Math.min(tileWidth - tileGap, rightWall - tileX);
        context.fillRect(tileX, floorY, currentWidth, tileHeight);
      }
      context.fillStyle = floorColors[floorIndex];
      for (let tileX = leftWall; tileX < rightWall; tileX += tileWidth) {
        const currentWidth = Math.min(tileWidth - tileGap, rightWall - tileX);
        context.beginPath();
        context.roundRect(tileX, floorY, currentWidth, tileHeight, 2 * scale);
        context.fill();
      }
      context.fillStyle = "rgba(255,255,255,.28)";
      context.fillRect(leftWall, floorY, rightWall - leftWall, 1.5 * scale);

      const spikeHeight = 16 * scale;
      const spikeWidth = 8 * scale;
      for (const position of castleHazardLayouts[floorIndex]) {
        const centerX = leftWall + (rightWall - leftWall) * position;
        for (let spike = -1; spike <= 1; spike += 1) {
          const spikeX = centerX + spike * spikeWidth;
          context.fillStyle = spike === 0 ? "#FFE80F" : "#FF0080";
          context.beginPath();
          context.moveTo(spikeX - spikeWidth / 2, floorY);
          context.lineTo(spikeX, floorY - spikeHeight);
          context.lineTo(spikeX + spikeWidth / 2, floorY);
          context.closePath();
          context.fill();
        }
      }

      if (floorIndex < 4) {
        const ledgeY = floorY - 34 * scale;
        const ledgeX = leftWall + (rightWall - leftWall) * (floorIndex % 2 ? 0.2 : 0.58);
        context.fillStyle = floorColors[floorIndex + 1];
        for (let tile = 0; tile < 4; tile += 1) {
          context.beginPath();
          context.roundRect(ledgeX + tile * 18 * scale, ledgeY, 16 * scale, 8 * scale, 2 * scale);
          context.fill();
        }
      }
    }

    const flagX = castleFlagX();
    const topFloorY = castleFloorY(4);
    const flagLowering = castle.flagLowerProgress * 27 * scale;
    const poleTop = topFloorY - 56 * scale + flagLowering;
    context.fillStyle = "#32E2F1";
    context.fillRect(flagX - 2 * scale, poleTop, 4 * scale, topFloorY - poleTop);
    context.beginPath();
    context.arc(flagX, poleTop, 5 * scale, 0, Math.PI * 2);
    context.fill();
    const flagXStart = flagX - 29 * scale;
    const flagY = poleTop + 6 * scale;
    const cell = 6 * scale;
    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        context.fillStyle = (row + column) % 2 ? "#272727" : "#FFFFFF";
        context.fillRect(flagXStart + column * cell, flagY + row * cell, cell, cell);
      }
    }

  }

  // Slime mode arena, hazards, and course generation.
  function drawSlimeArena() {
    const wallWidth = 12 * gameScale();
    context.fillStyle = "#202020";
    context.fillRect(0, 0, wallWidth, height);
    context.fillRect(width - wallWidth, 0, wallWidth, height);
    context.fillStyle = "#168FC4";
    for (const rail of world.slimeRails) {
      const x = rail.side === "left" ? wallWidth : width - wallWidth - rail.width;
      context.fillRect(x, rail.y, rail.width, rail.height);
      context.fillRect(rail.side === "left" ? x + rail.width - 3 * gameScale() : x, rail.y, 3 * gameScale(), rail.height);
    }
    if (world.bounceFloorY <= height) {
      context.fillStyle = "#75B943";
      context.fillRect(wallWidth, world.bounceFloorY, width - wallWidth * 2, 10 * gameScale());
    }
    for (const blade of world.slimeBlades) drawSlimeBlade(blade);
    for (const saw of world.slimeSaws) drawSlimeSaw(saw);
  }

  function drawSlimeBlade(blade) {
    const radius = blade.size * 0.88;
    context.save();
    context.translate(blade.x, blade.y);
    context.rotate(blade.rotation);
    context.fillStyle = "#F24958";
    context.beginPath();
    for (let i = 0; i < 16; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 8;
      const pointRadius = i % 4 === 0 ? radius : i % 4 === 2 ? radius * 0.3 : radius * 0.68;
      const x = Math.cos(angle) * pointRadius;
      const y = Math.sin(angle) * pointRadius;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
    context.fillStyle = "#272727";
    context.beginPath();
    context.arc(0, 0, blade.size * 0.22, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function drawSlimeSaw(saw) {
    context.save();
    context.setLineDash([2 * gameScale(), 6 * gameScale()]);
    context.strokeStyle = "rgba(255,255,255,.5)";
    context.lineWidth = 2 * gameScale();
    context.beginPath();
    context.moveTo(saw.guideStart, saw.y);
    context.lineTo(saw.guideEnd, saw.y);
    context.stroke();
    context.setLineDash([]);
    context.translate(saw.x, saw.y);
    context.rotate(saw.rotation);
    context.fillStyle = colors[saw.color];
    context.beginPath();
    for (let i = 0; i < 32; i += 1) {
      const angle = i * Math.PI / 16;
      const radius = saw.radius * (i % 4 < 2 ? 1 : 0.76);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
    context.fillStyle = "#272727";
    context.beginPath();
    context.arc(0, 0, saw.radius * 0.28, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  function ensureSlimeCourse() {
    const difficulty = world.levelMode ? 0 : Math.min(1, world.slimeDistance / Math.max(1, height * 8));
    while (world.slimeNextY > -height
      && (!world.finishLine || world.slimeNextY > world.finishLine.y + height * 0.35)) {
      const wallWidth = 12 * gameScale();
      const laneLeft = wallWidth + 18 * gameScale();
      const laneRight = width - wallWidth - 18 * gameScale();
      const rowY = world.slimeNextY;
      const gapOffset = (Math.random() - 0.5) * width * 0.12;
      const gapY = rowY + gapOffset;
      const gapHeight = (world.levelMode ? 78 : 62 - difficulty * 8) * gameScale();
      const railWidth = 13 * gameScale();
      for (const side of ["left", "right"]) {
        const x = side === "left" ? wallWidth : width - wallWidth - railWidth;
        const sectionTop = rowY - 122 * gameScale();
        const sectionBottom = rowY + 122 * gameScale();
        world.slimeRails.push(
          { side, y: sectionTop, height: Math.max(0, gapY - gapHeight / 2 - sectionTop), width: railWidth },
          { side, y: gapY + gapHeight / 2, height: Math.max(0, sectionBottom - gapY - gapHeight / 2), width: railWidth }
        );
      }
      const side = Math.random() < 0.5 ? "left" : "right";
      const bladeSize = (19 + difficulty * 4) * gameScale();
      const bladeX = side === "left"
        ? wallWidth + railWidth + bladeSize * 0.65
        : width - wallWidth - railWidth - bladeSize * 0.65;
      world.slimeBlades.push({
        x: bladeX,
        y: gapY,
        size: bladeSize,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() < 0.5 ? -1 : 1) * (3 + difficulty)
      });
      const guideStart = laneLeft + 18 * gameScale();
      const guideEnd = laneRight - 18 * gameScale();
      const sawRadius = (20 + difficulty * 4) * gameScale();
      world.slimeSaws.push({
        x: width / 2 + gapOffset * 0.35,
        y: rowY + 76 * gameScale(),
        radius: sawRadius,
        color: 2,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() < 0.5 ? -1 : 1) * (3 + difficulty),
        guideStart,
        guideEnd,
        minX: guideStart + sawRadius,
        maxX: guideEnd - sawRadius,
        moveDirection: Math.random() < 0.5 ? -1 : 1,
        moveSpeed: (90 + difficulty * 35) * gameScale()
      });
      world.stars.push({
        x: width * (side === "left" ? 0.62 : 0.38),
        y: rowY + 126 * gameScale(),
        collected: false,
        rotation: 0,
        pulse: Math.random() * Math.PI * 2
      });
      world.slimeNextY -= (world.levelMode ? 315 : 255 - difficulty * 24 + Math.random() * 30) * gameScale();
    }
  }

  function getSlimeShotTarget(originX, originY) {
    let side = world.slimeAimX < originX ? "left" : "right";
    if (player.wallSide === side) side = side === "left" ? "right" : "left";
    const wallInset = 25 * gameScale() + player.radius;
    const targetX = side === "left" ? wallInset : width - wallInset;
    const apexY = originY - world.slimeJumpHeight;
    const candidates = world.slimeRails
      .filter((rail) => rail.side === side)
      .map((rail) => {
        const low = Math.max(rail.y + player.radius, apexY + player.radius * 0.2);
        const high = Math.min(rail.y + rail.height - player.radius, originY - player.radius);
        return high >= low ? Math.max(low, Math.min(high, world.slimeAimY)) : null;
      })
      .filter((y) => y !== null);
    const targetY = candidates.length
      ? candidates.reduce((best, y) => Math.abs(y - world.slimeAimY) < Math.abs(best - world.slimeAimY) ? y : best)
      : Math.max(apexY + player.radius, Math.min(originY - player.radius, world.slimeAimY));
    return { x: targetX, y: targetY, side };
  }

  function getSlimeShotPlan(originX, originY) {
    const target = getSlimeShotTarget(originX, originY);
    const gravityStrength = slimeGravity * gameScale();
    const velocityY = -Math.sqrt(2 * gravityStrength * world.slimeJumpHeight);
    const verticalDiscriminant = Math.max(0, velocityY * velocityY + 2 * gravityStrength * (target.y - originY));
    const duration = Math.max(0.1, (-velocityY + Math.sqrt(verticalDiscriminant)) / gravityStrength);
    return {
      target,
      gravity: gravityStrength,
      velocityY,
      velocityX: (target.x - originX) / duration,
      duration
    };
  }

  function distanceToSegment(x, y, startX, startY, endX, endY) {
    const dx = endX - startX;
    const dy = endY - startY;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - startX) * dx + (y - startY) * dy) / lengthSquared));
    return Math.hypot(x - (startX + dx * t), y - (startY + dy * t));
  }

  function checkSlimeContacts(previousX, previousY) {
    for (const blade of world.slimeBlades) {
      if (distanceToSegment(blade.x, blade.y, previousX, previousY, player.x, player.y) < player.radius + blade.size * 0.68) {
        showGameOver();
        return false;
      }
    }
    for (const saw of world.slimeSaws) {
      if (distanceToSegment(saw.x, saw.y, previousX, previousY, player.x, player.y) < player.radius + saw.radius * 0.82) {
        showGameOver();
        return false;
      }
    }
    return true;
  }

  function slimeWallAvailable(side, y) {
    return world.slimeRails.some((rail) => rail.side === side && y >= rail.y && y <= rail.y + rail.height);
  }

  function drawSlimeAim() {
    if (!world.running || world.mode !== "slime") return;
    const plan = getSlimeShotPlan(player.x, player.y);
    const target = plan.target;
    context.save();
    context.fillStyle = "rgba(255,255,255,.65)";
    const steps = 18;
    for (let i = 1; i < steps; i += 1) {
      const t = plan.duration * i / steps;
      const x = player.x + plan.velocityX * t;
      const y = player.y + plan.velocityY * t + 0.5 * plan.gravity * t * t;
      context.globalAlpha = 0.25 + 0.6 * (i / steps);
      context.beginPath();
      context.arc(x, y, (1.3 + i / steps) * gameScale(), 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    context.strokeStyle = "rgba(255,255,255,.45)";
    context.lineWidth = 1.5 * gameScale();
    context.beginPath();
    context.moveTo(target.x, target.y - 12 * gameScale());
    context.lineTo(target.x, target.y + 12 * gameScale());
    context.stroke();
    context.strokeStyle = "#FFFFFF";
    context.beginPath();
    context.arc(target.x, target.y, 8 * gameScale(), 0, Math.PI * 2);
    context.moveTo(target.x - 12 * gameScale(), target.y);
    context.lineTo(target.x + 12 * gameScale(), target.y);
    context.stroke();
    context.restore();
  }

  // Bounce and Hop mode arenas.
  function drawBounceArena() {
    const wallWidth = 22 * gameScale();
    const floorHeight = 12 * gameScale();
    const floorY = world.bounceFloorY;
    if (floorY >= 0 && floorY <= height) {
      context.fillStyle = "#32E2F1";
      context.fillRect(wallWidth, floorY, width - wallWidth * 2, floorHeight);
    }
    context.fillStyle = "#8C12FB";
    context.fillRect(0, 0, wallWidth, height);
    context.fillRect(width - wallWidth, 0, wallWidth, height);
    for (const spike of world.bounceSpikes) {
      const count = Math.max(2, Math.floor(spike.height / (12 * gameScale())));
      const spikeHeight = spike.height / count;
      context.fillStyle = "#FF0080";
      for (let i = 0; i < count; i += 1) {
        const y = spike.y - spike.height / 2 + i * spikeHeight;
        context.beginPath();
        if (spike.side === "left") {
          context.moveTo(wallWidth, y);
          context.lineTo(wallWidth + spike.depth, y + spikeHeight / 2);
          context.lineTo(wallWidth, y + spikeHeight);
        } else {
          context.moveTo(width - wallWidth, y);
          context.lineTo(width - wallWidth - spike.depth, y + spikeHeight / 2);
          context.lineTo(width - wallWidth, y + spikeHeight);
        }
        context.closePath();
        context.fill();
      }
    }
  }

  function drawHopArena() {
    const groundY = world.hopGroundY;
    const groundThickness = 12 * gameScale();
    if (groundY < height) {
      context.fillStyle = "#32E2F1";
      let groundStart = 0;
      for (const hole of [...world.hopHoles].sort((a, b) => a.x - b.x)) {
        const holeStart = Math.max(0, hole.x);
        const holeEnd = Math.min(width, hole.x + hole.width);
        if (holeEnd <= groundStart || holeStart >= width) continue;
        if (holeStart > groundStart) {
          context.fillRect(groundStart, groundY, holeStart - groundStart, groundThickness);
        }
        groundStart = Math.max(groundStart, holeEnd);
      }
      if (groundStart < width) context.fillRect(groundStart, groundY, width - groundStart, groundThickness);
    }
    for (const obstacle of world.hopObstacles) {
      const count = Math.max(2, Math.floor(obstacle.width / (11 * gameScale())));
      const spikeWidth = obstacle.width / count;
      context.fillStyle = "#FF0080";
      for (let i = 0; i < count; i += 1) {
        const x = obstacle.x + i * spikeWidth;
        context.beginPath();
        context.moveTo(x, groundY);
        context.lineTo(x + spikeWidth / 2, groundY - obstacle.height);
        context.lineTo(x + spikeWidth, groundY);
        context.closePath();
        context.fill();
      }
    }
    for (const saw of world.hopSaws) {
      context.save();
      context.translate(saw.x, saw.y);
      context.rotate(saw.rotation);
      context.fillStyle = "#FFE80F";
      context.beginPath();
      for (let i = 0; i < 24; i += 1) {
        const angle = i * Math.PI / 12;
        const radius = i % 2 === 0 ? saw.radius : saw.radius * 0.72;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
      context.fillStyle = "#272727";
      context.beginPath();
      context.arc(0, 0, saw.radius * 0.3, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }
    for (const platform of world.hopPlatforms) {
      context.fillStyle = "#8C12FB";
      context.fillRect(platform.x, platform.y, platform.width, 8 * gameScale());
      context.fillStyle = "#D5B6FF";
      context.fillRect(platform.x + 5 * gameScale(), platform.y + 2 * gameScale(), platform.width - 10 * gameScale(), 2 * gameScale());
    }
  }

  // Hop mode course generation and collision checks.
  function ensureHopCourse() {
    const courseLimit = world.finishLine?.orientation === "vertical"
      ? world.finishLine.x - width * 0.65
      : Infinity;
    while (world.hopNextObstacleX < width * 2 && world.hopNextObstacleX < courseLimit) {
      const difficulty = hopDifficulty();
      const roll = Math.random();
      const holeChance = difficulty < 0.16 ? 0 : 0.1 + difficulty * 0.1;
      const sawChance = difficulty < 0.38 ? 0 : 0.06 + (difficulty - 0.38) * 0.1;
      const platformChance = difficulty < 0.72 ? 0 : 0.08 + (difficulty - 0.72) * 0.12;
      let type = "spikes";
      if (roll < platformChance) type = "platform";
      else if (roll < platformChance + sawChance) type = "saw";
      else if (roll < platformChance + sawChance + holeChance) type = "hole";

      const obstacleWidth = (type === "hole"
        ? 62 + difficulty * 34 + Math.random() * 12
        : 26 + Math.random() * 18) * gameScale();
      const obstacleX = world.hopNextObstacleX;
      if (type === "spikes") {
        world.hopObstacles.push({
          x: obstacleX,
          width: world.levelMode ? (18 + Math.random() * 10) * gameScale() : obstacleWidth,
          height: world.levelMode ? 18 * gameScale() : (25 + Math.random() * 15) * gameScale()
        });
      } else if (type === "hole" || type === "platform") {
        const hole = { x: obstacleX, width: obstacleWidth };
        world.hopHoles.push(hole);
        if (type === "platform") {
          const platformWidth = (76 + Math.random() * 16) * gameScale();
          const baseY = world.hopGroundY - (68 + Math.random() * 10) * gameScale();
          world.hopPlatforms.push({
            x: obstacleX + obstacleWidth / 2 - platformWidth / 2,
            width: platformWidth,
            y: baseY,
            baseY,
            amplitude: 15 * gameScale(),
            phase: Math.random() * Math.PI * 2,
            speed: 1.2 + Math.random() * 0.5
          });
        }
      } else {
        const radius = (14 + difficulty * 4) * gameScale();
        world.hopSaws.push({
          x: obstacleX + obstacleWidth / 2,
          y: world.hopGroundY - radius,
          radius,
          rotation: Math.random() * Math.PI
        });
      }
      world.stars.push({
        x: obstacleX + obstacleWidth / 2,
        y: world.hopGroundY - (type === "platform" ? 122 : 72 + Math.random() * 22) * gameScale(),
        collected: false,
        rotation: 0,
        pulse: Math.random() * Math.PI * 2
      });
      const spacing = world.levelMode
        ? 1100 + Math.random() * 120
        : 340 - difficulty * 90 + Math.random() * (80 - difficulty * 20);
      world.hopNextObstacleX += spacing * gameScale();
    }
  }

  function hopGroundAt(x) {
    return !world.hopHoles.some((hole) => x > hole.x && x < hole.x + hole.width);
  }

  function checkHopObstacleCollision() {
    for (const obstacle of world.hopObstacles) {
      const overlapsX = player.x + player.radius > obstacle.x
        && player.x - player.radius < obstacle.x + obstacle.width;
      const overlapsY = player.y + player.radius > world.hopGroundY - obstacle.height;
      if (overlapsX && overlapsY) {
        showGameOver();
        return false;
      }
    }
    for (const saw of world.hopSaws) {
      if (Math.hypot(player.x - saw.x, player.y - saw.y) < player.radius + saw.radius * 0.78) {
        showGameOver();
        return false;
      }
    }
    return true;
  }

  // Bounce mode course generation and collision checks.
  function ensureBounceCourse() {
    const spacing = (world.levelMode ? 680 : 520) * gameScale();
    while (world.bounceNextHazardY > -height
      && (!world.finishLine || world.bounceNextHazardY > world.finishLine.y + height * 0.35)) {
      const side = world.bounceHazardIndex % 2 === 0 ? "right" : "left";
      world.bounceSpikes.push({
        side,
        y: world.bounceNextHazardY,
        height: 54 * gameScale(),
        depth: 40 * gameScale()
      });
      world.stars.push({
        x: width / 2,
        y: world.bounceNextHazardY - 190 * gameScale(),
        collected: false,
        rotation: 0,
        pulse: world.bounceHazardIndex * 1.7
      });
      world.bounceHazardIndex += 1;
      world.bounceNextHazardY -= spacing;
    }
  }

  function checkBounceSpikes() {
    const wallWidth = 22 * gameScale();
    for (const spike of world.bounceSpikes) {
      const nearWall = spike.side === "left"
        ? player.x - player.radius < wallWidth + spike.depth
        : player.x + player.radius > width - wallWidth - spike.depth;
      const overlapsSpike = nearWall
        && player.y + player.radius > spike.y - spike.height / 2
        && player.y - player.radius < spike.y + spike.height / 2;
      if (overlapsSpike) {
        showGameOver();
        return false;
      }
    }
    return true;
  }

  function drawRing(ring) {
    const segmentAngle = Math.PI * 2 / ring.sides;
    context.save();
    context.lineWidth = ring.thickness;
    context.lineCap = "butt";
    if (ring.shape === "circle") {
      for (let i = 0; i < ring.sides; i += 1) {
        context.beginPath();
        context.strokeStyle = colors[ring.colors[i]];
        context.arc(
          ring.x,
          ring.y,
          ring.radius,
          ring.angle + i * segmentAngle - 0.006,
          ring.angle + (i + 1) * segmentAngle + 0.006
        );
        context.stroke();
      }
    } else {
      const vertices = Array.from({ length: ring.sides }, (_, i) => {
        const angle = ring.angle + i * segmentAngle;
        return {
          x: ring.x + Math.cos(angle) * ring.radius,
          y: ring.y + Math.sin(angle) * ring.radius
        };
      });
      const incoming = [];
      const outgoing = [];
      for (let i = 0; i < ring.sides; i += 1) {
        const previous = vertices[(i + ring.sides - 1) % ring.sides];
        const vertex = vertices[i];
        const next = vertices[(i + 1) % ring.sides];
        incoming.push(pointAlong(vertex, previous, ring.cornerCut));
        outgoing.push(pointAlong(vertex, next, ring.cornerCut));
      }

      for (let i = 0; i < ring.sides; i += 1) {
        const endIndex = (i + 1) % ring.sides;
        const start = outgoing[i];
        const end = incoming[endIndex];
        const sideLength = Math.hypot(end.x - start.x, end.y - start.y);
        const overlap = Math.min(0.75, sideLength * 0.02);
        const dx = (end.x - start.x) / sideLength;
        const dy = (end.y - start.y) / sideLength;
        context.beginPath();
        context.strokeStyle = colors[ring.colors[i]];
        context.moveTo(start.x - dx * overlap, start.y - dy * overlap);
        context.lineTo(end.x + dx * overlap, end.y + dy * overlap);
        context.stroke();
      }

      for (let i = 0; i < ring.sides; i += 1) {
        const endIndex = (i + 1) % ring.sides;
        const bevelStart = incoming[endIndex];
        const bevelEnd = outgoing[endIndex];
        const corner = vertices[endIndex];
        const firstControl = pointAlong(bevelStart, corner, 0.5);
        const secondControl = pointAlong(corner, bevelEnd, 0.5);
        const bevelMidpoint = pointAlong(firstControl, secondControl, 0.5);
        context.beginPath();
        context.strokeStyle = colors[ring.colors[i]];
        context.moveTo(bevelStart.x, bevelStart.y);
        context.quadraticCurveTo(firstControl.x, firstControl.y, bevelMidpoint.x, bevelMidpoint.y);
        context.stroke();

        context.beginPath();
        context.strokeStyle = colors[ring.colors[endIndex]];
        context.moveTo(bevelMidpoint.x, bevelMidpoint.y);
        context.quadraticCurveTo(secondControl.x, secondControl.y, bevelEnd.x, bevelEnd.y);
        context.stroke();
      }
    }
    context.restore();
  }

  function pointAlong(from, to, fraction) {
    return {
      x: from.x + (to.x - from.x) * fraction,
      y: from.y + (to.y - from.y) * fraction
    };
  }

  function drawStar(star) {
    if (star.collected) return;
    context.save();
    context.translate(star.x, star.y);
    context.rotate(star.rotation);
    const pulse = 1 + Math.sin(star.pulse) * 0.1;
    context.scale(pulse, pulse);
    context.fillStyle = "#FFFFFF";
    context.beginPath();
    const points = [];
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = (i % 2 === 0 ? baseStarRadius : 8) * gameScale();
      points.push({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius });
    }
    const cornerRoundness = 0.4;
    for (let i = 0; i < points.length; i += 1) {
      const previous = points[(i + points.length - 1) % points.length];
      const point = points[i];
      const next = points[(i + 1) % points.length];
      const incoming = {
        x: point.x + (previous.x - point.x) * cornerRoundness,
        y: point.y + (previous.y - point.y) * cornerRoundness
      };
      const outgoing = {
        x: point.x + (next.x - point.x) * cornerRoundness,
        y: point.y + (next.y - point.y) * cornerRoundness
      };
      if (i === 0) context.moveTo(incoming.x, incoming.y);
      else context.lineTo(incoming.x, incoming.y);
      context.quadraticCurveTo(point.x, point.y, outgoing.x, outgoing.y);
    }
    context.closePath();
    context.fill();
    context.restore();
  }

  function drawPickup(pickup) {
    if (pickup.collected) return;
    const radius = pickupRadius();
    for (let i = 0; i < colors.length; i += 1) {
      const start = -Math.PI / 2 + i * Math.PI / 2;
      context.beginPath();
      context.moveTo(pickup.x, pickup.y);
      context.arc(pickup.x, pickup.y, radius, start, start + Math.PI / 2);
      context.closePath();
      context.fillStyle = colors[i];
      context.fill();
    }
    context.lineWidth = 1;
    context.strokeStyle = "#272727";
    context.beginPath();
    context.arc(pickup.x, pickup.y, radius, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(pickup.x - radius, pickup.y);
    context.lineTo(pickup.x + radius, pickup.y);
    context.moveTo(pickup.x, pickup.y - radius);
    context.lineTo(pickup.x, pickup.y + radius);
    context.stroke();
  }

  function drawPlayer() {
    drawBallSprite(player.x, player.y, player.color, player.radius, player.rotation);
  }

  function drawBallSprite(x, y, color, radius, rotation) {
    context.fillStyle = colors[color];
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
    if (world.mode === "hop") {
      context.save();
      context.translate(x, y);
      context.rotate(rotation);
      context.strokeStyle = "#272727";
      context.lineWidth = Math.max(1.1, radius * 0.18);
      context.beginPath();
      context.arc(0, 0, radius * 0.68, -Math.PI * 0.45, Math.PI * 0.45);
      context.stroke();
      context.restore();
    } else if (world.mode === "slime") {
      context.fillStyle = "rgba(255,255,255,.62)";
      context.beginPath();
      context.ellipse(x - radius * 0.28, y - radius * 0.32, radius * 0.22, radius * 0.13, -0.5, 0, Math.PI * 2);
      context.fill();
    }
  }

  function drawPlayerTrail() {
    const lifetime = world.mode === "hop" ? hopTrailLifetime : trailLifetime;
    for (const echo of world.trail) {
      const progress = echo.age / lifetime;
      context.globalAlpha = (1 - progress) * 0.42;
      drawBallSprite(echo.x, echo.y, echo.color, player.radius * (0.9 - progress * 0.16), echo.rotation);
    }
    context.globalAlpha = 1;
  }

  function ringSurfaceAt(ring, x, y) {
    const fullTurn = Math.PI * 2;
    const relativeAngle = Math.atan2(y - ring.y, x - ring.x) - ring.angle;
    const angle = ((relativeAngle % fullTurn) + fullTurn) % fullTurn;
    const segmentAngle = Math.PI * 2 / ring.sides;
    const segment = Math.min(ring.sides - 1, Math.floor(angle / segmentAngle));
    if (ring.shape === "circle") {
      return { distance: Math.hypot(x - ring.x, y - ring.y) - ring.radius, color: ring.colors[segment] };
    }

    const vertices = Array.from({ length: ring.sides }, (_, i) => {
      const vertexAngle = ring.angle + i * segmentAngle;
      return {
        x: ring.x + Math.cos(vertexAngle) * ring.radius,
        y: ring.y + Math.sin(vertexAngle) * ring.radius
      };
    });
    const incoming = [];
    const outgoing = [];
    for (let i = 0; i < ring.sides; i += 1) {
      incoming.push(pointAlong(vertices[i], vertices[(i + ring.sides - 1) % ring.sides], ring.cornerCut));
      outgoing.push(pointAlong(vertices[i], vertices[(i + 1) % ring.sides], ring.cornerCut));
    }

    let nearestDistance = Infinity;
    let nearestColor = ring.colors[0];
    for (let i = 0; i < ring.sides; i += 1) {
      const next = (i + 1) % ring.sides;
      const side = nearestPointOnSegment(x, y, outgoing[i], incoming[next]);
      if (side.distance < nearestDistance) {
        nearestDistance = side.distance;
        nearestColor = ring.colors[i];
      }

      const corner = vertices[i];
      const bevel = nearestPointOnQuadratic(x, y, incoming[i], corner, outgoing[i]);
      if (bevel.distance < nearestDistance) {
        nearestDistance = bevel.distance;
        const previous = (i + ring.sides - 1) % ring.sides;
        nearestColor = bevel.position < 0.5 ? ring.colors[previous] : ring.colors[i];
      }
    }

    const perimeter = [];
    for (let i = 0; i < ring.sides; i += 1) perimeter.push(incoming[i], outgoing[i]);
    const inside = isPointInPolygon(x, y, perimeter);
    return { distance: inside ? -nearestDistance : nearestDistance, color: nearestColor };
  }

  function nearestPointOnSegment(x, y, start, end) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lengthSquared = dx * dx + dy * dy;
    const position = lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, ((x - start.x) * dx + (y - start.y) * dy) / lengthSquared));
    const nearestX = start.x + dx * position;
    const nearestY = start.y + dy * position;
    return { distance: Math.hypot(x - nearestX, y - nearestY), position };
  }

  function nearestPointOnQuadratic(x, y, start, control, end) {
    let nearest = { distance: Infinity, position: 0 };
    let previous = start;
    const steps = 16;
    for (let i = 1; i <= steps; i += 1) {
      const position = i / steps;
      const inverse = 1 - position;
      const current = {
        x: inverse * inverse * start.x + 2 * inverse * position * control.x + position * position * end.x,
        y: inverse * inverse * start.y + 2 * inverse * position * control.y + position * position * end.y
      };
      const closest = nearestPointOnSegment(x, y, previous, current);
      if (closest.distance < nearest.distance) {
        nearest = {
          distance: closest.distance,
          position: (i - 1 + closest.position) / steps
        };
      }
      previous = current;
    }
    return nearest;
  }

  function isPointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
      const current = points[i];
      const previous = points[j];
      const crosses = (current.y > y) !== (previous.y > y)
        && x < (previous.x - current.x) * (y - current.y) / (previous.y - current.y) + current.x;
      if (crosses) inside = !inside;
    }
    return inside;
  }

  function checkRingContacts(previousX, previousY) {
    for (const ring of world.rings) {
      const previous = ringSurfaceAt(ring, previousX, previousY);
      const current = ringSurfaceAt(ring, player.x, player.y);
      const clearance = player.radius + ring.thickness / 2;
      const crossedEdge = previous.distance * current.distance <= 0;
      const touchingEdge = Math.abs(current.distance) <= clearance;
      if (!crossedEdge && !touchingEdge) continue;

      if (current.color !== player.color) {
        showGameOver();
        return false;
      }
    }
    return true;
  }

  function updateCollectibles() {
    for (const star of world.stars) {
      if (star.collected) continue;
      if (Math.hypot(player.x - star.x, player.y - star.y) < player.radius + starRadius()) {
        star.collected = true;
        world.score += 1;
        scoreElement.textContent = String(world.score);
        playSoundEffect("star");
      }
    }
    for (const pickup of world.pickups) {
      if (pickup.collected) continue;
      if (Math.hypot(player.x - pickup.x, player.y - pickup.y) < player.radius + pickupRadius()) {
        pickup.collected = true;
        player.color = chooseDifferentColor(player.color);
        pickup.color = player.color;
        playSoundEffect("colorSwitch");
      }
    }
  }

  function keepWorldInView() {
    if (world.mode === "hop") return;
    const followLine = height * 0.43;
    if (player.y >= followLine) return;
    const shift = followLine - player.y;
    player.y = followLine;
    for (const item of [...world.rings, ...world.stars, ...world.pickups, ...world.trail]) item.y += shift;
    if (world.finishLine?.orientation === "horizontal") world.finishLine.y += shift;
    if (world.mode === "bounce") {
      world.bounceFloorY += shift;
      world.bounceNextHazardY += shift;
      for (const spike of world.bounceSpikes) spike.y += shift;
      world.bounceSpikes = world.bounceSpikes.filter((spike) => spike.y < height + spike.height);
    }
    if (world.mode === "slime") {
      world.bounceFloorY += shift;
      world.slimeNextY += shift;
      for (const item of [...world.slimeRails, ...world.slimeBlades, ...world.slimeSaws]) item.y += shift;
      if (world.slimeShot) {
        world.slimeShot.startY += shift;
        world.slimeShot.targetY += shift;
      }
      world.slimeRails = world.slimeRails.filter((rail) => rail.y < height + rail.height);
      world.slimeBlades = world.slimeBlades.filter((blade) => blade.y < height + blade.size);
      world.slimeSaws = world.slimeSaws.filter((saw) => saw.y < height + saw.radius);
      world.slimeDistance += shift;
    }
    if (world.spawnPlatform?.active) world.spawnPlatform.y += shift;
  }

  function drawSpawnPlatform() {
    const platform = world.spawnPlatform;
    if (!platform?.active) return;
    context.fillStyle = "#FFFFFF";
    context.fillRect(
      platform.x - platform.width / 2,
      platform.y,
      platform.width,
      platform.height
    );
  }

  // Castle mode movement and floor progression.
  function updateCastle(delta) {
    const castle = world.castle;
    if (castle.completing) {
      castle.flagLowerProgress = Math.min(1, castle.flagLowerProgress + delta / 0.85);
      if (castle.flagLowerProgress >= 1) {
        showLevelComplete();
        return false;
      }
      return true;
    }

    const leftWall = castleLeftWall();
    const rightWall = castleRightWall();
    const floorY = castleFloorY(castle.floorIndex);
    const previousY = player.y;
    const scale = gameScale();
    const playerSpeed = 155 * scale;
    player.rotation += playerSpeed * delta / Math.max(1, player.radius);
    player.x = Math.min(rightWall - player.radius, player.x + playerSpeed * delta);

    if (!player.grounded) {
      player.velocity += gravity * scale * delta;
      player.y += player.velocity * delta;
      if (player.velocity >= 0
        && previousY + player.radius <= floorY
        && player.y + player.radius >= floorY) {
        player.y = floorY - player.radius;
        player.velocity = 0;
        player.grounded = true;
      }
    } else {
      player.y = floorY - player.radius;
    }

    for (const position of castleHazardLayouts[castle.floorIndex]) {
      const spikeX = leftWall + (rightWall - leftWall) * position;
      const nearSpike = Math.abs(player.x - spikeX) < 14 * scale + player.radius * 0.6;
      const overlappingSpikeHeight = player.y + player.radius > floorY - 16 * scale;
      if (nearSpike && overlappingSpikeHeight) {
        showGameOver();
        return false;
      }
    }

    if (castle.floorIndex === 4 && player.x + player.radius >= castleFlagX()) {
      player.x = castleFlagX();
      if (player.grounded) castle.completing = true;
      return true;
    }

    if (player.x + player.radius >= rightWall) {
      player.x = rightWall - player.radius;
      if (!player.grounded) return true;
      if (castle.floorIndex === 4) {
        castle.completing = true;
        return true;
      }
      castle.floorIndex += 1;
      player.x = leftWall + player.radius;
      player.y = castleFloorY(castle.floorIndex) - player.radius;
      player.velocity = 0;
      player.grounded = true;
    }
    return true;
  }

  // Shared game loop and per-mode updates.
  function update(delta) {
    world.elapsed += delta;
    const previousX = player.x;
    const previousY = player.y;
    if (world.mode === "castle") {
      if (!updateCastle(delta)) return false;
    } else if (world.mode === "hop") {
      const difficulty = hopDifficulty();
      const travel = hopSpeed * (1 + difficulty * 0.35) * gameScale() * delta;
      world.hopDistance += travel;
      if (world.finishLine?.orientation === "vertical") world.finishLine.x -= travel;
      player.rotation += travel / Math.max(1, player.radius);
      for (const obstacle of world.hopObstacles) obstacle.x -= travel;
      for (const hole of world.hopHoles) hole.x -= travel;
      for (const saw of world.hopSaws) {
        saw.x -= travel;
        saw.rotation += delta * 5;
      }
      for (const platform of world.hopPlatforms) {
        platform.x -= travel;
        platform.y = platform.baseY + Math.sin(world.elapsed * platform.speed + platform.phase) * platform.amplitude;
      }
      for (const star of world.stars) star.x -= travel;
      world.hopNextObstacleX -= travel;
      for (const echo of world.trail) echo.x -= travel;
      player.x = width * 0.26;
      if (player.hopPlatform && player.grounded) {
        const platform = player.hopPlatform;
        if (player.x + player.radius > platform.x && player.x - player.radius < platform.x + platform.width) {
          player.y = platform.y - player.radius;
        } else {
          player.hopPlatform = null;
          player.grounded = false;
        }
      }
      if (player.grounded && !player.hopPlatform && !hopGroundAt(player.x)) player.grounded = false;
      if (!player.grounded) {
        player.velocity += hopGravity * gameScale() * delta;
        player.y += player.velocity * delta;
        if (player.velocity >= 0 && previousY + player.radius <= world.hopGroundY
          && player.y + player.radius >= world.hopGroundY && hopGroundAt(player.x)) {
          player.y = world.hopGroundY - player.radius;
          player.velocity = 0;
          player.grounded = true;
          player.hopSlammed = false;
          player.hopPlatform = null;
        }
        if (!player.grounded) {
          for (const platform of world.hopPlatforms) {
            const overlapsX = player.x + player.radius > platform.x
              && player.x - player.radius < platform.x + platform.width;
            if (player.velocity >= 0 && previousY + player.radius <= platform.y
              && player.y + player.radius >= platform.y && overlapsX) {
              player.y = platform.y - player.radius;
              player.velocity = 0;
              player.grounded = true;
              player.hopSlammed = false;
              player.hopPlatform = platform;
              break;
            }
          }
        }
      }
      if (!checkHopObstacleCollision()) return false;
      world.hopObstacles = world.hopObstacles.filter((obstacle) => obstacle.x + obstacle.width > -20);
      world.hopHoles = world.hopHoles.filter((hole) => hole.x + hole.width > -20);
      world.hopSaws = world.hopSaws.filter((saw) => saw.x + saw.radius > -20);
      world.hopPlatforms = world.hopPlatforms.filter((platform) => platform.x + platform.width > -20);
      world.stars = world.stars.filter((star) => !star.collected && star.x > -starRadius());
      ensureHopCourse();
    } else if (world.mode === "bounce") {
      const wallInset = 22 * gameScale() + player.radius;
      if (player.wallSide !== null) {
        player.x = player.wallSide === "left" ? wallInset : width - wallInset;
        if (player.wallHangRemaining > 0) {
          player.wallHangRemaining = Math.max(0, player.wallHangRemaining - delta);
          player.velocity = 0;
        } else {
          const baseSlipSpeed = 32 * gameScale();
          player.wallSlipSpeed = Math.min(
            bounceWallSlipMaxSpeed * gameScale(),
            (player.wallSlipSpeed + baseSlipSpeed) * Math.exp(bounceWallSlipAcceleration * delta)
          );
          player.y += player.wallSlipSpeed * delta;
          player.velocity = player.wallSlipSpeed;
        }
      } else {
        player.x += world.bounceDirection * bounceSpeed * gameScale() * delta;
      }
      if (player.wallSide === null && player.x >= width - wallInset) {
        player.x = width - wallInset;
        world.bounceDirection = -1;
        player.wallSide = "right";
        player.wallHangRemaining = bounceWallHangDuration;
        player.wallSlipSpeed = 0;
        player.velocity = 0;
        player.grounded = false;
        player.coyoteTime = coyoteDuration;
        player.airJumpAvailable = true;
      } else if (player.wallSide === null && player.x <= wallInset) {
        player.x = wallInset;
        world.bounceDirection = 1;
        player.wallSide = "left";
        player.wallHangRemaining = bounceWallHangDuration;
        player.wallSlipSpeed = 0;
        player.velocity = 0;
        player.grounded = false;
        player.coyoteTime = coyoteDuration;
        player.airJumpAvailable = true;
      }
    } else if (world.mode === "slime") {
      if (world.slimeShot) {
        const shot = world.slimeShot;
        shot.elapsed = Math.min(shot.duration, shot.elapsed + delta);
        const shotTime = shot.elapsed;
        player.x = shot.startX + shot.velocityX * shotTime;
        player.y = shot.startY + shot.velocityY * shotTime + 0.5 * shot.gravity * shotTime * shotTime;
        player.velocityX = shot.velocityX;
        player.velocity = shot.velocityY + shot.gravity * shotTime;
        if (shot.elapsed >= shot.duration) {
          player.x = shot.targetX;
          player.y = shot.targetY;
          player.velocity = 0;
          player.velocityX = 0;
          player.wallSide = shot.targetSide;
          world.slimeShot = null;
        }
      } else if (player.wallSide !== null) {
        const wallInset = 25 * gameScale() + player.radius;
        player.x = player.wallSide === "left" ? wallInset : width - wallInset;
        player.velocity = 0;
        player.velocityX = 0;
      } else if (!player.grounded) {
        player.velocity += slimeGravity * gameScale() * delta;
        player.x += player.velocityX * delta;
        player.y += player.velocity * delta;
        const wallInset = 25 * gameScale() + player.radius;
        if (player.x <= wallInset && slimeWallAvailable("left", player.y)) {
          player.x = wallInset;
          player.wallSide = "left";
          player.velocity = 0;
          player.velocityX = 0;
        } else if (player.x >= width - wallInset && slimeWallAvailable("right", player.y)) {
          player.x = width - wallInset;
          player.wallSide = "right";
          player.velocity = 0;
          player.velocityX = 0;
        } else {
          if (player.x < player.radius) {
            player.x = player.radius;
            player.velocityX = Math.abs(player.velocityX) * 0.35;
          } else if (player.x > width - player.radius) {
            player.x = width - player.radius;
            player.velocityX = -Math.abs(player.velocityX) * 0.35;
          }
        }
        if (player.velocity >= 0 && previousY + player.radius <= world.bounceFloorY
          && player.y + player.radius >= world.bounceFloorY) {
          player.y = world.bounceFloorY - player.radius;
          player.velocity = 0;
          player.velocityX = 0;
          player.grounded = true;
        }
      }
      for (const saw of world.slimeSaws) {
        saw.rotation += saw.spin * delta;
        saw.x += saw.moveDirection * saw.moveSpeed * delta;
        if (saw.x >= saw.maxX) {
          saw.x = saw.maxX;
          saw.moveDirection = -1;
        } else if (saw.x <= saw.minX) {
          saw.x = saw.minX;
          saw.moveDirection = 1;
        }
      }
      for (const blade of world.slimeBlades) blade.rotation += blade.spin * delta;
      if (!checkSlimeContacts(previousX, previousY)) return false;
      if (player.y > height + player.radius) {
        showGameOver();
        return false;
      }
      ensureSlimeCourse();
    }
    const hangingOnBounceWall = world.mode === "bounce"
      && player.wallSide !== null
      && player.wallHangRemaining > 0;
    if (world.mode !== "hop" && world.mode !== "slime" && world.mode !== "castle" && !hangingOnBounceWall && !(world.mode === "bounce" && player.wallSide !== null)) {
      player.velocity += (world.mode === "bounce" ? bounceGravity : gravity) * gameScale() * delta;
      player.y += player.velocity * delta;
    }
    if (world.mode === "bounce") {
      const landedOnBounceFloor = world.bounceFloorY <= height
        && player.y + player.radius >= world.bounceFloorY;
      if (player.velocity >= 0 && landedOnBounceFloor) {
        player.y = world.bounceFloorY - player.radius;
        player.velocity = 0;
        player.grounded = true;
        player.coyoteTime = coyoteDuration;
        player.airJumpAvailable = true;
      } else if (player.y + player.radius < world.bounceFloorY || world.bounceFloorY > height) {
        if (player.grounded) player.coyoteTime = coyoteDuration;
        player.grounded = false;
      }
      if (!player.grounded) player.coyoteTime = Math.max(0, player.coyoteTime - delta);
      if (!checkBounceSpikes()) return false;
      ensureBounceCourse();
    }
    const platform = world.spawnPlatform;
    if (platform?.active && player.velocity >= 0
      && previousY + player.radius <= platform.y
      && player.y + player.radius >= platform.y
      && Math.abs(player.x - platform.x) <= platform.width / 2 + player.radius) {
      player.y = platform.y - player.radius;
      player.velocity = 0;
    }
    const classicDifficulty = world.mode === "classic" && !world.levelMode ? Math.min(0.5, world.elapsed / 180) : 0;
    for (const ring of world.rings) ring.angle += ring.spin * (1 + classicDifficulty) * delta;
    for (const star of world.stars) {
      star.rotation += delta * 0.45;
      star.pulse += delta * 3;
    }
    world.trail = world.trail.filter((echo) => {
      echo.age += delta;
      return echo.age < (world.mode === "hop" ? hopTrailLifetime : trailLifetime);
    });
    if (!checkRingContacts(previousX, previousY)) return false;
    if (world.mode !== "castle") keepWorldInView();
    world.trailClock += delta;
    if (world.trailClock >= 0.035) {
      world.trailClock %= 0.035;
      world.trail.push({ x: player.x, y: player.y, color: player.color, rotation: player.rotation, age: 0 });
    }
    updateCollectibles();
    if (checkLevelCompletion()) return false;

    const topRing = world.rings.reduce((top, ring) => Math.min(top, ring.y), Infinity);
    const nextRingY = topRing - ringSpacing();
    if (topRing > -ringSpacing()
      && (!world.finishLine || nextRingY > world.finishLine.y + ringRadius())) {
      makeRing(nextRingY);
    }
    world.rings = world.rings.filter((ring) => ring.y < height + ring.radius + 30);
    world.stars = world.stars.filter((star) => !star.collected && star.y < height + 30);
    world.pickups = world.pickups.filter((pickup) => !pickup.collected && pickup.y < height + 30);

    if (player.y > height + 24) {
      showGameOver();
      return false;
    }
    return true;
  }

  function checkLevelCompletion() {
    if (!world.levelMode || !world.finishLine) return false;
    const finish = world.finishLine;
    const touched = finish.orientation === "vertical"
      ? player.x + player.radius >= finish.x - finish.thickness / 2
        && player.x - player.radius <= finish.x + finish.thickness / 2
      : Math.abs(player.y - finish.y) <= player.radius + finish.thickness / 2;
    if (!touched) return false;
    showLevelComplete();
    return true;
  }

  function drawFinishLine() {
    if (!world.levelMode || !world.finishLine) return;
    const finish = world.finishLine;
    const cell = Math.max(5, 12 * gameScale());
    const columns = Math.ceil(width / cell);
    const rows = finish.orientation === "vertical" ? Math.ceil(height / cell) : 2;
    const stripWidth = finish.orientation === "vertical" ? finish.thickness : width;
    const stripHeight = finish.orientation === "vertical" ? height : finish.thickness;
    const left = finish.orientation === "vertical" ? finish.x - stripWidth / 2 : 0;
    const top = finish.orientation === "vertical" ? 0 : finish.y - stripHeight / 2;
    const stripColumns = Math.ceil(stripWidth / cell);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < (finish.orientation === "vertical" ? stripColumns : columns); column += 1) {
        context.fillStyle = (row + column) % 2 === 0 ? "#FFFFFF" : "#272727";
        context.fillRect(left + column * cell, top + row * cell, cell, cell);
      }
    }
    context.strokeStyle = "#FFFFFF";
    context.lineWidth = 2 * gameScale();
    context.setLineDash([5 * gameScale(), 4 * gameScale()]);
    context.beginPath();
    if (finish.orientation === "vertical") {
      context.moveTo(finish.x, 0);
      context.lineTo(finish.x, height);
    } else {
      context.moveTo(0, finish.y);
      context.lineTo(width, finish.y);
    }
    context.stroke();
    context.setLineDash([]);
  }

  // Shared scene composition.
  function draw() {
    drawBackground();
    if (world.mode === "castle") drawCastleArena();
    if (world.mode === "bounce") drawBounceArena();
    if (world.mode === "slime") drawSlimeArena();
    drawFinishLine();
    drawSpawnPlatform();
    world.stars.forEach(drawStar);
    world.pickups.forEach(drawPickup);
    world.rings.forEach(drawRing);
    if (world.mode === "hop") drawHopArena();
    drawPlayerTrail();
    drawSlimeAim();
    drawPlayer();
  }

  function gameFrame(time) {
    if (!world.running) return;
    const delta = Math.min((time - world.lastTime) / 1000, 0.04);
    world.lastTime = time;
    if (!update(delta)) {
      draw();
      return;
    }
    draw();
    requestAnimationFrame(gameFrame);
  }

  canvas.addEventListener("pointermove", (event) => {
    if (world.mode !== "slime") return;
    const bounds = canvas.getBoundingClientRect();
    world.slimeAimX = event.clientX - bounds.left;
    world.slimeAimY = event.clientY - bounds.top;
  });
  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (world.mode === "slime") {
      const bounds = canvas.getBoundingClientRect();
      world.slimeAimX = event.clientX - bounds.left;
      world.slimeAimY = event.clientY - bounds.top;
    }
    jump();
  });
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest("button:not(.jump-button)")) return;
    unlockSoundEffects();
    playSoundEffect("button");
  }, true);
  document.getElementById("jump-button").addEventListener("pointerdown", (event) => {
    event.preventDefault();
    jump();
  });
  document.addEventListener("keydown", handleInput);
  window.addEventListener("resize", setCanvasSize);
  setCanvasSize();
  showMenu();
  draw();
})();
