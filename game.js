(() => {
  const canvas = document.querySelector('#game');
  const ctx = canvas.getContext('2d');
  const counter = document.querySelector('#counter');
  const hint = document.querySelector('#hint');
  const intro = document.querySelector('#intro');
  const ending = document.querySelector('#ending');
  const photoCard = document.querySelector('#photoCard');
  const photoTitle = document.querySelector('#photoTitle');
  const keys = { left:false, right:false, jump:false };
  const worldWidth = 2860;
  const spots = [
    {x:610, name:'Dandelion wishes', emoji:'🌼', color:'#ffce57'},
    {x:1430, name:'The little blue pond', emoji:'🦋', color:'#5bc4d1'},
    {x:2220, name:'A sky full of pink', emoji:'🌸', color:'#ff8a9e'}
  ];
  let W = 960, H = 540, scale = 1, cam = 0, last = 0, time = 0;
  let running = false, won = false, soundOn = true, cardTimer = 0, tapTarget = null;
  let player = {x:130, y:420, vy:0, facing:1, grounded:true};
  let saved = [false,false,false];

  function resize(){
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(r.width*dpr); canvas.height = Math.round(r.height*dpr);
    scale = canvas.height / 540; H = 540; W = canvas.width / scale;
    ctx.setTransform(scale,0,0,scale,0,0);
  }
  window.addEventListener('resize', resize); resize();
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  function roundedRect(c,x,y,w,h,r){ c.beginPath(); c.roundRect(x,y,w,h,r); }
  function circle(c,x,y,r,color){ c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill(); }
  function cloud(x,y,s){
    ctx.fillStyle='#fff9e6d9'; ctx.beginPath(); ctx.ellipse(x,y,34*s,13*s,0,0,Math.PI*2);ctx.ellipse(x-19*s,y+2*s,17*s,11*s,0,0,Math.PI*2);ctx.ellipse(x+15*s,y-7*s,21*s,16*s,0,0,Math.PI*2);ctx.fill();
  }
  function hill(x,y,w,h,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x-w,y);ctx.quadraticCurveTo(x-w*.75,y-h,x,y-h*.8);ctx.quadraticCurveTo(x+w*.6,y-h*1.25,x+w,y);ctx.closePath();ctx.fill();}
  function drawBackground(){
    const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#a8def0');sky.addColorStop(.64,'#e4f6df');sky.addColorStop(1,'#c7e9bf');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
    circle(ctx,W*.78,90,35,'#ffe9a1');
    for(let i=0;i<5;i++){let x=((i*270-time*5-cam*.14)%(W+200)+W+200)%(W+200)-80;cloud(x,70+(i%3)*49,.75+(i%2)*.22)}
    // distant rounded hills
    hill(160-cam*.12%480,399,340,150,'#9ccfba');hill(520-cam*.12%480,411,370,135,'#8dc6ad');hill(870-cam*.12%480,399,350,160,'#a6d4b8');
    for(let x=-520-(cam*.23%500);x<W+600;x+=440){hill(x+190,426,280,112,'#74b991');hill(x+395,432,250,94,'#82c49a')}
    // rolling foreground meadow
    ctx.fillStyle='#69b982';ctx.beginPath();ctx.moveTo(0,400);ctx.quadraticCurveTo(W*.24,383,W*.48,409);ctx.quadraticCurveTo(W*.76,427,W,394);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.closePath();ctx.fill();
    // trail
    ctx.fillStyle='#dcae76';ctx.beginPath();ctx.moveTo(0,424);ctx.quadraticCurveTo(W*.4,410,W*.64,432);ctx.quadraticCurveTo(W*.83,451,W,425);ctx.lineTo(W,484);ctx.quadraticCurveTo(W*.6,502,W*.35,475);ctx.quadraticCurveTo(W*.14,454,0,482);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#f4d09a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(0,434);ctx.quadraticCurveTo(W*.4,421,W*.64,441);ctx.quadraticCurveTo(W*.84,458,W,435);ctx.stroke();
  }
  function tree(x,y,s=1){
    ctx.fillStyle='#8c6544';roundedRect(ctx,x-6*s,y-48*s,12*s,50*s,5*s);ctx.fill();
    circle(ctx,x,y-65*s,27*s,'#318b68');circle(ctx,x-20*s,y-52*s,20*s,'#3d9b6e');circle(ctx,x+19*s,y-52*s,21*s,'#277e61');
    circle(ctx,x-9*s,y-76*s,3*s,'#7ebd7d');circle(ctx,x+14*s,y-57*s,3*s,'#7ebd7d');
  }
  function drawWorld(){
    // background trees move gently with the world
    for(let i=0;i<18;i++){
      const x=((i*195-cam*.62+worldWidth*2)%(worldWidth+100))-50;
      if(x-cam>-100&&x-cam<W+100) tree(x-cam,425,(i%3===0?1.12:.78)+(i%4)*.06);
    }
    // tiny wildflowers along the path
    for(let i=0;i<76;i++){
      let x=40+i*41;
      if(x-cam < -15 || x-cam > W+15) continue;
      let yy=414+Math.sin(i*2.7)*7;
      ctx.strokeStyle='#398c63';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-cam,yy+11);ctx.lineTo(x-cam,yy);ctx.stroke();
      circle(ctx,x-cam,yy,3.4,['#fff4cd','#ff9aa1','#f7cf4a'][i%3]);circle(ctx,x-cam-3,yy+2,2,'#fff4cd');
    }
    // sweet little landmarks and their photo markers
    spots.forEach((s,i)=>{
      let x=s.x-cam;if(x < -180 || x>W+180)return;
      if(i===0){
        // flower patch
        for(let j=0;j<7;j++){const fx=x-66+j*21, fy=397+(j%2)*5;ctx.strokeStyle='#38865f';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(fx,425);ctx.lineTo(fx,fy);ctx.stroke();for(let p=0;p<5;p++){let a=p*Math.PI*2/5;circle(ctx,fx+Math.cos(a)*7,fy+Math.sin(a)*7,5,['#ffe174','#ff93a1','#fff2c4'][j%3])}circle(ctx,fx,fy,3,'#ec9d48')}
        circle(ctx,x,416,16,'#ffe3a2');
      } else if(i===1){
        // pond nestled in reeds
        ctx.fillStyle='#55b8c2';ctx.beginPath();ctx.ellipse(x,440,83,27,-.04,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b9e8d9';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,438,65,16,0,0,Math.PI*2);ctx.stroke();
        for(let j=-2;j<=2;j++){ctx.strokeStyle='#388f6b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+j*25,430);ctx.quadraticCurveTo(x+j*25-5,407,x+j*25+2,397);ctx.stroke();circle(ctx,x+j*25+2,397,4,'#ffb363')}
        // butterfly
        let bx=x+10, by=345+Math.sin(time*2)*8;circle(ctx,bx-7,by,7,'#ffc759');circle(ctx,bx+7,by,7,'#ff8ca0');ctx.strokeStyle='#285b52';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx,by-5);ctx.lineTo(bx,by+5);ctx.stroke();
      } else {
        // mountain lookout with blossoms
        hill(x+26,428,128,95,'#588f79');hill(x+22,373,63,45,'#f5f0d7');hill(x+91,395,61,34,'#e9f1dc');
        for(let j=0;j<5;j++){let fx=x-57+j*28;circle(ctx,fx,410+(j%2)*6,10,'#ed7894');circle(ctx,fx-5,410,5,'#ffb3bd');circle(ctx,fx+4,410,5,'#ffb3bd')}
        // little pennant
        ctx.strokeStyle='#795b49';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+80,353);ctx.lineTo(x+80,319);ctx.stroke();ctx.fillStyle='#ff765d';ctx.beginPath();ctx.moveTo(x+80,320);ctx.lineTo(x+105,328);ctx.lineTo(x+80,336);ctx.fill();
      }
      if(!saved[i]){
        const bob=Math.sin(time*3+i)*4;
        ctx.fillStyle='#193b3a';ctx.font='900 14px system-ui';ctx.textAlign='center';ctx.fillText('PHOTO SPOT',x,320+bob);
        ctx.fillStyle=s.color;ctx.beginPath();ctx.moveTo(x,328+bob);ctx.lineTo(x-7,319+bob);ctx.lineTo(x+7,319+bob);ctx.closePath();ctx.fill();
        circle(ctx,x,357+bob,19,'#fff7ddbd');circle(ctx,x,357+bob,13,s.color);ctx.fillStyle='#fff';ctx.font='17px sans-serif';ctx.fillText(s.emoji,x,363+bob);
      }
    });
    // finish sign at the edge
    let gx=2670-cam;
    if(gx>-100&&gx<W+100){ctx.fillStyle='#81583d';roundedRect(ctx,gx-5,358,10,75,4);ctx.fill();ctx.fillStyle='#fff3d4';roundedRect(ctx,gx-69,342,138,39,10);ctx.fill();ctx.fillStyle='#426b58';ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.fillText('SLOW DOWN →',gx,367);}
  }
  function drawPlayer(){
    const x=player.x-cam, foot=player.y, bob=player.grounded?Math.sin(time*10)*1.8:0;
    ctx.save();ctx.translate(x,foot+bob);if(player.facing<0)ctx.scale(-1,1);
    // shadow
    ctx.fillStyle='#286d5660';ctx.beginPath();ctx.ellipse(0,0,34,7,0,0,Math.PI*2);ctx.fill();
    // tail
    ctx.fillStyle='#008f7a';ctx.beginPath();ctx.moveTo(-17,-85);ctx.quadraticCurveTo(-59,-105,-70,-69);ctx.quadraticCurveTo(-48,-53,-13,-62);ctx.closePath();ctx.fill();ctx.fillStyle='#fac3c2';ctx.beginPath();ctx.moveTo(-53,-76);ctx.quadraticCurveTo(-38,-60,-17,-63);ctx.lineTo(-18,-57);ctx.quadraticCurveTo(-50,-58,-61,-70);ctx.closePath();ctx.fill();
    // legs + shoes
    ctx.fillStyle='#1749bd';roundedRect(ctx,-27,-51,20,43,9);ctx.fill();roundedRect(ctx,7,-51,20,43,9);ctx.fill();
    ctx.fillStyle='#008f7a';ctx.beginPath();ctx.ellipse(-20,-8,24,13,-.1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(23,-8,25,13,.1,0,Math.PI*2);ctx.fill();
    // body jacket
    ctx.fillStyle='#68696a';ctx.beginPath();ctx.moveTo(-28,-119);ctx.quadraticCurveTo(-39,-104,-38,-72);ctx.quadraticCurveTo(-34,-52,-20,-50);ctx.lineTo(27,-50);ctx.quadraticCurveTo(39,-67,32,-101);ctx.quadraticCurveTo(26,-117,12,-121);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#b5c3c0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-12,-116);ctx.lineTo(0,-99);ctx.lineTo(13,-116);ctx.stroke();ctx.beginPath();ctx.moveTo(-19,-87);ctx.lineTo(-27,-65);ctx.moveTo(22,-90);ctx.lineTo(31,-72);ctx.stroke();
    // arms and hands
    ctx.strokeStyle='#67696a';ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-28,-108);ctx.lineTo(-40,-83);ctx.moveTo(28,-109);ctx.lineTo(38,-88);ctx.stroke();
    circle(ctx,-41,-81,9,'#008f7a');circle(ctx,39,-86,9,'#008f7a');
    // neck and big dino head
    ctx.fillStyle='#008f7a';roundedRect(ctx,-14,-132,28,21,10);ctx.fill();
    ctx.fillStyle='#078e7a';ctx.beginPath();ctx.ellipse(0,-164,57,51,-.08,0,Math.PI*2);ctx.fill();
    // orange back spikes
    ctx.fillStyle='#ff3e24';[[ -44,-194],[-55,-173],[-57,-148],[-48,-129],[-12,-211],[13,-216],[34,-207]].forEach(([sx,sy],i)=>{ctx.beginPath();ctx.moveTo(sx-8,sy+8);ctx.quadraticCurveTo(sx-12,sy-10,sx+3,sy-10);ctx.quadraticCurveTo(sx+14,sy-7,sx+9,sy+12);ctx.closePath();ctx.fill()});
    // pale muzzle
    ctx.fillStyle='#ffd1d1';ctx.beginPath();ctx.ellipse(4,-145,49,26,-.04,0,Math.PI*2);ctx.fill();
    // eye mask + eyes
    ctx.fillStyle='#101719';roundedRect(ctx,-33,-190,66,34,8);ctx.fill();
    for(const ex of [-16,13]){circle(ctx,ex,-173,11,'#fff');circle(ctx,ex+1,-173,6.5,'#111');circle(ctx,ex-2,-176,2.4,'#fff')}
    // nose and smile
    ctx.fillStyle='#005f57';ctx.beginPath();ctx.ellipse(20,-148,3.2,5,-.4,0,Math.PI*2);ctx.ellipse(36,-151,3.2,5,.25,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#171d1b';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-39,-151);ctx.quadraticCurveTo(-4,-126,42,-142);ctx.stroke();
    // camera in front of chest
    ctx.fillStyle='#151718';roundedRect(ctx,2,-91,38,27,6);ctx.fill();ctx.fillStyle='#a5a7a5';roundedRect(ctx,17,-83,37,20,5);ctx.fill();circle(ctx,49,-73,8,'#d72b25');circle(ctx,49,-73,4,'#7b151a');ctx.fillStyle='#111';roundedRect(ctx,13,-94,19,8,3);ctx.fill();
    ctx.restore();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);drawBackground();drawWorld();drawPlayer();
    // softly floating pollen
    for(let i=0;i<15;i++){let x=(i*83+time*11-cam*.2)%(W+20);let y=175+(i*47)%220+Math.sin(time+i)*8;circle(ctx,x,y,1.7,'#fff5b8aa')}
  }
  function updateHud(){
    const count=saved.filter(Boolean).length;counter.textContent=`📷 ${count} / 3`;
    if(count===3) hint.textContent='All three moments tucked away! Head for the little sign →';
    else if(player.x>spots[0].x+170&&!saved[0])hint.textContent='Wait, you missed a photo spot! Turn around and find it 🌼';
    else hint.textContent='Wander the trail and collect three little moments.';
  }
  let audio;
  function chime(){
    if(!soundOn)return;
    try{audio ||= new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
      [659,784,1047].forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,audio.currentTime+i*.09);g.gain.exponentialRampToValueAtTime(.08,audio.currentTime+i*.09+.025);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+i*.09+.27);o.connect(g);g.connect(audio.destination);o.start(audio.currentTime+i*.09);o.stop(audio.currentTime+i*.09+.3)});
    }catch(_){ }
  }
  function snap(){
    if(!running||won)return;
    const index=spots.findIndex((s,i)=>!saved[i]&&Math.abs(player.x-s.x)<155);
    if(index<0){hint.textContent='Find a glowing PHOTO SPOT to frame a little moment ✨';setTimeout(updateHud,1800);return}
    saved[index]=true;counter.textContent=`📷 ${saved.filter(Boolean).length} / 3`;
    photoTitle.textContent=`${spots[index].emoji} ${spots[index].name}!`;
    photoCard.classList.add('show');clearTimeout(cardTimer);cardTimer=setTimeout(()=>photoCard.classList.remove('show'),1900);
    chime();updateHud();
  }
  function finish(){
    won=true;running=false;document.querySelector('#endText').textContent='Three little moments, one very big deep breath. The world will still be here when you’re ready.';
    ending.classList.remove('hidden');
  }
  function frame(now){
    const dt=Math.min(.1,(now-last)/1000||0);last=now;time+=dt;
    if(running){
      let dir=(keys.right?1:0)-(keys.left?1:0);
      if(!dir&&tapTarget!==null){dir=Math.sign(tapTarget-player.x);if(Math.abs(tapTarget-player.x)<8){player.x=tapTarget;tapTarget=null;dir=0}}
      else if(dir)tapTarget=null;
      if(dir){player.x+=dir*230*dt;player.facing=dir}
      if(keys.jump&&player.grounded){player.vy=-430;player.grounded=false}
      player.vy+=1080*dt;player.y+=player.vy*dt;
      if(player.y>=420){player.y=420;player.vy=0;player.grounded=true}
      player.x=clamp(player.x,55,worldWidth-60);
      cam=clamp(player.x-W*.43,0,worldWidth-W);
      if(saved.every(Boolean)&&player.x>=2620){finish()}
    }
    draw();requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  document.querySelector('#start').addEventListener('click',()=>{intro.classList.add('hidden');running=true;last=performance.now()});
  document.querySelector('#again').addEventListener('click',()=>{
    saved=[false,false,false];player={x:130,y:420,vy:0,facing:1,grounded:true};cam=0;tapTarget=null;won=false;running=true;ending.classList.add('hidden');updateHud();
  });
  document.querySelector('#sound').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.textContent=soundOn?'♪':'♫̸';e.currentTarget.setAttribute('aria-label',soundOn?'Mute sound':'Enable sound')});
  const keyMap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',Space:'jump',KeyW:'jump'};
  window.addEventListener('keydown',e=>{
    const action=keyMap[e.code];if(action){e.preventDefault();keys[action]=true;if(action==='left'||action==='right')tapTarget=null}
    if(e.code==='KeyE'||e.code==='Enter'){e.preventDefault();snap()}
  });
  window.addEventListener('keyup',e=>{const action=keyMap[e.code];if(action){e.preventDefault();keys[action]=false}});
  window.addEventListener('blur',()=>{keys.left=keys.right=keys.jump=false});
  document.querySelectorAll('.control').forEach(button=>{
    const action=button.dataset.key;
    const press=e=>{e.preventDefault();button.classList.add('pressed');if(action==='photo')snap();else keys[action]=true};
    const release=e=>{e.preventDefault();button.classList.remove('pressed');if(action!=='photo')keys[action]=false};
    button.addEventListener('pointerdown',press);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  });
  canvas.addEventListener('pointerdown',e=>{
    if(!running)return;
    const rect=canvas.getBoundingClientRect(),px=e.clientX-rect.left;
    // Tap the walking space to stroll toward that point; tap a nearby subject to snap.
    const tapWorld=px/rect.width*W+cam;
    const nearby=spots.findIndex((s,i)=>!saved[i]&&Math.abs(tapWorld-s.x)<75&&Math.abs(player.x-s.x)<160);
    if(nearby>=0){snap();return}
    if(Math.abs(tapWorld-player.x)>35){tapTarget=clamp(tapWorld,55,worldWidth-60)}
  });
})();
