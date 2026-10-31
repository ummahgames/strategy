(function(root){
'use strict';
// Smooth, original canvas miniatures. Native 128×160 artwork replaces the pixel sprites.
const cache=new Map();
const identities={
 rhea:{cloth:'#345f89',light:'#7babc0',dark:'#213c60',skin:'#b57e59',hair:'#302928'},
 bram:{cloth:'#b48a43',light:'#e6bf72',dark:'#72532f',skin:'#80503a',hair:'#292a28'},
 lyra:{cloth:'#437460',light:'#95b390',dark:'#254a3f',skin:'#75472f',hair:'#262a27'},
 orin:{cloth:'#70518b',light:'#b798c3',dark:'#403450',skin:'#b77b53',hair:'#302b30'},
 sana:{cloth:'#e4d9b5',light:'#fff3d5',dark:'#889879',skin:'#a46c48',hair:'#332e29'},
 finn:{cloth:'#287b80',light:'#80b8b1',dark:'#214b55',skin:'#ba875d',hair:'#302d28'}
};
function palette(u){return u.side==='enemy'?{cloth:u.name==='The Ash Regent'?'#63384f':'#a35042',light:'#d9936f',dark:'#493038',skin:'#a77955',hair:'#352d2c'}:identities[u.id]||identities.rhea;}
function drawFigure(ctx,u){
 const P=palette(u),armor=['sword','tank'].includes(u.sprite),robe=['mage','healer'].includes(u.sprite),gold='#d5ad60',ink='#293d3b';
 ctx.lineJoin='round';ctx.lineCap='round';
 const gradient=(x,y,r,a,b)=>{const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,a);g.addColorStop(1,b);return g;};
 const path=(d,fill,stroke=ink,width=1.2)=>{const p=new Path2D(d);ctx.fillStyle=fill;ctx.fill(p);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(p);}};
 const oval=(x,y,rx,ry,fill,stroke)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}};
 const line=(d,color,w)=>{ctx.strokeStyle=color;ctx.lineWidth=w;ctx.stroke(new Path2D(d));};
 // Flowing back cloth and weighted, rounded boots.
 path('M19 27 Q30 19 43 28 L48 62 Q36 71 17 64 Q21 44 19 27',P.dark);
 path('M24 55 Q20 60 22 72 L18 75 Q18 79 29 77 L31 57', '#68503b');
 path('M34 57 L35 75 Q40 79 48 76 Q49 72 42 70 L42 56', '#5b4635');
 line('M23 72 L28 72 M37 72 L43 72','#bf9e68',1.5);
 if(robe){path('M23 37 Q17 48 16 68 Q29 76 46 68 L40 36',gradient(27,43,32,P.light,P.dark));line('M25 45 Q22 59 23 68 M36 48 L40 69',P.cloth,2);line('M18 67 Q30 73 44 67',gold,1.5);}
 // Tunic and sculpted lamellar/cloth silhouette.
 path('M21 29 Q31 24 41 30 L44 53 Q32 60 20 53 Z',gradient(27,32,30,armor?'#e5d5ab':P.light,armor?'#8f8565':P.cloth));
 if(armor){for(let row=0;row<4;row++){line(`M22 ${35+row*4} Q31 ${39+row*4} 41 ${35+row*4}`,'#9e8c62',1);for(let i=0;i<3;i++)line(`M${25+i*5} ${35+row*4} l0 3`,'#b8a779',.7);}}
 else{line('M27 31 Q30 39 27 52',P.light,2);line('M38 33 Q35 42 39 53',P.dark,1.4);}
 // Sleeves, hands, embroidered hems, sash.
 path('M21 30 Q15 29 13 34 L11 49 Q12 54 17 52 L22 38',P.cloth);path('M41 30 Q48 28 49 35 L51 48 Q49 53 45 50 L40 38',P.dark);
 oval(14,51,3,4,P.skin);oval(48,50,3,4,P.skin);
 line('M13 46 L18 47 M45 46 L50 45',gold,1.8);
 path('M20 49 Q31 54 44 49 L44 54 Q30 59 20 54',P.dark);oval(32,53,3,2.6,gold);
 for(let i=0;i<5;i++)path(`M${22+i*4} 56 l1 2 l-1 2 l-1 -2 Z`,gold,null);
 // Neck, natural oval face, hair and a little directional shading.
 path('M27 22 L27 30 Q32 33 36 29 L36 21',P.skin);
 oval(31,17,10,13,gradient(27,13,23,'#e2b28a',P.skin),ink);
 path('M21 18 Q17 6 26 3 Q40 -1 42 12 L40 18 L37 10 Q28 13 24 9 Z',P.hair);
 oval(21.5,19,2,3,P.skin);oval(40.5,19,2,3,P.skin);
 line('M25 16 Q27 14 29 16 M34 16 Q37 14 39 16',P.hair,1.1);
 oval(27,18,1.1,1.3,'#202e2d');oval(36,18,1.1,1.3,'#202e2d');line('M32 18 l-1 5 l2 0','#8a5b42',.7);line('M29 26 Q32 27 35 25','#805541',.8);
 if(u.id==='bram'||u.id==='orin'){path('M23 22 Q27 27 31 27 Q38 27 40 21 L38 30 Q31 35 25 28 Z',P.hair,null);line('M29 26 L34 26','#c29165',.8);}
 if(u.sprite==='sword'){
  path('M22 10 Q16 23 20 35 L24 42 L26 39 Q22 27 24 12',P.hair);line('M23 10 Q31 12 40 9',gold,1.5);oval(33,10,1.8,2.3,'#63b6c4');
  // Round repoussé brass buckler and a graceful curved sabre.
  oval(12,49,10,13,gradient(8,43,24,'#e9c986','#886e3b'),ink);oval(12,49,7.7,10,P.cloth);oval(12,49,3,4,gold);for(let i=0;i<8;i++){const a=i*Math.PI/4;oval(12+Math.cos(a)*8,49+Math.sin(a)*10,.7,.7,'#fff0b7');}
  path('M50 48 Q56 27 50 9 Q62 25 54 49 Z',gradient(52,22,32,'#fff9df','#9bb3b5'));line('M50 48 Q55 26 51 13','#f6fcf0',.8);line('M47 49 Q53 46 58 48',gold,2.4);line('M52 49 L50 57','#765334',2.8);
 }
 if(u.sprite==='tank'){
  path('M20 14 Q18 2 30 1 Q44 1 44 15 L40 12 Q30 9 23 14 Z',gradient(26,3,22,'#e9d4a6','#837450'));line('M31 2 L31 12',gold,1.6);
  oval(14,49,11,15,gradient(10,43,24,'#e4c784','#87703f'),ink);oval(14,49,8,12,P.dark);path('M14 40 L19 49 L14 58 L9 49 Z',gold);oval(14,49,2.5,3,'#96c1bd');
  line('M51 64 L54 23','#805c36',3);oval(54,24,7.5,5.5,gradient(51,21,16,'#f1d9a6','#9b854f'));line('M52 20 L52 28',gold,1.1);
  if(u.name==='The Ash Regent')path('M21 6 L20 0 L27 5 L31 -1 L35 5 L43 0 L41 9 Z',gold);
 }
 if(['bow','healer','rogue'].includes(u.sprite)){
  path('M20 20 Q16 7 26 2 Q40 -1 44 13 L43 29 L38 28 L39 12 Q31 7 23 13 L24 29 L20 32 Z',gradient(23,6,27,P.light,P.cloth));line('M21 13 Q31 5 42 13',gold,1);
 }
 if(u.sprite==='bow'){
  path('M20 29 Q33 39 44 48 L42 51 Q31 44 19 33','#7b5335');line('M52 22 Q67 41 52 64','#966a38',2.7);line('M52 22 L52 64','#e4d2ac',.8);line('M43 44 L62 44','#d2b17d',1);path('M62 42 L66 44 L62 46 Z','#b1c7c3');
 }
 if(u.sprite==='rogue'){path('M23 22 Q32 25 41 22 L41 29 Q32 33 23 28',P.cloth);path('M17 32 Q30 44 43 47 L43 51 Q29 47 17 36','#71503a');for(const x of [8,52]){path(`M${x} 58 Q${x+4} 47 ${x+3} 38 Q${x+9} 47 ${x+3} 59 Z`,'#d5e5df');line(`M${x-1} 59 l7 -1`,gold,1.7);}}
 if(['mage','healer'].includes(u.sprite)){
  line('M53 70 L54 14','#8e6942',2.4);line('M54 15 L54 68','#d2ae67',.7);oval(54,13,5,7,gold);oval(54,12,3.4,4.8,u.sprite==='mage'?'#efb775':'#88c2ae');oval(53,10,1,1.6,'#fff5d0');
  if(u.sprite==='mage'){path('M20 14 Q16 6 24 2 Q31 -2 40 3 Q46 8 42 15 Z',P.cloth);line('M20 9 Q31 4 42 9',P.light,2.6);line('M21 13 Q32 9 42 13',gold,1.2);path('M40 12 Q48 20 43 40 L39 37 L41 17',P.cloth);oval(38,10,2,3,'#71b9c9');}
  else{line('M21 13 Q30 5 42 14','#e5bc64',1.4);path('M29 36 L33 32 L37 36 L33 40 Z',gold);oval(33,36,1.5,2,'#8bb8a2');}
 }
 if(u.tier){for(let i=0;i<Math.min(5,u.tier);i++)oval(24+i*3,52, .65,.8,'#f2d18c');}
 if(u.promoted){line('M18 31 L22 34 M41 32 L45 30','#ffdb85',2);}
 if(u.equippedRelic)oval(27,35,2,3,'#84d5c1');
 if(u.equippedWeapon){ctx.shadowColor='#c3a5ee';ctx.shadowBlur=7;oval(48,47,2,3,'#d8baff');ctx.shadowBlur=0;}
}
function imageFor(u){const key=[u.id,u.side,u.sprite,u.name,u.promoted,u.tier,u.equippedWeapon,u.equippedRelic].join('|');if(cache.has(key))return cache.get(key);const canvas=typeof OffscreenCanvas==='function'?new OffscreenCanvas(128,160):document.createElement('canvas');canvas.width=128;canvas.height=160;const ctx=canvas.getContext('2d');ctx.scale(2,2);drawFigure(ctx,u);cache.set(key,canvas);return canvas;}
function draw(ctx,u,x,y,scale=3,flip=false){ctx.save();ctx.imageSmoothingEnabled=true;ctx.translate(x,y-4*scale);if(flip){ctx.translate(16*scale,0);ctx.scale(-1,1);}ctx.drawImage(imageFor(u),0,0,16*scale,20*scale);ctx.restore();}
root.EmberCharacters=Object.freeze({draw});
})(globalThis);
