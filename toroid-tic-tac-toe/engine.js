(function(root){
'use strict';
const other=p=>p==='X'?'O':'X';
function shift(b,n,d){let a=Array(b.length); for(let r=0;r<n;r++)for(let c=0;c<n;c++){let y=(r+(d==='down'?1:d==='up'?-1:0)+n)%n,x=(c+(d==='right'?1:d==='left'?-1:0)+n)%n;a[y*n+x]=b[r*n+c]}return a}
function lines(b,n){let k=n===5?4:n, wins={X:[],O:[]};for(let r=0;r<n;r++)for(let c=0;c<n;c++)for(const [dy,dx] of [[0,1],[1,0],[1,1],[1,-1]]){let y=r+(k-1)*dy,x=c+(k-1)*dx;if(y<0||y>=n||x<0||x>=n)continue;let ids=Array.from({length:k},(_,i)=>(r+i*dy)*n+c+i*dx),p=b[ids[0]];if(p&&ids.every(i=>b[i]===p))wins[p].push(ids)}return wins}
function key(b,p){return b.map(x=>x||'.').join('')+p}
function moves(b,n){let a=[];b.forEach((v,i)=>{if(!v)a.push({type:'place',i})});for(const d of ['left','right','up','down'])if(shift(b,n,d).some((v,i)=>v!==b[i]))a.push({type:'shift',d});return a}
function apply(b,n,m,p){if(m.type==='place'){let a=b.slice();a[m.i]=p;return a}return shift(b,n,m.d)}
function outcome(b,n){let w=lines(b,n);return w.X.length&&w.O.length?'draw':w.X.length?'X':w.O.length?'O':null}
function choose(b,n,p,level,history,budget=350){let start=Date.now(), ms=moves(b,n);if(!ms.length)return null;let max=level==='Easy'?1:level==='Medium'?3:n===3?8:5;let best=ms[0];function evalBoard(b){let score=0,k=n===5?4:n;for(let r=0;r<n;r++)for(let c=0;c<n;c++)for(const [dy,dx] of [[0,1],[1,0],[1,1],[1,-1]]){let y=r+(k-1)*dy,x=c+(k-1)*dx;if(y<0||y>=n||x<0||x>=n)continue;let a=0,z=0;for(let i=0;i<k;i++){let v=b[(r+i*dy)*n+c+i*dx];if(v===p)a++;else if(v)z++}if(!z)score+=Math.pow(4,a);if(!a)score-=Math.pow(4,z)}return score}
function search(b,turn,depth,alpha,beta,h){if(Date.now()-start>budget)throw 0;let o=outcome(b,n);if(o)return o==='draw'?0:o===p?100000+depth:-100000-depth;let ky=key(b,turn);if((h[ky]||0)>=3)return 0;if(!depth)return evalBoard(b);let list=moves(b,n);if(!list.length)return 0;let v=turn===p?-Infinity:Infinity;for(const m of list){let nb=apply(b,n,m,turn),nk=key(nb,other(turn));h[nk]=(h[nk]||0)+1;let s=search(nb,other(turn),depth-1,alpha,beta,h);h[nk]--;if(turn===p){v=Math.max(v,s);alpha=Math.max(alpha,v)}else{v=Math.min(v,s);beta=Math.min(beta,v)}if(beta<=alpha)break}return v}
ms.sort(()=>Math.random()-.5);for(let depth=1;depth<=max;depth++){try{let top=-Infinity,candidate=best;for(const m of ms){let nb=apply(b,n,m,p),nk=key(nb,other(p)),h={...history};h[nk]=(h[nk]||0)+1;let s=search(nb,other(p),depth-1,-Infinity,Infinity,h);if(level==='Easy')s+=Math.random()*35;if(s>top){top=s;candidate=m}}best=candidate}catch(e){break}}return best}
root.Toroid={shift,lines,key,moves,apply,outcome,choose,other};if(typeof module!=='undefined')module.exports=root.Toroid;
})(typeof self!=='undefined'?self:globalThis);
