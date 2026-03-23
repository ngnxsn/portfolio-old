const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const levelEl = document.getElementById('level');
const livesEl = document.getElementById('lives');

const deathLines = [
  'Pha này gọi là tự ngã chứ game chưa kịp chơi bạn.',
  'Bình tĩnh thôi, mới vài ống tre mà đã gắt rồi.',
  'Con gà pixel còn điềm đạm hơn bạn ở pha vừa rồi.',
  'Bạn bấm rất nhiệt, tiếc là trúng mỗi chỗ không nên trúng.',
  'Chơi thư giãn thôi, đừng biến con gà thành kẻ thù truyền kiếp.',
  'Ống tre đứng yên mà bạn còn lao vào thì tôi cũng chịu.',
  'Pha này không phải xui, là phản xạ đang đi cà phê.',
  'Thua thêm ván nữa cũng được, miễn đừng cay với con gà.',
  'Game chưa khó lắm, chỉ là bạn đang làm nó kịch tính quá.',
  'Thất bại là mẹ thành công, còn bạn đang gặp mẹ hơi nhiều.',
  'Con vịt còn né được mà bạn thì không, hơi buồn nhẹ đấy.',
  'Bạn vừa biến một cú né đơn giản thành tiết mục cảm động.',
  'Pha này nhìn con vịt còn tưởng bạn nhường đường cho nó.',
  'Ống tre không chạy theo bạn đâu, chính bạn chạy vào nó đấy.',
  'Nếu con gà biết nói chắc nó cũng xin đổi người điều khiển.',
  'Con vịt bay ngang qua còn ngỡ bạn đang diễn xiếc miễn phí.',
  'Bạn chơi thư giãn mà nhìn tay bấm như đang trả thù tuổi thơ.',
  'Pha này không trách game được, game cũng đang bất ngờ.',
  'Con vịt vừa làm cameo thôi mà bạn đã đi luôn một mạng.',
  'Bạn né tre chưa xong mà còn muốn cãi nhau với vịt nữa à.',
  'Gà còn chưa hoảng, người chơi đã tự làm mình hoảng trước.',
  'Có những cú thua không đau, pha này thì hơi đau lòng đấy.',
  'Con vịt kia chỉ bay ngang thôi, sao bạn lại xem nó như boss.',
  'Pha này gọi là nhập vai quá sâu, thấy chướng ngại là lao vào.',
  'Không sao, thua ván này chỉ làm con vịt tự tin hơn thôi.',
  'Bạn vừa chứng minh tốc độ phản xạ và tốc độ tự hủy ngang nhau.',
  'Con gà đã cố hết sức, phần còn lại là câu chuyện của bạn.',
  'Tre không nói gì, vịt không nói gì, chỉ có kết quả nói hộ tất cả.',
  'Bạn vừa bay theo một quỹ đạo mà vật lý cũng không muốn nhận.',
  'Nếu đây là bài kiểm tra né vịt, thì con vịt đang chấm điểm khá gắt.'
];

const W = canvas.width;
const H = canvas.height;
const GROUND_H = 96;
const PIPE_W = 56;
const BASE_GAP = 150;
const PIPE_INTERVAL = 1320;
const GRAVITY = 0.34;
const FLAP = -6.2;
const BASE_SPEED = 2.9;
const DEBUG_HITBOX = false;

const assets = {
  bgSky: loadImage('assets/bg-sky.png'),
  bgClouds1: loadImage('assets/bg-clouds1.png'),
  bgClouds2: loadImage('assets/bg-clouds2.png'),
  bgClouds3: loadImage('assets/bg-clouds3.png'),
  bgTree1: loadImage('assets/bg-tree1.png'),
  bgTree2: loadImage('assets/bg-tree2.png'),
  bgLand: loadImage('assets/bg-land.png'),
  pipeTop: loadImage('assets/pipe-top.png'),
  pipeBottom: loadImage('assets/pipe-bottom.png'),
  chicken: [
    loadImage('assets/chicken-1.png'),
    loadImage('assets/chicken-2.png'),
    loadImage('assets/chicken-3.png')
  ],
  duck: [
    loadImage('assets/duck-1.png'),
    loadImage('assets/duck-2.png')
  ],
  egg: loadImage('assets/egg.png'),
  shield: loadImage('assets/shield.png'),
  superShield: loadImage('assets/super-shield.png'),
  title: loadImage('assets/title.png')
};

