/* Authored fictional campaign identities over the twelve original local engines.
 * New titles/places, milestone targets and rewards; NOT twelve newly downloaded
 * engines each day. Deterministic catalogue data, no IO, clocks or gameplay RNG. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BOArcadeCycleData=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const titles=Object.freeze({
  'emerald-clicker':Object.freeze(['Lumen Acornworks','Mica Moth Foundry','Dewglow Mint','Pebbleglint Atelier','Glowfern Prospectors','Moonseed Quarryfolk','Firefly Facet Guild','Velvet Geode Grove']),
  snake:Object.freeze(['Fernwhorl Courier','Clovercoil Pathfinders','Mossribbon Orchard','Dappleloop Gatherers','Dewlace Gardeners','Ambercoil Trailfolk','Thistletwist Caravan','Mintwhisk Meadowrun']),
  'prism-stack':Object.freeze(['Sunshard Quiltworks','Chromatic Cairnkeepers','Moonpetal Masonry','Dewglass Tessellators','Lumenbrick Weavers','Orchid Prismery','Dappletile Conservatory','Cloverstone Mosaic']),
  'money-idle-maker':Object.freeze(['Acorn Ledgerfolk','Little Lantern Co-op','Mothbell Marketmakers','Dewmint Workshops','Clovercoin Collective','Bramble Bazaarfolk','Glowthread Enterprise','Pebblepurse Partnership']),
  'rocket-hit':Object.freeze(['Cometseed Couriers','Moonbell Arcwrights','Thistledart Post','Glowcap Trajectory Guild','Firefly Beaconworks','Mica Comet Caravan','Dewdrop Launchfolk','Velvet Meteor Mail']),
  'dodge-slimes':Object.freeze(['Puddlewhisp Dash','Gloommallow Sprint','Mossbubble Evaders','Dappleglade Dashfolk','Lanternpuff Run','Cloverjelly Chase','Moonpuddle Sidestep','Fernfoam Footwork']),
  'lantern-guard':Object.freeze(['Glimmerroot Wardens','Dewlantern Bastion','Mothlight Watchfolk','Bramblewick Sentinels','Cloverflame Keepers','Pebblebeam Ramparts','Glowcap Hearthguard','Velvet Lantern Vigil']),
  'idle-dice':Object.freeze(['Dapplepip Conservatory','Moonpip Laboratory','Cloverdot Observatory','Mothmark Combiners','Dewbone Numberworks','Pebblepip Atelier','Glowspot Researchfolk','Fernface Academy']),
  'mossbound-critters':Object.freeze(['Bramblewhisk Almanac','Mossbell Kinship','Dewmoth Fieldfolk','Cloverpaw Companions','Moonruff Meadowkeepers','Pebbletail Society','Lanternfur Notebook','Velvetleaf Friendship']),
  'dragon-drill':Object.freeze(['Copperbloom Delvers','Embermole Expedition','Micaroot Tunnelfolk','Dewsteel Burrowworks','Clovercore Prospectors','Moonore Cartographers','Glowdrill Caravan','Pebbleflame Depths']),
  'circuit-weaver':Object.freeze(['Firefly Loomkeepers','Dewtrace Workshop','Mosswire Patternfolk','Clovercurrent Atelier','Moonfilament Makers','Lanternlink Conservatory','Pebblepulse Weavers','Velvet Circuit Garden']),
  'star-harbor':Object.freeze(['Pearlcloud Dockhands','Mothwing Anchorage','Deworbit Portfolk','Cloverjet Haven','Mooncradle Cargo Guild','Pebblewake Landing','Lanternsail Wharf','Velvet Comet Quay'])
 }),places=Object.freeze(['Arun','Beli','Cora','Demi','Elun','Fari','Gova','Hiri','Iona','Juli','Koru','Luma','Miri','Navo','Oru','Yara']),colors=Object.freeze(['#70e9cf','#ffcf88','#b4a3ff','#c4ef81','#85cbff','#f4a7d2','#e6da91','#93dfb4']);
 function place(n){const out=[];do{out.unshift(places[n%places.length]);n=Math.floor(n/places.length)}while(n);return out.join('-')+' Reach';}
 function catalog(base,cycle){if(!base||!Object.prototype.hasOwnProperty.call(titles,base.id)||!Number.isSafeInteger(cycle)||cycle<1||cycle>1200)throw Error('Invalid fictional arcade campaign.');const goals=Object.freeze(base.goals.map((n,i)=>Math.ceil(n*(20+(cycle-1)%16+1)/20)+cycle*(i+1))),xp=Object.freeze(base.xp.map((n,i)=>Math.ceil(n*(10+(cycle-1)%12+1)/10)+cycle*(i+1))),coins=Object.freeze(base.coins.map((n,i)=>n+cycle*(i+1)));return Object.freeze({...base,cycle,modeName:base.name,name:titles[base.id][(cycle-1)%8]+' · '+place(Math.floor((cycle-1)/8)),description:'A fresh fictional campaign using our original '+base.name+' rules. '+base.description,color:colors[(cycle-1)%colors.length],goals,xp,coins,totalXP:xp.reduce((a,b)=>a+b,0),totalCoins:coins.reduce((a,b)=>a+b,0)});}
 return Object.freeze({catalog,titles,MAX_CYCLE:1200});
});
