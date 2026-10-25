/* Same-entry, standalone-capable survey runner. Never persists response values. */
(function (root, factory) {
  'use strict';
  var generator = typeof module === 'object' && module.exports ? require('./surveys') : root.BOSurveys;
  var api = factory(root, generator);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BOSurveyRunner = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, S) {
  'use strict';
// Finite keyed presentation only: lookup at call time; canonical models and receipts stay untouched.

function _aux(key,fallback,params){const rt=globalThis.BOTranslation,values=params||{},plain=()=>fallback.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(all,name)=>Object.prototype.hasOwnProperty.call(values,name)?String(values[name]):all);if(!rt)return plain();const text=rt.t(key,values);return text===key?plain():text;}
function _auxEsc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const _auxKeys=Object.freeze({"team practice":"aux.survey.runner.eb9b9d720e32","a running track":"aux.survey.runner.a40ff4417073","a swimming pool":"aux.survey.runner.66e5e807d1ee","a climbing wall":"aux.survey.runner.27af1d3da407","a cycling route":"aux.survey.runner.7357f7ead818","a friendly tournament":"aux.survey.runner.b2b886c29e74","teamwork":"aux.survey.runner.9d9a67a66df1","comfort":"aux.survey.runner.8e9498bf9ee9","clear rules":"aux.survey.runner.66094c670bb8","colourful equipment":"aux.survey.runner.2a6eccd11987","fun challenges":"aux.survey.runner.c8cf95019381","space to relax":"aux.survey.runner.ff6dd0e8b259","Would you try a new team activity?":"aux.survey.runner.e1b7b5f53d6b","Would you watch a friendly match?":"aux.survey.runner.01f3f7c04a2b","Would you include a warm-up?":"aux.survey.runner.856bff133c27","Would you pick outdoor practice?":"aux.survey.runner.e34733fd7ba1","Would you share equipment?":"aux.survey.runner.27b8bfc5672e","Would you design a team badge?":"aux.survey.runner.bf1bad7f424a","How appealing is a friendly sports challenge?":"aux.survey.runner.a85acd32201f","How important is teamwork in your invented club?":"aux.survey.runner.d19c4841c5bb","How much would you enjoy a new activity?":"aux.survey.runner.0ba2ae22f3cf","How much does a colourful kit appeal to you?":"aux.survey.runner.3049d6b81760","How useful is a clear practice schedule?":"aux.survey.runner.3e53b2003a2b","Invent a name for a friendly sports club.":"aux.survey.runner.63946a1b75fa","Describe an imaginary team mascot.":"aux.survey.runner.03bc4384234e","Suggest a fun rule for a made-up sport.":"aux.survey.runner.c0394f66edc4","Describe an invented activity for a rainy day.":"aux.survey.runner.7f964161a8da","Suggest a friendly team motto.":"aux.survey.runner.0c65ac1b43ae","ball":"aux.survey.runner.e9de08263f4a","a city car":"aux.survey.runner.45c3045e0ff5","a tiny electric buggy":"aux.survey.runner.878bfa9166dd","a family wagon":"aux.survey.runner.8e2475dbf86e","a solar concept car":"aux.survey.runner.37432acaf3bf","a delivery van":"aux.survey.runner.de09aaecaea6","a colourful bus":"aux.survey.runner.7cfab8150751","quiet travel":"aux.survey.runner.2fe6ecedb835","colour":"aux.survey.runner.d6838c357444","easy parking":"aux.survey.runner.186f6038fded","storage space":"aux.survey.runner.465049962e23","a clear dashboard":"aux.survey.runner.dfa56a16489f","Would you choose a colourful concept car?":"aux.survey.runner.20fd31ae7fe8","Would you take an imaginary scenic route?":"aux.survey.runner.9b9880ed98aa","Would a quiet motor appeal to your character?":"aux.survey.runner.e818fbfe70b7","Would you try a miniature electric buggy?":"aux.survey.runner.d74fac0bc356","Would you add a map to the dashboard?":"aux.survey.runner.0adafbfd2f88","Would you design a car for a story?":"aux.survey.runner.d9ec10973539","How appealing is a quiet concept vehicle?":"aux.survey.runner.26a51ac584ae","How important is comfort on an invented trip?":"aux.survey.runner.845c8206846f","How useful is extra storage in your imaginary car?":"aux.survey.runner.5ab5fe2ed30e","How much do bright vehicle colours appeal to you?":"aux.survey.runner.37bc29578f66","How interesting is a solar-powered concept?":"aux.survey.runner.9b98f54227ef","Invent a model name for a fictional car.":"aux.survey.runner.58a7ff0beaf7","Describe one playful feature of an imaginary vehicle.":"aux.survey.runner.ddddf6d8cd3c","Suggest a destination for a made-up road trip.":"aux.survey.runner.c82f5d5ba0a0","Invent a friendly slogan for a concept car.":"aux.survey.runner.1e9437a6adda","Describe a vehicle from an imaginary city.":"aux.survey.runner.65a657360858","car":"aux.survey.runner.2b2961a431b2","a clear logo":"aux.survey.runner.e859ebb4eb3b","friendly packaging":"aux.survey.runner.4da6714aefbb","simple instructions":"aux.survey.runner.5154959213a2","durability":"aux.survey.runner.2731dedfe254","creative colours":"aux.survey.runner.102f725a21ba","repairable designs":"aux.survey.runner.53bf2f45c815","Would a simple fictional logo catch your eye?":"aux.survey.runner.f897598bbac5","Would you try a made-up reusable notebook?":"aux.survey.runner.0d0976a62bd8","Would your character choose bright packaging?":"aux.survey.runner.57b22600e07d","Would you notice clear product instructions?":"aux.survey.runner.da2bc6079f74","Would you invent a brand mascot?":"aux.survey.runner.f303ef1d3a59","Would you pick a repairable imaginary gadget?":"aux.survey.runner.11df17239a19","How memorable is a simple invented logo?":"aux.survey.runner.3b270d785d20","How appealing are playful fictional brand colours?":"aux.survey.runner.4c5e3aba8761","How important are clear instructions for a pretend product?":"aux.survey.runner.fd3d0e912340","How useful is a repairable imaginary gadget?":"aux.survey.runner.7c2e1f59dcb8","How much does friendly packaging appeal to you?":"aux.survey.runner.12fe3ad5dc12","Invent a name for a fictional brand.":"aux.survey.runner.68742c306b78","Suggest a friendly slogan for a made-up notebook.":"aux.survey.runner.cbc8ee26913d","Describe a logo for an imaginary shop.":"aux.survey.runner.50daf6a925f4","Invent a helpful feature for a pretend gadget.":"aux.survey.runner.a73b6beb140f","Describe a fictional brand mascot.":"aux.survey.runner.26cf9241ba97","spark":"aux.survey.runner.92f473809e59","a garden corner":"aux.survey.runner.a8280a210f5a","a reading nook":"aux.survey.runner.f9efe9a8bc06","a drawing desk":"aux.survey.runner.e6a16558f423","a picnic spot":"aux.survey.runner.0e2aa588b924","a puzzle shelf":"aux.survey.runner.955a1755b3cb","a music corner":"aux.survey.runner.c89cbc268c3a","calm surroundings":"aux.survey.runner.b437dc6c5493","bright colours":"aux.survey.runner.67485409244c","comfortable seating":"aux.survey.runner.b3572bcbd553","creative supplies":"aux.survey.runner.8795e32a83d9","clear signs":"aux.survey.runner.038abc10d898","room to share":"aux.survey.runner.a690ef9ab857","Would your fictional character enjoy a picnic?":"aux.survey.runner.229cd7bb50b8","Would you add a reading corner to an invented room?":"aux.survey.runner.03374989ba39","Would a made-up weekend include a puzzle?":"aux.survey.runner.00d1cbc9da5c","Would you choose a colourful imaginary garden?":"aux.survey.runner.c9f9faae6a03","Would you plan a pretend creative afternoon?":"aux.survey.runner.114260557582","Would a quiet corner suit your character?":"aux.survey.runner.404967c788c6","How appealing is a relaxed imaginary afternoon?":"aux.survey.runner.9e94d7fe41c0","How much would your fictional character enjoy a garden?":"aux.survey.runner.f48f21f4fa1e","How useful is a creative corner in an invented room?":"aux.survey.runner.87d161a02480","How appealing is a made-up puzzle activity?":"aux.survey.runner.7d3ee3346d14","How important is comfortable seating in a pretend space?":"aux.survey.runner.cbce387da7f8","Describe a relaxed afternoon for an invented character.":"aux.survey.runner.1d7e74d756a0","Invent a name for a friendly imaginary town.":"aux.survey.runner.bca19236d072","Suggest an activity for a fictional weekend.":"aux.survey.runner.4df7bd7c2661","Describe a made-up garden corner.":"aux.survey.runner.12df703489d7","Invent a cheerful detail for an imaginary room.":"aux.survey.runner.ca22d8802ba5","bee":"aux.survey.runner.62cb81b5904a","an animated adventure":"aux.survey.runner.1d22b038e7a8","a puzzle game":"aux.survey.runner.58ca1eac4aac","a nature comic":"aux.survey.runner.eba2ce52e40c","a music show":"aux.survey.runner.a0a8ad360202","a space story":"aux.survey.runner.0557aa35df4c","a creative video":"aux.survey.runner.141834cc0a92","a friendly cast":"aux.survey.runner.649cc8a581f9","clear sound":"aux.survey.runner.7172d558082e","colourful art":"aux.survey.runner.00c38600ae9d","a clever story":"aux.survey.runner.3f7789ccb686","gentle humour":"aux.survey.runner.18c92e1e61da","a surprising setting":"aux.survey.runner.ad91a89b63ce","Would you watch a made-up animated adventure?":"aux.survey.runner.31e027172d06","Would you try an imaginary puzzle game?":"aux.survey.runner.864b8ff83fa4","Would you read a fictional nature comic?":"aux.survey.runner.66100f0ad458","Would you invent a story soundtrack?":"aux.survey.runner.fef3f8b0662b","Would a friendly robot make a good main character?":"aux.survey.runner.92abc522615f","Would you design a pretend game world?":"aux.survey.runner.df0b8e399d55","How appealing is a colourful invented story?":"aux.survey.runner.d6b1e950aac0","How much would a fictional puzzle game interest you?":"aux.survey.runner.7388829ef56f","How useful is clear sound in a made-up show?":"aux.survey.runner.ff645cd4d9ca","How appealing is gentle humour in an imaginary comic?":"aux.survey.runner.0fe185e94c30","How interesting is a story set in a friendly space town?":"aux.survey.runner.d64d7c41b847","Invent a title for a friendly animated story.":"aux.survey.runner.7c12cf248786","Describe a character for an imaginary puzzle game.":"aux.survey.runner.86595cae0dbd","Suggest a setting for a made-up comic.":"aux.survey.runner.00fad0f420a0","Invent a name for a fictional music show.":"aux.survey.runner.2ad7a31e8a25","Describe one scene from an imaginary adventure.":"aux.survey.runner.2da216e5aef6","star":"aux.survey.runner.525eca1d5089","a sunny weekend":"aux.survey.runner.f101e8339195","a rainy afternoon":"aux.survey.runner.1c19f10ffec0","a friendly club":"aux.survey.runner.4f44fac8cf43","an imaginary festival":"aux.survey.runner.0fed26797387","a small creative project":"aux.survey.runner.4ab3942711dc","a futuristic town":"aux.survey.runner.39b247ef1056","a relaxed holiday":"aux.survey.runner.b7ce9192c750","a colourful exhibition":"aux.survey.runner.b30eb881043f","a community challenge":"aux.survey.runner.02627be0714f","an invented island":"aux.survey.runner.2ff242ca096b","a storybook village":"aux.survey.runner.e44ddb7930bd","a playful design contest":"aux.survey.runner.4f2047442dac","a quiet evening":"aux.survey.runner.dc4c5e4f7435","a spring celebration":"aux.survey.runner.cefbd6431599","Sports & teamwork":"aux.survey.runner.0e7609cab20b","Cars & travel":"aux.survey.runner.13351f98baf5","Fictional brands":"aux.survey.runner.1c034fffe924","Everyday life":"aux.survey.runner.6ffcf9be10dc","Media & creativity":"aux.survey.runner.5bbf50ff1587","{value1} No reward was earned.":"aux.survey.runner.68c032f03c59","Time elapsed {value1}:{value2}":"aux.survey.runner.233b61c51a3e","{value1} — scroll sideways if needed":"aux.survey.runner.3c26982dba08","{value1} — optional nature video preview":"aux.survey.runner.8aba3b828b67","Footage: {value1}":"aux.survey.runner.66c201dc5637","License: {value1}":"aux.survey.runner.d5fc271d7808","{value1}% complete":"aux.survey.runner.58856e13436c","Preference from {value1} to {value2}":"aux.survey.runner.517109907514","Fictional survey — Balatro Online":"aux.survey.runner.517df2548a83","ORIGINAL GAME SURVEY":"aux.survey.runner.22897330cc70","Use fictional answers, never real personal information. Local-only · game currency only · no survey-company affiliation.":"aux.survey.runner.bafb856e832f","Stars set presentation quality, never the saved reward.":"aux.survey.runner.8eb12781825f","Answer text is sharp":"aux.survey.runner.94c10e6cc839","Keep answers sharp":"aux.survey.runner.bf97d22268f8","Survey paused":"aux.survey.runner.8b962911ee56","Retry saved survey":"aux.survey.runner.f107b1d67727","Return to game":"survey.return","Thanks for completing the survey!":"aux.survey.runner.70941ad4097c","This survey has ended":"aux.survey.runner.96f577aca304","Your completed status is saved on this device. Return to the game to collect the game-currency reward.":"aux.survey.runner.444045937213","Returning to your game shortly…":"aux.survey.runner.20f3bb62c481","Local CAPTCHA":"aux.survey.runner.a0603f603aeb","Welcome to the Survey!":"aux.survey.runner.2980a0aedea0","A simple local game check — not a real bot-security service. No external CAPTCHA, tracking or account is used.":"aux.survey.runner.bd1521f23f8e","Verify local CAPTCHA":"aux.survey.runner.822dca242316","The local CAPTCHA is complete. Take your time and use invented details. Your questionnaire and listed game reward are saved on this device.":"aux.survey.runner.e826c9f10c83","This questionnaire includes clear instruction checks, seven-by-seven preference tables and real nature-video choices. Videos start paused and muted. Watching is optional; every video choice has a text description if its preview is unavailable.":"aux.survey.runner.1f1629fa4522","This questionnaire includes clear instruction checks and seven-by-seven preference tables. Media can be paused; optional real-world footage has a local illustration fallback.":"aux.survey.runner.a251ae564422","Begin survey":"aux.survey.runner.4a6d1d0dba30","Pause and return to game":"aux.survey.runner.c4aa6ca09e7d","Rate each feature":"aux.survey.runner.3313fdb22201","Feature":"aux.survey.runner.3d377ae910dc","Optional real-world flower footage · bundled CC0 preview. The question refers to the local illustration above, not this preview.":"aux.survey.runner.e11073782fc9","Real footage preview starts paused. Playback is optional; the illustrated question always works offline.":"aux.survey.runner.834c386da51b","Optional real-world flower footage, separate from the question":"aux.survey.runner.0d18fbe3b6ab","Real-world preview unavailable. Local illustrated fallback above remains available offline.":"aux.survey.runner.9a4e1838014c","Choose one clip. Previewing is optional; playback controls do not select an answer.":"aux.survey.runner.f1fb31a7f388","Shortened, resized and muted.":"aux.survey.runner.90bd7eed357d","Starts paused · watching is optional. Choose below using the video or description.":"aux.survey.runner.d472e3b48e95","Preview unavailable. You can still choose this option using its description; no viewing is required.":"aux.survey.runner.9dc5dfb616a8","Source":"aux.survey.runner.0e570ca6fabe","License":"aux.survey.runner.c011d6097bfb","noopener noreferrer":"aux.survey.runner.ec0f84cc9ffe","(prefers-reduced-motion: reduce)":"aux.survey.runner.fce63bfb9eba","Local SVG fallback · canvas unavailable":"aux.survey.runner.93b5fc4601e2","Play animation":"aux.survey.runner.76bced7d616a","Pause animation":"aux.survey.runner.8a754f71ce34","0:05 local loop · no audio":"aux.survey.runner.16ece71a53b0","Fictional questionnaire":"aux.survey.runner.c78cc8a6eb4a","Survey progress":"aux.survey.runner.228253d5939c","Invent a short answer — no personal details":"aux.survey.runner.67f99025a307","Your fictional answer":"aux.survey.runner.576a58921165","2–240 characters. Any language is welcome.":"aux.survey.runner.50cfef9b4e40","Move the slider to answer":"aux.survey.runner.950818ff3f3a","On small screens, swipe each table sideways to see all choices.":"aux.survey.runner.b2df739f158d","Your fictional preferences":"aux.survey.runner.ac45d384b51b","Word ":"aux.survey.runner.9a0283957922","Numeric value ":"aux.survey.runner.4ada4ace3330","Finish survey":"aux.survey.runner.a48ac90935cd","Continue":"common.continue","Take your time. Explicit attention checks, three speeding attempts, or clear spam can end a survey. Your raw answers are not saved.":"aux.survey.runner.a30dfea1c7fa"});
function _auxSource(source){if(typeof source!=='string')return source;const key=_auxKeys[source]||globalThis.BOTranslation?.keyFor?.(source);return key?_aux(key,source):source;}


// Source-explicit text/attribute bindings: no scanning English text, DOM-source recovery or user-data inference.
const _auxDisplayValues=new WeakMap();
function _auxInline(key,fallback,params){return '<span data-i18n-inline="true" data-i18n="'+_auxEsc(key)+'"'+(params?' data-i18n-params="'+_auxEsc(JSON.stringify(params))+'"':'')+'>'+_auxEsc(_aux(key,fallback,params))+'</span>';}
function _auxAttribute(attribute,quote,key,fallback,params){return _auxEsc(_aux(key,fallback,params))+quote+' data-i18n-'+attribute+'='+quote+_auxEsc(key)+(params?quote+' data-i18n-params='+quote+_auxEsc(JSON.stringify(params)):'');}
function _auxValue(key,fallback,params){const value=new String(_aux(key,fallback,params));_auxDisplayValues.set(value,{key,fallback,params});return value;}
function _auxSourceValue(source){if(typeof source!=='string')return source;const key=_auxKeys[source]||globalThis.BOTranslation?.keyFor?.(source);return key?_auxValue(key,source):source;}
function _auxValueHTML(value){const binding=value&&typeof value==='object'&&_auxDisplayValues.get(value);return binding?_auxInline(binding.key,binding.fallback,binding.params):_auxEsc(value);}

// Exact keyed projection of source-explicit bindings, before native equality checks.
// Never traverses the live document and never invokes an economy/controller/render callback.
function _auxMarkup(html){return globalThis.BOI18n?.projectHTML?.("survey-runner",html)??html;}
function _auxSetText(element,key,fallback,params){const text=_aux(key,fallback,params);element.textContent=text;element.setAttribute?.('data-i18n',key);if(params)element.setAttribute?.('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindText?.(element,key,params||{});return text;}
function _auxSetAttribute(element,attribute,key,fallback,params){const text=_aux(key,fallback,params);if(element.nodeType===9&&attribute==='title'){element.title=text;const leaf=element.querySelector('title');if(leaf)_auxSetText(leaf,key,fallback,params);return text;}element.setAttribute(attribute,text);element.setAttribute('data-i18n-'+attribute,key);if(params)element.setAttribute('data-i18n-params',JSON.stringify(params));globalThis.BOTranslation?.bindAttribute?.(element,attribute,key,params||{});return text;}


// Pure display descriptions of frozen questions. No q, expected, option.value or receipt is ever changed.
const _surveyStaticKeys=Object.freeze({"Yes":"aux.surveys.ui.85a39ab345d6","No":"aux.surveys.ui.1ea442a134b2","Red":"aux.surveys.ui.ba19e9c3d5f4","Green":"aux.surveys.ui.d486dfbd5fb5","Blue":"aux.surveys.ui.ec7d56a01607","Triangle":"aux.survey.static.06","Circle — choose me":"aux.survey.static.07","Square":"aux.survey.static.08","Not at all":"aux.survey.static.09","Very much":"aux.survey.static.10","It fits well":"aux.survey.static.11","It could fit":"aux.survey.static.12","I would choose something different":"aux.survey.static.13","A calmer pace":"aux.survey.static.14","This pace":"aux.survey.static.15","A livelier pace":"aux.survey.static.16","Your fictional preferences":"aux.survey.runner.ac45d384b51b","Not important":"aux.survey.static.18","Somewhat":"aux.survey.static.19","Slightly important":"aux.survey.static.20","Somewhat important":"aux.survey.static.21","Moderately important":"aux.survey.static.22","Important":"aux.survey.static.23","Very important":"aux.survey.static.24","Extremely important":"aux.survey.static.25","ease of use":"aux.survey.static.26","Rough draft":"aux.survey.static.27","Basic":"aux.survey.static.28","Standard":"aux.survey.static.29","Polished":"aux.survey.static.30","Studio":"aux.survey.static.31","Local attention illustration: follow the explicit instruction above.":"aux.survey.static.32","Animation — created locally, not a real video":"aux.survey.static.33","Local procedural animation — not a real video":"aux.survey.static.34","A short real-world nature clip. You can choose this option from its description even when the preview is unavailable.":"aux.survey.static.35","ball":"aux.survey.runner.e9de08263f4a","car":"aux.survey.runner.2b2961a431b2","bee":"aux.survey.runner.62cb81b5904a","star":"aux.survey.runner.525eca1d5089","Butterfly in the rain":"aux.survey.video.video01.label","A real butterfly holds onto a plant in rainy weather.":"aux.survey.video.video01.description","Butterfly visiting flowers":"aux.survey.video.video02.label","A Common Mormon butterfly visits flowers for nectar.":"aux.survey.video.video02.description","Belong waterfall":"aux.survey.video.video03.label","Water flows over rocks at Belong Waterfall in Bali.":"aux.survey.video.video03.description","Mma Legage waterfall":"aux.survey.video.video04.label","A real outdoor waterfall flows through a rocky landscape.":"aux.survey.video.video04.description","Leafcutter bee":"aux.survey.video.video05.label","A leafcutter bee visits its nest between the rocks.":"aux.survey.video.video05.description","Ducks at a pond":"aux.survey.video.video06.label","Real ducks gather at a pond in Sonoma, California.":"aux.survey.video.video06.description","Jellyfish":"aux.survey.video.video07.label","Real jellyfish drift through blue water at Boka Aquarium.":"aux.survey.video.video07.description","Barcelona aquarium":"aux.survey.video.video08.label","Real aquatic animals move through a Barcelona aquarium.":"aux.survey.video.video08.description","Hermit crab":"aux.survey.video.video09.label","A hermit crab moves through its aquarium habitat in Monaco.":"aux.survey.video.video09.description","Rain on a road":"aux.survey.video.video10.label","Rain falls onto a road and makes splashes on the surface.":"aux.survey.video.video10.description","Moray eel":"aux.survey.video.video11.label","A real moray eel rests among rocks in its aquarium habitat.":"aux.survey.video.video11.description","Garden flower":"aux.survey.video.video12.label","A real flower moves gently in an outdoor garden.":"aux.survey.video.video12.description","Shortened, resized and muted; encoded as H.264 MP4.":"aux.survey.video.changes"});
const _surveyMessages=Object.freeze({"aux.survey.stem.imagine":"Imagine {context}. {question}","aux.survey.stem.imagineText":"Imagine {context}. {question} Use invented details only, not personal information.","aux.survey.stem.for":"For {context}: {question}","aux.survey.stem.image":"For {context}, how does this original illustration fit an idea for {item}?","aux.survey.stem.animation":"For {context}, which pace would you choose for this illustrated {object}?","aux.survey.stem.table":"For {context}, rate these features of {item}. Choose one answer in every row.","aux.survey.stem.doubleTable":"For {context}, compare two imaginary ideas. Complete both tables; there is no right opinion.","aux.survey.stem.video":"For {context}, which real nature video would you choose for an imaginary creative project? This is a preference, with no right opinion. Watching is optional; descriptions are enough.","aux.survey.stem.colour":"Attention check: please select {colour} below. This checks the instructions, not your opinion.","aux.survey.stem.smallest":"Attention check: choose the smallest NUMERIC VALUE. Ignore the different font sizes.","aux.survey.stem.largest":"Attention check: choose the largest NUMERIC VALUE. Ignore the different font sizes.","aux.survey.stem.height":"Attention check: which labelled line is TALLEST (greatest height)? Compare the lines, not their labels.","aux.survey.stem.width":"Attention check: which labelled line is WIDEST (greatest width)? Compare the lines, not their labels.","aux.survey.stem.wordLength":"Attention check: choose the word with exactly {count} LETTERS. Ignore the font sizes.","aux.survey.stem.ignoreLabel":"Attention check: select Triangle. Ignore the extra words “choose me” on a different answer.","aux.survey.stem.shapeCount":"Attention check: how many CIRCLES are shown? Do not count the squares.","aux.survey.stem.captcha":"Local CAPTCHA: what is {a} + {b}?","aux.survey.label.line":"Line {id}","aux.survey.label.circles":"{count} circles","aux.survey.label.tableIdea":"Idea {id}: {item}","aux.survey.label.video":"Video option {count}","aux.survey.label.importance":"{count} · {importance}","aux.survey.alt.original":"Original local illustration of a {object} in a colourful outdoor scene.","aux.survey.alt.procedural":"Original local procedural illustration of a {object}. {quality} quality; no real footage in this illustration.","aux.survey.alt.shapes":"Accessible shape description: {count} circles and 2 squares.","aux.survey.description.animation":"An illustrated {object} glides across the scene. A still frame is available; no real footage is used.","aux.survey.description.procedural":"An illustrated {object} moves through a locally drawn scene. An optional real-world flower-footage preview is separate and is not part of this question.","aux.survey.static.06":"Triangle","aux.survey.static.07":"Circle — choose me","aux.survey.static.08":"Square","aux.survey.static.09":"Not at all","aux.survey.static.10":"Very much","aux.survey.static.11":"It fits well","aux.survey.static.12":"It could fit","aux.survey.static.13":"I would choose something different","aux.survey.static.14":"A calmer pace","aux.survey.static.15":"This pace","aux.survey.static.16":"A livelier pace","aux.survey.static.18":"Not important","aux.survey.static.19":"Somewhat","aux.survey.static.20":"Slightly important","aux.survey.static.21":"Somewhat important","aux.survey.static.22":"Moderately important","aux.survey.static.23":"Important","aux.survey.static.24":"Very important","aux.survey.static.25":"Extremely important","aux.survey.static.26":"ease of use","aux.survey.static.27":"Rough draft","aux.survey.static.28":"Basic","aux.survey.static.29":"Standard","aux.survey.static.30":"Polished","aux.survey.static.31":"Studio","aux.survey.static.32":"Local attention illustration: follow the explicit instruction above.","aux.survey.static.33":"Animation — created locally, not a real video","aux.survey.static.34":"Local procedural animation — not a real video","aux.survey.static.35":"A short real-world nature clip. You can choose this option from its description even when the preview is unavailable."});
function _surveyInfo(source){
 if(typeof source!=='string'||['sun','moon','cloud','Red','Green','Blue'].includes(source))return null;
 const fixed=_surveyStaticKeys[source]||_auxKeys[source];if(fixed)return {key:fixed,source,params:{}};
 const field=(name,value)=>name==='count'||name==='a'||name==='b'?/^[0-9]+$/.test(value):name==='id'?/^[ABC]$/.test(value):name==='colour'?['Red','Green','Blue'].includes(value):Object.prototype.hasOwnProperty.call(_auxKeys,value)||Object.prototype.hasOwnProperty.call(_surveyStaticKeys,value)||['Leaf Studio','Wave Works','Spark Club','Orbit Goods','Cloud Corner','Pebble Lab'].includes(value);
 for(const [key,template]of Object.entries(_surveyMessages)){
  if(!/\{[A-Za-z]/.test(template)){if(source===template)return {key,source,params:{}};continue;}
  let names=[],offset=0,pattern='^';template.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g,(all,name,index)=>{pattern+=template.slice(offset,index).replace(/[.*+?^$()|[\]\\]/g,'\\$&')+'(.+?)';names.push(name);offset=index+all.length;return all;});pattern+=template.slice(offset).replace(/[.*+?^$()|[\]\\]/g,'\\$&')+'$';
  const match=source.match(new RegExp(pattern));if(!match||!names.every((name,i)=>field(name,match[i+1])))continue;
  const params={};names.forEach((name,i)=>{const value=match[i+1],local=_surveyStaticKeys[value]||_auxKeys[value];params[name]=name==='colour'?value:local?_aux(local,value):value;});return {key,source,params};
 }
 // Frozen yes/no, slider and free-text stems contain a bank sentence as their final component.
 let match=source.match(/^Imagine (.+?)\. (.+)$/);if(match){const context=match[1],suffix=' Use invented details only, not personal information.',free=match[2].endsWith(suffix),question=free?match[2].slice(0,-suffix.length):match[2];if(_auxKeys[context]&&_auxKeys[question])return {key:free?'aux.survey.stem.imagineText':'aux.survey.stem.imagine',source,params:{context:_auxSource(context),question:_auxSource(question)}};}
 match=source.match(/^For (.+?): (.+)$/);if(match&&_auxKeys[match[1]]&&_auxKeys[match[2]])return {key:'aux.survey.stem.for',source,params:{context:_auxSource(match[1]),question:_auxSource(match[2])}};
 return null;
}
function _surveyText(source){const info=_surveyInfo(source);return info?_aux(info.key,info.source,info.params):source;}
const _surveyBound=new Map();
function _surveyRegister(element,entry){let entries=_surveyBound.get(element);if(!entries){entries=new Map();_surveyBound.set(element,entries);}entries.set(entry.attribute||'text',entry);}
function _surveyValue(source){if(source&&typeof source==='object'&&_auxDisplayValues.has(source))return source;const info=_surveyInfo(source);return info?_auxValue(info.key,info.source,info.params):source;}
function _surveyParams(params){return Object.fromEntries(Object.entries(params||{}).map(([key,value])=>{const bound=value&&typeof value==='object'&&_auxDisplayValues.get(value);return [key,bound?_aux(bound.key,bound.fallback,_surveyParams(bound.params)):value];}));}
function _surveyBind(element,source){const explicit=source&&typeof source==='object'&&_auxDisplayValues.get(source),info=explicit||_surveyInfo(source);if(!info){element.textContent=source;element.removeAttribute('data-i18n');_surveyBound.get(element)?.delete('text');return element;}const params=_surveyParams(info.params),fallback=explicit?info.fallback:info.source;element.textContent=_aux(info.key,fallback,params);element.dataset.i18n=info.key;element.dataset.i18nParams=JSON.stringify(params);globalThis.BOTranslation?.bindText?.(element,info.key,params);_surveyRegister(element,{source:explicit?null:source,key:info.key,fallback,canonicalParams:info.params,params,last:element.textContent});return element;}
function _surveyAttribute(element,attribute,source){const explicit=source&&typeof source==='object'&&_auxDisplayValues.get(source),info=explicit||_surveyInfo(source);if(!info){element.setAttribute(attribute,source);return;}const params=_surveyParams(info.params),fallback=explicit?info.fallback:info.source;element.setAttribute(attribute,_aux(info.key,fallback,params));element.setAttribute('data-i18n-'+attribute,info.key);element.dataset.i18nParams=JSON.stringify(params);globalThis.BOTranslation?.bindAttribute?.(element,attribute,info.key,params);_surveyRegister(element,{source:explicit?null:source,key:info.key,fallback,canonicalParams:info.params,params,attribute,last:element.getAttribute(attribute)});}
function _surveyPartsText(parts){return parts.map(part=>{const binding=part&&typeof part==='object'&&_auxDisplayValues.get(part);return binding?_aux(binding.key,binding.fallback,_surveyParams(binding.params)):_surveyText(part);}).join('');}
function _surveyAttributeParts(element,attribute,parts){const canonicalParts=parts.map(_surveyValue),text=_surveyPartsText(canonicalParts);element.setAttribute(attribute,text);_surveyRegister(element,{parts:canonicalParts,attribute,last:text});}
// Pure explicit leaf/attribute projection; no controller/model getters, question rebuilds or draft writes.
globalThis.BOI18n?.onChange?.(()=>{for(const [element,entries]of _surveyBound){if(!element.isConnected){_surveyBound.delete(element);continue;}for(const [target,entry]of entries){const rt=globalThis.BOTranslation,actual=entry.attribute?element.getAttribute(entry.attribute):element.textContent;if(!entry.attribute&&element.children.length){entries.delete(target);continue;}if(entry.parts){const text=_surveyPartsText(entry.parts);if(actual!==entry.last&&actual!==text){entries.delete(target);continue;}element.setAttribute(entry.attribute,text);entry.last=text;continue;}if(actual!==entry.last&&actual!==rt?.t(entry.key,entry.params)){entries.delete(target);continue;}const info=entry.source===null?{...entry,params:_surveyParams(entry.canonicalParams)}:_surveyInfo(entry.source);if(!info)continue;const fallback=entry.source===null?entry.fallback:info.source,params=info.params||{},text=_aux(info.key,fallback,params);if(entry.attribute){element.setAttribute(entry.attribute,text);rt?.bindAttribute?.(element,entry.attribute,info.key,params);}else{element.textContent=text;rt?.bindText?.(element,info.key,params);}element.dataset.i18nParams=JSON.stringify(params);entries.set(target,{...entry,key:info.key,params,last:text});}}});


  var SESSION_PREFIX = 'danis-table.survey-session.', LEASE_MS = 15000, MAX_SPEED_STRIKES = 3;
  var STATUSES = ['qualified', 'in-progress', 'completed', 'disqualified'];
  var SIGNALS = ['too-fast', 'attention', 'repetition', 'keyboard-smash'];
  var active = null, closing = null;
  function clone(value) { return value === undefined ? undefined : JSON.parse(JSON.stringify(value)); }
  function error(code) { var e = new Error(code); e.code = code; return e; }
  function check(ok, code) { if (!ok) throw error(code || 'invalid'); }
  function time(value) { return Number.isSafeInteger(value) && value >= 0 && value <= 8640000000000000; }
  function identifier(value) { return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value); }
  function normalizeSession(value, id) {
    check(S && value && typeof value === 'object' && !Array.isArray(value));
    check(value.version === 1 && identifier(value.id) && value.id === id && time(value.createdAt));
    check(typeof value.returnUrl === 'string' && value.returnUrl.length > 0 && value.returnUrl.length <= 4096);
    check((typeof value.seed === 'string' && value.seed.length <= 256) || Number.isSafeInteger(value.seed));
    check(STATUSES.indexOf(value.status) >= 0 && Number.isSafeInteger(value.index));
    var offer;
    try { offer = S.normalizeOffer(value.offer); } catch (_) { throw error('invalid'); }
    var modern = Object.prototype.hasOwnProperty.call(value, 'questionnaireVersion');
    check(!modern || value.questionnaireVersion === 2 || value.questionnaireVersion === S.QUESTIONNAIRE_VERSION);
    check(modern || !Object.prototype.hasOwnProperty.call(value, 'intro'));
    var questions = S.generateQuestions(offer, value.seed, value.questionnaireVersion), quality = value.quality === undefined ? [] : value.quality;
    check(value.index >= 0 && value.index <= offer.questionCount && Array.isArray(quality) && quality.length === value.index);
    if (value.status === 'qualified') check(value.index === 0);
    if (value.status === 'completed') check(value.index === offer.questionCount && time(value.completedAt) && value.completedAt >= value.createdAt);
    else check(value.index < offer.questionCount);
    var sum = 0;
    quality = quality.map(function (q, i) {
      check(q && q.questionId === questions[i].id && q.ok === true && time(q.elapsedMs) && q.elapsedMs >= S.SPEED_FLOORS[questions[i].type]);
      sum += q.elapsedMs; check(Number.isSafeInteger(sum));
      return {questionId: q.questionId, elapsedMs: q.elapsedMs, ok: true};
    });
    var revision = value.revision === undefined ? 0 : value.revision, elapsed = value.elapsedMs === undefined ? 0 : value.elapsedMs;
    check(Number.isSafeInteger(revision) && revision >= 0 && revision < Number.MAX_SAFE_INTEGER && time(elapsed) && elapsed === sum);
    var updated = value.updatedAt === undefined ? value.createdAt : value.updatedAt;
    check(time(updated) && updated >= value.createdAt);
    var out = {version: 1, id: id, offer: offer, seed: value.seed, createdAt: value.createdAt, returnUrl: value.returnUrl, status: value.status, index: value.index, revision: revision, elapsedMs: elapsed, quality: quality, updatedAt: updated};
    if (modern) {
      var intro = value.intro;
      check(intro && typeof intro === 'object' && !Array.isArray(intro) && ['captcha', 'welcome', 'ready'].indexOf(intro.phase) >= 0);
      var fields = ['phase'].concat(intro.phase !== 'captcha' ? ['captchaPassedAt'] : [], intro.phase === 'ready' ? ['welcomeAcceptedAt'] : []);
      check(Object.keys(intro).length === fields.length && fields.every(function (k) { return Object.prototype.hasOwnProperty.call(intro, k); }));
      if (intro.phase !== 'captcha') check(time(intro.captchaPassedAt) && intro.captchaPassedAt >= value.createdAt && intro.captchaPassedAt <= updated);
      if (intro.phase === 'ready') check(time(intro.welcomeAcceptedAt) && intro.welcomeAcceptedAt >= intro.captchaPassedAt && intro.welcomeAcceptedAt <= updated);
      else check(value.index === 0 && ['qualified', 'in-progress'].indexOf(value.status) >= 0);
      if (value.status === 'qualified') check(intro.phase === 'captcha');
      if (intro.phase === 'ready' && value.status === 'in-progress') check(value.questionStartedAt >= intro.welcomeAcceptedAt);
      out.questionnaireVersion = value.questionnaireVersion; out.intro = clone(intro);
    }
    if (value.economyGeneration !== undefined) { check(typeof value.economyGeneration === 'string' && value.economyGeneration.length > 0 && value.economyGeneration.length <= 256); out.economyGeneration = value.economyGeneration; }
    if (value.epoch !== undefined) { check(Number.isSafeInteger(value.epoch) && value.epoch >= 0); out.epoch = value.epoch; }
    if (value.startedAt !== undefined) { check(time(value.startedAt) && value.startedAt >= value.createdAt); out.startedAt = value.startedAt; }
    if (value.status === 'in-progress') { check(time(value.questionStartedAt) && value.questionStartedAt >= value.createdAt); out.questionStartedAt = value.questionStartedAt; }
    if (value.status === 'completed') out.completedAt = value.completedAt;
    if (value.status === 'disqualified') { check(time(value.disqualifiedAt) && value.disqualifiedAt >= value.createdAt && SIGNALS.indexOf(value.reason) >= 0); out.disqualifiedAt = value.disqualifiedAt; out.reason = value.reason; }
    var strikes = value.strikes === undefined ? {speed: 0} : value.strikes;
    check(strikes && Number.isSafeInteger(strikes.speed) && strikes.speed >= 0 && strikes.speed <= MAX_SPEED_STRIKES);
    out.strikes = {speed: strikes.speed};
    var failures = value.failures === undefined ? [] : value.failures;
    check(Array.isArray(failures) && failures.length <= MAX_SPEED_STRIKES + 1);
    out.failures = failures.map(function (f) { check(f && Number.isInteger(f.index) && f.index >= 0 && f.index <= value.index && SIGNALS.indexOf(f.reason) >= 0 && time(f.at) && f.at >= value.createdAt); return {index: f.index, reason: f.reason, at: f.at}; });
    check(out.failures.filter(function (f) { return f.reason === 'too-fast'; }).length === strikes.speed);
    if (value.status !== 'completed' && value.status !== 'disqualified' && value.lease !== undefined) { check(value.lease && identifier(value.lease.owner) && time(value.lease.expiresAt)); out.lease = {owner: value.lease.owner, expiresAt: value.lease.expiresAt}; }
    return out;
  }
  function identity(s) { return JSON.stringify([s.id, s.offer, s.seed, s.createdAt, s.returnUrl, s.economyGeneration, s.epoch, s.questionnaireVersion]); }
  function safeReturnUrl(returnUrl, currentUrl, id) {
    var base;
    try { base = new URL(currentUrl); } catch (_) { return null; }
    if (['https:', 'http:', 'file:', 'content:'].indexOf(base.protocol) < 0) return null;
    var target;
    try { target = new URL(returnUrl, base.href); } catch (_) { target = new URL(base.href); }
    // A survey can only return to the entry file that is currently running it.
    // For opaque file/content origins, compare protocol and host as well.
    if (target.origin !== base.origin || target.protocol !== base.protocol || target.host !== base.host || target.pathname !== base.pathname || target.search !== base.search || target.username || target.password) target = new URL(base.href);
    target.hash = 'survey-return=' + encodeURIComponent(identifier(id) ? id : 'invalid-session');
    return target.href;
  }
  function navigateReturn(location, returnUrl, id) {
    if (!location) return false;
    var target = safeReturnUrl(returnUrl, location.href, id);
    if (!target) return false;
    // Hash-only replace is same-document. Force normal app initialization even
    // when the runner was inlined in a single standalone HTML entry.
    location.replace(target);
    location.reload();
    return true;
  }
  function createController(env) {
    env = env || {};
    check(identifier(env.id) && identifier(env.owner));
    var key = SESSION_PREFIX + env.id, snapshot = null, fingerprint = null, pending = Promise.resolve();
    function now() { var n = env.now ? env.now() : Date.now(); check(time(n), 'clock'); return n; }
    function read() {
      var raw;
      try { raw = env.storage.getItem(key); } catch (_) { throw error('storage'); }
      check(raw !== null && raw !== undefined, 'missing');
      var value;
      try { value = JSON.parse(raw); } catch (_) { throw error('invalid'); }
      var session = normalizeSession(value, env.id), token = identity(session);
      if (fingerprint !== null) check(token === fingerprint, 'changed');
      else fingerprint = token;
      return {raw: raw, session: session};
    }
    function commit(previous, next, at) {
      check(next.revision < Number.MAX_SAFE_INTEGER - 1, 'invalid');
      next.revision++; next.updatedAt = Math.max(at, next.updatedAt);
      var raw = JSON.stringify(next), fresh;
      try { fresh = env.storage.getItem(key); } catch (_) { throw error('storage'); }
      check(fresh !== null, 'missing'); check(fresh === previous.raw, 'stale');
      try { env.storage.setItem(key, raw); check(env.storage.getItem(key) === raw, 'stale'); } catch (e) { throw e.code ? e : error('storage'); }
      snapshot = clone(next);
      return {ok: true, reason: 'ok', session: clone(next)};
    }
    function ownership(s, at) { check(!s.lease || s.lease.owner === env.owner || s.lease.expiresAt <= at, 'duplicate'); }
    function operation(kind, expectedIndex, value) {
      var previous = read(), s = previous.session, at = now(); snapshot = clone(s);
      check(at >= s.createdAt && at >= s.updatedAt, 'clock');
      if (s.status === 'completed' || s.status === 'disqualified') {
        if (kind === 'resume' || kind === 'heartbeat' || kind === 'release') return {ok: true, reason: 'ok', session: clone(s)};
        return {ok: false, reason: 'terminal', session: clone(s)};
      }
      if (kind === 'resume') {
        ownership(s, at);
        if (s.status === 'qualified') { s.status = 'in-progress'; s.startedAt = at; s.questionStartedAt = at; }
        s.lease = {owner: env.owner, expiresAt: at + LEASE_MS};
        return commit(previous, s, at);
      }
      check(s.status === 'in-progress', 'stale');
      // Never allow a submission/heartbeat from a stale tab to claim ownership.
      // A new tab must first resume and observe a vacant/expired lease.
      check(s.lease && s.lease.owner === env.owner, 'duplicate');
      if (kind === 'release') { delete s.lease; return commit(previous, s, at); }
      if (kind === 'heartbeat') { s.lease.expiresAt = at + LEASE_MS; return commit(previous, s, at); }
      if (kind === 'captcha' || kind === 'welcome') {
        check((s.questionnaireVersion === 2 || s.questionnaireVersion === S.QUESTIONNAIRE_VERSION) && s.intro.phase === (kind === 'captcha' ? 'captcha' : 'welcome'), 'intro');
        if (kind === 'captcha') {
          check(typeof value === 'string' && value.trim() === S.captchaChallenge(s.id, s.seed).expected, 'captcha');
          s.intro = {phase: 'welcome', captchaPassedAt: at};
        } else { s.intro.phase = 'ready'; s.intro.welcomeAcceptedAt = at; s.questionStartedAt = at; }
        s.lease.expiresAt = at + LEASE_MS;
        return commit(previous, s, at);
      }
      check(!s.intro || s.intro.phase === 'ready', 'intro');
      check(expectedIndex === s.index, 'stale');
      check(at >= s.questionStartedAt, 'clock');
      var q = S.generateQuestions(s.offer, s.seed, s.questionnaireVersion)[s.index], elapsed = at - s.questionStartedAt, result = S.answerQuality(q, value, elapsed);
      if (!result.ok) {
        if (SIGNALS.indexOf(result.reason) >= 0) {
          s.failures.push({index: s.index, reason: result.reason, at: at});
          if (result.reason === 'too-fast') s.strikes.speed++;
          if (result.reason !== 'too-fast' || s.strikes.speed >= MAX_SPEED_STRIKES) { s.status = 'disqualified'; s.reason = result.reason; s.disqualifiedAt = at; delete s.lease; delete s.questionStartedAt; }
          else s.lease.expiresAt = at + LEASE_MS;
          commit(previous, s, at);
        }
        return {ok: false, reason: result.reason, session: clone(s)};
      }
      s.quality.push({questionId: q.id, elapsedMs: elapsed, ok: true}); s.elapsedMs += elapsed; s.index++;
      if (s.index === s.offer.questionCount) { s.status = 'completed'; s.completedAt = at; delete s.lease; delete s.questionStartedAt; }
      else { s.questionStartedAt = at; s.lease.expiresAt = at + LEASE_MS; }
      return commit(previous, s, at);
    }
    function run(kind, expectedIndex, value) {
      var task = pending.then(function () {
        var work = function () { return operation(kind, expectedIndex, value); };
        if (env.locks && typeof env.locks.request === 'function') return env.locks.request(key, {mode: 'exclusive'}, work);
        // The fallback is deliberately synchronous inside a transaction, with
        // lease ownership plus fresh serialized state/revision checked before
        // and after every write. Browser Web Locks provide full serialization.
        return work();
      }).catch(function (e) { return {ok: false, reason: e.code || 'storage', session: clone(snapshot)}; });
      pending = task.then(function () {});
      return task;
    }
    return Object.freeze({resume: function () { return run('resume'); }, submitCaptcha: function (value) { return run('captcha', undefined, value); }, acceptWelcome: function () { return run('welcome'); }, submit: function (index, value) { return run('submit', index, value); }, heartbeat: function () { return run('heartbeat'); }, release: function () { return run('release'); }, getState: function () { return clone(snapshot); }, getQuestion: function () { return snapshot && snapshot.status === 'in-progress' && (!snapshot.intro || snapshot.intro.phase === 'ready') ? S.generateQuestions(snapshot.offer, snapshot.seed, snapshot.questionnaireVersion)[snapshot.index] : null; }});
  }
  var MESSAGES = {
    captcha: 'Try the local sum again. This game check never contacts a CAPTCHA service.', intro: 'Complete the local CAPTCHA and welcome screen before answering questions.',
    empty: 'Please complete the answer. Use invented details only.', invalid: 'This answer or saved session is not valid. Please check it and try again.',
    'too-fast': 'Please take a moment to read before continuing. Three speeding attempts end the survey.', attention: 'The explicit attention check was missed.',
    repetition: 'The answer contains a clear repeated spam pattern.', 'keyboard-smash': 'The answer is a recognisable keyboard-smash sequence.',
    storage: 'Browser storage is unavailable or full. Progress has NOT been confirmed. Free space or allow local storage, then retry.',
    duplicate: 'This survey is open in another tab. Continue there, or close it and retry here after 15 seconds.',
    stale: 'Progress changed in another tab. Reload the saved question before continuing.', missing: 'This saved survey is missing or was reset. It cannot be recreated here.',
    changed: 'This survey was replaced or the game was reset. This tab cannot update it.', clock: 'The device clock moved backwards. Restore the clock, then retry.', terminal: 'This survey has already ended.'
  };
  function _surveyError(reason,terminal=false){const known=Object.prototype.hasOwnProperty.call(MESSAGES,reason),key=known?reason:terminal?'unknown':'invalid';return _auxValue('aux.survey.error.'+key,key==='unknown'?'This fictional survey did not qualify.':MESSAGES[key]);}
  var CSS = [
    'body.bo-survey-page{margin:0!important;padding:0!important;min-height:100vh!important;background:#f5f7fa!important;color:var(--bo-survey-ink,#1d3044)!important;color-scheme:light!important;font:16px/1.5 system-ui,-apple-system,sans-serif!important;overflow:auto!important;text-shadow:none!important}body.bo-survey-page *{box-sizing:border-box}body.bo-survey-page [hidden]{display:none!important}',
    'body.bo-survey-page[data-survey-provider=theorem]{--bo-survey-primary:#7543a6;--bo-survey-primary-dark:#552979;--bo-survey-tint:#f5effc;--bo-survey-accent:#906700;--bo-survey-focus:#b18416;--bo-survey-attention:#e0b83c;--bo-survey-ink:#352346;--bo-survey-muted:#665574;background:#fff!important}body.bo-survey-page[data-survey-provider=bitlabs]{--bo-survey-primary:#236dba;--bo-survey-primary-dark:#18558f;--bo-survey-tint:#edf5fd;--bo-survey-accent:#236dba;--bo-survey-focus:#236dba;--bo-survey-attention:#236dba;--bo-survey-ink:#18344f;--bo-survey-muted:#49647e;background:#fff!important}',
    '.bo-survey-shell{width:min(760px,100%);margin:0 auto;padding:28px 20px 48px}.bo-survey-eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;color:var(--bo-survey-accent,#39705d)}.bo-survey-shell h1,.bo-survey-shell h2{letter-spacing:normal;text-transform:none;font-family:inherit;color:var(--bo-survey-ink,#1d3044)}.bo-survey-shell h1{font-size:clamp(25px,5vw,34px);line-height:1.2;margin:10px 0}.bo-survey-shell h2{font-size:21px;line-height:1.4;margin:0 0 18px}.bo-survey-shell p{margin:10px 0}.bo-survey-muted{color:var(--bo-survey-muted,#526375);font-size:14px}.bo-survey-card{background:#fff;border:1px solid #d8e0e8;border-radius:18px;padding:24px;margin:18px 0;box-shadow:0 6px 24px #18354c09}.bo-survey-meta{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;font-size:14px;color:var(--bo-survey-muted,#526375)}.bo-survey-progress{margin-top:12px}.bo-survey-progress progress{display:block;width:100%;height:12px;accent-color:var(--bo-survey-primary,#34735f)}.bo-survey-progress-label{display:block;font-size:14px;font-weight:700;margin-bottom:6px}',
    '.bo-survey-choice{display:flex;gap:12px;align-items:center;padding:14px;border:1px solid #cbd6df;border-radius:10px;cursor:pointer;margin:10px 0;background:#fff}.bo-survey-choice:has(input:checked){background:var(--bo-survey-tint,#edf7f1);border-color:var(--bo-survey-primary,#34735f)}.bo-survey-shell input[type=radio]{width:20px;height:20px;accent-color:var(--bo-survey-primary,#34735f);flex:none}.bo-survey-shell textarea{font:inherit;display:block;width:100%;min-height:125px;padding:14px;border:1px solid #9caebd;border-radius:9px;background:#fff;color:var(--bo-survey-ink,#1d3044);resize:vertical}.bo-survey-shell input[type=range]{width:100%;height:38px;accent-color:var(--bo-survey-primary,#34735f)}.bo-survey-slider-labels{display:flex;justify-content:space-between;gap:18px;font-size:14px}.bo-survey-slider-output{display:block;font-size:26px;font-weight:700;text-align:center;margin:14px}',
    '.bo-survey-shell button{appearance:none;font:inherit;font-weight:700;line-height:1.4;border:1px solid var(--bo-survey-primary-dark,#28614f);border-radius:10px;background:var(--bo-survey-primary,#34735f);color:white;padding:12px 18px;min-height:46px;cursor:pointer;text-shadow:none;box-shadow:none;position:static;transform:none;white-space:normal}.bo-survey-shell button:hover{background:var(--bo-survey-primary-dark,#285b4b)}.bo-survey-shell button:disabled{opacity:.6;cursor:wait}.bo-survey-shell .bo-survey-secondary{background:white;color:var(--bo-survey-primary-dark,#285b4b);border-color:#b4c3cc}.bo-survey-shell .bo-survey-secondary:hover{background:var(--bo-survey-tint,#edf7f1);color:var(--bo-survey-primary-dark,#285b4b)}.bo-survey-shell button:focus-visible,.bo-survey-shell input:focus-visible,.bo-survey-shell textarea:focus-visible{outline:3px solid var(--bo-survey-focus,#3d88c5);outline-offset:3px}.bo-survey-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:20px}.bo-survey-error{color:#973d2b;font-weight:600;min-height:24px;margin-top:16px}.bo-survey-attention{border-left:4px solid var(--bo-survey-attention,#6d59a3);padding-left:14px}',
    '.bo-survey-media{margin:16px 0;background:#edf7fb;border:1px solid #d6e5ec;border-radius:13px;overflow:hidden}.bo-survey-media svg,.bo-survey-media img{display:block;width:100%;height:auto;max-height:280px}.bo-survey-media figcaption{padding:10px 14px;font-size:13px;color:#355064}.bo-survey-animation .bo-survey-motion{animation:bo-survey-glide 5s ease-in-out infinite alternate!important}.bo-survey-clip-timeline{height:5px;background:#cadbe2;overflow:hidden}.bo-survey-clip-timeline span{display:block;width:100%;height:100%;background:var(--bo-survey-primary,#34735f);transform-origin:left;animation:bo-survey-timeline 5s linear infinite!important}.bo-survey-animation.is-paused .bo-survey-motion,.bo-survey-animation.is-paused .bo-survey-clip-timeline span{animation-play-state:paused!important}.bo-survey-clip-controls{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px}.bo-survey-clip-controls button{font-size:14px;min-height:38px;padding:7px 10px}@keyframes bo-survey-glide{from{transform:translateX(-85px)}to{transform:translateX(150px)}}@keyframes bo-survey-timeline{from{transform:scaleX(0)}to{transform:scaleX(1)}}',
    '.bo-survey-grid-wrap{overflow-x:auto;margin:16px 0 22px;border:1px solid #d6e0e7;border-radius:10px}.bo-survey-grid{width:100%;min-width:360px;border-collapse:collapse;font-size:14px;background:white}.bo-survey-grid caption{text-align:left;padding:12px;font-weight:700;background:var(--bo-survey-tint,#f2f6f8)}.bo-survey-grid th,.bo-survey-grid td{padding:12px 8px;text-align:center;border-bottom:1px solid #e4eaf0;vertical-align:middle}.bo-survey-grid th[scope=row]{text-align:left;min-width:100px}.bo-survey-grid th[scope=col]{font-weight:600;max-width:110px}.bo-survey-grid td label{display:flex;justify-content:center;align-items:center;min-height:34px;cursor:pointer}.bo-survey-grid tr:last-child>*{border-bottom:0}',
    'body.bo-survey-page[data-survey-stars="1"]{--bo-survey-primary:#62635b;--bo-survey-primary-dark:#41433d;--bo-survey-tint:#f2f1e9;--bo-survey-accent:#52534b;--bo-survey-focus:#465d7d;background:#e9e8e1!important}body[data-survey-stars="1"] .bo-survey-card{border:2px solid #9b9c91;border-radius:2px;box-shadow:3px 3px 0 #d2d0c5;background:#fbfaf5;background-image:none}body[data-survey-stars="1"] .bo-survey-choice{border-radius:1px}body[data-survey-stars="2"] .bo-survey-card{border-radius:8px;box-shadow:0 2px 4px #30443b12;background-image:linear-gradient(#fff,#fafbf9)}body[data-survey-stars="2"] .bo-survey-choice{border-radius:5px}body[data-survey-stars="4"] .bo-survey-card{border-radius:22px;box-shadow:0 10px 30px #194e4214;background-image:linear-gradient(150deg,#fff,#f4faf8)}body[data-survey-stars="5"] .bo-survey-card{border:1px solid #b6d8d5;border-top:4px solid var(--bo-survey-primary,#34735f);border-radius:26px;box-shadow:0 16px 45px #194e4221;background-image:linear-gradient(135deg,#fff 35%,#edfaf5 75%,#edf3ff)}body[data-survey-stars="5"] .bo-survey-choice{border-radius:13px;border-color:#bfd3cf}body[data-survey-stars="5"] .bo-survey-eyebrow{color:var(--bo-survey-primary,#28654e)}.bo-survey-quality{display:flex;gap:8px 15px;flex-wrap:wrap;align-items:center;font-size:13px;margin:14px 0;color:var(--bo-survey-muted,#526375)}.bo-survey-quality strong{color:var(--bo-survey-accent,#775607)}.bo-survey-quality button{font-size:12px;min-height:34px;padding:5px 9px}.bo-survey-captcha-label{display:block;font-size:19px;font-weight:700;margin:16px 0 10px}.bo-survey-shell .bo-survey-captcha-input{font:inherit;min-height:48px;width:160px;max-width:100%;padding:10px;border:2px solid #809b93;border-radius:6px;background:#fff;color:#1d3044}.bo-survey-grid-wrap:has(.bo-survey-grid-7){max-width:100%}.bo-survey-grid-7{min-width:820px}.bo-survey-grid-7 td label{min-width:44px;min-height:44px}.bo-survey-grid-7 th[scope=col]{min-width:88px}.bo-survey-procedural{display:block;width:100%;height:auto;aspect-ratio:12/5}.bo-survey-video{display:block;width:100%;max-height:300px;background:#17241e;aspect-ratio:16/9;object-fit:contain}.bo-survey-video[hidden]{display:none!important}.bo-survey-footage{margin:20px 0 0;border-top:1px solid #cadad2;padding-top:14px}.bo-survey-footage p{font-size:13px;color:#355064}.bo-survey-footage-status{font-size:13px}body[data-survey-stars="1"] .bo-survey-procedural{image-rendering:pixelated;filter:saturate(.3)}body[data-survey-stars="2"] .bo-survey-procedural{filter:saturate(.7)}body[data-survey-stars="1"] .bo-survey-video{filter:grayscale(.8) saturate(.4) blur(1.6px)}body[data-survey-stars="2"] .bo-survey-video{filter:saturate(.65) blur(.7px)}body[data-survey-stars="3"] .bo-survey-video{filter:saturate(.9)}body[data-survey-stars="4"] .bo-survey-video{filter:saturate(1.06) contrast(1.03)}body[data-survey-stars="5"] .bo-survey-video{filter:none}body[data-survey-stars="1"] .bo-survey-answer-text{filter:blur(.25px)}body[data-survey-stars="2"] .bo-survey-answer-text{filter:blur(.1px)}body .bo-survey-choice:focus-within .bo-survey-answer-text,body[data-sharp-answers="yes"] .bo-survey-answer-text{filter:none}.bo-survey-media svg text{filter:none}',
    '.bo-survey-video-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:14px;min-width:0;padding:0;margin:18px 0;border:0}.bo-survey-video-options legend{float:left;grid-column:1/-1;width:100%;padding:0;margin:0 0 12px}.bo-survey-video-option{display:flex;flex-direction:column;min-width:0;padding:12px;border:1px solid #cbd6df;border-radius:12px;background:#fff}.bo-survey-video-option:has(input:checked){border-color:var(--bo-survey-primary,#34735f);box-shadow:0 0 0 2px var(--bo-survey-primary,#34735f)}.bo-survey-option-video{display:block;width:100%;max-height:240px;aspect-ratio:16/9;object-fit:contain;background:#15202b;border-radius:7px}.bo-survey-video-option .bo-survey-choice{margin:14px 0 0;min-height:52px}.bo-survey-video-description{font-size:14px;line-height:1.5}.bo-survey-video-credit,.bo-survey-video-option .bo-survey-footage-status{font-size:12px;line-height:1.5;color:var(--bo-survey-muted,#526375);overflow-wrap:anywhere}.bo-survey-video-option .bo-survey-choice{margin-top:auto}.bo-survey-video-preview{margin:0 0 14px}.bo-survey-video-credit a{color:var(--bo-survey-primary-dark,#285b4b);text-decoration:underline}.bo-survey-option-video:focus-visible,.bo-survey-video-credit a:focus-visible{outline:3px solid var(--bo-survey-focus,#3d88c5);outline-offset:3px}',
    '@media(prefers-contrast:more),(forced-colors:active){body .bo-survey-answer-text,body .bo-survey-procedural,body .bo-survey-video{filter:none!important}.bo-survey-shell button:focus-visible,.bo-survey-shell input:focus-visible{outline:3px solid Highlight}}@media(max-width:420px){.bo-survey-shell{padding:20px 12px 32px}.bo-survey-card{padding:18px 14px}.bo-survey-shell h2{font-size:19px}.bo-survey-actions>*{width:100%}}@media(prefers-reduced-motion:reduce){.bo-survey-animation:not(.motion-opt-in) .bo-survey-motion,.bo-survey-animation:not(.motion-opt-in) .bo-survey-clip-timeline span{animation:none!important}}'
    ,'body.bo-survey-page #bo-survey-username-badge{position:fixed;top:max(8px,env(safe-area-inset-top,0px));right:max(12px,env(safe-area-inset-right,0px));z-index:100;display:block;max-width:calc(100vw - 24px);padding:4px 10px;border:1px solid #b4c3cc;border-radius:8px;background:#fff;color:#1d3044;font:700 12px/20px system-ui,-apple-system,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}body.bo-survey-page .bo-survey-shell{padding-top:58px}body.bo-survey-page #player-username-badge{display:none!important}'
  ].join('\n');
  function start(options) {
    options = options || {};
    var w = root, d = w && w.document, explicit = Object.prototype.hasOwnProperty.call(options, 'sessionId');
    if (!d || !d.body || !w.location || (!explicit && !/^#survey(?:=|$)/.test(w.location.hash))) return false;
    if (closing) return false;
    var id = options.sessionId;
    if (!explicit) { try { id = decodeURIComponent(w.location.hash.slice(8)); } catch (_) { id = ''; } }
    if (active) return !explicit || active.id === id;
    var owner;
    try { owner = 'tab-' + w.crypto.randomUUID(); } catch (_) { owner = 'tab-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); }
    // Local document-provider grants can be lost even by reopening a hash URL.
    // Park (never destroy/detach) the live game so its clocks can still find HUDs.
    var mounted = options.mount === true || ['content:', 'file:'].indexOf(w.location.protocol) >= 0;
    var view = {id: id, mounted: mounted, controller: null, heartbeat: null, timer: null, redirect: null, busy: false, renderedIndex: null, closed: false, listeners: [], mediaCleanups: [], sharpAnswers: false};
    active = view;
    function current() { return active === view && !view.closed; }
    function listen(target, name, fn) { target.addEventListener(name, fn); view.listeners.push(function () { target.removeEventListener(name, fn); }); }
    var surface = d.body, parked = null, saved = null;
    if (mounted) {
      saved = {attributes: Array.from(d.body.attributes, function (a) { return [a.name, a.value]; }), title: d.title, focus: d.activeElement, x: w.scrollX, y: w.scrollY};
      parked = d.createElement('div'); parked.id = 'bo-survey-game'; parked.hidden = true; parked.inert = true; parked.setAttribute('aria-hidden', 'true'); parked.style.setProperty('display', 'none', 'important');
      // Move nodes, not HTML strings: native handlers and game identity survive.
      while (d.body.firstChild) parked.appendChild(d.body.firstChild);
      surface = d.createElement('div'); surface.id = 'bo-survey-host'; surface.tabIndex = -1;
      d.body.appendChild(parked); d.body.appendChild(surface);
      ['click', 'pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'contextmenu', 'keydown', 'keyup', 'input', 'change', 'submit'].forEach(function (name) { listen(surface, name, function (event) { event.stopPropagation(); }); });
    }
    view.close = function (closeOptions) {
      closeOptions = closeOptions || {};
      if (view.closed) return view.closing;
      view.closed = true; stopHeartbeat(); clearRedirect(); clearMedia();
      if (view.timer !== null) { w.clearInterval(view.timer); view.timer = null; }
      view.listeners.forEach(function (remove) { remove(); }); view.listeners = [];
      if (view.style) view.style.remove();
      if (mounted) {
        // Restore synchronously, before callers reset/render or await release.
        surface.remove();
        while (parked.firstChild) d.body.insertBefore(parked.firstChild, parked);
        parked.remove();
        Array.from(d.body.attributes).forEach(function (a) { d.body.removeAttribute(a.name); });
        saved.attributes.forEach(function (a) { d.body.setAttribute(a[0], a[1]); }); d.title = saved.title;
        if (saved.focus && saved.focus.isConnected) saved.focus.focus({preventScroll: true});
        w.scrollTo(saved.x, saved.y);
      }
      if (active === view) active = null;
      var release = view.controller && closeOptions.preserveSession !== true ? view.controller.release() : Promise.resolve();
      view.closing = Promise.resolve(release).then(async function () {
        if (closeOptions.notify === false) return true;
        var onReturn = options.onReturn || (mounted && w.BOApp && w.BOApp.surveys && w.BOApp.surveys.returnFromSurvey);
        if (onReturn) await onReturn(); // Host revalidates canonical completion; no reward is trusted here.
        return true;
      }).catch(function (e) { if (w.console) w.console.warn('Survey return could not refresh:', e.message); return false; }).finally(function () { if (closing === view.closing) closing = null; });
      closing = view.closing; return view.closing;
    };
    function element(tag, text, className) { var e = d.createElement(tag); if (text !== undefined) _surveyBind(e, text); if (className) e.className = className; return e; }
    function button(text, fn, secondary, idValue) { var b = element('button', text, secondary ? 'bo-survey-secondary' : ''); b.type = 'button'; if (idValue) b.id = idValue; b.addEventListener('click', fn); return b; }
    function state() { return view.controller && view.controller.getState(); }
    function navigate() {
      if (!current() || view.navigating) return;
      view.navigating = true;
      if (mounted) { void view.close(); return; }
      var s = state();
      if (!navigateReturn(w.location, s ? s.returnUrl : w.location.href, id)) view.navigating = false;
    }
    function clearRedirect() { if (view.redirect !== null) { w.clearTimeout(view.redirect); view.redirect = null; } }
    function stopHeartbeat() { if (view.heartbeat !== null) { w.clearInterval(view.heartbeat); view.heartbeat = null; } }
    function clearMedia() { view.mediaCleanups.forEach(function (cleanup) { cleanup(); }); view.mediaCleanups = []; }
    // Read-only nickname display. No session, account or response identity is stored.
    function surveyUsername() {
      var prefs = null, generation;
      try { var raw = w.localStorage.getItem('danis-table.settings.v1'); if (raw !== null && raw.length <= 4 * 1024 * 1024) prefs = JSON.parse(raw); } catch (_) {}
      try { var m = w.BOSaveSlots && w.BOSaveSlots.peek(w.localStorage); if (m) generation = m.slots[m.active - 1].generation; } catch (_) {}
      return w.BOPlayerIdentity ? w.BOPlayerIdentity.displayUsername(prefs, generation) : 'LocalPlayer';
    }
    // Runner-owned, read-only companion: normal game nodes stay parked/inert.
    // Refreshing its snapshot cannot answer, pause or advance this questionnaire.
    function refreshEmerald() {
      var presentation = w.BOEmeraldSurvey, target = surface.querySelector('#emerald-survey-slot');
      if (!target) return;
      var details = target.querySelector('details'), wasOpen = details ? details.open : view.emeraldOpen === true;
      var hadFocus = target.contains(d.activeElement) || view.emeraldFocus === true;
      function restoreFocus() {
        if (!hadFocus) return;
        // A removed companion never focuses, clicks or changes an answer control.
        var next = target.querySelector('summary') || surface.querySelector('#bo-survey-shell h1');
        if (next) next.focus({preventScroll: true});
      }
      try {
        var snapshot = presentation ? presentation.readSnapshot(w.localStorage, id, Date.now()) : null;
        var signature = JSON.stringify(snapshot) + ':' + (view.emeraldQuestion ? view.emeraldQuestion.type : 'none');
        d.body.classList.toggle('bo-survey-emerald-rich', !!snapshot && snapshot.level >= 41);
        var utteranceKey = [id, view.emeraldQuestion ? view.emeraldQuestion.id : 'intro', state()?.intro?.phase || 'ready'];
        if (view.emeraldSignature === signature) { presentation?.presentSpeech?.(target.querySelector('.emerald-survey-companion'), snapshot, view.emeraldQuestion, utteranceKey); return; }
        var sameOrigin = !!snapshot && view.emeraldOrigin === snapshot.identity;
        view.emeraldSignature = signature; view.emeraldOrigin = snapshot ? snapshot.identity : null; target.replaceChildren();
        if (snapshot) {
          if (!presentation.render(d, target, snapshot, view.emeraldQuestion)) throw Error('Emerald presentation unavailable.');
          var replacement = target.querySelector('details'); if (replacement) replacement.open = sameOrigin && wasOpen;
          presentation.presentSpeech?.(target.querySelector('.emerald-survey-companion'), snapshot, view.emeraldQuestion, utteranceKey);
        }
        view.emeraldOpen = false; view.emeraldFocus = false; restoreFocus();
      } catch (_) {
        target.replaceChildren(); view.emeraldSignature = null; view.emeraldOrigin = null; view.emeraldOpen = false; view.emeraldFocus = false;
        d.body.classList.remove('bo-survey-emerald-rich'); restoreFocus();
      }
    }
    function frame(title, emeraldQuestion) {
      var prior = surface.querySelector('#emerald-survey-slot'), priorDetails = prior && prior.querySelector('details');
      view.emeraldOpen = !!priorDetails && priorDetails.open; view.emeraldFocus = !!prior && prior.contains(d.activeElement);
      view.emeraldQuestion = emeraldQuestion || null; view.emeraldSignature = null;
      clearRedirect(); clearMedia(); d.body.className = 'bo-survey-page'; surface.replaceChildren(); _auxSetAttribute(d,"title","aux.survey.runner.517df2548a83","Fictional survey — Balatro Online");
      var session = state(); d.body.dataset.surveyProvider = session && session.offer.provider ? session.offer.provider : 'cpx';
      var quality = session && S.runnerQuality(session.offer.stars); d.body.dataset.surveyStars = quality ? String(quality.stars) : '3'; d.body.dataset.sharpAnswers = view.sharpAnswers ? 'yes' : 'no';
      var shell = element('main', undefined, 'bo-survey-shell'); shell.id = 'bo-survey-shell';
      var identity = element('div', '@' + surveyUsername(), 'bo-survey-username-badge'); identity.id = 'bo-survey-username-badge'; identity.setAttribute('data-player-username', ''); shell.appendChild(identity);
      shell.appendChild(element('div', _auxValue("aux.survey.runner.22897330cc70","ORIGINAL GAME SURVEY"), 'bo-survey-eyebrow')); var titleNode = element('h1', title); titleNode.tabIndex = -1; shell.appendChild(titleNode);
      shell.appendChild(element('p', _auxValue("aux.survey.runner.bafb856e832f","Use fictional answers, never real personal information. Local-only · game currency only · no survey-company affiliation."), 'bo-survey-muted'));
      if (quality) {
        var rating = element('div', undefined, 'bo-survey-quality'); rating.appendChild(element('strong', '★'.repeat(quality.stars) + ' · ' + quality.label));
        rating.appendChild(element('span', _auxValue("aux.survey.runner.8eb12781825f","Stars set presentation quality, never the saved reward.")));
        if (quality.stars <= 2) { var sharp = button(view.sharpAnswers ? _auxValue("aux.survey.runner.94c10e6cc839","Answer text is sharp") : _auxValue("aux.survey.runner.bf97d22268f8","Keep answers sharp"), function () { view.sharpAnswers = !view.sharpAnswers; d.body.dataset.sharpAnswers = view.sharpAnswers ? 'yes' : 'no'; sharp.setAttribute('aria-pressed', String(view.sharpAnswers)); _surveyBind(sharp,view.sharpAnswers ? _auxValue("aux.survey.runner.94c10e6cc839","Answer text is sharp") : _auxValue("aux.survey.runner.bf97d22268f8","Keep answers sharp")); }, true, 'bo-survey-sharp'); sharp.setAttribute('aria-pressed', String(view.sharpAnswers)); rating.appendChild(sharp); }
        shell.appendChild(rating);
      }
      var emeraldSlot = element('div'); emeraldSlot.id = 'emerald-survey-slot'; shell.appendChild(emeraldSlot);
      surface.appendChild(shell); refreshEmerald(); return shell;
    }
    function renderError(reason) {
      if (!current()) return;
      stopHeartbeat(); var shell = frame(_auxValue("aux.survey.runner.8b962911ee56","Survey paused")), card = element('section', undefined, 'bo-survey-card');
      card.appendChild(element('p', _surveyError(reason)));
      var actions = element('div', undefined, 'bo-survey-actions');
      if (view.controller && ['missing', 'changed'].indexOf(reason) < 0) actions.appendChild(button(_auxValue("aux.survey.runner.f107b1d67727","Retry saved survey"), resume, false, 'bo-survey-retry'));
      actions.appendChild(button(_auxValue("survey.return","Return to game"), navigate, true, 'bo-survey-return')); card.appendChild(actions); shell.appendChild(card);
    }
    function renderTerminal(s) {
      if (!current()) return;
      stopHeartbeat(); var complete = s.status === 'completed', shell = frame(complete ? _auxValue("aux.survey.runner.70941ad4097c","Thanks for completing the survey!") : _auxValue("aux.survey.runner.96f577aca304","This survey has ended")), card = element('section', undefined, 'bo-survey-card');
      if (complete) card.appendChild(element('p', _auxValue("aux.survey.runner.444045937213","Your completed status is saved on this device. Return to the game to collect the game-currency reward.")));
      else card.appendChild(element('p', _auxValue("aux.survey.runner.68c032f03c59","{value1} No reward was earned.",{value1:_surveyError(s.reason,true)})));
      card.appendChild(element('p', _auxValue("aux.survey.runner.20f3bb62c481","Returning to your game shortly…"), 'bo-survey-muted'));
      card.appendChild(button(_auxValue("survey.return","Return to game"), navigate, false, 'bo-survey-return')); shell.appendChild(card);
      view.redirect = w.setTimeout(navigate, 6000);
    }
    function renderIntro(s) {
      var captcha = s.intro.phase === 'captcha', shell = frame(captcha ? _auxValue("aux.survey.runner.a0603f603aeb","Local CAPTCHA") : _auxValue("aux.survey.runner.2980a0aedea0","Welcome to the Survey!")), card = element('section', undefined, 'bo-survey-card'), message = element('p', '', 'bo-survey-error'); message.id = 'bo-survey-error'; message.setAttribute('role', 'alert');
      async function advance(control, value) {
        if (!current() || view.busy) return; view.busy = true; control.disabled = true; _surveyBind(message,'');
        var result = captcha ? await view.controller.submitCaptcha(value) : await view.controller.acceptWelcome(); view.busy = false;
        if (!current()) return; control.disabled = false;
        if (result.ok) { if (result.session.intro.phase === 'ready') renderQuestion(result.session); else renderIntro(result.session); w.scrollTo(0, 0); }
        else if (['captcha', 'intro', 'storage', 'clock'].indexOf(result.reason) >= 0) _surveyBind(message,_surveyError(result.reason));
        else renderError(result.reason);
      }
      if (captcha) {
        card.appendChild(element('p', _auxValue("aux.survey.runner.bd1521f23f8e","A simple local game check — not a real bot-security service. No external CAPTCHA, tracking or account is used."), 'bo-survey-muted'));
        var form = element('form'); form.id = 'bo-survey-captcha-form'; form.noValidate = true;
        var label = element('label', S.captchaChallenge(s.id, s.seed).prompt, 'bo-survey-captcha-label'); label.htmlFor = 'bo-survey-captcha-answer';
        var input = element('input', undefined, 'bo-survey-captcha-input'); input.id = 'bo-survey-captcha-answer'; input.name = 'captcha'; input.type = 'text'; input.inputMode = 'numeric'; input.autocomplete = 'off'; input.maxLength = 3; input.setAttribute('aria-describedby', message.id);
        var submit = element('button', _auxValue("aux.survey.runner.822dca242316","Verify local CAPTCHA")); submit.id = 'bo-survey-captcha-submit'; submit.type = 'submit'; var actions = element('div', undefined, 'bo-survey-actions'); actions.appendChild(submit);
        form.appendChild(label); form.appendChild(input); form.appendChild(message); form.appendChild(actions); form.addEventListener('submit', function (event) { event.preventDefault(); void advance(submit, input.value); }); card.appendChild(form);
      } else {
        card.appendChild(element('p', _auxValue("aux.survey.runner.e826c9f10c83","The local CAPTCHA is complete. Take your time and use invented details. Your questionnaire and listed game reward are saved on this device.")));
        card.appendChild(element('p', s.questionnaireVersion === 3 ? _auxValue("aux.survey.runner.1f1629fa4522","This questionnaire includes clear instruction checks, seven-by-seven preference tables and real nature-video choices. Videos start paused and muted. Watching is optional; every video choice has a text description if its preview is unavailable.") : _auxValue("aux.survey.runner.a251ae564422","This questionnaire includes clear instruction checks and seven-by-seven preference tables. Media can be paused; optional real-world footage has a local illustration fallback."), 'bo-survey-muted'));
        card.appendChild(message); var begin = button(_auxValue("aux.survey.runner.4a6d1d0dba30","Begin survey"), function () { void advance(begin); }, false, 'bo-survey-begin'); card.appendChild(begin);
      }
      shell.appendChild(card); shell.appendChild(button(_auxValue("aux.survey.runner.c4aa6ca09e7d","Pause and return to game"), async function () { if (!current() || view.busy) return; view.busy = true; if (!mounted) await view.controller.release(); navigate(); }, true, 'bo-survey-return'));
      view.renderedIndex = 'intro-' + s.intro.phase;
    }
    function elapsedText(s) { var elapsed = s.elapsedMs + (s.questionStartedAt ? Math.max(0, Date.now() - s.questionStartedAt) : 0), sec = Math.floor(elapsed / 1000); return _auxValue("aux.survey.runner.233b61c51a3e","Time elapsed {value1}:{value2}",{value1:(Math.floor(sec / 60)),value2:(String(sec % 60).padStart(2, '0'))}); }
    function grid(form, table, tableId) {
      var wrap = element('div', undefined, 'bo-survey-grid-wrap'), node = element('table', undefined, 'bo-survey-grid' + (table.rows.length === 7 && table.columns.length === 7 ? ' bo-survey-grid-7' : ''));
      wrap.tabIndex = 0; wrap.setAttribute('role', 'region'); _surveyAttribute(wrap,'aria-label',_auxValue("aux.survey.runner.3c26982dba08","{value1} — scroll sideways if needed",{value1:_surveyValue(table.label || 'Preference table')}));
      node.appendChild(element('caption', table.label || _auxValue("aux.survey.runner.3313fdb22201","Rate each feature")));
      var head = element('thead'), headRow = element('tr'), blank = element('th', _auxValue("aux.survey.runner.3d377ae910dc","Feature")); blank.scope = 'col'; headRow.appendChild(blank);
      table.columns.forEach(function (c) { var th = element('th', c.label); th.scope = 'col'; headRow.appendChild(th); }); head.appendChild(headRow); node.appendChild(head);
      var body = element('tbody');
      table.rows.forEach(function (row) {
        var tr = element('tr'), th = element('th', row.label); th.scope = 'row'; tr.appendChild(th);
        table.columns.forEach(function (c) {
          var td = element('td'), label = element('label'), input = element('input'); input.type = 'radio'; input.name = tableId + '.' + row.id; input.value = c.value; input.dataset.table = tableId; input.dataset.row = row.id; _surveyAttributeParts(input,'aria-label',[table.label,': ',row.label,' — ',c.label]); label.appendChild(input); td.appendChild(label); tr.appendChild(td);
        }); body.appendChild(tr);
      }); node.appendChild(body); wrap.appendChild(node); form.appendChild(wrap);
    }
    function readAnswer(form, q) {
      if (q.type === 'text') return form.querySelector('textarea[name="answer"]').value;
      if (q.type === 'slider') { var range = form.querySelector('input[type="range"]'); return range.dataset.touched === 'yes' ? Number(range.value) : null; }
      if (q.type === 'table' || q.type === 'double-table') {
        var tables = q.type === 'table' ? [{id: 'main', rows: q.rows}] : q.tables, value = {};
        tables.forEach(function (table) { var group = {}; table.rows.forEach(function (row) { var selected = form.querySelector('input[data-table="' + table.id + '"][data-row="' + row.id + '"]:checked'); if (selected) group[row.id] = selected.value; }); value[table.id] = group; });
        return q.type === 'table' ? value.main : value;
      }
      var selected = form.querySelector('input[name="answer"]:checked'); return selected ? selected.value : null;
    }
    function drawScene(ctx, spec, phase) {
      // Bounded, original procedural scenery. This is illustration, not footage.
      var detail = spec.detail, x = 260 + Math.sin(phase * Math.PI * 2) * 105, y = 159, colour = spec.colour;
      ctx.setTransform(spec.width / 640, 0, 0, spec.height / 267, 0, 0); ctx.clearRect(0, 0, 640, 267);
      function ellipse(cx, cy, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); }
      function gradient(x1, y1, x2, y2, a, b) { var g = ctx.createLinearGradient(x1, y1, x2, y2); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
      ctx.fillStyle = detail >= 3 ? gradient(0, 0, 0, 240, '#77b9e0', '#e9f6f5') : '#d5e2e6'; ctx.fillRect(0, 0, 640, 267);
      if (detail >= 4) { var glow = ctx.createRadialGradient(520, 49, 8, 520, 49, 90); glow.addColorStop(0, '#fff9dce8'); glow.addColorStop(1, '#fff9dc00'); ctx.fillStyle = glow; ctx.fillRect(430, 0, 180, 145); }
      ellipse(520, 49, 24, 24, detail >= 3 ? '#ffe5a0' : '#e3d6af');
      for (var cloud = 0; cloud < detail; cloud++) { var cx = 55 + cloud * 137; ellipse(cx, 53 + cloud % 2 * 20, 31, 10, '#ffffffa0'); if (detail >= 3) ellipse(cx - 9, 47 + cloud % 2 * 20, 18, 15, '#ffffffaa'); }
      ctx.beginPath(); ctx.moveTo(0, 161); ctx.bezierCurveTo(100, 78, 180, 146, 280, 118); ctx.bezierCurveTo(400, 60, 500, 152, 640, 99); ctx.lineTo(640, 267); ctx.lineTo(0, 267); ctx.fillStyle = detail >= 3 ? gradient(0, 110, 0, 267, '#80b9a0', '#406f68') : '#a6b3a6'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 188); ctx.bezierCurveTo(220, 132, 380, 233, 640, 157); ctx.lineTo(640, 267); ctx.lineTo(0, 267); ctx.fillStyle = detail >= 3 ? gradient(0, 175, 0, 267, '#bad1a3', '#6d9369') : '#bfc6ad'; ctx.fill();
      if (spec.object === 'car') { ctx.fillStyle = '#66777d'; ctx.fillRect(0, 179, 640, 35); ctx.strokeStyle = '#e6e4ca'; ctx.lineWidth = 2; ctx.setLineDash([24, 18]); ctx.beginPath(); ctx.moveTo(0, 201); ctx.lineTo(640, 201); ctx.stroke(); ctx.setLineDash([]); y = 167; }
      if (spec.object === 'bee') y = 123 + Math.sin(phase * Math.PI * 4) * 7;
      if (detail >= 3) ellipse(x + 5, spec.object === 'bee' ? 187 : y + 33, 49, 8, '#173c332c');
      ctx.save(); ctx.translate(x, y);
      if (spec.object === 'car') {
        ctx.fillStyle = detail >= 3 ? gradient(0, -35, 0, 21, '#e4edf0', colour) : colour; ctx.beginPath(); ctx.moveTo(-49, 5); ctx.lineTo(-37, -12); ctx.lineTo(-21, -32); ctx.lineTo(21, -32); ctx.lineTo(41, -11); ctx.lineTo(53, -4); ctx.lineTo(53, 18); ctx.lineTo(-49, 18); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#254e66'; ctx.beginPath(); ctx.moveTo(-28, -13); ctx.lineTo(-16, -27); ctx.lineTo(15, -27); ctx.lineTo(29, -13); ctx.closePath(); ctx.fill();
        ellipse(-29, 19, 12, 12, '#23343e'); ellipse(32, 19, 12, 12, '#23343e');
        if (detail >= 3) { ellipse(-29, 19, 6, 6, '#b6c7d0'); ellipse(32, 19, 6, 6, '#b6c7d0'); ctx.fillStyle = '#fff3a4'; ctx.fillRect(44, -1, 8, 5); ctx.fillStyle = '#f08b73'; ctx.fillRect(-49, 0, 5, 5); }
        if (detail >= 4) { ctx.strokeStyle = '#ffffff8c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-37, -5); ctx.lineTo(37, -5); ctx.stroke(); ctx.fillStyle = '#274756'; ctx.fillRect(3, -8, 2, 22); ctx.fillRect(10, -4, 8, 2); }
      } else if (spec.object === 'bee') {
        ellipse(-12, -21, 16, 25, '#eaf9ffb8'); ellipse(14, -19, 17, 25, '#eaf9ffd0');
        var bee = detail >= 3 ? ctx.createRadialGradient(-10, -12, 2, 0, 0, 37) : null; if (bee) { bee.addColorStop(0, '#fff5ad'); bee.addColorStop(0.6, '#eec44c'); bee.addColorStop(1, '#ad7f1b'); }
        ellipse(0, 0, 35, 23, bee || '#d1be6b'); ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, 35, 23, 0, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#303d3e'; ctx.fillRect(-16, -25, 9, 50); ctx.fillRect(4, -25, 9, 50); ctx.restore(); ellipse(25, -5, 3, 3, '#142831'); if (detail >= 4) ellipse(24, -6, 1, 1, '#fff');
      } else if (spec.object === 'ball') {
        var ball = detail >= 3 ? ctx.createRadialGradient(-12, -15, 2, 0, 0, 34) : null; if (ball) { ball.addColorStop(0, '#ffecb8'); ball.addColorStop(0.5, colour); ball.addColorStop(1, '#334859'); }
        ellipse(0, 0, 33, 33, ball || colour); ctx.strokeStyle = '#284152'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-33, 0); ctx.lineTo(33, 0); ctx.moveTo(0, -33); ctx.bezierCurveTo(-22, -13, -22, 15, 0, 33); ctx.moveTo(0, -33); ctx.bezierCurveTo(22, -13, 22, 15, 0, 33); ctx.stroke();
      } else {
        ctx.beginPath(); for (var point = 0; point < 10; point++) { var angle = -Math.PI / 2 + point * Math.PI / 5, radius = point % 2 ? 17 : 36; if (!point) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius); else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); } ctx.closePath(); ctx.fillStyle = detail >= 3 ? gradient(-25, -35, 25, 35, '#fff1b9', colour) : colour; ctx.fill(); if (detail >= 4) { ctx.strokeStyle = '#ffffffbd'; ctx.lineWidth = 2; ctx.stroke(); }
      }
      ctx.restore();
      if (detail >= 2) for (var grass = 0; grass < detail * 12; grass++) { var gx = (grass * 83 + 11) % 640, gy = 235 + grass % 6 * 5; ctx.strokeStyle = detail >= 4 ? '#385f4b89' : '#6d856c'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 7 - grass % 4); ctx.stroke(); if (detail >= 4 && grass % 3 === 0) { ellipse(gx - 3, gy - 9, 3, 3, ['#fff5c8', '#f2bfc5', '#d8e6ff'][grass % 3]); } }
    }
    function procedural(figure, q, reduced) {
      var spec = q.media, canvas = element('canvas', undefined, 'bo-survey-procedural'); canvas.width = spec.width; canvas.height = spec.height; canvas.dataset.fps = String(spec.fps); canvas.setAttribute('role', 'img'); _surveyAttribute(canvas, 'aria-label', q.alt); var ctx;
      try { ctx = canvas.getContext('2d', {alpha: false}); } catch (_) {}
      if (!ctx) return null;
      figure.appendChild(canvas);
      var paused = reduced || q.type !== 'animation', alive = true, request = null, last = -Infinity, started = null;
      function paint(stamp) { if (!alive || paused) return; if (started === null) started = stamp; if (stamp - last >= 1000 / spec.fps) { drawScene(ctx, spec, (stamp - started) % 5000 / 5000); last = stamp; } request = w.requestAnimationFrame(paint); }
      function setPaused(value) { paused = value; canvas.dataset.paused = String(paused); figure.classList.toggle('is-paused', paused); if (request !== null) { w.cancelAnimationFrame(request); request = null; } if (!paused) request = w.requestAnimationFrame(paint); }
      drawScene(ctx, spec, 0); setPaused(paused);
      var hidden = function () { if (d.hidden) setPaused(true); }; d.addEventListener('visibilitychange', hidden);
      view.mediaCleanups.push(function () { alive = false; if (request !== null) w.cancelAnimationFrame(request); d.removeEventListener('visibilitychange', hidden); });
      return {toggle: function () { setPaused(!paused); return paused; }};
    }
    function footage(form) {
      var box = element('section', undefined, 'bo-survey-footage'), title = element('p', _auxValue("aux.survey.runner.e11073782fc9","Optional real-world flower footage · bundled CC0 preview. The question refers to the local illustration above, not this preview.")), video = element('video', undefined, 'bo-survey-video'), status = element('p', _auxValue("aux.survey.runner.834c386da51b","Real footage preview starts paused. Playback is optional; the illustrated question always works offline."), 'bo-survey-footage-status');
      video.src = 'survey-flower.mp4'; video.controls = true; video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'metadata'; _surveyAttribute(video,'aria-label',_auxValue("aux.survey.runner.0d18fbe3b6ab","Optional real-world flower footage, separate from the question"));
      function ready() { video.dataset.ready = 'yes'; }
      function failed() { video.hidden = true; _auxSetText(status,"aux.survey.runner.9a4e1838014c","Real-world preview unavailable. Local illustrated fallback above remains available offline."); }
      function hidden() { if (d.hidden) video.pause(); }
      video.addEventListener('loadedmetadata', ready); video.addEventListener('error', failed); d.addEventListener('visibilitychange', hidden);
      view.mediaCleanups.push(function () { video.removeEventListener('loadedmetadata', ready); video.removeEventListener('error', failed); d.removeEventListener('visibilitychange', hidden); video.pause(); video.removeAttribute('src'); video.load(); });
      box.appendChild(title); box.appendChild(video); box.appendChild(status); form.appendChild(box);
    }
    function videoOptions(form, q) {
      var group = element('fieldset', undefined, 'bo-survey-video-options'), players = [], removers = [];
      group.appendChild(element('legend', _auxValue("aux.survey.runner.f1fb31a7f388","Choose one clip. Previewing is optional; playback controls do not select an answer."), 'bo-survey-muted'));
      function trusted(id) {
        // Saved questions/URLs are never consulted. Only the shipped, ID-bound
        // catalog can supply a source: an exact bundled path or build embedding.
        var fallback = S.VIDEO_OPTIONS[id], catalog = w.BOSurveyVideos, entry = null;
        if (!fallback) return null;
        try { if (catalog && typeof catalog.get === 'function') entry = catalog.get(id); } catch (_) {}
        if (!entry || entry.id !== id) entry = {};
        function text(value, limit) { return typeof value === 'string' && value.trim() && value.length <= limit ? value : ''; }
        var src = typeof entry.src === 'string' && (entry.src === 'survey-' + id + '.mp4' || /^data:video\/mp4;base64,[A-Za-z0-9+/]+={0,2}$/.test(entry.src)) ? entry.src : null;
        function link(value) {
          try { var url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; } catch (_) { return ''; }
        }
        return {label: text(entry.label, 200) || fallback.label, description: text(entry.description, 2000) || fallback.description, credit: text(entry.credit, 500), license: text(entry.license, 200), sourceUrl: link(entry.sourceUrl), licenseUrl: link(entry.licenseUrl), changes: text(entry.changes, 500) || 'Shortened, resized and muted.', src: src};
      }
      q.videoOptions.forEach(function (choice) {
        var clip = trusted(choice.id); if (!clip) return;
        var card = element('article', undefined, 'bo-survey-video-option'), video = element('video', undefined, 'bo-survey-video bo-survey-option-video');
        var prefix = 'bo-survey-' + choice.id, description = element('p', clip.description, 'bo-survey-video-description'), status = element('p', _auxValue("aux.survey.runner.d472e3b48e95","Starts paused · watching is optional. Choose below using the video or description."), 'bo-survey-footage-status');
        card.dataset.videoId = choice.id; video.dataset.videoId = choice.id;
        description.id = prefix + '-description'; status.id = prefix + '-status'; status.setAttribute('role', 'status');
        video.controls = true; video.autoplay = false; video.loop = false; video.muted = true; video.defaultMuted = true; video.playsInline = true; video.preload = 'metadata';
        video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); _surveyAttribute(video,'aria-label',_auxValue("aux.survey.runner.8aba3b828b67","{value1} — optional nature video preview",{value1:_surveyValue(clip.label)})); video.setAttribute('aria-describedby', description.id);
        function ready() { video.dataset.ready = 'yes'; }
        function failed() { video.pause(); video.hidden = true; video.dataset.ready = 'no'; _auxSetText(status,"aux.survey.runner.9dc5dfb616a8","Preview unavailable. You can still choose this option using its description; no viewing is required."); }
        function playing() { if (video.paused) return; players.forEach(function (other) { if (other !== video) other.pause(); }); if (d.hidden) video.pause(); }
        video.addEventListener('loadedmetadata', ready); video.addEventListener('error', failed); video.addEventListener('play', playing); video.addEventListener('playing', playing);
        players.push(video);
        removers.push(function () {
          video.removeEventListener('loadedmetadata', ready); video.removeEventListener('error', failed); video.removeEventListener('play', playing); video.removeEventListener('playing', playing);
          video.pause(); video.removeAttribute('src'); video.load();
        });
        if (clip.src) video.src = clip.src; else failed();
        var figure = element('figure', undefined, 'bo-survey-video-preview'), caption = element('figcaption');
        figure.appendChild(video); caption.appendChild(description); caption.appendChild(status);
        if (clip.credit || clip.license) {
          var credits = element('p', undefined, 'bo-survey-video-credit');if(clip.credit)credits.appendChild(element('span', _auxValue('aux.survey.runner.66c201dc5637','Footage: {value1}',{value1:clip.credit})));if(clip.credit&&clip.license)credits.appendChild(d.createTextNode(' · '));if(clip.license)credits.appendChild(element('span', _auxValue('aux.survey.runner.d5fc271d7808','License: {value1}',{value1:clip.license})));caption.appendChild(credits);
          var attribution = element('p', clip.changes, 'bo-survey-video-credit');
          [[_auxValue("aux.survey.runner.0e570ca6fabe","Source"), clip.sourceUrl], [_auxValue("aux.survey.runner.c011d6097bfb","License"), clip.licenseUrl]].forEach(function (item) {
            if (!item[1]) return; var anchor = element('a', item[0]); anchor.href = item[1]; anchor.target = '_blank'; anchor.rel = "noopener noreferrer"; attribution.appendChild(d.createTextNode(' · ')); attribution.appendChild(anchor);
          });
          caption.appendChild(attribution);
        }
        figure.appendChild(caption); card.appendChild(figure);
        // Deliberately separate from <video>: no label/card click handler wraps
        // media controls, so playing, seeking or changing volume cannot answer.
        var label = element('label', undefined, 'bo-survey-choice'), input = element('input'); input.type = 'radio'; input.name = 'answer'; input.value = choice.id; input.id = prefix + '-answer'; input.setAttribute('aria-describedby', description.id + ' ' + status.id);
        label.htmlFor = input.id; label.appendChild(input); label.appendChild(element('span', clip.label, 'bo-survey-answer-text')); card.appendChild(label); group.appendChild(card);
      });
      function hidden() { if (d.hidden) players.forEach(function (video) { video.pause(); }); }
      d.addEventListener('visibilitychange', hidden);
      view.mediaCleanups.push(function () { d.removeEventListener('visibilitychange', hidden); removers.forEach(function (remove) { remove(); }); });
      form.appendChild(group);
    }
    function media(form, q) {
      var figure = element('figure', undefined, 'bo-survey-media' + (q.type === 'animation' ? ' bo-survey-animation' : q.type === 'attention' ? ' bo-survey-attention-media' : ''));
      // q.svg comes ONLY from the local pure generator, never from saved media
      // URLs, entered text, the hash, or an external service.
      var reduced = !!options.reducedMotion || !!(w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches), clip = q.media && procedural(figure, q, reduced);
      if (!clip) { var scene = element('div'); if(q.type==='attention'&&['colour','word-length'].includes(q.variant)){scene.lang='en';scene.setAttribute('translate','no');} scene.innerHTML = q.svg; figure.appendChild(scene); if (q.media) figure.appendChild(element('p', _auxValue("aux.survey.runner.93b5fc4601e2","Local SVG fallback · canvas unavailable"), 'bo-survey-muted')); }
      if (q.type === 'animation') {
        if (reduced) figure.classList.add('is-paused');
        var timeline = element('div', undefined, 'bo-survey-clip-timeline'); timeline.setAttribute('aria-hidden', 'true'); timeline.appendChild(element('span')); figure.appendChild(timeline);
        var explanation = element('figcaption'); explanation.appendChild(element('span', q.animation.label)); explanation.appendChild(d.createTextNode('. ')); explanation.appendChild(element('span', q.animation.description)); figure.appendChild(explanation);
        var controls = element('div', undefined, 'bo-survey-clip-controls'), toggle = button(reduced ? _auxValue("aux.survey.runner.76bced7d616a","Play animation") : _auxValue("aux.survey.runner.8a754f71ce34","Pause animation"), function () {
          var paused = clip ? clip.toggle() : figure.classList.toggle('is-paused'); if (!paused) figure.classList.add('motion-opt-in'); _surveyBind(toggle,paused ? _auxValue("aux.survey.runner.76bced7d616a","Play animation") : _auxValue("aux.survey.runner.8a754f71ce34","Pause animation")); toggle.setAttribute('aria-pressed', String(!paused));
        }, true); toggle.setAttribute('aria-pressed', String(!reduced)); controls.appendChild(toggle); controls.appendChild(element('span', _auxValue("aux.survey.runner.16ece71a53b0","0:05 local loop · no audio"), 'bo-survey-muted')); figure.appendChild(controls);
      } else figure.appendChild(element('figcaption', q.alt));
      form.appendChild(figure);
      if (q.media && q.type === 'animation') footage(form);
    }
    function renderQuestion(s) {
      if (!current()) return;
      var q = view.controller.getQuestion(); if (!q) return renderError('invalid');
      var shell = frame(s.offer.topic, q), meta = element('div', undefined, 'bo-survey-meta'), timer = element('span', elapsedText(s)); timer.id = 'bo-survey-timer'; meta.appendChild(timer); meta.appendChild(element('span', _auxValue("aux.survey.runner.c78cc8a6eb4a","Fictional questionnaire"))); shell.appendChild(meta);
      if (s.offer.showProgress) {
        var progressWrap = element('div', undefined, 'bo-survey-progress'), label = element('span', _auxValue("aux.survey.runner.58856e13436c","{value1}% complete",{value1:(Math.floor(s.index / s.offer.questionCount * 100))}), 'bo-survey-progress-label'), progress = element('progress'); progress.id = 'bo-survey-progress'; progress.max = s.offer.questionCount; progress.value = s.index; _surveyAttribute(progress,'aria-label',_auxValue("aux.survey.runner.228253d5939c","Survey progress")); progressWrap.appendChild(label); progressWrap.appendChild(progress); shell.appendChild(progressWrap);
      }
      var card = element('section', undefined, 'bo-survey-card'), form = element('form'); form.id = 'bo-survey-form'; form.dataset.questionType = q.type; form.noValidate = true;
      var heading = element('h2', q.prompt, q.type === 'attention' ? 'bo-survey-attention' : ''); heading.id = 'bo-survey-prompt'; form.setAttribute('aria-labelledby', heading.id); form.appendChild(heading);
      if (q.variant) form.dataset.attentionVariant = q.variant;
      if (!q.videoOptions && (q.type === 'image' || q.type === 'animation' || (q.type === 'attention' && q.svg))) media(form, q);
      if (q.videoOptions) videoOptions(form, q);
      else if (q.type === 'text') {
        var text = element('textarea'); text.name = 'answer'; text.minLength = q.minLength; text.maxLength = q.maxLength; _surveyAttribute(text,'placeholder',_auxValue('aux.survey.runner.67f99025a307','Invent a short answer — no personal details')); _surveyAttribute(text,'aria-label',_auxValue("aux.survey.runner.576a58921165","Your fictional answer")); form.appendChild(text); form.appendChild(element('p', _auxValue("aux.survey.runner.50cfef9b4e40","2–240 characters. Any language is welcome."), 'bo-survey-muted'));
      } else if (q.type === 'slider') {
        var output = element('output', _auxValue("aux.survey.runner.950818ff3f3a","Move the slider to answer"), 'bo-survey-slider-output'), range = element('input'); range.type = 'range'; range.name = 'answer'; range.min = q.min; range.max = q.max; range.step = q.step; range.value = (q.min + q.max) / 2; range.dataset.touched = 'no'; _surveyAttribute(range,'aria-label',_auxValue("aux.survey.runner.517109907514","Preference from {value1} to {value2}",{value1:(q.min),value2:(q.max)}));
        function touched() { range.dataset.touched = 'yes'; _surveyBind(output,range.value + ' / ' + q.max); }
        range.addEventListener('input', touched); range.addEventListener('change', touched); form.appendChild(output); form.appendChild(range); var labels = element('div', undefined, 'bo-survey-slider-labels'); var low=element('span'),high=element('span');low.appendChild(d.createTextNode(q.min+' — '));low.appendChild(element('span',q.minLabel));high.appendChild(d.createTextNode(q.max+' — '));high.appendChild(element('span',q.maxLabel));labels.appendChild(low);labels.appendChild(high); form.appendChild(labels);
      } else if (q.type === 'table' || q.type === 'double-table') {
        form.appendChild(element('p', _auxValue("aux.survey.runner.b2df739f158d","On small screens, swipe each table sideways to see all choices."), 'bo-survey-muted'));
        if (q.type === 'table') grid(form, {label: _auxValue("aux.survey.runner.ac45d384b51b","Your fictional preferences"), rows: q.rows, columns: q.columns}, 'main');
        else q.tables.forEach(function (t) { grid(form, t, t.id); });
      }
      else q.options.forEach(function (o) { var label = element('label', undefined, 'bo-survey-choice'), input = element('input'), text = element('span', o.label, 'bo-survey-answer-text'); if (q.variant === 'word-length' || q.type === 'attention' && ['Red','Green','Blue'].includes(o.label)) { text.lang = 'en'; text.setAttribute('translate', 'no'); } input.type = 'radio'; input.name = 'answer'; input.value = o.value; if (q.type === 'attention' && Number.isInteger(o.fontSize)) { text.style.fontSize = o.fontSize + 'px'; text.style.lineHeight = '1.15'; _surveyAttributeParts(input,'aria-label',[(q.variant === 'word-length' ? _auxValue('aux.survey.runner.9a0283957922','Word ') : _auxValue('aux.survey.runner.4ada4ace3330','Numeric value ')),o.label]); } label.appendChild(input); label.appendChild(text); form.appendChild(label); });
      var message = element('p', '', 'bo-survey-error'); message.id = 'bo-survey-error'; message.setAttribute('role', 'alert'); form.appendChild(message);
      var actions = element('div', undefined, 'bo-survey-actions'), next = element('button', s.index === s.offer.questionCount - 1 ? _auxValue("aux.survey.runner.a48ac90935cd","Finish survey") : _auxValue("common.continue","Continue")); next.id = 'bo-survey-continue'; next.type = 'submit'; actions.appendChild(next); form.appendChild(actions);
      form.addEventListener('submit', async function (event) {
        event.preventDefault(); if (!current() || view.busy) return; view.busy = true; next.disabled = true; _surveyBind(message,'');
        // Response values exist only for this call and the visible form. Only
        // quality codes/timings can reach canonical storage.
        var result = await view.controller.submit(s.index, readAnswer(form, q)); view.busy = false;
        if (!current()) return;
        next.disabled = false;
        if (result.session && (result.session.status === 'completed' || result.session.status === 'disqualified')) { renderTerminal(result.session); return; }
        if (result.ok) { renderQuestion(result.session); w.scrollTo(0, 0); return; }
        if (['empty', 'invalid', 'too-fast'].indexOf(result.reason) >= 0) { _surveyBind(message,_surveyError(result.reason)); return; }
        if (['storage', 'clock'].indexOf(result.reason) >= 0) { _surveyBind(message,_surveyError(result.reason)); return; }
        renderError(result.reason);
      }); card.appendChild(form); shell.appendChild(card);
      shell.appendChild(element('p', _auxValue("aux.survey.runner.a30dfea1c7fa","Take your time. Explicit attention checks, three speeding attempts, or clear spam can end a survey. Your raw answers are not saved."), 'bo-survey-muted'));
      shell.appendChild(button(_auxValue("aux.survey.runner.c4aa6ca09e7d","Pause and return to game"), async function () { if (!current() || view.busy) return; view.busy = true; if (!mounted) await view.controller.release(); navigate(); }, true, 'bo-survey-return'));
      view.renderedIndex = s.index;
    }
    function startHeartbeat() {
      if (!current() || d.hidden || view.heartbeat !== null) return;
      view.heartbeat = w.setInterval(async function () {
        var result = await view.controller.heartbeat();
        if (!current()) return;
        if (!result.ok) { renderError(result.reason); return; }
        if (result.session.status === 'completed' || result.session.status === 'disqualified') renderTerminal(result.session);
      }, 5000);
    }
    async function resume() {
      if (!current() || view.busy || !view.controller) return;
      view.busy = true; var result = await view.controller.resume(); view.busy = false;
      if (!current()) return;
      if (!result.ok) { renderError(result.reason); return; }
      if (result.session.status === 'completed' || result.session.status === 'disqualified') renderTerminal(result.session);
      else {
        var intro = result.session.intro && result.session.intro.phase !== 'ready', key = intro ? 'intro-' + result.session.intro.phase : result.session.index;
        if (view.renderedIndex !== key || !surface.querySelector(intro ? '#bo-survey-error' : '#bo-survey-form')) { if (intro) renderIntro(result.session); else renderQuestion(result.session); }
        startHeartbeat();
      }
    }
    if (!d.getElementById('bo-survey-runner-style')) { var style = element('style', CSS); style.id = 'bo-survey-runner-style'; d.head.appendChild(style); view.style = style; }
    listen(w, 'pagehide', function () { void view.close({notify: false}); });
    frame('Opening your fictional survey…');
    if (mounted) surface.focus({preventScroll: true});
    if (!identifier(id) || !S) { renderError('invalid'); return true; }
    var storage = {getItem: function (key) { return w.localStorage.getItem(key); }, setItem: function (key, value) { if (typeof options.assertWritable === 'function') options.assertWritable(); if (w.BOEmeraldConduct) check(!w.BOEmeraldConduct.read(w.localStorage, Date.now()).active, 'conduct'); return w.localStorage.setItem(key, value); }};
    view.controller = createController({id: id, owner: owner, storage: storage, now: function () { return Date.now(); }, locks: w.navigator && w.navigator.locks});
    view.timer = w.setInterval(function () { var s = state(), node = surface.querySelector('#bo-survey-timer'); if (current() && s && node) _surveyBind(node,elapsedText(s)); if (current()) refreshEmerald(); }, 1000);
    listen(w, 'storage', function (event) {
      if (!current()) return;
      if (event.key === SESSION_PREFIX + id || event.key === null) {
        if (event.newValue === null) { renderError('missing'); return; }
        resume();
      }
    });
    listen(d, 'visibilitychange', function () {
      if (!current()) return;
      if (d.hidden) { stopHeartbeat(); void view.controller.release().then(function () { if (current() && !d.hidden) resume(); }); }
      else resume();
    });
    resume(); return true;
  }
  return Object.freeze({SESSION_PREFIX: SESSION_PREFIX, LEASE_MS: LEASE_MS, MAX_SPEED_STRIKES: MAX_SPEED_STRIKES, normalizeSession: normalizeSession, safeReturnUrl: safeReturnUrl, navigateReturn: navigateReturn, createController: createController, start: start, mountSession: function (id, options) { return start(Object.assign({}, options, {sessionId: id, mount: true})); }, close: function (options) { return active ? active.close(options) : closing || Promise.resolve(false); }, isMounted: function () { return !!(active && active.mounted); }, getState: function () { return active && active.controller ? active.controller.getState() : null; }, getQuestion: function () { return active && active.controller ? active.controller.getQuestion() : null; }});
});