function loadImage(src){
  const img = new Image();
  img.src = src;
  return img;
}

function drawImageSafe(img, x, y, w, h){
  if(!img || !img.complete || !img.naturalWidth) return false;
  ctx.drawImage(img, x, y, w, h);
  return true;
}

let audioCtx;
function beep(freq, duration, type='square', gain=0.03){
  try {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = gain;
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + duration);
  } catch {}
}
const sfxFlap = ()=>beep(520,0.05,'square',0.03);
const sfxScore = ()=>{ beep(740,0.05,'square',0.03); setTimeout(()=>beep(920,0.07,'square',0.03),60); };
const sfxHit = ()=>beep(130,0.16,'sawtooth',0.05);
const sfxItem = ()=>{ beep(660,0.04,'triangle',0.03); setTimeout(()=>beep(980,0.07,'triangle',0.03),50); };

let best = Number(localStorage.getItem('flappyPixelBest') || 0);
bestEl.textContent = best;
let game;

function pickDeathLine(){
  return deathLines[Math.floor(Math.random() * deathLines.length)];
}

function reset(){
  game = {
    started:false,
    over:false,
    score:0,
    lives:1,
    maxLives:3,
    bird:{x:100,y:H/2-40,vy:0,w:42,h:34,frame:0,flapAnim:0,shieldTimer:0,invincibleTimer:0,shieldUsed:false},
    pipes:[],
    items:[],
    ducks:[],
    bgActors:[],
    popups:[],
    lastPipe:0,
    lastItem:0,
    lastDuck:0,
    bgOffset:0,
    time:0,
    hitCooldown:0,
    deathLine:pickDeathLine(),
    newBest:false,
  };
  game.bgActors = createBgActors();
  scoreEl.textContent='0';
  levelEl.textContent='1';
  livesEl.textContent='1';
}

function createBgActors(){
  return [
    { kind:'cloud', img:assets.bgClouds1, x:40, y:H*0.04, w:W, h:H, speed:0.22 },
    { kind:'cloud', img:assets.bgClouds2, x:W*0.72, y:H*0.02, w:W, h:H, speed:0.28 },
    { kind:'cloud', img:assets.bgClouds3, x:W*1.36, y:0, w:W, h:H, speed:0.34 },
    { kind:'tree', img:assets.bgTree1, x:0, y:H*0.30, w:W*0.86, h:H*0.52, speed:0.55 },
    { kind:'tree', img:assets.bgTree2, x:W*0.44, y:H*0.34, w:W*0.82, h:H*0.48, speed:0.62 },
    { kind:'tree', img:assets.bgTree1, x:W*0.92, y:H*0.38, w:W*0.76, h:H*0.42, speed:0.7 },
    { kind:'tree', img:assets.bgTree2, x:W*1.34, y:H*0.42, w:W*0.70, h:H*0.36, speed:0.76 },
    { kind:'tree', img:assets.bgTree1, x:W*1.78, y:H*0.40, w:W*0.74, h:H*0.40, speed:0.84 },
  ];
}

function recycleBgActor(actor){
  const furthestX = Math.max(...game.bgActors.map(a => a.x + a.w));
  actor.x = furthestX + 80 + Math.random() * 120;
  if(actor.kind === 'cloud'){
    actor.y = H * (0.00 + Math.random() * 0.08);
  } else {
    actor.y = H * (0.30 + Math.random() * 0.12);
  }
}

function getLevel(){ return Math.floor(game.score / 4) + 1; }
function getSpeed(){ return BASE_SPEED + Math.min(5, (getLevel()-1) * 0.3); }
function getGap(){ return Math.max(88, BASE_GAP - (getLevel()-1) * 9); }

function addPipe(){
  const gap = getGap();
  const top = 110 + Math.random() * (H - GROUND_H - gap - 200);
  const moving = getLevel() >= 5 && Math.random() < 0.55;
  const tilting = getLevel() >= 7 && Math.random() < 0.38;
  game.pipes.push({
    x: W + 30,
    top,
    gap,
    scored:false,
    moving,
    tilting,
    phase: Math.random() * Math.PI * 2,
    amp: moving ? 10 + getLevel() * 1.2 : 0,
    tiltAmp: tilting ? Math.min(7, 2 + getLevel() * 0.35) : 0,
    tilt: 0,
  });
}

