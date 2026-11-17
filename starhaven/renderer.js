/* Original procedural vector artwork. No external images or fonts. */
(function(root){
'use strict';
const D=root.StarhavenData;
function ellipse(c,x,y,rx,ry,color){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();}
function creature(c,type,x,y,size,time=0,stage=1,flip=false,hungry=false){
 const s=D.species[type];c.save();c.translate(x,y);if(flip)c.scale(-1,1);c.scale(size/30,size/30);const color=hungry?'#8b97a5':s.color;c.lineWidth=1.5;c.strokeStyle=color;c.shadowColor=color;c.shadowBlur=9;
 if(type==='amoeba'){c.beginPath();for(let i=0;i<=30;i++){const a=i/30*Math.PI*2,r=23+Math.sin(a*5+time*2)*2.6;c.lineTo(Math.cos(a)*r,Math.sin(a)*r*.85);}c.closePath();c.fillStyle=color;c.fill();c.shadowBlur=0;ellipse(c,-4,-2,10,9,'#3b9b98');ellipse(c,-10,-8,4,3,'#d5fff299');ellipse(c,10,7,3,3,'#d5fff277');}
 if(type==='jelly'){for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*8,8);c.bezierCurveTo(i*10+Math.sin(time*2+i)*9,27,i*7-10,31,i*10+Math.sin(time+i)*8,43);c.globalAlpha=.65;c.stroke();}c.globalAlpha=1;c.beginPath();c.moveTo(-26,8);c.bezierCurveTo(-26,-35,26,-35,26,8);c.quadraticCurveTo(0,18,-26,8);c.fillStyle=color;c.fill();c.shadowBlur=0;c.strokeStyle='#eee3ff88';c.beginPath();c.ellipse(0,7,24,6,0,0,Math.PI*2);c.stroke();}
 if(type==='whale'||type==='leviathan'){const lev=type==='leviathan';c.beginPath();c.moveTo(-26,-3);c.bezierCurveTo(-44,-24,-50,-19,-44,-2);c.lineTo(-51,13);c.quadraticCurveTo(-36,14,-27,7);c.bezierCurveTo(-5,37,40,27,40,1);c.bezierCurveTo(39,-27,-9,-25,-26,-3);c.fillStyle=color;c.fill();c.shadowBlur=0;c.beginPath();c.moveTo(-18,12);c.quadraticCurveTo(10,29,35,12);c.quadraticCurveTo(10,39,-18,12);c.fillStyle=lev?'#e2fff3':'#dce9ff';c.fill();c.beginPath();c.moveTo(-1,9);c.quadraticCurveTo(2,33,-14,30);c.lineTo(-9,8);c.fillStyle=lev?'#79cbbd':'#6285c9';c.fill();if(lev){c.strokeStyle='#f5ffbd';for(let i=0;i<3;i++){c.beginPath();c.moveTo(-17+i*12,-16);c.lineTo(-20+i*12,-31-i*3);c.stroke();}}}
 if(type==='polyp'){for(let i=0;i<6;i++){const a=i*Math.PI/3+time*.2;ellipse(c,Math.cos(a)*16,Math.sin(a)*16,10,14,color);}ellipse(c,0,0,15,15,'#d87885');ellipse(c,-4,-5,5,4,'#ffd6bd');}
 if(type==='ray'){c.beginPath();c.moveTo(-35,-4);c.quadraticCurveTo(-6,-28,6,-12);c.quadraticCurveTo(17,-15,36,-2);c.quadraticCurveTo(20,24,3,12);c.quadraticCurveTo(-20,20,-35,-4);c.fillStyle=color;c.fill();c.beginPath();c.moveTo(-6,8);c.quadraticCurveTo(-35,32,-46,32);c.stroke();}
 c.shadowBlur=0;const eyeX=type==='whale'||type==='leviathan'?25:7,eyeY=type==='jelly'?0:-2;ellipse(c,eyeX,eyeY,2.4,3.4,'#15293b');ellipse(c,eyeX+.7,eyeY-1,0.8,1,'#fff');if(type!=='whale'&&type!=='leviathan')ellipse(c,-5,eyeY,2.3,3.3,'#15293b');if(stage===2){c.fillStyle='#fff3b5';c.font='12px sans-serif';c.fillText('✧',-6,-30);}c.restore();
}
function resource(c,d,t){const color=D.resources[d.type].color;c.save();c.translate(d.x,d.y);c.rotate(Math.sin(t+d.id)*.2);c.shadowBlur=12;c.shadowColor=color;c.fillStyle=color;c.strokeStyle=color;c.lineWidth=1.5;
 if(d.type==='solar'){ellipse(c,0,0,5,5,color);c.globalAlpha=.2;ellipse(c,0,0,11,11,color);}
 else if(d.type==='plankton'){ellipse(c,-3,0,7,5,color);ellipse(c,5,-3,5,6,color);}
 else if(d.type==='dark'||d.type==='core'){ellipse(c,0,0,10,10,color);ellipse(c,0,0,6,6,'#1c1c3c');c.beginPath();c.ellipse(0,0,15,5,-.4,0,Math.PI*2);c.stroke();}
 else{c.beginPath();c.moveTo(0,-12);c.lineTo(9,-3);c.lineTo(6,9);c.lineTo(-5,11);c.lineTo(-10,-2);c.closePath();c.fill();c.shadowBlur=0;c.strokeStyle='#fff8';c.beginPath();c.moveTo(0,-9);c.lineTo(-3,2);c.lineTo(5,7);c.stroke();}c.restore();}
