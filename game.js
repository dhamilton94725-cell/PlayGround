import * as THREE from 'three';

const host=document.querySelector('#game');
const scene=new THREE.Scene();
scene.background=new THREE.Color('#c9eee5');
scene.fog=new THREE.Fog('#c9eee5',38,155);
const camera=new THREE.PerspectiveCamera(42,innerWidth/innerHeight,.1,240);
camera.position.set(0,6.1,13.8);camera.lookAt(0,1.35,-5.5);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
host.appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight('#e8fff5','#a27854',2.1);scene.add(hemi);
const sun=new THREE.DirectionalLight('#fff0d4',3.2);sun.position.set(-11,20,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-22;sun.shadow.camera.right=22;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-24;scene.add(sun);
const fill=new THREE.DirectionalLight('#a3e6dc',.75);fill.position.set(10,8,-20);scene.add(fill);
const mats={
 road:new THREE.MeshStandardMaterial({color:'#657b75',roughness:.92}),
 sidewalk:new THREE.MeshStandardMaterial({color:'#e4cbaa',roughness:1}),
 grass:new THREE.MeshStandardMaterial({color:'#87b77d',roughness:1}),
 stripe:new THREE.MeshStandardMaterial({color:'#f9e9bd',roughness:.8}),
 teal:new THREE.MeshStandardMaterial({color:'#058d7e',roughness:.72}),
 red:new THREE.MeshStandardMaterial({color:'#f44d36',roughness:.75}),
 black:new THREE.MeshStandardMaterial({color:'#172629',roughness:.5}),
 white:new THREE.MeshStandardMaterial({color:'#fff8e9',roughness:.85}),
 gray:new THREE.MeshStandardMaterial({color:'#55585a',roughness:.92}),
 blue:new THREE.MeshStandardMaterial({color:'#1548c7',roughness:.82}),
 pink:new THREE.MeshStandardMaterial({color:'#ffd0d0',roughness:.88}),
 gold:new THREE.MeshStandardMaterial({color:'#ffc456',metalness:.25,roughness:.34})
};
const mat=(color,roughness=.85)=>new THREE.MeshStandardMaterial({color,roughness});
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,20,16),coneGeo=new THREE.ConeGeometry(1,1,8),cylGeo=new THREE.CylinderGeometry(1,1,1,16);
function mesh(geo,material,parent=scene){const o=new THREE.Mesh(geo,material);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(parent,material,x,y,z,sx,sy,sz){const o=mesh(boxGeo,material,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}
function ball(parent,material,x,y,z,sx,sy,sz){const o=mesh(sphereGeo,material,parent);o.position.set(x,y,z);o.scale.set(sx,sy,sz);return o;}

// Track, city pieces, Rex and the gameplay objects are composed from low-poly primitives.
const ground=mesh(new THREE.PlaneGeometry(600,280),mats.grass);ground.rotation.x=-Math.PI/2;ground.position.set(0,-.18,-45);ground.receiveShadow=true;
const road=mesh(new THREE.PlaneGeometry(10.6,280),mats.road);road.rotation.x=-Math.PI/2;road.position.set(0,-.09,-45);road.receiveShadow=true;
const sidewalks=[];for(const x of [-6.25,6.25]){const p=mesh(new THREE.PlaneGeometry(1.7,280),mats.sidewalk);p.rotation.x=-Math.PI/2;p.position.set(x,-.1,-45);sidewalks.push(p);}

const laneDashes=[];
for(let i=0;i<32;i++)for(const x of [-1.77,1.77]){const d=box(scene,mats.stripe,x,-.045,-i*6-7,.075,.025,2.6);d.castShadow=false;laneDashes.push(d);}

const hero=new THREE.Group();hero.position.set(0,0,2.2);scene.add(hero);
const body=new THREE.Group();hero.add(body);
const teal=mats.teal, red=mats.red, dark=mats.black, pink=mats.pink, shirt=mats.gray, pants=mats.blue;
// Short legs and oversized boots.
const legs=[];
for(const side of [-1,1]){
 const leg=new THREE.Group();leg.position.set(side*.24,.8,0);body.add(leg);legs.push(leg);
 const shin=mesh(new THREE.CapsuleGeometry(.17,.58,4,8),pants,leg);shin.position.y=-.12;
 const boot=ball(leg,teal,side*.02,-.52,.1,.31,.19,.4);
 const arm=new THREE.Group();arm.position.set(side*.48,1.8,0);body.add(arm);arm.name=side<0?'leftArm':'rightArm';
 const sleeve=mesh(new THREE.CapsuleGeometry(.14,.46,4,8),shirt,arm);sleeve.rotation.z=side*.45;sleeve.position.set(side*.08,-.13,0);
 const hand=ball(arm,teal,side*.18,-.4,.02,.2,.17,.18);
}
const torso=mesh(new THREE.CapsuleGeometry(.47,.85,5,10),shirt,body);torso.position.set(0,1.55,0);torso.scale.set(1,.95,.8);
// Big friendly dino head, muzzle, goggles and red crest, inspired by the supplied drawing.
const head=new THREE.Group();head.position.set(0,2.72,.05);body.add(head);
ball(head,teal,0,.24,0,.93,.91,.78);
ball(head,pink,-.05,-.2,.52,.79,.45,.4);
const goggles=box(head,dark,0,.49,.695,1.48,.57,.16);goggles.rotation.x=-.06;
for(const x of [-.36,.36]){
 ball(head,mats.white,x,.51,.79,.24,.25,.075);
 ball(head,dark,x+.035,.5,.855,.135,.17,.055);
 ball(head,mats.white,x+.065,.57,.9,.055,.06,.025);
}
for(const x of [-.19,.25]){const nostril=ball(head,dark,x,-.02,.87,.075,.14,.05);nostril.rotation.z=x<0?-.3:.3;}
const smile=mesh(new THREE.TorusGeometry(.36,.035,8,24,Math.PI),dark,head);smile.position.set(.03,-.21,.91);smile.rotation.z=Math.PI;
for(let i=0;i<4;i++){const spike=mesh(coneGeo,red,head);spike.position.set(-.6-i*.04,.93-i*.31,-.17);spike.scale.set(.21,.42,.2);spike.rotation.z=-.8;}
const crownSpike=mesh(coneGeo,red,head);crownSpike.position.set(0,1.08,-.2);crownSpike.scale.set(.27,.48,.25);crownSpike.rotation.z=.25;
// Camera prop on Rex's chest: oversized, readable silhouette and ruby lens.
const cameraProp=new THREE.Group();cameraProp.position.set(.08,1.45,.64);body.add(cameraProp);
box(cameraProp,dark,0,0,0,.9,.52,.28);box(cameraProp,mat('#71797a'),.05,-.02,.18,.58,.34,.1);
const lens=mesh(new THREE.CylinderGeometry(.13,.13,.09,18),mat('#d73534',.3),cameraProp);lens.rotation.x=Math.PI/2;lens.position.set(.25,-.02,.26);
const lensCore=ball(cameraProp,mat('#ff8565',.25),.25,-.02,.31,.055,.055,.025);
box(cameraProp,dark,-.16,.32,0,.28,.1,.22);

const arms=body.children.filter(c=>c.name==='leftArm'||c.name==='rightArm');
const player={lane:1,targetLane:1,jump:0,duck:0,vy:0,hit:false};
const lanes=[-2.85,0,2.85];
let obstacles=[],pickups=[],decor=[],districtSegments=[];
const districts=[
 {name:'DOWNTOWN',colors:['#ef9b7c','#70bdb0','#f1c675','#829fc5'],accent:'#f45e4d',kind:'city'},
 {name:'FACTORY ROW',colors:['#d49c69','#e2b974','#87aaa2','#ca806e'],accent:'#e79b49',kind:'factory'},
 {name:'SUNNY SIDE CLINIC',colors:['#90c8bc','#fff2d6','#b0d7d0','#efa88f'],accent:'#ed7c69',kind:'clinic'},
 {name:'OLD TOWN',colors:['#d48769','#e6b868','#93b3a0','#d3a279'],accent:'#bb5948',kind:'old'},
 {name:'GREEN PARK',colors:['#9cc88a','#ecc980','#7ebcaf','#e7a58d'],accent:'#55a87d',kind:'park'}
];
let activeDistrict=0;

function makeTree(parent,x,z,scale=1){
 const trunk=mesh(new THREE.CylinderGeometry(.13,.21,1.3,7),mat('#9a704e'),parent);trunk.position.set(x,.55,z);trunk.scale.setScalar(scale);
 for(let i=0;i<3;i++){const crown=mesh(new THREE.IcosahedronGeometry(.66-i*.09,1),mat(['#66a979','#81b978','#a1c47b'][i]),parent);crown.position.set(x+(i-1)*.18,1.35+i*.36,z);crown.scale.setScalar(scale);}
}
function makeBuilding(parent,x,z,side,district,index){
 const palette=district.colors;const color=palette[index%palette.length];
 const width=3.4+Math.random()*1.7,height=5.5+Math.random()*8,depth=4.2+Math.random()*2.2;
 const baseX=x+side*(4.7+Math.random()*1.8);
 const building=box(parent,mat(color),baseX,height/2-.08,z,width,height,depth);
 // stepped rooftop and playful signs make each block instantly distinct
 if(district.kind==='factory'){
  const roof=box(parent,mat('#7d7770'),baseX,height+.18,z,width*.78,.35,depth*.75);
  for(let n=0;n<2;n++){const chimney=mesh(new THREE.CylinderGeometry(.22,.29,2.4,8),mat('#c67c60'),parent);chimney.position.set(baseX-width*.28+n*width*.5,height+1.5,z);}
  for(let n=-1;n<=1;n++){const win=box(parent,mat('#f9d79c'),baseX+n*.75,height*.58,z+depth/2+.03,.38,.32,.07);}
 }else if(district.kind==='old'){
  const roof=mesh(new THREE.ConeGeometry(width*.72,2.6,4),mat('#a94d3c'),parent);roof.position.set(baseX,height+1,z);roof.rotation.y=Math.PI/4;
  for(let n=-1;n<=1;n++){const win=box(parent,mat('#ffe3a3'),baseX+n*.8,height*.55,z+depth/2+.04,.48,.75,.08);}
 }else if(district.kind==='clinic'){
  for(let n=-1;n<=1;n++){box(parent,mat('#fff6de'),baseX+n*.8,height*.6,z+depth/2+.04,.54,.8,.08);}
  if(index%2===0){box(parent,mat('#f27468'),baseX,height*.78,z+depth/2+.11,.18,.76,.06);box(parent,mat('#f27468'),baseX,height*.78,z+depth/2+.11,.62,.18,.06);}
 }else{
  const roof=box(parent,mat(index%2?'#f4dbab':'#df755b'),baseX,height+.15,z,width*.7,.3,depth*.8);
  for(let row=0;row<Math.min(4,Math.floor(height/2.3));row++)for(let col=-1;col<=1;col++){
   const win=box(parent,mat(index%3?'#ffe9b8':'#b8e4d6'),baseX+col*.76,1.2+row*2.15,z+depth/2+.04,.44,.72,.07);
   if(index%4===0)win.material=mat('#d6eef0');
  }
  if(index%3===0){const awning=box(parent,mat(district.accent),baseX,1.05,z+depth/2+.23,1.9,.26,.56);}
 }
 // Storefront awning / door
 box(parent,mat('#5f736c'),baseX,.85,z+depth/2+.08,.72,1.65,.12);
 for(let n=-1;n<=1;n++){const lamp=ball(parent,mat('#f5d992'),baseX+n*.8,height*.83,z+depth/2+.08,.12,.12,.08);}
}
function makeSegment(index,z){
 const root=new THREE.Group();root.position.z=z;scene.add(root);
 const district=districts[index%districts.length];
 // Build symmetric but varied streetscapes; keep the run corridor entirely open.
 for(const side of [-1,1]){
  for(let b=0;b<2;b++)makeBuilding(root,side*(3+b*10),-7-b*21,side,district,index+b+(side>0?2:0));
  if(district.kind==='park')for(let t=0;t<3;t++)makeTree(root,side*(4.9+Math.random()*2),-4-t*14,.8+Math.random()*.5);
  else if(index%2===0)makeTree(root,side*4.9,-27,.72);
 }
 // Decorative block corner bollards
 for(const side of [-1,1]){
  const post=mesh(new THREE.CylinderGeometry(.08,.12,.65,8),mat('#f0b968'),root);post.position.set(side*5.25,.25,-2);
 }
 return root;
}
function setDistrict(index){activeDistrict=index%districts.length;const d=districts[activeDistrict];document.querySelector('#districtLabel').textContent=d.name;}
for(let i=0;i<5;i++)districtSegments.push(makeSegment(i,-i*52-18));

function makeObstacle(lane,type,z){
 const root=new THREE.Group();root.position.set(lanes[lane],0,z);scene.add(root);
 if(type==='jump'){
  const barrier=box(root,mat('#f2744d'),0,.58,0,1.95,1.05,.48);
  for(let i=-1;i<=1;i++){
   const stripe=box(root,mat('#ffe0a4'),i*.57,.58,.25,.23,1.05,.035);stripe.rotation.z=.36;
  }
  for(const x of [-.78,.78]){const foot=box(root,mat('#8d4a3e'),x,.13,0,.22,.3,.62);}
  root.userData={type,height:1.28};
 }else if(type==='slide'){
  for(const x of [-.82,.82]){const pole=mesh(new THREE.CylinderGeometry(.1,.13,1.9,10),mat('#54a99b'),root);pole.position.set(x,.95,0);}
  box(root,mat('#3f8d86'),0,1.8,0,2.05,.35,.55);
  box(root,mat('#f8dfaa'),0,1.8,.29,1.7,.1,.04);
  root.userData={type,height:1.15};
 }else{
  const block=box(root,mat('#edb65f'),0,.85,0,2,1.7,.8);
  const stripe=box(root,mat('#fff0c8'),0,.85,.42,1.8,.18,.04);
  const mark=box(root,mat('#e97658'),0,1.32,.44,.62,.18,.04);
  root.userData={type:'block',height:2};
 }
 root.userData.lane=lane;root.userData.passed=false;obstacles.push(root);
}
function makePickup(lane,z){
 const g=new THREE.Group();g.position.set(lanes[lane],1.28,z);scene.add(g);
 const ring=mesh(new THREE.TorusGeometry(.44,.1,10,24),mats.gold,g);ring.rotation.y=.22;
 const card=box(g,mat('#fff5d6'),0,0,.03,.43,.48,.12);
 const dot=ball(g,mat('#f26150'),.08,.04,.12,.11,.11,.045);
 box(g,mat('#f4a44b'),-.04,-.15,.12,.24,.055,.025);
 g.userData={spin:Math.random()*4};pickups.push(g);
}
const worldItems=[];
function spawnWave(){
 if(Math.random()<.66){
  const lane=Math.floor(Math.random()*3),types=['jump','slide','block'];
  const type=types[Math.floor(Math.random()*types.length)];makeObstacle(lane,type,-108);
  if(Math.random()<.66){const other=(lane+1+Math.floor(Math.random()*2))%3;for(let i=0;i<3;i++)makePickup(other,-98-i*4.6);}
 }else{
  const lane=Math.floor(Math.random()*3);for(let i=0;i<5;i++)makePickup(lane,-108-i*4.5);
 }
}

const startScreen=document.querySelector('#startScreen'),pauseScreen=document.querySelector('#pauseScreen'),overScreen=document.querySelector('#gameOverScreen');
const hud=document.querySelector('#hud'),distanceNode=document.querySelector('#distance'),snapsNode=document.querySelector('#snaps');
let state='ready',elapsed=0,distance=0,snapCount=0,speed=22,spawnTimer=1.3,toastTimer=0;
let soundOn=false,audioContext=null;
function playTone(freq=680,duration=.11){
 if(!soundOn)return;
 try{audioContext??=new AudioContext();const osc=audioContext.createOscillator(),gain=audioContext.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.055,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+duration);}catch{}
}
function showToast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');toastTimer=1.1;}
function clearMovingObjects(){for(const o of [...obstacles,...pickups])scene.remove(o);obstacles=[];pickups=[];}
function resetRun(){
 clearMovingObjects();elapsed=0;distance=0;snapCount=0;speed=22;spawnTimer=1.15;
 player.lane=1;player.targetLane=1;player.jump=0;player.vy=0;player.duck=0;player.hit=false;
 body.position.set(0,0,0);body.scale.set(1,1,1);
 for(let i=0;i<districtSegments.length;i++){scene.remove(districtSegments[i]);districtSegments[i]=makeSegment(i,-i*52-18);}
 setDistrict(0);distanceNode.textContent='000';snapsNode.textContent='0';
}
function beginRun(){resetRun();state='playing';startScreen.classList.add('hidden');pauseScreen.classList.add('hidden');overScreen.classList.add('hidden');hud.classList.add('active');document.querySelector('#mobileControls').style.display='';playTone(480,.16);}
function pauseRun(){if(state==='playing'){state='paused';pauseScreen.classList.remove('hidden');}else if(state==='paused'){state='playing';pauseScreen.classList.add('hidden');}}
function finishRun(){
 if(state!=='playing')return;state='over';hud.classList.remove('active');
 document.querySelector('#finalDistance').textContent=Math.floor(distance).toString();document.querySelector('#finalSnaps').textContent=snapCount;
 const message=snapCount>15?'You got the whole city on camera!':snapCount>6?'Rex nailed a few postcard moments.':'The city looks good on you.';document.querySelector('#runMessage').textContent=message;
 overScreen.classList.remove('hidden');playTone(190,.32);
}
function moveLane(dir){if(state!=='playing')return;player.targetLane=THREE.MathUtils.clamp(player.targetLane+dir,0,2);}
function jump(){if(state!=='playing')return;if(player.jump<=.015&&player.duck<.1){player.vy=8.5;playTone(360,.08);}}
function duck(){if(state==='playing'&&player.jump<.3){player.duck=.65;}}
function action(name){if(name==='left')moveLane(-1);if(name==='right')moveLane(1);if(name==='jump')jump();if(name==='duck')duck();}

document.querySelector('#startButton').addEventListener('click',beginRun);
document.querySelector('#restartButton').addEventListener('click',beginRun);
document.querySelector('#pauseButton').addEventListener('click',pauseRun);
document.querySelector('#resumeButton').addEventListener('click',pauseRun);
document.querySelector('#soundButton').addEventListener('click',e=>{soundOn=!soundOn;e.currentTarget.classList.toggle('sound-on',soundOn);e.currentTarget.textContent=soundOn?'♫':'♩';if(soundOn)playTone(640,.08);});
window.addEventListener('keydown',e=>{
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','a','d','w','s'].includes(e.key))e.preventDefault();
 if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')moveLane(-1);
 if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')moveLane(1);
 if(e.key==='ArrowUp'||e.key===' '||e.key.toLowerCase()==='w')jump();
 if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')duck();
 if(e.key.toLowerCase()==='p'||e.key==='Escape')pauseRun();
 if(state==='ready'&&e.key==='Enter')beginRun();
});
document.querySelectorAll('.mobile-controls button').forEach(button=>{
 const act=()=>action(button.dataset.action);button.addEventListener('pointerdown',e=>{e.preventDefault();act();});
});
let touchStart=null;
renderer.domElement.addEventListener('touchstart',e=>{if(e.touches.length)touchStart=[e.touches[0].clientX,e.touches[0].clientY];},{passive:true});
renderer.domElement.addEventListener('touchend',e=>{
 if(!touchStart||state!=='playing')return;const dx=e.changedTouches[0].clientX-touchStart[0],dy=e.changedTouches[0].clientY-touchStart[1];
 if(Math.max(Math.abs(dx),Math.abs(dy))<24)jump();else if(Math.abs(dx)>Math.abs(dy))moveLane(dx<0?-1:1);else if(dy<0)jump();else duck();touchStart=null;
},{passive:true});

let nextDistrictIndex=5;
function updateGame(dt,time){
 // Rex's jaunty jog continues on the title screen too.
 const runTime=state==='playing'?elapsed:time*.75;
 const cadence=state==='playing'?10+speed*.04:6.5;
 legs[0].rotation.x=Math.sin(runTime*cadence)*.46;legs[1].rotation.x=-legs[0].rotation.x;
 const left=arms.find(a=>a.name==='leftArm'),right=arms.find(a=>a.name==='rightArm');
 if(left){left.rotation.x=Math.sin(runTime*cadence+Math.PI)*.34;left.rotation.z=-.12;}
 if(right){right.rotation.x=Math.sin(runTime*cadence)*.34;right.rotation.z=.12;}
 head.rotation.z=Math.sin(time*2.4)*.025;cameraProp.rotation.z=Math.sin(runTime*cadence)*.025;
 if(state!=='playing')return;
 elapsed+=dt;speed=Math.min(35,22+elapsed*.19);distance+=speed*dt*.19;
 distanceNode.textContent=Math.floor(distance).toString().padStart(3,'0');
 const laneX=lanes[player.targetLane];hero.position.x=THREE.MathUtils.damp(hero.position.x,laneX,12,dt);
 if(player.jump>0||player.vy>0){player.jump+=player.vy*dt;player.vy-=22*dt;if(player.jump<=0){player.jump=0;player.vy=0;}}
 player.duck=Math.max(0,player.duck-dt);body.position.y=player.jump;const duckScale=player.duck>0?THREE.MathUtils.lerp(1,.63,Math.min(1,player.duck/.15)):1;body.scale.y=duckScale;
 hero.position.y=0;
 for(const d of laneDashes){d.position.z+=speed*dt;if(d.position.z>14)d.position.z-=192;}
 for(let i=0;i<districtSegments.length;i++){
  const seg=districtSegments[i];seg.position.z+=speed*dt;
  if(seg.position.z>35){scene.remove(seg);const minZ=Math.min(...districtSegments.map(o=>o.position.z));districtSegments[i]=makeSegment(nextDistrictIndex++,minZ-52);}
 }
 const zone=Math.floor(distance/100)%districts.length;if(zone!==activeDistrict)setDistrict(zone);
 spawnTimer-=dt;if(spawnTimer<=0){spawnWave();spawnTimer=Math.max(1.05,1.52-elapsed*.004)+Math.random()*.38;}
 for(let i=obstacles.length-1;i>=0;i--){
  const o=obstacles[i];o.position.z+=speed*dt;
  if(!o.userData.passed&&o.position.z>3.5){o.userData.passed=true;distance+=8;}
  const close=Math.abs(o.position.z-hero.position.z)<1.35&&Math.abs(o.position.x-hero.position.x)<1.22;
  if(close){
   const type=o.userData.type;let safe=false;
   if(type==='jump')safe=player.jump>1.28;
   else if(type==='slide')safe=player.duck>.1;
   if(!safe){player.hit=true;hero.rotation.z=.16;finishRun();break;}
  }
  if(o.position.z>18){scene.remove(o);obstacles.splice(i,1);}
 }
 for(let i=pickups.length-1;i>=0;i--){const p=pickups[i];p.position.z+=speed*dt;p.rotation.y+=dt*2.4;p.position.y=1.28+Math.sin(time*3+p.userData.spin)*.16;
  if(Math.abs(p.position.z-hero.position.z)<1.5&&Math.abs(p.position.x-hero.position.x)<1.35){snapCount++;snapsNode.textContent=snapCount;scene.remove(p);pickups.splice(i,1);playTone(720+Math.min(snapCount*9,360),.12);if(snapCount%5===0)showToast('✦ PHOTO STREAK!');continue;}
  if(p.position.z>16){scene.remove(p);pickups.splice(i,1);}
 }
 if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)document.querySelector('#toast').classList.remove('show');}
}
const clock=new THREE.Clock();let raf=0;
function frame(){raf=requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.045);updateGame(dt,clock.elapsedTime);renderer.render(scene,camera);}
frame();
function resize(){const w=innerWidth,h=innerHeight;camera.aspect=w/h;camera.fov=w<650?47:42;camera.position.set(0,w<650?6.6:6.1,w<650?15.6:13.8);camera.lookAt(0,1.35,-5.5);camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.setSize(w,h);}
window.addEventListener('resize',resize);