function addItem(){
  const targetPipe = game.pipes[game.pipes.length - 1];
  if(!targetPipe) return;
  const roll = Math.random();
  const type = roll < 0.5 ? 'egg' : roll < 0.82 ? 'shield' : 'superShield';
  const itemSize = 22;
  const gapTop = targetPipe.top;
  const gapBottom = targetPipe.top + targetPipe.gap - itemSize;
  const gapMid = gapTop + (targetPipe.gap - itemSize) / 2;
  const birdCurrentY = game.bird.y + game.bird.h / 2;

  const topZoneStart = gapTop + 10;
  const topZoneEnd = gapTop + Math.max(22, targetPipe.gap * 0.24);
  const bottomZoneStart = gapBottom - Math.max(22, targetPipe.gap * 0.24);
  const bottomZoneEnd = gapBottom - 10;

  const forceOppositeHalf = birdCurrentY < gapMid;
  const y = forceOppositeHalf
    ? bottomZoneStart + Math.random() * Math.max(6, bottomZoneEnd - bottomZoneStart)
    : topZoneStart + Math.random() * Math.max(6, topZoneEnd - topZoneStart);

  const itemOffsetX = PIPE_W + 78;
  game.items.push({
    x: targetPipe.x + itemOffsetX,
    y,
    type,
    collected:false,
    anchorPipe: targetPipe,
    offsetX: itemOffsetX,
    offsetY: y - targetPipe.top,
  });
}

function addDuck(){
  const y = 120 + Math.random() * (H - GROUND_H - 220);
  game.ducks.push({x:W + 70, y, w:34, h:26, flapOffset:Math.random()*10});
}

function flap(){
  if(game.over){ reset(); return; }
  if(!game.started){ game.started = true; }
  game.bird.vy = FLAP;
  game.bird.flapAnim = 180;
  sfxFlap();
}

function addPopup(text, color = '#fff7cc'){
  game.popups.push({
    text,
    x: game.bird.x + game.bird.w / 2,
    y: game.bird.y,
    life: 900,
    maxLife: 900,
    color,
  });
}

