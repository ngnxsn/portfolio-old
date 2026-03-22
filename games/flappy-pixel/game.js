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
  'Thất bại là mẹ thành công, còn bạn đang gặp mẹ hơi nhiều.'
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
    bird:{x:100,y:H/2-40,vy:0,w:42,h:34,frame:0,shieldTimer:0,invincibleTimer:0,shieldUsed:false},
    pipes:[],
    items:[],
    ducks:[],
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
  scoreEl.textContent='0';
  levelEl.textContent='1';
  livesEl.textContent='1';
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
  const gapSpace = targetPipe.gap - itemSize;
  if(gapSpace <= 36) return;

  const bandSize = Math.max(18, gapSpace * 0.22);
  const topBandStart = targetPipe.top + 10;
  const topBandEnd = topBandStart + bandSize;
  const bottomBandEnd = targetPipe.top + targetPipe.gap - itemSize - 10;
  const bottomBandStart = bottomBandEnd - bandSize;
  const useTopBand = Math.random() < 0.5;

  const y = useTopBand
    ? topBandStart + Math.random() * Math.max(4, topBandEnd - topBandStart)
    : bottomBandStart + Math.random() * Math.max(4, bottomBandEnd - bottomBandStart);

  game.items.push({
    x: targetPipe.x + PIPE_W + 8,
    y,
    type,
    collected:false,
    anchorPipe: targetPipe,
    offsetX: PIPE_W + 8,
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

    game.pipes = game.pipes.filter(p => p.x + PIPE_W > -20);
    game.items = game.items.filter(i => i.x > -24 && !i.collected);
    game.ducks = game.ducks.filter(d => d.x + d.w > -20);
    game.popups = game.popups.filter(p => p.life > 0);

    const birdBox = {x:game.bird.x+6, y:game.bird.y+4, w:game.bird.w-12, h:game.bird.h-8};

    for(const pipe of game.pipes){
      const topBox = {x:pipe.x-10, y:0, w:PIPE_W+20, h:pipe.top};
      const bottomBox = {x:pipe.x-10, y:pipe.top+pipe.gap, w:PIPE_W+20, h:H-GROUND_H-(pipe.top+pipe.gap)};
      if(rectsOverlap(birdBox, topBox) || rectsOverlap(birdBox, bottomBox)) hitBird();
    }

    for(const duck of game.ducks){
      const box = {x:duck.x+2, y:duck.y+4, w:duck.w-4, h:duck.h-6};
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
          addPopup('Bảo vệ 1 lần trong 10 giây', '#8ecae6');
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

function drawBackground(){
  const sky = ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#cdefff');
  sky.addColorStop(1,'#f6fbff');
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
  drawSun();
  for(let i=0;i<5;i++){
    const x = ((i*110 - game.bgOffset) % (W+120)) - 60;
    const y = 84 + (i%2)*28;
    drawCloud(x,y);
  }
  drawDistantHills();
  drawFarmHouse(40,H-GROUND_H-92,82,58);
  drawBarn(304,H-GROUND_H-92,88,58);
  drawRiceField();
}
function drawSun(){ ctx.fillStyle='#ffe49d'; ctx.fillRect(330,78,26,26); ctx.fillStyle='#fff2c4'; ctx.fillRect(336,84,14,14); }
function drawCloud(x,y){ ctx.fillStyle='#ffffffdd'; ctx.fillRect(x,y,42,14); ctx.fillRect(x+10,y-10,22,12); ctx.fillRect(x+28,y-6,18,10); }
function drawDistantHills(){ ctx.fillStyle='#97c98b'; ctx.fillRect(0,H-GROUND_H-78,W,30); for(let x=0;x<W;x+=36) ctx.fillRect(x,H-GROUND_H-90-(x%72===0?12:0),36,42); }
function drawFarmHouse(x,y,w,h){ ctx.fillStyle='#f3dfbb'; ctx.fillRect(x,y+18,w,h-18); ctx.fillStyle='#bf5c3f'; for(let i=0;i<w/8;i++) ctx.fillRect(x+i*8,y+8-Math.abs(i-(w/16))*2,8,10); ctx.fillStyle='#7a4a29'; ctx.fillRect(x+30,y+34,18,24); ctx.fillStyle='#8cc6ff'; ctx.fillRect(x+10,y+30,12,10); ctx.fillRect(x+58,y+30,12,10); }
function drawBarn(x,y,w,h){ ctx.fillStyle='#c45a42'; ctx.fillRect(x,y+16,w,h-16); ctx.fillStyle='#8a2f25'; for(let i=0;i<w/8;i++) ctx.fillRect(x+i*8,y+6-Math.abs(i-(w/16))*2,8,10); ctx.fillStyle='#f6e7c8'; ctx.fillRect(x+34,y+28,20,30); ctx.fillStyle='#8a2f25'; ctx.fillRect(x+42,y+28,4,30); }
function drawRiceField(){
  ctx.fillStyle='#a5d86e'; ctx.fillRect(0,H-GROUND_H-6,W,GROUND_H+6);
  ctx.fillStyle='#8bc34a'; ctx.fillRect(0,H-GROUND_H+8,W,GROUND_H-8);
  for(let x=0;x<W;x+=8){
    const sway = Math.sin((x + game.bgOffset) * 0.05) * 2;
    ctx.fillStyle='#6fa93a'; ctx.fillRect(x,H-GROUND_H-4+sway,2,18);
    ctx.fillStyle='#d9c96a'; ctx.fillRect(x+2,H-GROUND_H+2+sway,2,12);
    ctx.fillStyle='#7bbf45'; ctx.fillRect(x+4,H-GROUND_H-2+sway,2,16);
  }
  ctx.fillStyle='#6db5d8'; for(let x=4;x<W;x+=52) ctx.fillRect(x,H-GROUND_H+30,28,4);
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
function drawPipe(pipe){
  drawBambooSegment(pipe.x,0,pipe.top,pipe.tilt||0,false);
  const bottomY = pipe.top + pipe.gap;
  drawBambooSegment(pipe.x,bottomY,H-GROUND_H-bottomY,-(pipe.tilt||0),true);
}
function drawItem(item){
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
function drawDuck(d){
  const flap = ((Math.floor((game.time/120)+d.flapOffset))%2)===0;
  ctx.fillStyle='#fff3b0'; ctx.fillRect(d.x+6,d.y+8,18,10);
  ctx.fillStyle='#f4d35e'; ctx.fillRect(d.x+8,d.y+6,14,10);
  ctx.fillStyle='#111'; ctx.fillRect(d.x+18,d.y+8,2,2);
  ctx.fillStyle='#f77f00'; ctx.fillRect(d.x+24,d.y+10,8,3);
  ctx.fillStyle='#f9c74f';
  if(flap) ctx.fillRect(d.x+10,d.y+14,9,5); else ctx.fillRect(d.x+10,d.y+18,9,4);
}
function drawChicken(){
  const b = game.bird; const wingUp = Math.floor(b.frame)%2===0;
  ctx.save();
  ctx.translate(b.x+b.w/2,b.y+b.h/2);
  ctx.rotate(Math.max(-0.35,Math.min(1,b.vy*0.06)));
  ctx.translate(-b.w/2,-b.h/2);
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
    ctx.strokeStyle = 'rgba(142,202,230,0.18)';
    ctx.beginPath();
    ctx.arc(21,17,19,0,Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(142,202,230,${0.45 + shieldRatio * 0.55})`;
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
  pixelText('FLAPPY',W/2,54,4,'#fff9e6',true);
  pixelText('GA PIXEL',W/2,80,4,'#ffe082',true);
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

function draw(){
  drawBackground();
  for(const pipe of game.pipes) drawPipe(pipe);
  for(const item of game.items) drawItem(item);
  for(const duck of game.ducks) drawDuck(duck);
  drawChicken();
  drawPopups();
  drawText();
}

window.addEventListener('keydown', e => {
  if(e.code === 'Space'){ e.preventDefault(); flap(); }
});
canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  flap();
});
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
}, { passive: false });
window.addEventListener('gesturestart', e => e.preventDefault());
reset();
requestAnimationFrame(update);
