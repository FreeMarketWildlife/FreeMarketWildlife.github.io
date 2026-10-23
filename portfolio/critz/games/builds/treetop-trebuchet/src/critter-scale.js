import {CRITTERS} from './build-catalog.js?v=49';

/** Comparison references, not new physics inputs or world canon.
 * length/height are the game's local envelope axes in metres; height is the
 * catalogue's historical `width` field. Biological axes/statistics stay separate.
 * Source names are retained without claiming a current taxonomic revision. */
const references={
 mouse:{representativeName:'Wood mouse / long-tailed field mouse',sourceScientificName:'Apodemus sylvaticus',
  sourceURL:'https://mammal.org.uk/british-mammals/wood-mouse',
  notes:'The game envelope includes the tail. The source separates head-and-body length from tail length; its body length alone is not the game length.',
  biological:{measurements:[
   {axis:'head-body',label:'Head + body',kind:'range',minMeters:.081,maxMeters:.103},
   {axis:'tail',label:'Tail',kind:'range',minMeters:.071,maxMeters:.095}],
   mass:{kind:'range',minGrams:13,maxGrams:27,scope:'Published wood-mouse guide'}}},
 frog:{representativeName:"White's tree frog",sourceScientificName:'Litoria caerulea (source name)',
  sourceURL:'https://nationalzoo.si.edu/animals/whites-tree-frog',
  notes:'A larger tree-frog reference fits the existing 8 cm example. Body length excludes extended legs. The mass study reports mean and standard deviation, not a species-wide range.',
  biological:{measurements:[
   {axis:'reported-body-length',label:'Reported body length',kind:'range',minMeters:.07,maxMeters:.115},
   {axis:'snout-vent',label:'Snout–vent length, study mean ± SD',kind:'study-mean-sd',meanMeters:.0695,sdMeters:.0095,sampleSize:5,
    sourceURL:'https://journals.biologists.com/jeb/article/215/22/3965/11129/Self-cleaning-in-tree-frog-toe-pads-a-mechanism'}],
   mass:{kind:'study-mean-sd',meanGrams:29.095,sdGrams:9.635,sampleSize:5,scope:'Five experimental White\'s tree frogs; mean ± SD, not minimum/maximum',
    sourceURL:'https://journals.biologists.com/jeb/article/215/22/3965/11129/Self-cleaning-in-tree-frog-toe-pads-a-mechanism'}}},
 chipmunk:{representativeName:'Eastern chipmunk',sourceScientificName:'Tamias striatus',
  sourceURL:'https://mdc.mo.gov/discover-nature/field-guide/eastern-chipmunk',
  notes:'The source explicitly includes the tail in total length. The drawn tail is folded, so the game envelope is not a straightened anatomical measurement.',
  biological:{measurements:[
   {axis:'total-length',label:'Total length, including tail',kind:'range',minMeters:8*.0254,maxMeters:12*.0254},
   {axis:'tail',label:'Tail',kind:'range',minMeters:2.5*.0254,maxMeters:4.5*.0254}],
   mass:{kind:'range',minGrams:2*28.349523125,maxGrams:5*28.349523125,scope:'Published 2–5 oz; converted to grams'}}},
 squirrel:{representativeName:'Eastern gray squirrel',sourceScientificName:'Sciurus carolinensis',
  sourceURL:'https://animaldiversity.org/accounts/Sciurus_carolinensis/',
  notes:'Reference length includes the tail; the illustration curls it upward. Game height includes that pose and is not shoulder height.',
  biological:{measurements:[
   {axis:'total-length',label:'Total length, including tail',kind:'range',minMeters:.38,maxMeters:.525},
   {axis:'tail',label:'Tail',kind:'range',minMeters:.15,maxMeters:.25}],
   mass:{kind:'range',minGrams:338,maxGrams:750,scope:'Published species range'}}},
 rabbit:{representativeName:'European rabbit',sourceScientificName:'Oryctolagus cuniculus',
  sourceURL:'https://animaldiversity.org/accounts/Oryctolagus_cuniculus/',
  notes:'The source gives wild-rabbit length and mass. Its length convention is not expanded into separate tail measurements; the game height also includes ears and folded limbs.',
  biological:{measurements:[
   {axis:'reported-body-length',label:'Reported wild-rabbit length',kind:'range',minMeters:.38,maxMeters:.50}],
   mass:{kind:'range',minGrams:1500,maxGrams:2500,scope:'Wild European rabbits; domestic breeds vary'}}},
 armadillo:{representativeName:'Nine-banded armadillo',sourceScientificName:'Dasypus novemcinctus',
  sourceURL:'https://www.depts.ttu.edu/nsrl/mammals-of-texas-online-edition/Accounts_Cingulata/Dasypus_novemcinctus.php',
  notes:'Texas Tech distinguishes total length and tail. Its means are not minimum sizes; the game uses a compact illustrated tail.',
  biological:{measurements:[
   {axis:'total-length',label:'Total length, published mean',kind:'mean',meanMeters:.760},
   {axis:'tail',label:'Tail, published mean',kind:'mean',meanMeters:.345}],
   mass:{kind:'range',minGrams:4000,maxGrams:8000,scope:'Adult sex ranges combined: males 5–8 kg, females 4–6 kg'}}},
 fox:{representativeName:'Red fox',sourceScientificName:'Vulpes vulpes',
  sourceURL:'https://animaldiversity.org/accounts/Vulpes_vulpes/',
  notes:'Head-and-body and tail are separate source axes. The game is a crouched/flight envelope with a compact tail, not an assertion of standing shoulder height.',
  biological:{measurements:[
   {axis:'head-body',label:'Head + body',kind:'range',minMeters:.455,maxMeters:.900},
   {axis:'tail',label:'Tail',kind:'range',minMeters:.300,maxMeters:.555}],
   mass:{kind:'range',minGrams:3000,maxGrams:14000,scope:'Published species range; population and sex vary'}}},
 tiger:{representativeName:'Tiger, adult male reference',sourceScientificName:'Panthera tigris',
  sourceURL:'https://ielc.libguides.com/sdzg/factsheets/tiger/characteristics',
  notes:'The source separates head-and-body length, tail and shoulder measurement. The game envelope is compact; do not present its 2.6 m as a measured straightened head-to-tail specimen.',
  biological:{measurements:[
   {axis:'head-body',label:'Head + body, male',kind:'range',minMeters:1.89,maxMeters:3.00},
   {axis:'tail',label:'Tail',kind:'range',minMeters:.72,maxMeters:1.09},
   {axis:'shoulder-height',label:'Shoulder height',kind:'range',minMeters:.80,maxMeters:1.00}],
   mass:{kind:'range',minGrams:100000,maxGrams:261000,scope:'Wild adult males across living subspecies; zoo males can reach 325 kg'}}},
 bear:{representativeName:'Brown bear',sourceScientificName:'Ursus arctos',
  sourceURL:'https://animaldiversity.org/accounts/Ursus_arctos/',
  notes:'Head-to-rump length, tail and shoulder height are distinct. The game uses a horizontal envelope; upright rearing height is not its length or height.',
  biological:{measurements:[
   {axis:'head-rump',label:'Head to rump',kind:'range',minMeters:1,maxMeters:2.8},
   {axis:'tail',label:'Tail',kind:'range',minMeters:.065,maxMeters:.210},
   {axis:'shoulder-height',label:'Shoulder height',kind:'range',minMeters:.90,maxMeters:1.50}],
   mass:{kind:'range',minGrams:80000,maxGrams:600000,scope:'Published species range; some individuals exceed the listed upper endpoint'}}},
 elephant:{representativeName:'Asian elephant, adult male reference',sourceScientificName:'Elephas maximus',
  sourceURL:'https://animaldiversity.org/accounts/Elephas_maximus/',
  notes:'The existing 6 m / 2.6 m / 5 t example is coherent with an adult male Asian-elephant reference. Body length and standing height are separate; no stretched-trunk or tail measurement is inferred.',
  biological:{measurements:[
   {axis:'body-length',label:'Body length',kind:'range',minMeters:5.5,maxMeters:6.4},
   {axis:'standing-height',label:'Standing height, male',kind:'range',minMeters:2.4,maxMeters:3.0}],
   mass:{kind:'range',minGrams:3500000,maxGrams:6000000,scope:'Adult males; females have different height and mass ranges'}}},
 whale:{representativeName:'Blue whale',sourceScientificName:'Balaenoptera musculus',
  sourceURL:'https://www.fisheries.noaa.gov/species/blue-whale',
  notes:'NOAA quick facts provide upper bounds, not an adult population range or mean. The 24 m / 100 t game example is not claimed to be the maximum. Game height is a body/flipper envelope, not a published standing-height measurement.',
  biological:{measurements:[
   {axis:'total-length',label:'Whole-animal length, NOAA upper bound',kind:'upper-bound',maxMeters:110*.3048}],
   mass:{kind:'upper-bound',maxGrams:330000*453.59237,scope:'NOAA quick-fact upper bound; the text notes larger Antarctic individuals, so this is not an absolute biological limit'}}},
};
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
export const CRITTER_SCALE=freeze(CRITTERS.map(animal=>{
 const reference=references[animal.id];if(!reference)throw Error(`Missing scale reference: ${animal.id}`);
 return{...reference,id:animal.id,displayName:animal.name,length:animal.length,height:animal.width,grams:animal.grams,measureLabel:'Game envelope · length × height'};
}));
const byId=new Map(CRITTER_SCALE.map(record=>[record.id,record]));
export function critterScale(id){const record=byId.get(id);if(!record)throw Error(`Unknown volunteer scale: ${id}`);return record;}