function rectsOverlap(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getPipeCollisionBoxes(pipe){
  const topBox = {
    x: pipe.x-10,
    y: 0,
    w: PIPE_W+20,
    h: pipe.top,
  };
  const bottomBox = {
    x: pipe.x-10,
    y: pipe.top+pipe.gap,
    w: PIPE_W+20,
    h: H-GROUND_H-(pipe.top+pipe.gap),
  };
  return { topBox, bottomBox };
}

function hitBird(){
  if(game.hitCooldown > 0 || game.over) return;
  if(game.bird.invincibleTimer > 0){
    sfxItem();
    game.hitCooldown = 16;
    return;
  }
  if(game.bird.shieldTimer > 0 && !game.bird.shieldUsed){
    game.bird.shieldUsed = true;
    game.bird.shieldTimer = 0;
    sfxItem();
    game.hitCooldown = 40;
    return;
  }
  game.lives -= 1;
  livesEl.textContent = game.lives;
  sfxHit();
  game.hitCooldown = 50;
  if(game.lives <= 0){
    game.over = true;
    game.deathLine = pickDeathLine();
    game.newBest = game.score > best;
    if(game.newBest){
      best = game.score;
      localStorage.setItem('flappyPixelBest', String(best));
      bestEl.textContent = best;
    }
  } else {
    game.bird.y = Math.max(40, game.bird.y - 20);
    game.bird.vy = -3;
  }
}

function update(ts=0){
  const dt = game.time ? Math.min(32, ts - game.time) : 16;
  game.time = ts;
  const speed = getSpeed();

  if(game.started && !game.over){
    if(game.hitCooldown > 0) game.hitCooldown -= dt / 16;
    if(game.bird.shieldTimer > 0) game.bird.shieldTimer = Math.max(0, game.bird.shieldTimer - dt);
    if(game.bird.invincibleTimer > 0) game.bird.invincibleTimer = Math.max(0, game.bird.invincibleTimer - dt);
    game.bird.vy += GRAVITY * (dt / 16);
    game.bird.y += game.bird.vy * (dt / 16);
    if(game.bird.flapAnim > 0) game.bird.flapAnim = Math.max(0, game.bird.flapAnim - dt);
    game.bird.frame += dt / 140;
    game.bgOffset = (game.bgOffset + speed * 0.12) % W;

    if(ts - game.lastPipe > Math.max(760, PIPE_INTERVAL - (getLevel()-1) * 48)){
      addPipe(); game.lastPipe = ts;
    }
    if(ts - game.lastItem > 5600){
      addItem(); game.lastItem = ts;
    }
    if(getLevel() >= 3 && ts - game.lastDuck > Math.max(1800, 4300 - getLevel() * 200)){
      addDuck(); game.lastDuck = ts;
    }

    for(const pipe of game.pipes){
      pipe.x -= speed * (dt / 16);
      if(pipe.moving) pipe.top += Math.sin(ts / 680 + pipe.phase) * (0.32 + getLevel() * 0.018);
      pipe.top = Math.max(70, Math.min(pipe.top, H - GROUND_H - pipe.gap - 70));
      pipe.tilt = pipe.tilting ? Math.sin(ts / 300 + pipe.phase) * pipe.tiltAmp : 0;
      if(!pipe.scored && pipe.x + PIPE_W < game.bird.x){
        pipe.scored = true;
        game.score += 1;
        scoreEl.textContent = game.score;
        levelEl.textContent = getLevel();
        sfxScore();
      }
    }

    for(const item of game.items){
      if(item.anchorPipe && game.pipes.includes(item.anchorPipe)){
        item.x = item.anchorPipe.x + item.offsetX;
        const itemMinY = item.anchorPipe.top + 16;
        const itemMaxY = item.anchorPipe.top + item.anchorPipe.gap - 38;
        item.y = Math.max(itemMinY, Math.min(itemMaxY, item.anchorPipe.top + item.offsetY));
      } else {
        item.x -= speed * (dt / 16);
      }
    }
    for(const duck of game.ducks){
      duck.x -= (speed + 1.5) * (dt / 16);
      duck.y += Math.sin(ts / 150 + duck.flapOffset) * 0.45;
    }
    for(const popup of game.popups){
      popup.y -= 0.45 * (dt / 16);
      popup.life -= dt;
    }
    for(const actor of game.bgActors){
      actor.x -= actor.speed * (dt / 16);
      if(actor.x + actor.w < -20) recycleBgActor(actor);
    }

    game.pipes = game.pipes.filter(p => p.x + PIPE_W > -20);
    game.items = game.items.filter(i => i.x > -24 && !i.collected);
    game.ducks = game.ducks.filter(d => d.x + d.w > -20);
    game.popups = game.popups.filter(p => p.life > 0);

    const birdBox = {x:game.bird.x+6, y:game.bird.y+4, w:game.bird.w-12, h:game.bird.h-8};

    for(const pipe of game.pipes){
      const { topBox, bottomBox } = getPipeCollisionBoxes(pipe);
      if(rectsOverlap(birdBox, topBox) || rectsOverlap(birdBox, bottomBox)) hitBird();
    }

    for(const duck of game.ducks){
      const box = {x:duck.x-2, y:duck.y, w:duck.w+8, h:duck.h+6};
      if(rectsOverlap(birdBox, box)) hitBird();
    }

    for(const item of game.items){
      const box = {x:item.x, y:item.y, w:22, h:22};
      if(rectsOverlap(birdBox, box)){
        item.collected = true;
        sfxItem();
        if(item.type === 'egg'){
          const wasFullLives = game.lives >= game.maxLives;
          game.lives = Math.min(game.maxLives, game.lives + 1);
          livesEl.textContent = game.lives;
          if(wasFullLives){
            game.score += 1;
            scoreEl.textContent = game.score;
            levelEl.textContent = getLevel();
            sfxScore();
            addPopup('+1 điểm (full mạng)', '#ffe082');
          } else {
            addPopup('+1 mạng', '#fff3b0');
          }
        } else if(item.type === 'shield') {
          game.bird.shieldTimer = 10000;
          game.bird.shieldUsed = false;
          addPopup('Bảo vệ 1 lần trong 10 giây', '#7bdc65');
        } else {
          game.bird.invincibleTimer = 5000;
          addPopup('Bất tử hoàn toàn 5 giây', '#ffb703');
        }
      }
    }

    if(game.bird.y + game.bird.h >= H - GROUND_H || game.bird.y <= 0) hitBird();
  }

  draw();
  requestAnimationFrame(update);
}

function drawFullLayer(img, dx = 0, dy = 0, w = W, h = H){
  if(!img || !img.complete || !img.naturalWidth) return false;
  ctx.drawImage(img, dx, dy, w, h);
  return true;
}

function drawPanoramaLayer(img, speedFactor = 0.05, y = 0, height = H){
  if(!img || !img.complete || !img.naturalWidth) return false;
  const viewWidthInSource = img.naturalHeight * (W / height);
  if(viewWidthInSource >= img.naturalWidth){
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, y, W, height);
    return true;
  }
  const maxShift = img.naturalWidth - viewWidthInSource;
  const shift = Math.min(maxShift, game.bgOffset * speedFactor * 6);
  ctx.drawImage(img, shift, 0, viewWidthInSource, img.naturalHeight, 0, y, W, height);
  return true;
}

