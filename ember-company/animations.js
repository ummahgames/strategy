(function(root){
'use strict';
// Presentation math is independent from combat state and frame rate.
const PACES = Object.freeze({ deliberate: 1, standard: 0.65, quick: 0.35 });
function timing(pace='deliberate') {
  const scale=PACES[pace]??PACES.deliberate;
  return {step:220*scale,attack:1400*scale,recovery:650*scale,think:850*scale};
}
function sampleMovement(path,progress,reduced=false) {
  if(!path?.length)return null;
  if(path.length===1)return {...path[0],bob:0};
  const t=Math.max(0,Math.min(1,progress))*(path.length-1);
  const i=Math.min(path.length-2,Math.floor(t)),p=t-i;
  const amount=reduced?(p<1?0:1):p*p*(3-2*p);
  return {x:path[i].x+(path[i+1].x-path[i].x)*amount,
    y:path[i].y+(path[i+1].y-path[i].y)*amount,
    bob:reduced?0:Math.sin(p*Math.PI)*0.65};
}
function attackKind(actor,action) {
  if(action==='guard')return 'guard';
  if(action==='potion'||(action==='skill'&&actor.id==='sana'))return 'heal';
  if(action==='skill'&&actor.id==='bram')return 'rally';
  if(action==='skill'&&actor.id==='orin')return 'fire';
  if(actor.sprite==='bow')return 'arrow';
  if(actor.sprite==='mage'||actor.sprite==='healer')return 'bolt';
  if(action==='skill'&&actor.id==='finn')return 'shadow';
  return 'slash';
}
function timelineStep(elapsed,delta,duration,paused=false) {
  const next=paused?elapsed:Math.min(duration,elapsed+Math.max(0,Math.min(delta,50)));
  return {elapsed:next,progress:duration?next/duration:1,done:next>=duration};
}

root.EmberAnimations=Object.freeze({PACES,timing,sampleMovement,attackKind,timelineStep});
})(globalThis);