function enemy(c,e,t){c.save();c.translate(e.x,e.y);c.strokeStyle='#ff9292';c.fillStyle=e.type==='asteroid'?'#a8857a':'#573747';c.lineWidth=2;c.shadowColor='#ff9999';c.shadowBlur=15;
 if(e.type==='asteroid'){c.beginPath();for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.lineTo(Math.cos(a)*(i%2?17:22),Math.sin(a)*20);}c.closePath();c.fill();c.stroke();}
 else if(e.type==='parasite'){for(let i=0;i<5;i++){c.beginPath();c.moveTo(i*6-12,0);c.quadraticCurveTo(i*8-14,17,Math.sin(t*4+i)*10+i*5-10,25);c.stroke();}ellipse(c,0,-3,17,13,'#c77f99');ellipse(c,0,-5,5,5,'#fee2ab');}
 else if(e.type==='leech'){c.rotate(t*.3);c.beginPath();c.ellipse(0,0,26,12,0,0,Math.PI*2);c.fill();c.stroke();for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*8,-8);c.lineTo(i*10,-19);c.stroke();}}
 else{const r=e.type==='flagship'?2.5:1;c.scale(r,r);c.beginPath();c.moveTo(0,-20);c.lineTo(28,17);c.lineTo(0,9);c.lineTo(-28,17);c.closePath();c.fill();c.stroke();ellipse(c,0,0,5,8,'#ffc59d');}c.shadowBlur=0;c.restore();const w=e.type==='flagship'?110:45;c.fillStyle='#3e3043';c.fillRect(e.x-w/2,e.y-35,w,4);c.fillStyle='#ff9c98';c.fillRect(e.x-w/2,e.y-35,w*Math.max(0,e.hp/e.maxHp),4);}