function drawBackground(){
  const sky = ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#cdefff');
  sky.addColorStop(1,'#f6fbff');
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,W,H);

  if(assets.bgSky && assets.bgSky.complete && assets.bgSky.naturalWidth){
    ctx.drawImage(assets.bgSky, 0, 0, W, H);
  }

  for(const actor of game.bgActors.filter(a => a.kind === 'cloud')){
    if(actor.img && actor.img.complete) ctx.drawImage(actor.img, actor.x, actor.y, actor.w, actor.h);
  }

  for(const actor of game.bgActors.filter(a => a.kind === 'tree')){
    if(actor.img && actor.img.complete) ctx.drawImage(actor.img, actor.x, actor.y, actor.w, actor.h);
  }
}

function drawLandOverlay(){
  if(assets.bgLand && assets.bgLand.complete && assets.bgLand.naturalWidth){
    const height = 170;
    const scale = height / assets.bgLand.naturalHeight;
    const drawWidth = assets.bgLand.naturalWidth * scale;
    const maxShift = Math.max(0, drawWidth - W);
    const shift = Math.min(maxShift, game.bgOffset * 0.7);
    ctx.drawImage(assets.bgLand, -shift, H - height, drawWidth, height);
  } else {
    ctx.fillStyle='#8bc34a';
    ctx.fillRect(0,H-GROUND_H,W,GROUND_H);
  }
}

function drawBambooSegment(x,y,h,tilt=0,flip=false){
  ctx.save();
  const pivotY = flip ? y : y + h;
  ctx.translate(x + PIPE_W/2, pivotY);
  ctx.rotate((tilt||0) * Math.PI / 180);
  ctx.translate(-(x + PIPE_W/2), -pivotY);
  ctx.fillStyle='#5aa84f'; ctx.fillRect(x,y,PIPE_W,h);
  ctx.fillStyle='#7ecf67'; ctx.fillRect(x+8,y,10,h);
  ctx.fillStyle='#3d7a30'; for(let yy=y+22; yy<y+h; yy+=30) ctx.fillRect(x-2,yy,PIPE_W+4,6);
  ctx.fillStyle='#4d9a3f'; ctx.fillRect(x+PIPE_W-7,y+12,10,14); ctx.fillRect(x+PIPE_W-11,y+40,14,10);
  ctx.fillStyle='#6fbe57'; ctx.fillRect(x-6,y+h-18,14,8);
  ctx.restore();
}
function drawPipeWithNaturalScale(img, x, y, width){
  if(!img || !img.complete || !img.naturalWidth) return false;
  const scaledHeight = img.naturalHeight * (width / img.naturalWidth);
  ctx.drawImage(img, x, y, width, scaledHeight);
  return scaledHeight;
}

