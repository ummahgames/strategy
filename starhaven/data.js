/* Shared browser / Node data. All prices and pacing live here. */
(function(root,factory){const data=factory();if(typeof module==='object')module.exports=data;else root.StarhavenData=data;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const species={
 amoeba:{name:'Stardust amoeba',short:'Amoeba',cost:70,food:'matter',output:'mineral',interval:7,hunger:42,radius:19,color:'#7ce8d0',unlock:0,description:'Eats star-matter · releases minerals. Adults also shed solar motes.'},
 jelly:{name:'Nebula jellyfish',short:'Jellyfish',cost:230,food:'solar',output:'crystal',interval:10,hunger:52,radius:25,color:'#c1a0ff',unlock:5,description:'Eats solar motes from adult amoebas · releases crystals.'},
 polyp:{name:'Bloom polyp',short:'Polyp',cost:140,food:'matter',output:'plankton',interval:8,hunger:45,radius:21,color:'#ffb6a3',unlock:10,description:'Eats star-matter · grows plankton clouds to feed whales.'},
 whale:{name:'Space-whale',short:'Whale',cost:500,food:'plankton',output:'dark',interval:13,hunger:65,radius:43,color:'#8eb9ff',unlock:10,description:'Eats plankton from polyps or your dispenser · releases dark matter.'},
 ray:{name:'Comet ray',short:'Ray',cost:360,food:'mineral',output:'alloy',interval:12,hunger:55,radius:28,color:'#ffd484',unlock:15,description:'Eats uncollected minerals · refines them into valuable alloy.'},
 leviathan:{name:'Aurora leviathan',short:'Leviathan',cost:850,food:'crystal',output:'core',interval:17,hunger:70,radius:48,color:'#b5f5ed',unlock:17,description:'Eats uncollected jellyfish crystals · produces singularity cores.'}
};
const resources={mineral:{name:'Mineral',value:15,color:'#ffd88b'},crystal:{name:'Crystal',value:100,color:'#bf9bff'},dark:{name:'Dark matter',value:250,color:'#ec9fec'},alloy:{name:'Alloy',value:150,color:'#ffb66c'},core:{name:'Singularity core',value:600,color:'#a6fff2'},solar:{name:'Solar mote',value:0,color:'#fff2a2'},plankton:{name:'Plankton',value:0,color:'#faa6a0'}};
const companions=[
{id:'pip',name:'Pip',role:'Mining drone',icon:'◈',unlock:0,description:'Collects a valuable every 5 seconds.'},
{id:'halo',name:'Halo',role:'Shield satellite',icon:'◎',unlock:2,description:'Absorbs one hull impact every 12 seconds.'},
{id:'zip',name:'Zip',role:'Mini-fighter',icon:'➤',unlock:4,description:'Deals 8 damage to an invader every 2 seconds.'},
{id:'sol',name:'Sol',role:'Feeding drone',icon:'☀',unlock:6,description:'Drops free star-matter every 4 seconds.'},
{id:'mender',name:'Mender',role:'Repair bot',icon:'✚',unlock:9,description:'Repairs 2 hull every 4 seconds outside combat.'},
{id:'luma',name:'Luma',role:'Research probe',icon:'✧',unlock:12,description:'Every 8 seconds, nourishes and grows one creature.'},
{id:'tether',name:'Tether',role:'Gravity buoy',icon:'⌘',unlock:15,description:'Doubles how long resources stay in the biodome.'},
{id:'echo',name:'Echo',role:'Resonance satellite',icon:'≋',unlock:18,description:'Every 14 seconds, triggers a bonus production pulse.'}
];
const sectors=[{name:'Nursery Orbit',subtitle:'A small beginning, a boundless sky.',color:'#7ce8d0',planet:'#2e727d'}, {name:'Violet Expanse',subtitle:'Life blooms in the light between stars.',color:'#c1a0ff',planet:'#745285'}, {name:'The Broken Belt',subtitle:'A refuge among the remnants.',color:'#ffb88b',planet:'#8b644d'}, {name:'Aurora Frontier',subtitle:'Follow the currents of a living universe.',color:'#a3eadd',planet:'#487b92'}, {name:'The Living Ark',subtitle:'Carry your little universe home.',color:'#ffe6b0',planet:'#796989'}];
const titles=['First light','A growing constellation','Uninvited guests','A little backup','The first jump','Solar gardens','Violet bloom','A delicate balance','Under the glass','Parasite bloom','The plankton nursery','Gentle giants','Shower of stones','Shelter in the belt','Through the debris','Mineral currents','A richer orbit','The aurora awakens','All hands on deck','The last outpost','The Living Ark'];
const missions=titles.map((title,i)=>({id:i,title,sector:Math.floor(i/5),stage:i===20?1:i%5+1,beacon:i<5?350+i*100:900+(i-5)*100,threatEvery:Math.max(22,48-i),difficulty:1+Math.floor(i/5)*.45+(i%5)*.07,starting: i<5?190: i<10?360:600,description:i===20?'Assemble the evacuation gate and defeat the pirate flagship.':i%5===4?'Build the beacon while defending against an intensified assault.':'Grow your ecosystem and install all three jump-beacon components.'}));
return {species,resources,companions,sectors,missions};
});
