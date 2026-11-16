importScripts('engine.js');
onmessage=e=>{let {board,n,level,history,id}=e.data;postMessage({move:Toroid.choose(board,n,'O',level,history),id})};
