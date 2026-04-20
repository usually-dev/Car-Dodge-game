// ===== CANVAS =====
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ===== SCALE =====
let scale = 1;
function updateScale() {
  scale = canvas.width / 400;
}

// ===== LANES =====
let laneCount = 4;
let laneWidth;
let lanes = [];

function setupLanes() {
  laneWidth = canvas.width / laneCount;
  lanes = [];
  for (let i = 0; i < laneCount; i++) {
    lanes.push(laneWidth * i + laneWidth / 2);
  }
}

// ===== FULLSCREEN =====
function resizeCanvas() {
  const maxWidth = 500; // limit for desktop
  const width = Math.min(window.innerWidth, maxWidth);

  canvas.width = width;
  canvas.height = window.innerHeight;

  // center canvas
  canvas.style.display = "block";
  canvas.style.margin = "0 auto";

  setupLanes();
  updateScale();

  targetX = lanes[currentLane];
}

// ===== INITIAL STATE =====
let currentLane = 1;
let targetX = 0;

// ===== GAME STATE =====
let gameState = "menu";

// ===== LOAD IMAGE =====
function loadImage(src) {
  const img = new Image();
  img.src = src;
  return img;
}

// ===== ASSETS =====
const playerImg = loadImage("assets/player.png");
const enemyImgs = [
  loadImage("assets/enemy1.png"),
  loadImage("assets/enemy2.png"),
  loadImage("assets/enemy3.png")
];
const heartImg = loadImage("assets/heart.png");

// ===== SOUND =====
const crashSound = new Audio("assets/crash.wav");
const scoreSound = new Audio("assets/score.wav");
const bgMusic = new Audio("assets/music.mp3");

bgMusic.loop = true;
bgMusic.volume = 0.4;

let audioUnlocked = false;

function unlockAudio() {
  if (!audioUnlocked) {
    bgMusic.play().then(() => {
      bgMusic.pause();
      bgMusic.currentTime = 0;
      audioUnlocked = true;
    }).catch(()=>{});
  }
}

function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(()=>{});
}

// ===== PLAYER =====
const player = {
  x: 0,
  y: 0,
  width: 40,
  height: 70
};

// ===== GAME DATA =====
let enemies = [];
let score = 0;
let lives = 3;
let gameSpeed = 4;
let roadOffset = 0;

// ===== START GAME =====
function startGame() {
  gameState = "playing";
  enemies = [];
  score = 0;
  lives = 3;
  gameSpeed = 4;
  currentLane = 1;
  targetX = lanes[currentLane];

  bgMusic.currentTime = 0;
  bgMusic.play().catch(()=>{});
}

// ===== INPUT =====
document.addEventListener("keydown", (e) => {
  if (gameState !== "playing") return;

  if (e.key === "ArrowLeft" && currentLane > 0) currentLane--;
  if (e.key === "ArrowRight" && currentLane < laneCount - 1) currentLane++;

  targetX = lanes[currentLane];
});

canvas.addEventListener("click", (e) => {
  unlockAudio();

  const x = e.clientX;
  const y = e.clientY;

  // start/restart
  if (gameState === "menu" || gameState === "gameover") {
    startGame();
    return;
  }

  // play/pause button
  if (x > canvas.width - 60 && y < 60) {
    if (gameState === "playing") {
      gameState = "paused";
      bgMusic.pause();
    } else if (gameState === "paused") {
      gameState = "playing";
      bgMusic.play();
    }
  }
});

// ===== SPAWN ENEMY =====
function spawnEnemy() {
  let laneIndex = Math.random() < 0.6
    ? currentLane
    : Math.floor(Math.random() * laneCount);

  enemies.push({
    x: lanes[laneIndex],
    y: -80,
    width: 40,
    height: 70,
    img: enemyImgs[Math.floor(Math.random() * enemyImgs.length)],
    speed: gameSpeed + Math.random() * 1.5,
    zigzag: Math.random() < 0.15,
    zigDir: Math.random() > 0.5 ? 1 : -1
  });
}

// ===== COLLISION =====
function isColliding(a, b) {
  return a.x < b.x + b.width &&
         a.x + a.width > b.x &&
         a.y < b.y + b.height &&
         a.y + a.height > b.y;
}

