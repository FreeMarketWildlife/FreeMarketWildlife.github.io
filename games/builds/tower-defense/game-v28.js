(() => {
'use strict';

const moonfireDemo = new URLSearchParams(location.search).get('demo') === 'moonfire';
const soundDemo = new URLSearchParams(location.search).get('demo') === 'sound';
const buttonwoodSample = new URLSearchParams(location.search).get('sample') === 'buttonwood';

const coreParts=[
  'game-v8-part0.txt?v=41',
  'game-v8-part1.txt?v=44',
  'game-v8-part2.txt?v=42'
];
const liquidParts=[
  'game-v10-liquid.txt?v=44',
  'game-v10-liquid-fixes.txt?v=28',
  'game-v13-liquid-visibility.txt?v=28',
  'game-v14-liquid-guarantee.txt?v=28',
  'game-v15-liquid-diagnostic.txt?v=28',
  'game-v17-liquid-tuning.txt?v=28',
  'game-v17-seedfix.txt?v=28',
  'game-v18-terraria-liquid.txt?v=28',
  'game-v19-liquid-flow.txt?v=28',
  'game-v20-liquid-surface.txt?v=28',
  'game-v21-liquid-render.txt?v=28',
  'game-v22-liquid-engine.txt?v=28'
];
const cameraUrl='game-v24-camera-bounce.txt?v=28';
const gridUrl='game-v25-grid-toggle.txt?v=41';
const zoomUrl='game-v26-zoom-input.txt?v=28';
const minerUrl='game-v27-miner-ai-rhythm.txt?v=44';
const resourceUrl='game-v28-resources-obsidian.txt?v=44';
const liquidFeelUrl='game-v29-liquid-feel.txt?v=29';
const devPanelUrl='game-v30-dev-panel.txt?v=30';
const obsidianArtUrl='game-v31-obsidian-art.txt?v=31';
const artDirectionUrl='game-v32-art-direction.txt?v=41';
const pickaxeUrl='game-v39-pickaxe.txt?v=39';
const treesUrl='game-v41-trees.txt?v=44';
const spiritsUrl='game-v42-miner-ghosts.txt?v=43';
const industryUrl='game-v44-industry-resources.txt?v=59';
const structureArtUrl='game-v46-structure-art.txt?v=46';
const structuresUrl='game-v46-structures.txt?v=46';
const tailUrl='game-v8-part3.txt?v=42';

const moduleReadsV87=new Map();
function read(url){
 if(!moduleReadsV87.has(url))moduleReadsV87.set(url,fetch(url,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Could not load '+url+' ('+r.status+')');return r.text()}));
 return moduleReadsV87.get(url);
}

(async()=>{
  try{
    // Download independently; evaluate below in the original dependency order.
    const preloadV87=["defense-core.js", "buttonwood/defense-art.js", "game-v93-defense.txt?v=93", "biomes.js", "game-v88-musical-feedback.txt", "game-v90-discoveries.txt?v=90", "game-v91-loose-building.txt?v=91", "game-v92-level-rewards.txt?v=92", "game-v89-storm-score.txt?v=89","buttonwood/animal-facts.js", "buttonwood/biomes.js", "buttonwood/buildings.js", "buttonwood/critters/wildlife-idles/animations.js", "buttonwood/critters/wildlife-idles/sprites.js", "buttonwood/environment.js", "buttonwood/extraction.js", "buttonwood/fey-art.js", "buttonwood/fog.js", "buttonwood/hud-art.js", "buttonwood/integration.txt", "buttonwood/inventory-art.js", "buttonwood/lunar-art.js", "buttonwood/meadow.js", "buttonwood/meteor-art.js", "buttonwood/palette.js", "buttonwood/sky.js", "buttonwood/ui.js", "buttonwood/wildlife.js", "buttonwood/winter-sky-data.js", "buttonwood/winter-sky.js", "buttonwood/workers.js", "extraction-network.js", "game-v10-liquid-fixes.txt?v=28", "game-v10-liquid.txt?v=44", "game-v13-liquid-visibility.txt?v=28", "game-v14-liquid-guarantee.txt?v=28", "game-v15-liquid-diagnostic.txt?v=28", "game-v17-liquid-tuning.txt?v=28", "game-v17-seedfix.txt?v=28", "game-v18-terraria-liquid.txt?v=28", "game-v19-liquid-flow.txt?v=28", "game-v20-liquid-surface.txt?v=28", "game-v21-liquid-render.txt?v=28", "game-v22-liquid-engine.txt?v=28", "game-v24-camera-bounce.txt?v=28", "game-v25-grid-toggle.txt?v=41", "game-v26-zoom-input.txt?v=28", "game-v27-miner-ai-rhythm.txt?v=44", "game-v28-resources-obsidian.txt?v=44", "game-v29-liquid-feel.txt?v=29", "game-v30-dev-panel.txt?v=30", "game-v31-obsidian-art.txt?v=31", "game-v32-art-direction.txt?v=41", "game-v39-pickaxe.txt?v=39", "game-v41-trees.txt?v=44", "game-v42-miner-ghosts.txt?v=43", "game-v44-industry-resources.txt?v=59", "game-v46-structure-art.txt?v=46", "game-v46-structures.txt?v=46", "game-v48-structures-ui.txt?v=48", "game-v49-pickaxes.txt?v=49", "game-v50-workshop-ui.txt?v=50", "game-v52-keyboard.txt?v=52", "game-v54-dev-resources.txt?v=54", "game-v55-workers.txt?v=55", "game-v56-settlement.txt?v=56", "game-v57-performance.txt?v=58", "game-v60-storehouses.txt?v=60", "game-v61-player-crafting.txt?v=61", "game-v62-sky.txt?v=62", "game-v64-compact-structures.txt?v=67", "game-v66-mobile-ui.txt?v=67", "game-v67-disclosures.txt?v=67", "game-v68-hotbar.txt?v=68", "game-v69-oil.txt?v=69", "game-v70-extraction.txt?v=70", "game-v71-wildlife.txt?v=71", "game-v72-terrain-fog.txt?v=72", "game-v73-critter-eggs.txt?v=73", "game-v74-meadow.txt?v=74", "game-v75-fey.txt?v=75", "game-v76-pause.txt?v=76", "game-v77-bells-resources.txt?v=77", "game-v77-minimal-hud.txt?v=77", "game-v78-inventory-nails.txt?v=78", "game-v79-inspector-crew.txt?v=79", "game-v8-part0.txt?v=41", "game-v8-part1.txt?v=44", "game-v8-part2.txt?v=42", "game-v8-part3.txt?v=42", "game-v80-winter-inspection.txt?v=80", "game-v81-moonfire.txt?v=81", "game-v82-moonfire-demo.txt?v=82", "game-v83-brimstone.txt?v=86", "game-v87-performance.txt?v=87"];
    for(const url of preloadV87)read(url).catch(()=>{});
    let core='';
    for(const url of coreParts)core+=await read(url);
    // Select the sample save before the core reads or registers autosaves.
    if(buttonwoodSample||moonfireDemo||soundDemo){
      const saveDeclaration="const SAVE_KEY='skyStack.save.v1';";
      if(!core.includes(saveDeclaration))throw new Error('Sample save declaration missing');
      core=core.replace(saveDeclaration,soundDemo?"const SAVE_KEY='tower.sound.demo.v1';":moonfireDemo?"const SAVE_KEY='tower.moonfire.survival-demo.v2';":"const SAVE_KEY='tower.buttonwood.sample.v1';");
    }
    const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='buttonwood/sample.css?v=67';document.head.append(sheet);
    (0,eval)(await read('biomes.js'));
    (0,eval)(await read('defense-core.js'));
    for(const path of ['palette.js','sky.js','workers.js','buildings.js','environment.js','ui.js','extraction.js','biomes.js','wildlife.js','fog.js']){
      (0,eval)(await read('buttonwood/'+path));
    }
    for(const path of ['winter-sky-data.js','winter-sky.js','animal-facts.js','critters/wildlife-idles/sprites.js','critters/wildlife-idles/animations.js','lunar-art.js','meadow.js','fey-art.js','hud-art.js','inventory-art.js','meteor-art.js']){(0,eval)(await read('buttonwood/'+path));}
    (0,eval)(await read('buttonwood/defense-art.js'));
    (0,eval)(await read('extraction-network.js'));
    if(buttonwoodSample&&new URLSearchParams(location.search).get('critters')==='42'){
      const names=['mouse','turtle','lizard'];
      window.ButtonwoodArt.concepts42=await Promise.all(names.map(name=>new Promise((resolve,reject)=>{
        const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Could not load '+name+' concept'));
        image.src='buttonwood/critters/concepts-42/'+name+'-42.png';
      })));
    }

    let liquid='';
    for(const url of liquidParts)liquid+=await read(url);

    let tail=await read(tailUrl);
    tail=tail.replace(/^\s*\}\);\s*/, '');

    const camera=await read(cameraUrl);
    const grid=await read(gridUrl);
    const zoom=await read(zoomUrl);
    const miner=await read(minerUrl);
    const resources=await read(resourceUrl);
    const liquidFeel=await read(liquidFeelUrl);
    const devPanel=await read(devPanelUrl);
    const obsidianArt=await read(obsidianArtUrl);
    const artDirection=await read(artDirectionUrl);
    const pickaxe=await read(pickaxeUrl);
    const trees=await read(treesUrl);
    const spirits=await read(spiritsUrl);
    const industry=await read(industryUrl)+'\n'+await read('game-v77-bells-resources.txt?v=77');
    const structureArt=await read(structureArtUrl);
    const structures=await read(structuresUrl);
    const structuresUi=await read('game-v48-structures-ui.txt?v=48');
    const pickaxes=await read('game-v49-pickaxes.txt?v=49');
    const workshopUi=await read('game-v50-workshop-ui.txt?v=50');
    const keyboard=await read('game-v52-keyboard.txt?v=52');
    const devResources=await read('game-v54-dev-resources.txt?v=54');
    const marker='restoreDynamicState(initialSave);';
    if(!tail.includes(marker))throw new Error('v28 insertion marker missing');
    tail=tail.replace(marker,camera+'\n'+grid+'\n'+zoom+'\n'+miner+'\n'+resources+'\n'+liquidFeel+'\n'+devPanel+'\n'+obsidianArt+'\n'+artDirection+'\n'+pickaxe+'\n'+trees+'\n'+spirits+'\n'+industry+'\n'+structureArt+'\n'+structures+'\n'+structuresUi+'\n'+pickaxes+'\n'+workshopUi+'\n'+keyboard+'\n'+marker);

    tail=tail.replace(marker,devResources+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v55-workers.txt?v=55'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v56-settlement.txt?v=56'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v57-performance.txt?v=58'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v60-storehouses.txt?v=60'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v61-player-crafting.txt?v=61'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v62-sky.txt?v=62'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v67-disclosures.txt?v=67'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v64-compact-structures.txt?v=67'))+'\n'+marker);
    tail=tail.replace(marker,(await read('buttonwood/integration.txt'))+'\n'+marker+'\nbuttonwoodBoot();');
    tail=tail.replace(marker,(await read('game-v66-mobile-ui.txt?v=67'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v68-hotbar.txt?v=68'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v69-oil.txt?v=69'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v70-extraction.txt?v=70'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v71-wildlife.txt?v=71'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v72-terrain-fog.txt?v=72'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v73-critter-eggs.txt?v=73'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v74-meadow.txt?v=74'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v75-fey.txt?v=75'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v76-pause.txt?v=76'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v77-minimal-hud.txt?v=77'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v78-inventory-nails.txt?v=78'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v79-inspector-crew.txt?v=79'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v80-winter-inspection.txt?v=80'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v81-moonfire.txt?v=81'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v82-moonfire-demo.txt?v=82'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v83-brimstone.txt?v=86'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v87-performance.txt?v=87'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v88-musical-feedback.txt'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v89-storm-score.txt?v=89'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v90-discoveries.txt?v=90'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v91-loose-building.txt?v=91'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v92-level-rewards.txt?v=92'))+'\n'+marker);
    tail=tail.replace(marker,(await read('game-v93-defense.txt?v=93'))+'\n'+marker);
    const src=core+'\n});\n'+liquid+'\n'+tail;
    (0,eval)(src);
  }catch(e){
    console.error('Tower of Babel failed to load',e);
    const el=document.getElementById('load');
    if(el)el.textContent='Game failed to load — refresh to retry';
  }
})();
})();