function drawPipe(pipe){
  const topTilt = pipe.tilt || 0;
  const bottomY = pipe.top + pipe.gap;
  const pipeWidth = 156;
  const topBoxX = pipe.x - 10;
  const boxCenterX = topBoxX + (PIPE_W + 20) / 2;
  const pipeX = boxCenterX - pipeWidth / 2 - 6;

  ctx.save();
  ctx.translate(boxCenterX, pipe.top);
  ctx.rotate(topTilt * Math.PI / 180);
  ctx.translate(-boxCenterX, -pipe.top);
  if(!assets.pipeTop || !assets.pipeTop.complete || !assets.pipeTop.naturalWidth){
    drawBambooSegment(pipe.x,0,pipe.top,topTilt,false);
  } else {
    const scaledTopHeight = assets.pipeTop.naturalHeight * (pipeWidth / assets.pipeTop.naturalWidth);
    ctx.drawImage(assets.pipeTop, pipeX, pipe.top - scaledTopHeight + 46, pipeWidth, scaledTopHeight);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(boxCenterX, bottomY);
  ctx.rotate((-topTilt) * Math.PI / 180);
  ctx.translate(-boxCenterX, -bottomY);
  if(!assets.pipeBottom || !assets.pipeBottom.complete || !assets.pipeBottom.naturalWidth){
    drawBambooSegment(pipe.x,bottomY,H-GROUND_H-bottomY,-topTilt,true);
  } else {
    const scaledBottomHeight = assets.pipeBottom.naturalHeight * (pipeWidth / assets.pipeBottom.naturalWidth);
    ctx.drawImage(assets.pipeBottom, pipeX, bottomY - 44, pipeWidth, scaledBottomHeight);
  }
  ctx.restore();
}
function drawItem(item){
  const map = {
    egg: assets.egg,
    shield: assets.shield,
    superShield: assets.superShield,
  };
  if(!drawImageSafe(map[item.type], item.x - 4, item.y - 4, 30, 30)){
    if(item.type==='egg'){
      ctx.fillStyle='#fff8e7'; ctx.fillRect(item.x+6,item.y+2,10,16);
      ctx.fillStyle='#e9dbc1'; ctx.fillRect(item.x+8,item.y+4,6,12);
    } else if(item.type==='shield') {
      ctx.fillStyle='#74c0fc'; ctx.fillRect(item.x+4,item.y+4,14,14);
      ctx.fillStyle='#d0ebff'; ctx.fillRect(item.x+8,item.y+0,6,22);
    } else {
      ctx.fillStyle='#ffb703'; ctx.fillRect(item.x+4,item.y+4,14,14);
      ctx.fillStyle='#ffd166'; ctx.fillRect(item.x+8,item.y+0,6,22);
      ctx.fillStyle='#fff3b0'; ctx.fillRect(item.x+6,item.y+6,10,10);
    }
  }
}
function drawDuck(d){
  const flap = ((Math.floor((game.time/120)+d.flapOffset))%2)===0 ? 0 : 1;
  if(!drawImageSafe(assets.duck[flap], d.x - 14, d.y - 8, 66, 44)){
    ctx.fillStyle='#fff3b0'; ctx.fillRect(d.x+6,d.y+8,18,10);
    ctx.fillStyle='#f4d35e'; ctx.fillRect(d.x+8,d.y+6,14,10);
    ctx.fillStyle='#111'; ctx.fillRect(d.x+18,d.y+8,2,2);
    ctx.fillStyle='#f77f00'; ctx.fillRect(d.x+24,d.y+10,8,3);
    ctx.fillStyle='#f9c74f';
    if(flap===0) ctx.fillRect(d.x+10,d.y+14,9,5); else ctx.fillRect(d.x+10,d.y+18,9,4);
  }
}
function drawChicken(){
  const b = game.bird;
  const frame = b.flapAnim > 0 ? 1 : 0;
  ctx.save();
  ctx.translate(b.x+b.w/2,b.y+b.h/2);
  ctx.rotate(Math.max(-0.35,Math.min(1,b.vy*0.06)));
  ctx.translate(-b.w/2,-b.h/2);
  if(!drawImageSafe(assets.chicken[frame], -12, -14, 64, 64)){
    const wingUp = Math.floor(b.frame)%2===0;
    ctx.fillStyle='#d8cab6'; ctx.fillRect(10,8,22,18);
    ctx.fillStyle='#fff7ec'; ctx.fillRect(12,8,20,18);
    ctx.fillStyle='#f5e8cf'; ctx.fillRect(18,12,10,10);
    ctx.fillStyle='#ecd3ad'; if(wingUp) ctx.fillRect(15,10,10,7); else ctx.fillRect(15,16,10,7);
    ctx.fillStyle='#d62839'; ctx.fillRect(18,3,4,4); ctx.fillRect(22,1,4,6); ctx.fillRect(26,3,4,4);
    ctx.fillStyle='#ff9f1c'; ctx.fillRect(32,14,8,4);
    ctx.fillStyle='#111'; ctx.fillRect(27,12,2,2);
    ctx.fillStyle='#ffb4a2'; ctx.fillRect(25,15,2,2);
    ctx.fillStyle='#31572c'; ctx.fillRect(6,10,4,4); ctx.fillStyle='#40916c'; ctx.fillRect(4,14,5,4); ctx.fillStyle='#90a955'; ctx.fillRect(6,18,4,4);
    ctx.fillStyle='#ffb703'; ctx.fillRect(20,26,2,7); ctx.fillRect(26,26,2,7); ctx.fillRect(19,32,4,2); ctx.fillRect(25,32,4,2);
  }
  if(game.bird.invincibleTimer > 0){
    const invRatio = game.bird.invincibleTimer / 5000;
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(255,183,3,0.18)';
    ctx.beginPath();
    ctx.arc(21,17,22,0,Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(255,183,3,${0.5 + invRatio * 0.5})`;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(21,17,22,-Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * invRatio);
    ctx.stroke();
    ctx.lineCap = 'butt';
  } else if(game.bird.shieldTimer > 0){
    const shieldRatio = game.bird.shieldTimer / 10000;
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(123,220,101,0.18)';
    ctx.beginPath();
    ctx.arc(21,17,19,0,Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(123,220,101,${0.45 + shieldRatio * 0.55})`;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(21,17,19,-Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * shieldRatio);
    ctx.stroke();
    ctx.lineCap = 'butt';
  }
  ctx.restore();
}

const FONT = {A:['0110','1001','1111','1001','1001'],B:['1110','1001','1110','1001','1110'],C:['0111','1000','1000','1000','0111'],E:['1111','1000','1110','1000','1111'],F:['1111','1000','1110','1000','1000'],G:['0111','1000','1011','1001','0111'],I:['111','010','010','010','111'],L:['1000','1000','1000','1000','1111'],M:['10001','11011','10101','10001','10001'],O:['0110','1001','1001','1001','0110'],P:['1110','1001','1110','1000','1000'],R:['1110','1001','1110','1010','1001'],S:['0111','1000','0110','0001','1110'],T:['11111','00100','00100','00100','00100'],V:['1001','1001','1001','1001','0110'],X:['1001','1001','0110','1001','1001'],Y:['1001','1001','0110','0010','0010'],' ':['0','0','0','0','0']};
function pixelText(text,cx,y,scale,color,center=false){
  text = String(text).toUpperCase();
  const charWidth = 6 * scale;
  let x = center ? cx - (text.length * charWidth) / 2 : cx;
  ctx.fillStyle = color;
  for(const ch of text){
    const glyph = FONT[ch] || FONT[' '];
    for(let row=0; row<glyph.length; row++){
      for(let col=0; col<glyph[row].length; col++) if(glyph[row][col]==='1') ctx.fillRect(x+col*scale,y+row*scale,scale,scale);
    }
    x += charWidth;
  }
}
function drawPanel(y,height=160){
  ctx.fillStyle='#00000055'; ctx.fillRect(28,y,W-56,height);
  ctx.fillStyle='#f7eed3'; ctx.fillRect(36,y+8,W-72,height-16);
  ctx.fillStyle='#7a4a29'; ctx.fillRect(36,y+8,W-72,14);
}
function drawMultilineText(text, x, y, maxWidth, lineHeight){
  const words = String(text).split(' ');
  let line = '';
  const lines = [];
  for(const word of words){
    const test = line ? `${line} ${word}` : word;
    if(ctx.measureText(test).width > maxWidth && line){
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if(line) lines.push(line);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}
function drawStartOverlay(){
  drawPanel(158,148);
  pixelText('START',W/2,190,4,'#3f3121',true);
  ctx.fillStyle='#6f6251';
  ctx.font='700 20px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  ctx.textAlign='center';
  ctx.fillText('Chạm để bay', W/2, 248);
  ctx.font='16px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  ctx.fillText('Né tre, vịt và săn điểm', W/2, 280);
}
function drawArcadeScore(value, x, y){
  ctx.textAlign='center';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#7a1f00';
  ctx.strokeText(String(value), x, y);
  const grad = ctx.createLinearGradient(0, y - 34, 0, y + 8);
  grad.addColorStop(0, '#fff3a1');
  grad.addColorStop(0.45, '#ffd54a');
  grad.addColorStop(1, '#ff6b1a');
  ctx.fillStyle = grad;
  ctx.fillText(String(value), x, y);
}
function drawGameOverOverlay(){
  drawPanel(110,276);
  pixelText('GAME OVER',W/2,146,4,'#3f3121',true);
  ctx.textAlign='center';
  ctx.fillStyle='#7a4a29';
  ctx.font='700 16px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  ctx.fillText('Điểm của anh', W/2, 188);
  ctx.font='900 42px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  drawArcadeScore(game.score, W/2, 236);
  ctx.fillStyle='#7a4a29';
  ctx.font='700 15px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  ctx.fillText(`Best: ${best}`, W/2, 268);
  if(game.newBest){
    ctx.fillStyle='#d62828';
    ctx.font='800 16px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
    ctx.fillText('Điểm kỷ lục mới!', W/2, 294);
  }
  ctx.fillStyle='#6f6251';
  ctx.font='16px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  drawMultilineText(game.deathLine, W/2, game.newBest ? 326 : 300, 280, 24);
  ctx.font='700 15px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  ctx.fillText('Chạm để chơi lại', W/2, 376);
}
function drawText(){
  if(assets.title && assets.title.complete && assets.title.naturalWidth){
    const titleWidth = 440;
    const titleHeight = titleWidth * (assets.title.naturalHeight / assets.title.naturalWidth);
    ctx.drawImage(assets.title, W / 2 - titleWidth / 2, 18, titleWidth, titleHeight);
  }
  if(!game.started && !game.over) drawStartOverlay();
  if(game.over) drawGameOverOverlay();
}

function drawPopups(){
  ctx.textAlign = 'center';
  ctx.font = '700 14px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif';
  for(const popup of game.popups){
    const alpha = Math.max(0, popup.life / popup.maxLife);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(25,25,25,0.45)';
    ctx.lineWidth = 4;
    ctx.strokeText(popup.text, popup.x, popup.y);
    ctx.fillStyle = popup.color;
    ctx.fillText(popup.text, popup.x, popup.y);
    ctx.globalAlpha = 1;
  }
}

function drawDebugHitboxes(){
  if(!DEBUG_HITBOX) return;
  const birdBox = {x:game.bird.x+6, y:game.bird.y+4, w:game.bird.w-12, h:game.bird.h-8};
  ctx.save();
  ctx.strokeStyle = 'rgba(255,0,0,0.85)';
  ctx.lineWidth = 2;
  ctx.strokeRect(birdBox.x, birdBox.y, birdBox.w, birdBox.h);
  ctx.strokeStyle = 'rgba(0,255,255,0.75)';
  for(const pipe of game.pipes){
    const { topBox, bottomBox } = getPipeCollisionBoxes(pipe);
    ctx.strokeRect(topBox.x, topBox.y, topBox.w, topBox.h);
    ctx.strokeRect(bottomBox.x, bottomBox.y, bottomBox.w, bottomBox.h);
  }
  ctx.restore();
}

function draw(){
  drawBackground();
  for(const pipe of game.pipes) drawPipe(pipe);
  drawLandOverlay();
  for(const duck of game.ducks) drawDuck(duck);
  for(const item of game.items) drawItem(item);
  drawChicken();
  drawDebugHitboxes();
  drawPopups();
  drawText();
}

function handleSpacePress(e){
  if(e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar'){
    e.preventDefault();
    flap();
  }
}

window.addEventListener('keydown', handleSpacePress, { capture: true });
document.addEventListener('keydown', handleSpacePress, { capture: true });
canvas.addEventListener('keydown', handleSpacePress);
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  canvas.focus();
  flap();
});
canvas.addEventListener('mousedown', () => canvas.focus());
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  canvas.focus();
}, { passive: false });
window.addEventListener('gesturestart', e => e.preventDefault());
window.addEventListener('load', () => canvas.focus());
reset();
requestAnimationFrame(update);
Frame(update);