class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.motion=true;this.cursor=null;this.stars=Array.from({length:110},(_,i)=>({x:(Math.sin(i*127.1)*43758.5453%1+1)%1*960,y:(Math.sin(i*311.7)*19341.573%1+1)%1*600,r:i%7===0?1.6:.7}));}
 resize(){const rect=this.canvas.getBoundingClientRect(),dpr=Math.min(root.devicePixelRatio||1,2);const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}}
 draw(g){this.resize();const c=this.ctx;c.setTransform(this.canvas.width/960,0,0,this.canvas.height/600,0,0);const sector=D.sectors[g.mission.sector],t=this.motion?g.time:0;const bg=c.createLinearGradient(0,0,960,600);bg.addColorStop(0,'#0e1c31');bg.addColorStop(.6,'#0b1629');bg.addColorStop(1,'#182638');c.fillStyle=bg;c.fillRect(0,0,960,600);
  const glow=c.createRadialGradient(690,180,0,690,180,380);glow.addColorStop(0,sector.planet+'60');glow.addColorStop(1,sector.planet+'00');c.fillStyle=glow;c.fillRect(0,0,960,600);
  for(const s of this.stars){c.globalAlpha=.3+(Math.sin(t*.4+s.x)*.5+.5)*.5;ellipse(c,s.x,s.y,s.r,s.r,'#d3e5ff');}c.globalAlpha=1;
  const planet=c.createRadialGradient(795,85,0,770,130,125);planet.addColorStop(0,sector.planet);planet.addColorStop(.75,'#1c354a');planet.addColorStop(1,'#102035');ellipse(c,770,125,115,115,planet);c.strokeStyle=sector.color+'25';c.lineWidth=1;c.beginPath();c.ellipse(770,125,155,36,-.45,0,Math.PI*2);c.stroke();
  // The transparent biodome: restrained concentric ribs and floor lights.
  c.strokeStyle='#719eaf12';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(480,300,470-i*18,290-i*10,0,0,Math.PI*2);c.stroke();}c.strokeStyle='#8dcac810';c.beginPath();c.moveTo(60,520);c.quadraticCurveTo(480,480,900,520);c.stroke();
  for(let i=0;i<8;i++)ellipse(c,200+i*80,555,2,2,sector.color+'66');
  // Beacon hardware becomes part of the scene.
  for(let i=0;i<3;i++){c.save();c.translate(430+i*50,555);c.rotate(Math.PI/4);c.fillStyle=i<g.beacons?D.sectors[g.mission.sector].color:'#273c50';c.shadowColor=sector.color;c.shadowBlur=i<g.beacons?14:0;c.fillRect(-6,-6,12,12);c.restore();}
  for(const f of g.food){c.shadowColor=f.type==='matter'?'#c9f6dc':'#ffbbaa';c.shadowBlur=9;ellipse(c,f.x,f.y,f.type==='matter'?4:8,4,f.type==='matter'?'#c9f6dc':'#ffbbaa');}c.shadowBlur=0;
  for(const cr of g.creatures){const s=D.species[cr.type],stage=g.stage(cr),size=s.radius*(.8+stage*.15);creature(c,cr.type,cr.x,cr.y+(this.motion?Math.sin(t*1.5+cr.id)*2:0),size,t,stage,cr.vx<0,cr.hunger<22);if(cr.hunger<30){c.fillStyle=cr.hunger<15?'#ffab9b':'#ffd59e';c.font='17px sans-serif';c.textAlign='center';c.fillText('♧',cr.x,cr.y-size-10);}}
  for(const d of g.drops) {c.globalAlpha=d.life<3?Math.max(.25,d.life/3):1;resource(c,d,t);}c.globalAlpha=1;
  g.companions.forEach((id,i)=>{const x=75+i*55,y=95+(this.motion?Math.sin(t+i)*6:0),p=D.companions.find(p=>p.id===id);ellipse(c,x,y,15,15,'#1d394a');c.strokeStyle='#9be8d1';c.lineWidth=1;c.beginPath();c.arc(x,y,18,0,Math.PI*2);c.stroke();c.fillStyle='#a8eddc';c.textAlign='center';c.font='19px sans-serif';c.fillText(p.icon,x,y+6);if(id==='halo'&&g.shield){c.strokeStyle='#9be8d160';c.beginPath();c.arc(x,y,24,0,Math.PI*2);c.stroke();}});
  for(const e of g.enemies)enemy(c,e,t);
  for(const e of g.effects){c.globalAlpha=Math.min(1,e.life*2);c.fillStyle=e.color;c.textAlign='center';c.font='600 17px system-ui';c.fillText(e.text,e.x,e.y-(1-e.life)*25);}c.globalAlpha=1;
  if(g.mode!=='sanctuary'&&g.status==='playing'){const remaining=g.nextThreat-g.time;if(remaining<8){c.textAlign='center';c.font='11px system-ui';c.fillStyle='#ffbfaa';c.fillText(`INCOMING SIGNAL / ${Math.max(0,Math.ceil(remaining))}s`,480,45);}}
  if(this.cursor){const {x,y}=this.cursor;c.strokeStyle='#b8f7df';c.lineWidth=1;c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.moveTo(x-18,y);c.lineTo(x+18,y);c.moveTo(x,y-18);c.lineTo(x,y+18);c.stroke();}
 }
}
root.StarhavenArt={creature,Renderer};
})(globalThis);
