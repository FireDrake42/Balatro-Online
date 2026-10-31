/* Original per-game sonic signatures. Tones: seconds,MIDI,length,gain,wave,Hz.
 * Noise: seconds,length,gain,centreHz,Q,highpass. Pure data; no game/save/RNG access.
 * Call only AFTER a proven action. Reload/status/checkpoint never author a sound.
 */
(function(root,factory){'use strict';const data=factory();if(typeof module==='object'&&module.exports)module.exports=data;else root.BOGameAudioData=data;})(typeof window!=='undefined'?window:globalThis,function(){'use strict';
const games=Object.create(null),sounds=Object.create(null),own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
function add(game,action,tones,noise=[],pan=0,wet=.08){const id='game_'+game.replace(/-/g,'_')+'_'+action,d={id,tones,noise,pan,wet};(games[game]||(games[game]=Object.create(null)))[action]=d;sounds[id]=d;}
// Blackjack: dry, low felt taps with warm piano overtones.
add('blackjack','deal',[[.025,48,.08,.09,'piano',1450],[.075,64,.12,.045,'sine',2100]],[[0,.09,.095,1250,.7,false]],-.12,.025);
add('blackjack','choose',[[0,57,.065,.075,'piano',1600],[.055,62,.11,.045,'triangle',1900]],[[.008,.035,.035,1900,.6,false]],-.1,.03);
add('blackjack','result',[[0,62,.21,.07,'piano',2100],[.08,69,.24,.055,'piano',2300],[.17,65,.3,.04,'sine',2600]],[],0,.12);
// Baccarat: tiny high glass pairs; no Blackjack felt or poker strum.
add('baccarat','deal',[[0,84,.13,.045,'sine',5400],[.021,91,.09,.021,'sine',5800],[.09,82,.17,.04,'triangle',4200]],[[.018,.045,.035,3200,.9,false]],.14,.16);
add('baccarat','choose',[[0,86,.12,.045,'sine',4800],[.065,83,.15,.032,'sine',4300]],[],.18,.14);
add('baccarat','result',[[0,83,.23,.045,'sine',4900],[.075,78,.2,.034,'triangle',3500],[.16,86,.3,.035,'sine',5100],[.24,90,.26,.02,'sine',5500]],[],.05,.18);
// High-Low: a question/answer contour, hollow and gently nasal.
add('high-low','deal',[[0,67,.11,.065,'triangle',2300],[.1,74,.14,.045,'triangle',2800],[.19,72,.14,.025,'sine',2700]],[[.025,.06,.035,2300,.5,true]],-.16,.05);
add('high-low','choose',[[0,74,.085,.06,'triangle',2500],[.047,69,.12,.041,'triangle',2000],[.113,76,.1,.024,'sine',3200]],[],-.14,.04);
add('high-low','result',[[0,79,.14,.05,'triangle',3000],[.095,76,.17,.039,'triangle',2600],[.21,81,.24,.035,'sine',3500]],[],0,.09);
// Draw Poker: a miniature plucked chord, with an audible low-string body.
add('poker','deal',[[.025,52,.1,.065,'piano',1800],[.04,59,.13,.045,'piano',2100],[.065,66,.17,.035,'piano',2700]],[[0,.1,.07,1750,.65,false]],-.2,.065);
add('poker','choose',[[0,64,.09,.055,'piano',2200],[.028,71,.13,.031,'sine',3000]],[[.006,.025,.026,1500,1,false]],-.19,.06);
add('poker','result',[[0,64,.23,.06,'piano',2400],[.043,71,.24,.046,'piano',2700],[.13,68,.25,.036,'sine',3000],[.22,76,.31,.026,'sine',3400]],[],0,.15);
// Strict Poker: restrained low, woody pulses rather than the draw-table strum.
add('strict-poker','deal',[[0,42,.08,.075,'triangle',700],[.041,54,.1,.038,'square',1050],[.11,61,.13,.03,'triangle',1500]],[[.018,.055,.07,720,.9,false]],.07,.02);
add('strict-poker','choose',[[0,54,.07,.05,'square',950],[.075,58,.09,.035,'triangle',1400]],[[.01,.025,.03,640,1.3,false]],.09,.015);
add('strict-poker','result',[[0,49,.16,.055,'triangle',1150],[.09,61,.22,.042,'square',1650],[.185,66,.25,.032,'triangle',2200],[.29,65,.19,.022,'sine',2100]],[],0,.07);
// Slots: an irregular mechanical ratchet followed by rounded luminous pings.
add('slots','spin',[[0,55,.06,.05,'triangle',1800],[.045,62,.06,.045,'triangle',2100],[.112,58,.07,.041,'triangle',1900],[.19,65,.09,.033,'sine',2700]],[[0,.035,.035,2300,1.1,false],[.08,.035,.03,2800,.9,false],[.16,.04,.026,3300,.7,false]],0,.04);
add('slots','choose',[[0,70,.07,.04,'sine',3200],[.035,77,.11,.025,'triangle',3800]],[[.01,.03,.03,2500,.9,false]],.1,.07);
add('slots','result',[[0,72,.17,.05,'sine',3300],[.06,79,.19,.043,'triangle',3600],[.145,75,.23,.035,'sine',3200],[.255,84,.3,.027,'sine',4500]],[],0,.15);
// Darts: short air pass, tightly filtered cork impact, then a low wood resonance.
add('darts','throw',[[.063,46,.09,.105,'triangle',830],[.071,58,.055,.027,'sine',1250]],[[0,.06,.05,5100,.6,true],[.057,.04,.11,640,1.2,false]],.03,.005);
add('darts','choose',[[0,61,.052,.045,'triangle',1450]],[[0,.022,.032,950,1.1,false]],.04,.005);
add('darts','result',[[0,58,.13,.055,'triangle',1600],[.12,63,.19,.04,'piano',1900],[.265,70,.25,.03,'triangle',2400]],[[.015,.035,.025,750,.7,false]],0,.07);
// Fictional-game collection: small bouncy mallets, separate from all card tables.
add('games','play',[[0,76,.09,.055,'sine',3700],[.07,69,.13,.042,'triangle',2500],[.16,73,.11,.027,'sine',3200]],[[.028,.04,.035,3400,.5,true]],-.04,.06);
add('games','choose',[[0,81,.07,.038,'sine',4300],[.09,77,.1,.026,'triangle',3200]],[],.04,.08);
add('games','result',[[0,77,.15,.05,'sine',3900],[.075,84,.18,.036,'triangle',4600],[.18,80,.2,.03,'sine',4100],[.305,86,.27,.025,'sine',5200]],[],0,.13);
// Twelve local games: independently authored motifs, rhythms and materials.
add('emerald-clicker','play',[[0,80,.07,.055,'sine',4200],[.045,87,.09,.025,'sine',5300]],[],.08,.055);
add('emerald-clicker','choose',[[0,75,.065,.045,'triangle',2900],[.08,82,.1,.025,'sine',3900]],[],.08,.04);
add('emerald-clicker','result',[[0,80,.16,.05,'sine',4200],[.07,75,.18,.035,'sine',3700],[.19,87,.28,.03,'triangle',5100]],[],0,.12);
add('snake','play',[[0,60,.065,.055,'square',1200],[.055,67,.07,.034,'triangle',1600],[.13,65,.08,.024,'square',1400]],[],0,.015);
add('snake','choose',[[0,67,.045,.035,'square',1500]],[[.008,.022,.022,1800,.65,false]],-.04,.01);
add('snake','result',[[0,67,.13,.045,'square',1700],[.09,70,.14,.035,'triangle',2100],[.215,76,.23,.025,'square',2400]],[],0,.05);
add('prism-stack','play',[[0,71,.075,.045,'triangle',2900],[.038,78,.09,.03,'sine',3900],[.12,74,.11,.025,'sine',3500]],[[0,.035,.03,3600,.8,false]],.13,.09);
add('prism-stack','choose',[[0,78,.055,.035,'triangle',3100],[.04,80,.065,.023,'sine',3600]],[],.1,.065);
add('prism-stack','result',[[0,74,.14,.045,'sine',3500],[.065,81,.17,.035,'triangle',4100],[.17,78,.2,.027,'sine',3900],[.295,85,.26,.022,'sine',4900]],[],0,.16);
add('money-idle-maker','play',[[0,48,.085,.07,'piano',1300],[.075,55,.12,.038,'piano',1900]],[[.016,.04,.03,1100,1,false]],-.13,.035);
add('money-idle-maker','choose',[[0,60,.08,.042,'piano',2200],[.1,58,.09,.026,'triangle',1800]],[],0,.03);
add('money-idle-maker','result',[[0,60,.16,.05,'piano',2200],[.08,64,.2,.037,'piano',2500],[.23,69,.29,.028,'sine',3000]],[],0,.11);
add('rocket-hit','play',[[.015,43,.15,.08,'triangle',980],[.095,55,.12,.035,'sine',1600]],[[0,.15,.08,2900,.55,true],[.13,.06,.035,690,1.1,false]],.03,.025);
add('rocket-hit','choose',[[0,65,.07,.038,'triangle',2300],[.06,72,.08,.024,'sine',3100]],[],.04,.02);
add('rocket-hit','result',[[0,55,.17,.06,'triangle',1700],[.065,67,.15,.033,'triangle',2600],[.185,74,.26,.028,'sine',3400]],[[0,.08,.045,780,.7,false]],0,.065);
add('dodge-slimes','play',[[0,57,.09,.055,'triangle',1450],[.08,64,.1,.035,'sine',2100],[.155,60,.085,.027,'triangle',1800]],[[.01,.06,.04,2400,.5,true]],-.09,.02);
add('dodge-slimes','choose',[[0,69,.055,.037,'triangle',2500],[.055,66,.07,.023,'sine',2100]],[],0,.015);
add('dodge-slimes','result',[[0,72,.16,.048,'triangle',3000],[.115,69,.16,.033,'sine',2700],[.245,79,.25,.027,'sine',3700]],[],.03,.09);
add('lantern-guard','play',[[0,62,.12,.05,'piano',1800],[.062,69,.15,.034,'sine',2400],[.14,66,.16,.023,'piano',2100]],[],.08,.13);
add('lantern-guard','choose',[[0,74,.09,.036,'sine',3100],[.08,69,.12,.024,'piano',2400]],[],.09,.12);
add('lantern-guard','result',[[0,66,.2,.045,'piano',2400],[.125,74,.24,.032,'sine',3300],[.27,81,.31,.024,'sine',4100]],[],0,.19);
add('idle-dice','play',[[0,50,.055,.06,'triangle',980],[.07,57,.06,.04,'piano',1500],[.165,53,.08,.03,'triangle',1200]],[[.025,.035,.045,1300,1.2,false],[.115,.025,.03,1700,.9,false]],0,.015);
add('idle-dice','choose',[[0,65,.065,.035,'piano',2100]],[[.007,.03,.025,950,1.1,false]],-.05,.02);
add('idle-dice','result',[[0,65,.14,.045,'piano',2300],[.1,72,.19,.033,'triangle',3000],[.25,68,.25,.024,'sine',2700]],[],0,.085);
add('mossbound-critters','play',[[0,76,.12,.045,'sine',3300],[.11,71,.16,.032,'triangle',2500],[.2,74,.14,.024,'sine',2900]],[[.025,.06,.027,3900,.5,true]],-.12,.14);
add('mossbound-critters','choose',[[0,69,.08,.033,'sine',2300],[.12,73,.11,.023,'triangle',2800]],[],.06,.11);
add('mossbound-critters','result',[[0,74,.21,.042,'sine',3300],[.15,81,.23,.031,'sine',4100],[.3,78,.3,.025,'triangle',3600]],[],0,.2);
add('dragon-drill','play',[[0,38,.1,.08,'triangle',620],[.055,50,.11,.04,'square',950],[.12,45,.12,.033,'triangle',740]],[[.015,.1,.06,510,.9,false]],-.04,.01);
add('dragon-drill','choose',[[0,57,.06,.04,'square',1300],[.075,52,.08,.027,'triangle',1050]],[[0,.03,.025,750,.9,false]],0,.015);
add('dragon-drill','result',[[0,50,.17,.055,'triangle',1200],[.085,57,.19,.036,'piano',1700],[.235,62,.28,.028,'triangle',2300]],[[.025,.045,.028,630,1,false]],0,.06);
add('circuit-weaver','play',[[0,82,.055,.038,'sine',4800],[.065,77,.07,.03,'square',2200],[.145,85,.1,.024,'sine',5100]],[],.11,.04);
add('circuit-weaver','choose',[[0,77,.05,.032,'square',1900],[.037,84,.08,.021,'sine',4500]],[],.1,.025);
add('circuit-weaver','result',[[0,77,.13,.04,'sine',4100],[.055,85,.17,.031,'triangle',4900],[.165,82,.2,.026,'sine',4600],[.29,89,.28,.019,'sine',5500]],[],0,.1);
add('star-harbor','play',[[0,65,.095,.05,'triangle',2400],[.085,77,.15,.028,'sine',3700],[.175,72,.13,.023,'sine',3000]],[[0,.08,.035,4200,.5,true]],-.08,.12);
add('star-harbor','choose',[[0,72,.055,.032,'sine',2900],[.075,79,.1,.022,'triangle',3600]],[],0,.08);
add('star-harbor','result',[[0,77,.19,.043,'sine',3900],[.135,84,.22,.029,'triangle',4500],[.28,88,.3,.023,'sine',5100]],[],0,.18);
freeze(games);freeze(sounds);
function idFor(game,action){return typeof game==='string'&&typeof action==='string'&&own(games,game)&&own(games[game],action)?games[game][action].id:null;}
return Object.freeze({version:1,games,sounds,idFor});
});