// ===== UPDATE =====
function update() {
  if (gameState !== "playing") return;

  let moveSpeed = 10 * scale;

if (Math.abs(targetX - player.x) > 1) {
  player.x += (targetX - player.x) / moveSpeed;
} else {
  player.x = targetX;
}
  player.y = canvas.height - 100 * scale;

  roadOffset += gameSpeed;

  enemies.forEach((e, i) => {
    e.y += e.speed;

    if (e.zigzag) {
      e.x += e.zigDir * 1;
      if (e.x < lanes[0] || e.x > lanes[laneCount - 1]) {
        e.zigDir *= -1;
      }
    }

    if (isColliding(player, e)) {
      enemies.splice(i, 1);
      playSound(crashSound);
      lives--;

      if (lives <= 0) {
        gameState = "gameover";
        bgMusic.pause();
      }
    }

    if (e.y > canvas.height) {
      enemies.splice(i, 1);
      score++;
      playSound(scoreSound);

      if (score % 5 === 0) gameSpeed += 0.5;
    }
  });
}

// ===== DRAW ROAD =====
function drawRoad() {
  // road base
  ctx.fillStyle = "#2c2f4a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // side borders (road edges)
  ctx.fillStyle = "#555";
  ctx.fillRect(0, 0, 6 * scale, canvas.height);
  ctx.fillRect(canvas.width - 6 * scale, 0, 6 * scale, canvas.height);

  // moving dashed center lines
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3 * scale;

  for (let i = -40; i < canvas.height; i += 40) {
    let y = i + (roadOffset % 40);

    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, y);
    ctx.lineTo(canvas.width / 2, y + 20);
    ctx.stroke();
  }

  // lane separators (lighter)
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1.5 * scale;

  for (let i = 1; i < laneCount; i++) {
    ctx.beginPath();
    ctx.moveTo(laneWidth * i, 0);
    ctx.lineTo(laneWidth * i, canvas.height);
    ctx.stroke();
  }
}
// ===== DRAW =====
function draw() {
  drawRoad();

  if (gameState === "menu") {
    ctx.fillStyle = "white";
    ctx.font = `${30 * scale}px Arial`;
    ctx.fillText("TAP TO START", canvas.width/2 - 120*scale, canvas.height/2);
    return;
  }

  // player
  ctx.drawImage(
    playerImg,
    player.x - 20 * scale,
    player.y,
    40 * scale,
    70 * scale
  );

  // enemies
  enemies.forEach(e => {
    ctx.drawImage(
      e.img,
      e.x - 20 * scale,
      e.y,
      40 * scale,
      70 * scale
    );
  });

  // hearts
  for (let i = 0; i < lives; i++) {
    ctx.drawImage(
      heartImg,
      10*scale + i * 30*scale,
      10*scale,
      25*scale,
      25*scale
    );
  }

  // score
  ctx.fillStyle = "white";
  ctx.font = `${18 * scale}px Arial`;
  ctx.fillText("Score: " + score, canvas.width/2 - 50*scale, 30*scale);

  // play/pause icon
  ctx.fillStyle = "white";

  if (gameState === "playing") {
    ctx.fillRect(canvas.width - 40*scale, 10*scale, 8*scale, 25*scale);
    ctx.fillRect(canvas.width - 25*scale, 10*scale, 8*scale, 25*scale);
  } else if (gameState === "paused") {
    ctx.beginPath();
    ctx.moveTo(canvas.width - 40*scale, 10*scale);
    ctx.lineTo(canvas.width - 40*scale, 35*scale);
    ctx.lineTo(canvas.width - 15*scale, 22*scale);
    ctx.fill();
  }

  if (gameState === "paused") {
    ctx.font = `${30 * scale}px Arial`;
    ctx.fillText("PAUSED", canvas.width/2 - 80*scale, canvas.height/2);
  }

  if (gameState === "gameover") {
    ctx.fillStyle = "red";
    ctx.font = `${30 * scale}px Arial`;
    ctx.fillText("GAME OVER", canvas.width/2 - 100*scale, canvas.height/2);

    ctx.fillStyle = "white";
    ctx.font = `${18 * scale}px Arial`;
    ctx.fillText("Tap to Restart", canvas.width/2 - 90*scale, canvas.height/2 + 40*scale);
  }
}

// ===== LOOP =====
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// ===== INIT =====
resizeCanvas();

// ===== SPAWN =====
setInterval(() => {
  if (gameState === "playing") spawnEnemy();
}, 800);

// ===== START LOOP =====
loop();

// ===== DEV POPUP =====
window.addEventListener("load", () => {
  const popup = document.getElementById("devPopup");

  setTimeout(() => {
    popup.classList.add("show");
  }, 300); // slight delay for smoothness

  setTimeout(() => {
    popup.classList.remove("show");
  }, 3000); // hide after 3 sec
});