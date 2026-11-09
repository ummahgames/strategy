'use strict';
// Codes identify a fresh level and its principal settings, not live battle state.
const LevelCode={
  encode(level,difficulty,preset,progression){
    if(!/^[1-9][0-9]*$/.test(String(level))||!['easy','medium','hard','expert'].includes(difficulty)||!['classic','flow'].includes(preset)||!['guided','custom'].includes(progression))throw Error('Invalid level settings');
    return `GW1:${level}:${difficulty}:${preset}:${progression}`;
  },
  decode(code){const parts=String(code).trim().toLowerCase().split(':');if(parts.length!==5||parts[0]!=='gw1')throw Error('Invalid level code');const [,level,difficulty,preset,progression]=parts;this.encode(level,difficulty,preset,progression);return {level,difficulty,preset,progression}}
};
const codePanel=updatePanel;
updatePanel=function(){codePanel();if(!config.level)return;const code=LevelCode.encode(config.level,config.difficulty==='normal'?'medium':config.difficulty,config.deployment==='flow'?'flow':'classic',config.progression==='guided'?'guided':'custom');if($('levelCode').value!==code)$('levelCode').value=code};
$('applyLevelCode').onclick=()=>{try{const data=LevelCode.decode($('importLevelCode').value);$('levelNumber').value=data.level;$('difficulty').value=data.difficulty;$('preset').value=data.preset;$('progression').value=data.progression;$('preset').onchange();$('levelCodeFeedback').textContent='Level code applied. Launch to start a fresh battle.'}catch(e){$('levelCodeFeedback').textContent='Invalid level code. Check the code and try again.'}};
$('copyLevel').onclick=async()=>{let field=$('levelCode');if(!field.value){notice('Start a level first.');return}try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(field.value);notice('Level code copied.')}catch(e){field.focus();field.select();notice('Level code selected; copy it from the field.')}};
