(function(root){
'use strict';
const E=root.EmberEngine;
const vec={sub:(a,b)=>a.map((v,i)=>v-b[i]),dot:(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{const n=Math.hypot(...a)||1;return a.map(v=>v/n);}};
function multiply(a,b){const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}
function lookAt(eye,target){const z=vec.norm(vec.sub(eye,target)),x=vec.norm(vec.cross([0,1,0],z)),y=vec.cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-vec.dot(x,eye),-vec.dot(y,eye),-vec.dot(z,eye),1]);}
function ortho(l,r,b,t,n,f){return new Float32Array([2/(r-l),0,0,0,0,2/(t-b),0,0,0,0,-2/(f-n),0,-(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1]);}
function cameraMatrix(yaw=.72,zoom=1,aspect=1.4){const eye=[Math.sin(yaw)*20,22,Math.cos(yaw)*20],half=6.6/zoom;return multiply(ortho(-half*aspect,half*aspect,-half,half,.1,70),lookAt(eye,[0,0,0]));}
function projectPoint(m,p,width=896,height=640){const v=[...p,1],o=[0,0,0,0];for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[r]+=m[k*4+r]*v[k];return {x:(o[0]/o[3]+1)*width/2,y:(1-o[1]/o[3])*height/2,z:o[2]/o[3]};}
function contains(poly,p){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a.y>p.y)!==(b.y>p.y))&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
const hex=c=>{const n=parseInt(c.replace('#',''),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];};
const noise=(x,y,k=0)=>{const n=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return n-Math.floor(n);};
const identity=new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function modelMatrix(x,y,z,angle){const c=Math.cos(angle),s=Math.sin(angle);return new Float32Array([c,0,-s,0,0,1,0,0,s,0,c,0,x,y,z,1]);}
function mesh(){
 const result={cube:[],sphere:[],leaf:[],blade:[],arch:[],star:[]};
 const tri=(out,a,b,c,na,nb,nc)=>{const n=vec.norm(vec.cross(vec.sub(b,a),vec.sub(c,a)));for(const [p,q] of [[a,na||n],[b,nb||n],[c,nc||n]])out.push([...p,...q]);};
 const faces=[[[1,0,0],[[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[.5,-.5,.5]]],[[-1,0,0],[[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-.5,-.5,-.5]]],[[0,1,0],[[-.5,.5,-.5],[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5]]],[[0,-1,0],[[-.5,-.5,.5],[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5]]],[[0,0,1],[[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[-.5,-.5,.5]]],[[0,0,-1],[[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[.5,-.5,-.5]]]];
 for(const [n,p] of faces)for(const i of [0,1,2,0,2,3])result.cube.push([...p[i],...n]);
 const pt=(i,j)=>{const a=i*Math.PI/8,b=j*Math.PI/6;return [Math.sin(a)*Math.cos(b)*.5,Math.cos(a)*.5,Math.sin(a)*Math.sin(b)*.5];};
 for(let i=0;i<8;i++)for(let j=0;j<12;j++){const a=pt(i,j),b=pt(i+1,j),c=pt(i+1,j+1),d=pt(i,j+1);tri(result.sphere,a,b,c,vec.norm(a),vec.norm(b),vec.norm(c));tri(result.sphere,a,c,d,vec.norm(a),vec.norm(c),vec.norm(d));}
 function lathe(name,profile){const out=[];for(let i=0;i<profile.length-1;i++)for(let j=0;j<20;j++){const [y,r]=profile[i],[yy,rr]=profile[i+1],a=j*Math.PI/10,b=(j+1)*Math.PI/10,p=[Math.cos(a)*r,y,Math.sin(a)*r],q=[Math.cos(b)*r,y,Math.sin(b)*r],s=[Math.cos(a)*rr,yy,Math.sin(a)*rr],t=[Math.cos(b)*rr,yy,Math.sin(b)*rr],slope=(r-rr)/(yy-y||1),n=vec.norm([Math.cos(a),slope,Math.sin(a)]),m=vec.norm([Math.cos(b),slope,Math.sin(b)]);tri(out,p,s,t,n,n,m);tri(out,p,t,q,n,m,m);}result[name]=out;}
 lathe('cylinder',[[-.5,0],[-.5,.5],[.5,.5],[.5,0]]);
 lathe('tunic',[[-.5,.34],[-.47,.43],[-.2,.37],[.12,.47],[.32,.49],[.46,.36],[.5,.22]]);
 lathe('robe',[[-.5,.5],[-.46,.51],[-.2,.44],[.15,.34],[.5,.25]]);
 lathe('turban',[[-.5,.36],[-.4,.48],[-.1,.51],[.2,.48],[.4,.35],[.5,0]]);
 lathe('helmet',[[-.5,.5],[-.1,.51],[.24,.44],[.44,.26],[.5,0]]);
 lathe('vase',[[-.5,.22],[-.4,.38],[-.05,.5],[.2,.42],[.38,.22],[.48,.2],[.5,.27]]);
 lathe('pillar',[[-.5,.5],[-.4,.5],[-.36,.34],[.34,.3],[.4,.5],[.5,.5]]);
 lathe('dome',[[-.5,.5],[-.4,.51],[0,.45],[.3,.3],[.48,.1],[.5,0]]);
 // Continuous curved palm frond and sabre blade, without stair-step boxes.
 for(let i=0;i<12;i++){const t=i/12,s=(i+1)/12,w=Math.sin(t*Math.PI)*.16,ww=Math.sin(s*Math.PI)*.16;const a=[t-.5,Math.sin(t*Math.PI)*.18,-w],b=[s-.5,Math.sin(s*Math.PI)*.18,-ww],c=[s-.5,Math.sin(s*Math.PI)*.18,ww],d=[t-.5,Math.sin(t*Math.PI)*.18,w];tri(result.leaf,a,b,c,[0,1,0],[0,1,0],[0,1,0]);tri(result.leaf,a,c,d,[0,1,0],[0,1,0],[0,1,0]);}
 for(let i=0;i<16;i++){const t=i/16,s=(i+1)/16,x=t*t*.26,xx=s*s*.26,w=.07*(1-t)+.006,ww=.07*(1-s)+.006;tri(result.blade,[x-w,t-.5,0],[xx-ww,s-.5,0],[xx+ww,s-.5,0],[0,0,1],[0,0,1],[0,0,1]);tri(result.blade,[x-w,t-.5,0],[xx+ww,s-.5,0],[x+w,t-.5,0],[0,0,1],[0,0,1],[0,0,1]);}
 for(let i=0;i<16;i++){const a=i*Math.PI/16,b=(i+1)*Math.PI/16;for(const z of [-.5,.5]){const p=[Math.cos(a)*.5,Math.sin(a)*.5,z],q=[Math.cos(b)*.5,Math.sin(b)*.5,z],r=[Math.cos(a)*.32,Math.sin(a)*.32,z],s=[Math.cos(b)*.32,Math.sin(b)*.32,z];tri(result.arch,p,r,s);tri(result.arch,p,s,q);}const p=[Math.cos(a)*.5,Math.sin(a)*.5,-.5],q=[Math.cos(b)*.5,Math.sin(b)*.5,-.5],r=[q[0],q[1],.5],s=[p[0],p[1],.5];tri(result.arch,p,q,r);tri(result.arch,p,r,s);}
 for(let i=0;i<16;i++){const a=i*Math.PI/8,b=(i+1)*Math.PI/8,r=i%2?.27:.5,rr=(i+1)%2?.27:.5;tri(result.star,[0,0,0],[Math.cos(a)*r,0,Math.sin(a)*r],[Math.cos(b)*rr,0,Math.sin(b)*rr],[0,1,0],[0,1,0],[0,1,0]);}
 return result;
}
const meshes=mesh();
function create(canvas){
 let gl;try{gl=canvas.getContext('webgl',{antialias:true,alpha:true,preserveDrawingBuffer:true});}catch{}
 if(!gl){const note=document.createElement('div');note.className='webgl-note';note.textContent='WebGL is unavailable here. Showing the illustrated 2D renderer.';canvas.parentElement.append(note);return null;}
 const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
 const makeProgram=(v,f)=>{const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;};
 const vertex='attribute vec3 aPosition;attribute vec3 aColor;attribute vec3 aNormal;uniform mat4 uMatrix;uniform mat4 uModel;uniform mat4 uLight;varying vec3 vColor;varying vec3 vNormal;varying vec3 vWorld;varying vec4 vShadow;void main(){vec4 world=uModel*vec4(aPosition,1.0);vWorld=world.xyz;vColor=aColor;vNormal=mat3(uModel)*aNormal;vShadow=uLight*world;gl_Position=uMatrix*world;}';
 const fragment='precision highp float;varying vec3 vColor;varying vec3 vNormal;varying vec3 vWorld;varying vec4 vShadow;uniform sampler2D uShadow;uniform float uHasShadow;uniform vec3 uEye;uniform float uTime;uniform float uOverlay;void main(){vec3 n=normalize(vNormal),light=normalize(vec3(-0.6,1.0,0.55));float ndl=max(dot(n,light),0.0);vec3 coord=vShadow.xyz/vShadow.w*0.5+0.5;float shade=0.0;if(uHasShadow>0.5&&coord.x>0.0&&coord.x<1.0&&coord.y>0.0&&coord.y<1.0){float bias=max(0.0022*(1.0-ndl),0.0015);for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){vec2 rg=texture2D(uShadow,coord.xy+vec2(float(x),float(y))/1024.0).rg;float depth=dot(rg,vec2(1.0,1.0/255.0));shade+=coord.z-bias>depth?1.0:0.0;}shade/=9.0;}float grain=sin(vWorld.x*78.0+sin(vWorld.z*51.0))*sin(vWorld.y*81.0+vWorld.z*96.0)*0.013;float ambient=0.55+0.1*n.y;vec3 color=vColor*(ambient+ndl*(1.0-shade*0.67)*0.46+grain);vec3 viewDir=normalize(uEye-vWorld),halfDir=normalize(light+viewDir);float metal=step(0.55,vColor.r)*step(vColor.b,vColor.r*0.92);float spec=pow(max(dot(n,halfDir),0.0),32.0)*0.13*(1.0-shade)*metal;color+=vec3(1.0,0.87,0.64)*spec;float fog=smoothstep(6.0,16.0,length(vWorld.xz))*0.15;color=mix(color,vec3(0.75,0.83,0.79),fog);float water=step(vColor.r+0.12,vColor.b)*(1.0-step(0.0,vWorld.y));float ripple=sin(vWorld.x*12.0+vWorld.z*9.0+uTime*0.7)*sin(vWorld.x*5.0-vWorld.z*15.0+uTime*0.5);color+=water*vec3(0.01,0.02,0.025)*ripple;color=mix(color,vColor,uOverlay);color=pow(color,vec3(0.94));gl_FragColor=vec4(color,1.0);}';
 let program,shadowProgram;
 try{program=makeProgram(vertex,fragment);shadowProgram=makeProgram('attribute vec3 aPosition;uniform mat4 uMatrix;uniform mat4 uModel;void main(){gl_Position=uMatrix*uModel*vec4(aPosition,1.0);}','precision highp float;void main(){vec2 enc=fract(vec2(1.0,255.0)*gl_FragCoord.z);enc.x-=enc.y/255.0;gl_FragColor=vec4(enc,0.0,1.0);}');}catch(error){console.warn('3D renderer unavailable:',error.message);const wrapper=canvas.parentElement,replacement=canvas.cloneNode(true);canvas.replaceWith(replacement);const note=document.createElement('div');note.className='webgl-note';note.textContent='3D could not initialize. Showing the illustrated 2D battlefield.';wrapper.append(note);return null;}
 const loc=(p,name)=>gl.getUniformLocation(p,name),uMatrix=loc(program,'uMatrix'),uModel=loc(program,'uModel'),uLight=loc(program,'uLight'),uEye=loc(program,'uEye'),uShadow=loc(program,'uShadow'),uHasShadow=loc(program,'uHasShadow'),uTime=loc(program,'uTime'),uOverlay=loc(program,'uOverlay'),sMatrix=loc(shadowProgram,'uMatrix'),sModel=loc(shadowProgram,'uModel');
 const lightMatrix=multiply(ortho(-12,12,-12,12,.1,55),lookAt([-13,23,12],[0,0,0]));
 const shadowTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1024,1024,0,gl.RGBA,gl.UNSIGNED_BYTE,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const shadowFbo=gl.createFramebuffer(),depthBuffer=gl.createRenderbuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,shadowTexture,0);gl.bindRenderbuffer(gl.RENDERBUFFER,depthBuffer);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,1024,1024);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depthBuffer);const hasShadow=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);canvas.style.imageRendering='auto';
 const hud=document.createElement('canvas');hud.width=canvas.width;hud.height=canvas.height;hud.className='webgl-hud';hud.setAttribute('aria-hidden','true');canvas.parentElement.append(hud);const ink=hud.getContext('2d');
 const controls=document.createElement('div');controls.className='camera-controls';controls.innerHTML='<span>3D DIORAMA</span><button type="button" aria-label="Rotate camera left">↶</button><button type="button" aria-label="Rotate camera right">↷</button><button type="button" aria-label="Zoom out">−</button><button type="button" aria-label="Zoom in">+</button>';canvas.parentElement.append(controls);
 let yaw=.72,zoom=1,matrix=cameraMatrix(),lastC,lastUI,lastTime=0,lost=false,vertices=[],cachedTiles=null,sceneGeometry,overlayGeometry;const modelCache=new Map();
 const buttons=controls.querySelectorAll('button');buttons[0].onclick=()=>{yaw-=Math.PI/4;redraw();};buttons[1].onclick=()=>{yaw+=Math.PI/4;redraw();};buttons[2].onclick=()=>{zoom=Math.max(.7,zoom-.1);redraw();};buttons[3].onclick=()=>{zoom=Math.min(1.35,zoom+.1);redraw();};
 function redraw(){if(lastC)draw(lastC,lastUI,lastTime);}
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;const note=document.createElement('div');note.className='webgl-note';note.textContent='Graphics paused. Reload to resume your caravan.';canvas.parentElement.append(note);});
 const height=(c,x,y)=>({w:-.06,b:.14,m:.08,h:.2}[c.tiles[Math.max(0,Math.min(9,Math.round(y)))][Math.max(0,Math.min(13,Math.round(x)))]]??.06);
 function vertexData(p,n,color){vertices.push(...p,...color,...n);}
 function add(kind,x,y,z,sx,sy,sz,color,angle=0,pitch=0,roll=0){
  const col=typeof color==='string'?hex(color):color,cy=Math.cos(angle),syaw=Math.sin(angle),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
  const rotate=p=>{let [a,b,c]=p;[b,c]=[b*cp-c*sp,b*sp+c*cp];[a,b]=[a*cr-b*sr,a*sr+b*cr];return [a*cy+c*syaw,b,-a*syaw+c*cy];};
  for(const v of meshes[kind]){const p=rotate([v[0]*sx,v[1]*sy,v[2]*sz]),n=rotate(vec.norm([v[3]/sx,v[4]/sy,v[5]/sz]));vertexData([x+p[0],y+p[1],z+p[2]],n,col);}
 }
 function segment(a,b,r,color){const d=vec.sub(b,a),length=Math.hypot(...d),yaw=Math.atan2(d[0],d[2]),pitch=Math.acos(d[1]/length);add('cylinder',(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,r*2,length,r*2,color,yaw,pitch);}
 function upload(usage=gl.STATIC_DRAW,existing){const geometry=existing||{buffer:gl.createBuffer()};gl.bindBuffer(gl.ARRAY_BUFFER,geometry.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),usage);geometry.count=vertices.length/9;return geometry;}
 function bind(p,geometry){gl.bindBuffer(gl.ARRAY_BUFFER,geometry.buffer);for(const [name,offset] of [['aPosition',0],['aColor',12],['aNormal',24]]){const location=gl.getAttribLocation(p,name);if(location>=0){gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,3,gl.FLOAT,false,36,offset);}}}
 function drawGeometry(p,g,model=identity){if(!g?.count)return;bind(p,g);gl.uniformMatrix4fv(p===program?uModel:sModel,false,model);gl.drawArrays(gl.TRIANGLES,0,g.count);}
 function ring(x,y,z,r,color,width=.018){for(let i=0;i<40;i++){const a=i*Math.PI/20,b=(i+1)*Math.PI/20;segment([x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],width,color);}}
 function border(x,y,z,color){for(const [dx,dz,sx,sz] of [[-.47,0,.022,.94],[.47,0,.022,.94],[0,-.47,.94,.022],[0,.47,.94,.022]])add('cube',x+dx,y,z+dz,sx,.009,sz,color);}
 function characterGeometry(u,phase=0){
  const key=[u.id,u.sprite,u.side,u.name,u.promoted,u.tier,Boolean(u.equippedWeapon),Boolean(u.equippedRelic),phase].join('|');if(modelCache.has(key))return modelCache.get(key);
  const previous=vertices;vertices=[];
  const enemy=u.side==='enemy',boss=u.name==='The Ash Regent',robe=['mage','healer'].includes(u.sprite),cloth=enemy?(boss?'#613851':'#a85f4b'):(u.color||'#65866c'),dark=enemy?'#4a3037':({rhea:'#243c61',bram:'#705131',lyra:'#2d503e',orin:'#463653',sana:'#71856e',finn:'#244c52'}[u.id]||'#304f50'),skin=enemy?'#aa7c58':({rhea:'#ba805c',bram:'#805139',lyra:'#75472f',orin:'#b77b53',sana:'#a46c48',finn:'#ba875d'}[u.id]||'#b7815c'),gold=u.promoted?'#efc876':'#c7a363',metal='#b7a174',hair='#332d2a',step=phase?Math.sin(phase*Math.PI/4)*.075:0;
  const part=(kind,x,y,z,sx,sy,sz,color,yaw=0,pitch=0,roll=0)=>add(kind,x,y,z,sx,sy,sz,color,yaw,pitch,roll);
  // Anatomical rounded limbs, tapered coats and separate hanging cloth layers.
  for(const side of [-1,1]){part('sphere',side*.105,.23,.015+step*side,.16,.39,.18,dark,0,step*side*3);part('sphere',side*.105,.065,.07+step*side,.17,.115,.29,'#70523a');part('cylinder',side*.105,.12,.015+step*side,.165,.04,.18,gold);}
  if(robe){part('robe',0,.36,0,.6,.52,.52,cloth);for(let i=0;i<8;i++){const a=i*Math.PI/4;segment([Math.cos(a)*.26,.12,Math.sin(a)*.225],[Math.cos(a)*.17,.58,Math.sin(a)*.15],.008,i%2?gold:dark);}}
  else part('tunic',0,.43,0,.47,.38,.42,cloth);
  part('tunic',0,.7,0,.47,.44,.39,cloth);part('robe',0,.56,-.12,.47,.55,.14,dark,0,.1);
  if(['sword','tank'].includes(u.sprite)){part('tunic',0,.72,.018,.46,.35,.4,metal);for(let row=0;row<4;row++)for(let i=0;i<5;i++){const xx=(i-2)*.065;part('sphere',xx,.62+row*.06,.18-Math.abs(xx)*.35,.075,.05,.023,row%2?'#c9b585':'#a28f62');}}
  part('cylinder',0,.5,0,.45,.06,.37,'#79583d');part('sphere',0,.5,.197,.09,.07,.035,gold);
  for(const side of [-1,1]){const swing=side*step;part('sphere',side*.26,.71,swing,.17,.32,.18,cloth,0,-swing*3,side*.2);part('sphere',side*.29,.52,swing*.8,.12,.23,.13,cloth,0,swing*3);part('cylinder',side*.29,.43,swing*.8,.125,.035,.14,gold);part('sphere',side*.29,.4,swing*.8,.105,.14,.105,skin);if(u.sprite==='tank'||u.promoted)part('dome',side*.24,.865,0,.26,.12,.27,metal);}
  part('cylinder',0,.93,0,.12,.16,.13,skin);part('sphere',0,1.11,0,.28,.35,.27,skin);part('sphere',0,1.21,-.025,.295,.19,.26,hair);part('sphere',0,1.12,-.11,.27,.23,.1,hair);
  for(const side of [-1,1]){part('sphere',side*.14,1.09,0,.055,.09,.045,skin);part('sphere',side*.061,1.13,.117,.024,.018,.014,'#292f2a');segment([side*.085,1.16,.112],[side*.039,1.16,.128],.007,hair);}
  part('sphere',0,1.075,.135,.035,.065,.04,skin);part('sphere',0,1.025,.122,.065,.013,.012,'#86553c');
  if(['bram','orin'].includes(u.id)||u.sprite==='tank'&&enemy)part('sphere',0,.995,.06,.21,.15,.2,hair);
  if(u.id==='rhea'||u.id==='lyra')for(let i=0;i<8;i++)part('sphere',-.12,1.14-i*.052,.04+i*.006,.065-i*.003,.08,.07,hair);
  // Regional cloth wraps, metalwork and restrained woven gold detailing.
  if(u.sprite==='mage'){part('turban',0,1.29,0,.36,.23,.32,cloth);for(let i=0;i<3;i++)part('cylinder',0,1.22+i*.043,0,.355-i*.015,.025,.315-i*.012,i===1?'#c6a6c5':cloth);part('sphere',.08,1.27,.15,.045,.06,.025,gold);part('sphere',.08,1.27,.17,.025,.04,.015,'#68b4c4');part('robe',.14,1.02,-.07,.13,.42,.07,cloth,0,0,-.15);}
  if(['bow','healer','rogue'].includes(u.sprite)){part('turban',0,1.27,-.045,.34,.22,.31,cloth);part('sphere',-.145,1.11,-.04,.08,.29,.28,cloth);part('sphere',.145,1.11,-.04,.08,.29,.28,cloth);part('cylinder',0,.93,0,.34,.08,.32,cloth);for(let i=0;i<5;i++)part('sphere',(i-2)*.042,.91,.149,.018,.022,.014,gold);}
  if(u.sprite==='sword'){part('cylinder',0,1.24,0,.29,.025,.26,gold);part('sphere',0,1.24,.145,.04,.045,.025,'#77b9c9');part('sphere',-.34,.61,.055,.1,.46,.43,gold);part('sphere',-.395,.61,.055,.025,.37,.34,cloth);part('sphere',-.415,.61,.055,.035,.095,.09,gold);for(let i=0;i<8;i++){const a=i*Math.PI/4;part('sphere',-.41,.61+Math.cos(a)*.19,.055+Math.sin(a)*.17,.015,.025,.025,gold);}part('blade',.3,.83,.09,.75,.74,.1,'#d8e4dc',0,0,-.12);segment([.21,.46,.09],[.43,.46,.09],.018,gold);segment([.32,.36,.09],[.32,.47,.09],.026,'#765137');}
  if(u.sprite==='tank'){part('helmet',0,1.285,0,.35,.22,.33,metal);part('cylinder',0,1.25,0,.36,.03,.34,gold);part('sphere',-.35,.59,.06,.1,.52,.46,gold);part('sphere',-.405,.59,.06,.03,.43,.37,dark);part('sphere',-.43,.59,.06,.04,.11,.11,gold);segment([.31,.26,.08],[.34,1.09,.08],.023,'#8b683d');part('sphere',.34,1.1,.08,.27,.15,.18,metal);part('cylinder',.34,1.1,.08,.13,.17,.13,gold);if(boss){part('turban',0,1.42,0,.26,.11,.25,gold);for(let i=0;i<5;i++)part('sphere',Math.cos(i*1.25)*.1,1.48,Math.sin(i*1.25)*.1,.035,.11,.035,gold);}}
  if(u.sprite==='bow'){for(let i=0;i<15;i++){const t=i/14*Math.PI,s=(i+1)/14*Math.PI;segment([.34,.31+i/14*.75,.08+Math.sin(t)*.19],[.34,.31+(i+1)/14*.75,.08+Math.sin(s)*.19],.014,'#a78049');}segment([.34,.31,.08],[.34,1.06,.08],.004,'#e6d6aa');part('cylinder',-.14,.69,-.23,.12,.4,.14,'#745239');for(let i=0;i<3;i++)segment([-.17+i*.035,.68,-.23],[-.17+i*.035,1.04,-.23],.006,'#d3ba85');}
  if(robe){segment([.34,.15,.1],[.34,1.32,.1],.015,'#ab8753');part('cylinder',.34,1.26,.1,.14,.03,.14,gold);part('sphere',.34,1.38,.1,.13,.2,.13,u.sprite==='mage'?'#e9bd79':'#a8d6bc');part('sphere',.32,1.4,.14,.025,.05,.018,'#fff2bf');part('robe',.1,.7,.18,.04,.31,.025,gold);}
  if(u.sprite==='rogue'){part('cylinder',0,1.03,.04,.27,.06,.25,cloth);for(const side of [-1,1]){part('blade',side*.32,.53,.08,.5,.36,.08,'#cfdfd8',0,0,side*.2);segment([side*.27,.36,.08],[side*.39,.36,.08],.012,gold);}}
  for(let i=0;i<5;i++)part('sphere',(i-2)*.07,.32,.19,.018,.025,.015,gold);
  if(u.tier)for(let i=0;i<Math.min(5,u.tier);i++)part('sphere',(i-2)*.035,.51,.202,.014,.02,.012,'#f2d18c');
  if(u.equippedWeapon)part('sphere',.3,.44,.13,.055,.08,.04,'#cbb0ea');if(u.equippedRelic)part('sphere',-.075,.79,.19,.055,.07,.025,'#8bcab6');
  const geometry=upload();vertices=previous;modelCache.set(key,geometry);if(modelCache.size>160){const oldest=modelCache.keys().next().value;gl.deleteBuffer(modelCache.get(oldest).buffer);modelCache.delete(oldest);}return geometry;
 }
 function tree(x,y,z,biome,k){
  if(biome==='islands'){
   for(let j=0;j<5;j++)segment([x+j*.035,y+j*.2,z],[x+(j+1)*.035,y+(j+1)*.2,z],.045-j*.004,'#a48a61');
   for(let i=0;i<9;i++){const a=i*Math.PI*2/9;add('leaf',x+.17+Math.cos(a)*.32,y+1.02,z+Math.sin(a)*.32,.95,.8,.8,i%2?'#62865b':'#8ca671',-a);}
  }else if(biome==='pass'){
   segment([x,y,z],[x,y+1.1,z],.055,'#846c4e');for(let j=0;j<5;j++)add('dome',x,y+.35+j*.19,z,.78-j*.13,.34,.78-j*.13,j%2?'#60866c':'#7b9877');
  }else{
   const baobab=biome==='grove';add('vase',x,y+.37,z,baobab?.31:.1,.75,baobab?.28:.1,'#9b8058');for(let j=0;j<4;j++){const a=j*Math.PI/2;segment([x,y+.45,z],[x+Math.cos(a)*.28,y+.8,z+Math.sin(a)*.2],baobab?.045:.027,'#9b8058');}
   for(let i=0;i<9;i++){const a=i*2.4,xx=x+Math.cos(a)*.27,zz=z+Math.sin(a)*.22;add('sphere',xx,y+.87+noise(k,i,2)*.12,zz,.55+noise(k,i,3)*.16,.22+noise(k,i,4)*.1,.5,i%3===0?'#a0b281':i%2?'#779663':'#577b57');}
  }
 }
 function buildScene(c){
  vertices=[];const biome=E.MAPS[c.battle%8].type,earth=biome==='grove',sandstone=['desert','ruins','fort'].includes(biome);
  // Continuous ground, softly rounded edge stones, and natural raised ground replace tile blocks.
  add('cube',0,-.34,0,14.03,.45,10.03,earth?'#9a805c':'#7d9170');add('cube',0,-.58,0,14.1,.06,10.1,'#5d7264');
  const colors={g:earth?'#bda475':'#a5b68b',f:earth?'#a88f64':'#90a477',r:'#cbbb94',w:'#5599a4',b:'#bda675',m:sandstone?'#d6ba8c':'#a7ae97',s:'#dec896',h:biome==='desert'?'#d6bd8c':'#b2b58b',a:'#d0bc97'};
  for(let y=0;y<10;y++)for(let x=0;x<14;x++){
   const t=c.tiles[y][x],wx=x-6.5,wz=y-4.5,h=height(c,x,y),col=hex(colors[t]).map(v=>v*(.995+noise(x,y,4)*.01));
   // Adjacent ground patches touch; hills rise through shared corner vertices.
   const corner=(dx,dz)=>{if(['w','b'].includes(t))return t==='b'?-.06:h;let sum=0;for(const xx of [x+dx-.5,x+dx+.5])for(const yy of [y+dz-.5,y+dz+.5]){const tx=Math.max(0,Math.min(13,Math.round(xx))),ty=Math.max(0,Math.min(9,Math.round(yy)));sum+=c.tiles[ty][tx]==='h'?.2:.06;}return sum/4;};
   const p=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([dx,dz])=>[wx+dx,corner(dx,dz),wz+dz]);
   for(const i of [0,1,2,0,2,3]){
    let tint=col;
    if(!['w','b','a'].includes(t)){
     const [dx,dz]=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]][i];tint=[0,0,0];let samples=0;
     for(const xx of [x+dx-.5,x+dx+.5])for(const yy of [y+dz-.5,y+dz+.5]){
      const tx=Math.max(0,Math.min(13,Math.round(xx))),ty=Math.max(0,Math.min(9,Math.round(yy))),neighbor=c.tiles[ty][tx];
      const sample=['w','b'].includes(neighbor)?col:hex(colors[neighbor]);tint=tint.map((v,k)=>v+sample[k]);samples++;
     }tint=tint.map(v=>v/samples);
    }
    vertexData(p[i],[0,1,0],tint);
   }
   if(t==='w'||t==='b')for(let j=0;j<3;j++)add('sphere',wx-.3+j*.22,h+.006,wz+noise(x,y,j)*.6-.3,.2,.008,.013,'#9ac8c8');
   if(t==='w')for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]){const tx=x+dx,ty=y+dz;if(tx<0||tx>13||ty<0||ty>9||['w','b'].includes(c.tiles[ty][tx]))continue;add('sphere',wx+dx*.48,h+.035,wz+dz*.48,dx?.12:1.02,.045,dz?.12:1.02,'#c5be94');}
   if(t==='b'){for(let j=0;j<8;j++)add('cube',wx-.44+j*.125,.16,wz,.115,.07,.9,j%2?'#c8b17f':'#b99f6d');for(const side of [-1,1]){segment([wx-.5,.34,wz+side*.44],[wx+.5,.34,wz+side*.44],.025,'#9d8357');for(const xx of [-.4,.4])segment([wx+xx,.14,wz+side*.44],[wx+xx,.39,wz+side*.44],.025,'#8f7651');}}
   if(t==='f')tree(wx-.18,h,wz-.18,biome,x+y*14);
   if(t==='m'){
    if(['ruins','fort'].includes(biome)){
     add('pillar',wx-.32,h+.39,wz,.22,.78,.32,'#c6a472');add('pillar',wx+.32,h+.39,wz,.22,.78,.32,'#c6a472');add('arch',wx,h+.71,wz,.86,.9,.33,'#dcc08e');
     add('cube',wx,h+1.15,wz,.98,.1,.41,'#bd9967');for(const side of [-1,1]){add('dome',wx+side*.33,h+1.21,wz,.22,.12,.26,'#e6cda1');add('sphere',wx+side*.33,h+.5,wz+.18,.075,.13,.018,'#49818a');}
    }else for(let i=0;i<4;i++){const xx=wx+(noise(x,y,i)-.5)*.65,zz=wz+(noise(y,x,i+3)-.5)*.55;add('sphere',xx,h+.25+noise(i,x,4)*.14,zz,.5+noise(i,y,3)*.5,.5+noise(i,x,6)*.5,.5+noise(x,i,7)*.45,i%2?(sandstone?'#c8a475':'#9ca58d'):(sandstone?'#e0c38e':'#b8bea4'),i*.6,0,i*.1);}
   }
   if(t==='a'&&(x+y)%3===0){add('star',wx,h+.008,wz,.48,.012,.48,'#377b85');add('cube',wx,h+.018,wz,.12,.008,.12,'#dfc38d',Math.PI/4);}
   if(['g','f','h'].includes(t)&&noise(x,y,1)>.32){for(let i=0;i<3;i++){const xx=wx+(noise(x,y,i+8)-.5)*.75,zz=wz+(noise(y,x,i+9)-.5)*.75;add('leaf',xx,h+.04,zz,.1,.45,.12,i%2?'#81945e':'#c7c496',i*2);if(noise(x,y,i+13)>.78)add('sphere',xx,h+.065,zz,.06,.04,.06,'#ebd6a1');}}
   if(t==='s'&&noise(x,y,8)>.65)add('sphere',wx+.18,h+.035,wz-.23,.22,.07,.14,'#c4aa7b');
  }
  for(const [x,z,color] of [[-6.55,-4.25,'#31787d'],[6.55,4.25,'#b5774c']]){
   segment([x,.06,z],[x,1.31,z],.018,'#a98d5b');add('sphere',x,1.34,z,.055,.11,.055,'#dfbc72');
   for(let i=0;i<9;i++){const xx=x+.035+i*.036,zz=z+Math.sin(i*.45)*.035;add('cube',xx,1.02,zz,.04,.38-i*.006,.012,i===0||i===8?'#d5b36c':color);}
   add('cube',x+.18,1.02,z+.036,.10,.10,.015,'#e3c682',0,0,Math.PI/4);add('cube',x+.18,1.02,z+.048,.045,.045,.01,color,0,0,Math.PI/4);
   add('vase',x+.2,.13,z+.15,.15,.23,.15,'#b38659');
  }
  if(sceneGeometry)gl.deleteBuffer(sceneGeometry.buffer);sceneGeometry=upload();cachedTiles=c.tiles;
 }
 function draw(c,ui,time=0){
  if(lost)return;lastC=c;lastUI=ui;lastTime=time;matrix=cameraMatrix(yaw,zoom,canvas.width/canvas.height);if(cachedTiles!==c.tiles)buildScene(c);
  const active=c.units.find(u=>u.id===(ui.actorId||E.active(c)?.id)),actors=[];
  for(const u of c.units.filter(E.alive)){
   const moving=ui.motion?.id===u.id,pos=moving?ui.motion.position:u;let x=pos.x-6.5,z=pos.y-4.5,y=height(c,pos.x,pos.y)+(moving?pos.bob*.08:0),angle=u.side==='enemy'?-Math.PI/2:Math.PI/2;
   if(ui.strike?.actor.id===u.id){const t=ui.strike.target;angle=Math.atan2(t.x-u.x,t.y-u.y);if(['slash','shadow'].includes(ui.strike.kind)&&!ui.strike.reduced){const l=Math.sin(Math.min(1,ui.strike.progress/.55)*Math.PI)*.24;x+=Math.sign(t.x-u.x)*l;z+=Math.sign(t.y-u.y)*l;angle+=Math.sin(ui.strike.progress*Math.PI*2)*.25;}}
   if(ui.strike?.target.id===u.id&&ui.strike.progress>.55&&!ui.strike.reduced)x+=Math.sin(ui.strike.progress*80)*.025;
   actors.push({u,geometry:characterGeometry(u,moving?1+Math.floor(time/85)%8:0),model:modelMatrix(x,y,z,angle)});
  }
  vertices=[];
  const reach=active?.side==='ally'&&!c.moved&&ui.action==='move'&&!ui.animating?E.reachable(c,active):new Map();
  if(ui.grid)for(let y=0;y<10;y++)for(let x=0;x<14;x++)border(x-6.5,height(c,x,y)+.012,y-4.5,'#8fa184');
  for(const key of reach.keys()){const [x,y]=key.split(',').map(Number);border(x-6.5,height(c,x,y)+.022,y-4.5,'#d2e4d2');}
  if(active&&!ui.animating&&['attack','skill'].includes(ui.action))for(const target of c.units.filter(u=>E.validTarget(c,active,u,ui.action)))ring(target.x-6.5,height(c,target.x,target.y)+.035,target.y-4.5,.43,'#e8c18b');
  if(ui.hover)border(ui.hover.x-6.5,height(c,ui.hover.x,ui.hover.y)+.04,ui.hover.y-4.5,'#fff0c4');
  if(active)ring(active.x-6.5,height(c,active.x,active.y)+.035,active.y-4.5,.38,'#f6d69b',.012);
  for(const item of c.loot||[]){const x=item.x-6.5,z=item.y-4.5,h=height(c,item.x,item.y);add('vase',x,h+.14,z,.24,.28,.24,'#a1814e');add('dome',x,h+.31,z,.27,.12,.27,E.ITEMS[item.type].color);add('sphere',x,h+.56+Math.sin(time/350)*.04,z,.08,.14,.08,'#e9d79b');}
  const fx=ui.strike;if(fx){const p=fx.progress,a=fx.actor,b=fx.target,ay=height(c,a.x,a.y)+.9,by=height(c,b.x,b.y)+.8,heal=['heal','rally','guard'].includes(fx.kind);
   if(p<.55&&['heal','rally','fire','bolt','guard'].includes(fx.kind))ring(a.x-6.5,height(c,a.x,a.y)+.04,a.y-4.5,.24+p*.5,heal?'#d1e2ac':'#e8c491',.012);
   if(p>=.2&&p<.57&&['arrow','bolt','fire'].includes(fx.kind)){const t=(p-.2)/.35,x=a.x+(b.x-a.x)*t-6.5,z=a.y+(b.y-a.y)*t-4.5,y=ay+(by-ay)*t+Math.sin(t*Math.PI)*.17;add(fx.kind==='arrow'?'cylinder':'sphere',x,y,z,.07,fx.kind==='arrow'?.4:.19,.07,fx.kind==='fire'?'#ffd09a':'#d3e0de',Math.atan2(b.x-a.x,b.y-a.y),Math.PI/2);}
   if(p>.43&&p<.88&&['slash','shadow'].includes(fx.kind)){const t=(p-.43)/.45;for(let i=0;i<14;i++){const a=-1.4+i*.13+t*.9,aa=a+.13,r=.42+t*.15;segment([b.x-6.5+Math.cos(a)*r,by+Math.sin(a)*r,b.y-4.5+.05],[b.x-6.5+Math.cos(aa)*r,by+Math.sin(aa)*r,b.y-4.5+.05],.012,fx.kind==='shadow'?'#a5e0d6':'#fff0c9');}}
   if(p>.55){const t=(p-.55)/.45;ring(b.x-6.5,height(c,b.x,b.y)+.05,b.y-4.5,.17+t*.6,heal?'#c4e6a6':'#f4d393',.012);for(let i=0;i<12;i++){const a=i*Math.PI/6+t*2;add('sphere',b.x-6.5+Math.cos(a)*(.1+t*.5),by+t*.45+Math.sin(i)*.14,b.y-4.5+Math.sin(a)*(.1+t*.5),.02+(1-t)*.06,.03+(1-t)*.1,.02+(1-t)*.06,heal?'#d2edb3':fx.kind==='fire'?'#f7c385':'#f7e4b7');}}
  }
  overlayGeometry=upload(gl.DYNAMIC_DRAW,overlayGeometry);
  if(hasShadow){gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFbo);gl.viewport(0,0,1024,1024);gl.clearColor(1,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(shadowProgram);gl.uniformMatrix4fv(sMatrix,false,lightMatrix);drawGeometry(shadowProgram,sceneGeometry);for(const a of actors)drawGeometry(shadowProgram,a.geometry,a.model);gl.bindFramebuffer(gl.FRAMEBUFFER,null);}
  gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniformMatrix4fv(uMatrix,false,matrix);gl.uniformMatrix4fv(uLight,false,lightMatrix);gl.uniform3f(uEye,Math.sin(yaw)*20,22,Math.cos(yaw)*20);gl.uniform1f(uHasShadow,hasShadow?1:0);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,shadowTexture);gl.uniform1i(uShadow,0);gl.uniform1f(uTime,time/1000);gl.uniform1f(uOverlay,0);drawGeometry(program,sceneGeometry);gl.uniform1f(uOverlay,1);drawGeometry(program,overlayGeometry);gl.uniform1f(uOverlay,0);for(const a of actors)drawGeometry(program,a.geometry,a.model);
  ink.clearRect(0,0,hud.width,hud.height);ink.textAlign='center';ink.font='600 10px system-ui,sans-serif';
  for(const {u} of actors){const pos=ui.motion?.id===u.id?ui.motion.position:u,point=projectPoint(matrix,[pos.x-6.5,height(c,pos.x,pos.y)+1.62,pos.y-4.5],hud.width,hud.height);ink.fillStyle='#263e3abf';ink.beginPath();ink.roundRect(point.x-14,point.y,28,3,1.5);ink.fill();ink.fillStyle=u.side==='ally'?'#cde5ac':'#e8ad8e';ink.beginPath();ink.roundRect(point.x-13,point.y+.7,26*u.hp/u.maxHp,1.6,.8);ink.fill();if(active?.id===u.id){ink.lineWidth=3;ink.strokeStyle='#e7e7d7';ink.strokeText(u.name,point.x,point.y-5);ink.fillStyle='#294843';ink.fillText(u.name,point.x,point.y-5);}}
  for(const effect of ui.effects||[]){const remaining=effect.until-performance.now();if(remaining<=0)continue;const point=projectPoint(matrix,[effect.x-6.5,height(c,effect.x,effect.y)+1.8+(1-remaining/1200)*.5,effect.y-4.5],hud.width,hud.height);ink.font='600 17px Georgia,serif';ink.lineWidth=3;ink.strokeStyle='#304138';const text=(effect.value>0?'+':'')+effect.value;ink.strokeText(text,point.x,point.y);ink.fillStyle=effect.value>0?'#d8efa9':'#fff0cb';ink.fillText(text,point.x,point.y);}
 }
 function pick(clientX,clientY){
  if(!lastC)return null;const rect=canvas.getBoundingClientRect(),point={x:(clientX-rect.left)/rect.width*canvas.width,y:(clientY-rect.top)/rect.height*canvas.height};
  const units=lastC.units.filter(E.alive).map(u=>({u,p:projectPoint(matrix,[u.x-6.5,height(lastC,u.x,u.y)+.85,u.y-4.5],canvas.width,canvas.height)})).sort((a,b)=>a.p.z-b.p.z);for(const {u,p} of units)if(Math.hypot(point.x-p.x,point.y-p.y)<16)return {x:u.x,y:u.y};
  const hits=[];for(let y=0;y<10;y++)for(let x=0;x<14;x++){const h=height(lastC,x,y),poly=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([dx,dz])=>projectPoint(matrix,[x-6.5+dx,h+.02,y-4.5+dz],canvas.width,canvas.height));if(contains(poly,point))hits.push({x,y,z:poly.reduce((n,p)=>n+p.z,0)/4});}hits.sort((a,b)=>a.z-b.z);return hits.length?{x:hits[0].x,y:hits[0].y}:null;
 }
 return {draw,pick};
}
root.EmberWebGL=Object.freeze({create,cameraMatrix,projectPoint,contains});
})(globalThis);
