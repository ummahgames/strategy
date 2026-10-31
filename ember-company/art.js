(function(root){
'use strict';
const {W,H,MAPS,ITEMS,alive,active,reachable,validTarget}=root.EmberEngine;
const sprite=(ctx,u,x,y,scale=3,flip=false)=>root.EmberCharacters.draw(ctx,u,x,y,scale,flip);
const rand=(x,y,k)=>{const n=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return n-Math.floor(n);};
let terrainCache,terrainTiles,terrainBiome,lastCamp;
const campImage=typeof Image==='function'?new Image():null;
if(campImage){campImage.onload=()=>{if(lastCamp)drawCamp(...lastCamp);};campImage.src='assets/caravan-camp.png';}
function tools(ctx){
 const shape=(d,fill,stroke,width=.18)=>{const p=new Path2D(d);if(fill){ctx.fillStyle=fill;ctx.fill(p);}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(p);}};
 const ellipse=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
 const stroke=(d,color,width=.2)=>shape(d,null,color,width);
 const gradient=(x,y,r,a,b)=>{const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,a);g.addColorStop(1,b);return g;};
 const rect=(x,y,w,h,r,fill,outline)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(outline){ctx.strokeStyle=outline;ctx.lineWidth=.2;ctx.stroke();}};
 return {shape,ellipse,stroke,gradient,rect};
}
function tree(ctx,x,y,biome,k){
 const {shape,ellipse,stroke,gradient}=tools(ctx);
 ellipse(x+1,y+4,6,2.6,'#233f3330');
 if(biome==='islands'){
  stroke(`M${x} ${y+4} Q${x+1} ${y-1} ${x+2} ${y-7}`,'#8c7049',1.1);stroke(`M${x-.2} ${y+3} Q${x+1} ${y-2} ${x+2} ${y-7}`,'#c5a46e',.35);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7,dx=Math.cos(a)*7,dy=Math.sin(a)*3;shape(`M${x+2} ${y-6} Q${x+dx} ${y-10+dy} ${x+2+dx} ${y-3+dy} Q${x+dx*.6} ${y-7+dy} ${x+2} ${y-6}`,i%2?'#42765c':'#65916a');}
 }else if(biome==='pass'){
  stroke(`M${x} ${y+4} L${x} ${y-7}`,'#846847',.9);
  for(let i=0;i<4;i++){const yy=y-10+i*3,w=2+i*1.5;shape(`M${x} ${yy-2} Q${x-w} ${yy+2} ${x-w} ${yy+3} Q${x} ${yy+4} ${x+w} ${yy+3} Q${x+w*.8} ${yy+1} ${x} ${yy-2}`,gradient(x-1,yy,7,'#7e9a73','#3d6555'));}
 }else{
  const thick=biome==='grove';shape(`M${x-1} ${y+4} Q${x-1.6} ${y-1} ${x-.5} ${y-5} L${x+1} ${y-5} Q${x+1} ${y} ${x+2} ${y+4}`,thick?'#a58864':'#80684a');
  if(thick){stroke(`M${x} ${y+3} L${x} ${y-4}`,'#d2b082',.6);}
  stroke(`M${x} ${y-2} L${x-4} ${y-6} M${x} ${y-3} L${x+4} ${y-6}`,'#826b49',.6);
  for(let i=0;i<9;i++){const xx=x+Math.cos(i*2.4)*(i%3+1)*1.8,yy=y-6+Math.sin(i*2.4)*1.7;ellipse(xx,yy,2.7+rand(i,k,2),1.6+rand(i,k,3),gradient(xx-.6,yy-.7,4,i%2?'#a9b780':'#86a16e','#42684e'));}
  for(let i=0;i<15;i++)ellipse(x+(rand(i,k,11)-.5)*12,y-7+rand(i,k,12)*3,.25,.12,'#d0cd9460');
 }
}
function paintTerrain(ctx,c){
 ctx.save();ctx.scale(4,4);const biome=MAPS[c.battle%8].type,earth=biome==='grove',sandstone=['ruins','fort','desert'].includes(biome);
 const {shape,ellipse,stroke,gradient,rect}=tools(ctx),bg=ctx.createLinearGradient(0,0,224,160);bg.addColorStop(0,earth?'#c5aa7d':biome==='desert'?'#e9d39e':'#b6c192');bg.addColorStop(1,earth?'#aa875d':biome==='desert'?'#c8ac78':'#829c76');ctx.fillStyle=bg;ctx.fillRect(0,0,224,160);
 // Broad translucent washes unify the ground; details stay clear without a pixel lattice.
 for(let i=0;i<110;i++){const x=rand(i,c.battle,1)*224,y=rand(i,c.battle,2)*160;ellipse(x,y,4+rand(i,2,3)*10,1+rand(i,1,4)*4,earth?'#815d3c0c':'#e7dbad10');}
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const t=c.tiles[y][x],sx=x*16,sy=y*16;
  if(t==='r'){ctx.fillStyle='#dbc59480';ctx.fillRect(sx,sy,16,16);for(let j=0;j<5;j++){const xx=sx+rand(x,y,j)*16,yy=sy+rand(y,x,j+9)*16;ellipse(xx,yy,.3+rand(x,j,3)*.5,.15,'#a88f6455');}}
  if(t==='s'){ctx.fillStyle='#e3cb9599';ctx.fillRect(sx,sy,16,16);for(let j=0;j<3;j++)stroke(`M${sx-2} ${sy+3+j*5} Q${sx+5} ${sy+j*5} ${sx+16} ${sy+4+j*5}`,'#f5e5bb70',.3);}
  if(t==='h'){ellipse(sx+8,sy+8,8,7,gradient(sx+6,sy+5,13,biome==='desert'?'#ead59e':'#c6c59b','#a3a47b00'));stroke(`M${sx+2} ${sy+11} Q${sx+8} ${sy+6} ${sx+14} ${sy+10}`,'#887d5240',.25);}
  if(t==='a'||t==='m'&&['ruins','fort'].includes(biome)){
   ctx.fillStyle=(x+y)%2?'#d1bd97':'#d4c19b';ctx.fillRect(sx,sy,16,16);stroke(`M${sx} ${sy+16} V${sy} H${sx+16}`,'#98876a55',.18);
   if((x+y)%3===0){let motif='';for(let i=0;i<16;i++){const a=-Math.PI/2+i*Math.PI/8,r=i%2?2.4:4;motif+=(i?' L':'M')+(sx+8+Math.cos(a)*r)+' '+(sy+8+Math.sin(a)*r);}shape(motif+' Z','#377b85','#c0a16a',.2);shape(`M${sx+8} ${sy+6.5} l1.5 1.5 l-1.5 1.5 l-1.5 -1.5 Z`,'#ead3a1');}
   if(rand(x,y,2)>.75)stroke(`M${sx+2} ${sy+13} l3 -4 l-1 -3 l5 -2`,'#947f5d66',.15);
  }
  if(['g','f','h'].includes(t)){for(let k=0;k<8;k++){const xx=sx+rand(x,y,k)*16,yy=sy+rand(y,x,k+3)*16;stroke(`M${xx} ${yy} q-.8 -1.2 -1 -1.4 M${xx} ${yy} q.2 -1.7 1 -2`,earth?'#756b423d':'#496b4250',.15);if(k===0&&rand(x,y,55)>.7){ellipse(xx,yy-1,.45,.25,'#f2dc9b');ellipse(xx+.7,yy-1.4,.3,.3,'#e6b8a0');}}}
  if(t==='w'||t==='b'){
   const water=ctx.createLinearGradient(0,0,224,160);water.addColorStop(0,'#62a8b0');water.addColorStop(1,'#3b7f91');ctx.fillStyle=water;ctx.fillRect(sx,sy,16,16);
   for(let k=0;k<5;k++){const xx=sx+rand(x,y,k+2)*11,yy=sy+2+k*3;stroke(`M${xx} ${yy} q2.4 -.8 4.5 0`,'#c6e1d94c',.16);}
   // Curving sandy banks on exposed sides preserve the tactical tile boundary.
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const tx=x+dx,ty=y+dy;if(tx<0||ty<0||tx>=W||ty>=H||['w','b'].includes(c.tiles[ty][tx]))continue;
    ctx.save();ctx.translate(sx+8,sy+8);ctx.rotate(dx===-1?0:dx===1?Math.PI:dy===-1?Math.PI/2:-Math.PI/2);shape('M-8 -8 Q-5 -3 -6 0 Q-8 5 -6 8 L-8 8 Z','#c2bd8e');stroke('M-6.5 -8 Q-4.5 -3 -5 0 Q-7 5 -5 8','#cfe2c16b',.35);ctx.restore();
   }
  }
  if(t==='b'){
   ctx.save();ctx.shadowColor='#25464955';ctx.shadowBlur=4;rect(sx-.2,sy+1.2,16.4,13.5,.6,'#a18a59');ctx.restore();
   for(let j=0;j<7;j++){rect(sx+j*2.3,sy+1.8,2.05,12,.2,j%2?'#cfb985':'#bda36d');stroke(`M${sx+j*2.3+.6} ${sy+3} v8`,'#f7e1ac55',.12);}
   stroke(`M${sx} ${sy+2} H${sx+16} M${sx} ${sy+13} H${sx+16}`,'#735e3b',.7);
  }
 }
 // Occluders are painted after the ground, giving trees and cliffs real overlap.
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const sx=x*16,sy=y*16,t=c.tiles[y][x];
  if(t==='f')tree(ctx,sx+8,sy+9,biome,x+y*13);
  if(t==='m'){
   ellipse(sx+9,sy+13,8,3,'#243d3329');
   if(['ruins','fort'].includes(biome)){
    rect(sx+1,sy-2,14,15,.6,gradient(sx+4,sy,20,'#ccb084','#9a7954'));rect(sx+1,sy-4,14,5,.5,'#e0c18e');rect(sx+2,sy-3,12,1,.3,'#f4ddb1');
    shape(`M${sx+6} ${sy+11} V${sy+5} Q${sx+8} ${sy+1} ${sx+10} ${sy+5} V${sy+11} Z`,'#725b42');stroke(`M${sx+6} ${sy+11} V${sy+5} Q${sx+8} ${sy+1} ${sx+10} ${sy+5}`,'#f0d5a1',.4);
    for(let j=0;j<3;j++)rect(sx+1+j*5,sy-6,3,3,.25,'#c8a577');
   }else{
    shape(`M${sx} ${sy+12} Q${sx+1} ${sy+5} ${sx+4} ${sy+2} Q${sx+8} ${sy-2} ${sx+12} ${sy+2} L${sx+16} ${sy+12} Q${sx+9} ${sy+17} ${sx} ${sy+12}`,gradient(sx+5,sy+1,20,sandstone?'#e7c693':'#c5c4a6',sandstone?'#a87d53':'#788575'),'#736b4a55');
    shape(`M${sx+4} ${sy+2} L${sx+7} ${sy+9} L${sx+16} ${sy+12} L${sx+12} ${sy+2}`,sandstone?'#c9a372':'#929d84');stroke(`M${sx+4} ${sy+3} L${sx+8} ${sy+9} L${sx+14} ${sy+11}`,'#f7e6bb60',.2);
   }
  }
 }
 for(const [x,y,color] of [[3,8,'#337c81'],[215,148,'#af734d']]){
  stroke(`M${x} ${y+6} V${y-8}`,'#9a7c4e',.35);ellipse(x,y-8.5,.45,.7,'#e8c17b');shape(`M${x+.3} ${y-7} Q${x+3} ${y-8} ${x+5} ${y-6} V${y-1} Q${x+3} ${y-3} ${x+.3} ${y-1} Z`,color,'#c4a467',.2);shape(`M${x+2.7} ${y-6} l1 1.5 l-1 1.5 l-1 -1.5 Z`,'#e8cf95');
 }
 const light=ctx.createLinearGradient(0,0,224,160);light.addColorStop(0,'#ffecd921');light.addColorStop(.5,'#f5dfa000');light.addColorStop(1,'#214c4124');ctx.fillStyle=light;ctx.fillRect(0,0,224,160);ctx.restore();
}
function drawMap(ctx,c,ui,time=0){
 const biome=MAPS[c.battle%8].type;
 if(terrainTiles!==c.tiles||terrainBiome!==biome){terrainCache=typeof OffscreenCanvas==='function'?new OffscreenCanvas(896,640):document.createElement('canvas');terrainCache.width=896;terrainCache.height=640;paintTerrain(terrainCache.getContext('2d'),c);terrainTiles=c.tiles;terrainBiome=biome;}
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.drawImage(terrainCache,0,0,ctx.canvas.width,ctx.canvas.height);ctx.scale(ctx.canvas.width/224,ctx.canvas.height/160);
 const {ellipse,rect,shape,stroke,gradient}=tools(ctx),u=ui.actorId?c.units.find(v=>v.id===ui.actorId):active(c);
 if(ui.grid){ctx.setLineDash([.4,1]);for(let x=1;x<W;x++)stroke(`M${x*16} 0 V160`,'#244c3b20',.13);for(let y=1;y<H;y++)stroke(`M0 ${y*16} H224`,'#244c3b20',.13);ctx.setLineDash([]);}
 if(!ui.animating&&c.mode==='battle'&&u?.side==='ally'){
  if(ui.action==='move'&&!c.moved)for(const key of reachable(c,u).keys()){const [x,y]=key.split(',').map(Number);rect(x*16+.6,y*16+.6,14.8,14.8,1.2,'#8ed0dc25','#e7f6e18c');}
  if(['attack','skill'].includes(ui.action))for(const t of c.units.filter(t=>validTarget(c,u,t,ui.action))){rect(t.x*16+.5,t.y*16+.5,15,15,1.4,ui.action==='skill'&&['sana','bram'].includes(u.id)?'#c4e5ad55':'#ec9a7555','#f9dfb9');}
 }
 if(ui.hover)rect(ui.hover.x*16+.5,ui.hover.y*16+.5,15,15,1.4,'#fff2cc0a','#fff2cf');
 for(const item of c.loot||[]){const x=item.x*16+8,y=item.y*16+9;ellipse(x,y+4,5,1.5,'#334c3b33');ctx.save();ctx.shadowColor=ITEMS[item.type].color;ctx.shadowBlur=10;rect(x-3,y-2,6,5,1,'#a27943','#dfc38b');shape(`M${x-3} ${y-2} Q${x} ${y-6} ${x+3} ${y-2} Z`,ITEMS[item.type].color);rect(x-.5,y-.5,1,2,.3,'#fbe1a4');ctx.restore();ellipse(x,y-5-Math.sin(time/500),.4,.6,'#fff0b2');}
 const strike=ui.strike;
 for(const v of c.units.filter(v=>alive(v)||(strike&&strike.progress>=.55&&ui.effects?.some(f=>f.value<0&&f.x===v.x&&f.y===v.y))).sort((a,b)=>a.y-b.y)){
  let x=v.x*16,y=v.y*16;
  if(ui.motion?.id===v.id){x=ui.motion.position.x*16;y=ui.motion.position.y*16-ui.motion.position.bob;}
  if(strike?.actor.id===v.id&&['slash','shadow'].includes(strike.kind)&&!strike.reduced){const l=Math.sin(Math.min(1,strike.progress/.55)*Math.PI)*4;x+=Math.sign(strike.target.x-strike.actor.x)*l;y+=Math.sign(strike.target.y-strike.actor.y)*l;}
  if(strike?.target.id===v.id&&strike.progress>.55&&!strike.reduced)x+=Math.sin(strike.progress*85)*(1-strike.progress)*2;
  ctx.save();if(!alive(v))ctx.globalAlpha=Math.max(0,1-(strike.progress-.55)/.4);
  ellipse(x+8,y+13,6,2,gradient(x+8,y+13,7,'#243b4266','#243b4200'));
  if(u?.id===v.id){ctx.strokeStyle='#fff2be';ctx.lineWidth=.45;ctx.beginPath();ctx.ellipse(x+8,y+13,6.7,2.5,0,0,Math.PI*2);ctx.stroke();shape(`M${x+6} ${y-5} L${x+10} ${y-5} L${x+8} ${y-3} Z`,'#ffdd91');}
  sprite(ctx,v,x,y-1,1,v.side==='enemy');
  rect(x+3,y+15,10,1,.5,'#293d3eaa');rect(x+3,y+15,10*Math.max(0,v.hp)/v.maxHp,1,.5,v.side==='ally'?'#c3dda5':'#edb08c');
  if(c.guarding[v.id]){ctx.strokeStyle='#f8dda0';ctx.lineWidth=.35;ctx.beginPath();ctx.arc(x+8,y+6,8,-.7,3.8);ctx.stroke();}
  ctx.restore();
 }
 if(strike)drawStrike(ctx,strike);
 for(const fx of ui.effects||[]){const remaining=fx.until-performance.now();if(remaining<=0)continue;ctx.font='600 4px Georgia,serif';ctx.textAlign='center';ctx.lineWidth=.7;ctx.strokeStyle='#263f3a';const text=(fx.value>0?'+':'')+fx.value,x=fx.x*16+8,y=fx.y*16-2-(1-remaining/1200)*5;ctx.strokeText(text,x,y);ctx.fillStyle=fx.value>0?'#e3f8b7':'#fff3da';ctx.fillText(text,x,y);}
 ctx.restore();
}
function drawStrike(ctx,fx){
 const p=fx.progress,a={x:fx.actor.x*16+8,y:fx.actor.y*16+6},b={x:fx.target.x*16+8,y:fx.target.y*16+6},{ellipse,stroke,gradient}=tools(ctx),heal=['heal','rally','guard'].includes(fx.kind),color=heal?'#c9eda5':fx.kind==='fire'?'#ffbf70':'#bde3f1';
 ctx.save();
 if(p<.55&&['fire','bolt','heal','rally','guard'].includes(fx.kind)){ctx.globalAlpha=Math.sin(p*Math.PI);ctx.strokeStyle=color;ctx.lineWidth=.4;ctx.beginPath();ctx.ellipse(a.x,a.y+6,5+p*5,2+p*2,0,0,Math.PI*2);ctx.stroke();}
 ctx.globalAlpha=1;
 if(p>=.2&&p<.57&&['arrow','fire','bolt'].includes(fx.kind)){ctx.save();const t=(p-.2)/.35,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t-Math.sin(t*Math.PI)*3;ctx.shadowColor=color;ctx.shadowBlur=8;if(fx.kind==='arrow'){const angle=Math.atan2(b.y-a.y,b.x-a.x);ctx.translate(x,y);ctx.rotate(angle);stroke('M-3 0 L3 0','#f6e4b8',.4);stroke('M1 -1 L3 0 L1 1','#e9f4e6',.4);}else{ellipse(x,y,2,2,gradient(x,y,2,'#fff5d5',color));for(let i=1;i<6;i++)ellipse(x-(b.x-a.x)*i*.018,y-(b.y-a.y)*i*.018,1-i*.12,1-i*.12,color);}ctx.shadowBlur=0;ctx.restore();}
 if(p>=.45&&p<.88&&['slash','shadow'].includes(fx.kind)){const t=(p-.45)/.43;ctx.globalAlpha=Math.sin(t*Math.PI);ctx.strokeStyle='#fff0c8';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(b.x,b.y,6+t*3,-1.4+t,1.3+t);ctx.stroke();}
 if(p>=.55){const t=(p-.55)/.45;ctx.globalAlpha=Math.max(0,1-t);ellipse(b.x,b.y,8+t*5,8+t*5,gradient(b.x,b.y,14,heal?'#cbe8ae66':'#ffc36f77','#ffe0a000'));for(let i=0;i<12;i++){const angle=i*Math.PI/6+t,x=b.x+Math.cos(angle)*(2+t*9),y=b.y+Math.sin(angle)*(2+t*7)-t*3;ellipse(x,y,.25+(1-t)*.5,.4+(1-t)*.7,color);}ctx.strokeStyle=color;ctx.lineWidth=.5;ctx.beginPath();ctx.ellipse(b.x,b.y+5,3+t*9,1+t*3,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();
}
function drawCamp(ctx,heroes){
 lastCamp=[ctx,heroes];const w=ctx.canvas.width,h=ctx.canvas.height;ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;
 if(campImage?.complete&&campImage.naturalWidth){const sw=campImage.naturalWidth,sh=campImage.naturalHeight,sourceH=Math.min(sh,sw*h/w);ctx.drawImage(campImage,0,(sh-sourceH)*.5,sw,sourceH,0,0,w,h);return;}
 const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1e3a50');g.addColorStop(1,'#c29461');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);ctx.save();ctx.scale(w/224,h/80);const {shape,ellipse,stroke}=tools(ctx);for(let i=0;i<45;i++)ellipse(rand(i,1,2)*224,rand(i,2,3)*35,.3,.3,'#e7dcb2');for(const x of [8,195,217])tree(ctx,x,45,'islands',x);shape('M65 60 Q76 38 120 35 L158 58 Z','#c89659');for(let i=0;i<7;i++)stroke(`M${80+i*9} ${40+i*.4} l-5 17`,i%2?'#d6b674':'#80505b',4);ellipse(112,69,36,8,'#2c5968');for(let i=0;i<7;i++)ellipse(90+i*7,69,1.7,2,'#d6b674');ellipse(57,65,11,7,'#f7ba6977');shape('M52 68 Q48 61 56 54 Q54 62 62 61 Q63 67 58 70 Z','#f2b76b');ctx.restore();
}
root.EmberArt=Object.freeze({sprite,drawMap,drawCamp});
})(globalThis);
