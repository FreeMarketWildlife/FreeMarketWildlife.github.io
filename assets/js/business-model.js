// Shared by the game and Worker. Rankings are explainable matches, not income predictions.
export const LIMIT = 10;
const tree = (rows) => rows.map(([label, branches]) => ({label, children:branches.map(([label, leaves])=>({label,children:leaves.map(label=>({label,children:[]}))}))}));
export const SKILLS = tree([
 ['Writing',[['Storytelling',['Video scripts','Brand stories','Personal essays']],['Editing',['Proofreading','Website copy','Email newsletters']],['Research',['Interviews','Fact checking','Explaining complex ideas']]]],
 ['Organizing',[['Planning',['Project coordination','Event logistics','Content calendars']],['Administration',['Inbox management','Scheduling','Data entry']],['Systems',['Spreadsheets','Process documentation','Digital filing']]]],
 ['Making things',[['Crafting',['Sewing','Jewelry','Paper crafts']],['Building',['Woodworking','Furniture assembly','Set building']],['Designing',['Graphic design','Illustration','Product photography']]]],
 ['Fixing things',[['Home repairs',['Painting','Furniture repair','Basic maintenance']],['Technology help',['Computer setup','Phone setup','Troubleshooting']],['Mending',['Clothing repairs','Bicycle maintenance','Tool care']]]],
 ['Teaching',[['Tutoring',['Math tutoring','Reading support','Study skills']],['Coaching',['Practice plans','Giving feedback','Building confidence']],['Explaining',['Step-by-step guides','Software lessons','Group workshops']]]],
 ['Talking to people',[['Listening',['Customer support','Client interviews','Community moderation']],['Selling',['Outreach','Presentations','Following up']],['Connecting',['Networking','Hosting events','Building partnerships']]]],
 ['Computers',[['Websites',['Website setup','Website maintenance','No-code tools']],['Automation',['Forms and workflows','Spreadsheet formulas','Simple scripts']],['Technical support',['Software setup','Digital organization','Remote tech help']]]],
 ['Visual art',[['Design',['Logos','Social graphics','Print layouts']],['Drawing',['Portraits','Pixel art','Custom illustrations']],['Photography',['Product photos','Event photos','Photo editing']]]],
 ['Video',[['Video editing',['Short-form editing','Subtitles','Podcast clips']],['Filming',['Phone filmmaking','Product videos','Event coverage']],['Production',['Storyboarding','Lighting','Audio cleanup']]]],
 ['Music',[['Performing',['Singing','Playing an instrument','Live sound']],['Recording',['Audio editing','Podcast editing','Mixing']],['Songwriting',['Lyrics','Arranging','Music notation']]]],
 ['Working outdoors',[['Gardening',['Plant care','Weeding','Container gardens']],['Yard care',['Lawn care','Seasonal cleanup','Leaf removal']],['Outdoor work',['Basic landscaping','Garden planning','Tool maintenance']]]],
 ['Caring for animals',[['Pet care',['Dog walking','Pet sitting','Feeding routines']],['Animal handling',['Basic training practice','Enrichment activities','Pet photography']],['Care planning',['Care instructions','Appointment coordination','Pet supply organization']]]],
 ['Cooking',[['Baking',['Bread baking','Custom cookies','Recipe testing']],['Food preparation',['Meal planning','Batch cooking','Food photography']],['Kitchen skills',['Recipe writing','Kitchen organization','Cooking lessons']]]],
 ['Working with numbers',[['Bookkeeping',['Expense categorization','Invoice tracking','Bank reconciliation']],['Spreadsheets',['Data cleanup','Budget templates','Reporting']],['Analysis',['Comparing prices','Inventory tracking','Finding patterns']]]],
 ['Cleaning',[['Home care',['Deep cleaning','Move-out cleaning','Laundry']],['Organizing spaces',['Decluttering','Closet organization','Home office setup']],['Detail work',['Window cleaning','Car detailing','Equipment cleaning']]]]
]);
export const INTERESTS = tree([
 ['Music',[['Artists',['Independent musicians','Local bands','Artist releases']],['Making music',['Songwriting','Recording','Performing']],['Music culture',['Live events','Discovering artists','Music education']]]],
 ['Animals',[['Pets',['Dogs','Cats','Small pets']],['Animal care',['Pet enrichment','Walking dogs','Helping pet owners']],['Wildlife',['Birdwatching','Conservation','Nature photography']]]],
 ['Art & design',[['Visual art',['Drawing','Illustration','Pixel art']],['Design',['Branding','Typography','Interior styling']],['Creative work',['Craft fairs','Handmade gifts','Photography']]]],
 ['Technology',[['Web',['Small business websites','Online shops','No-code tools']],['Practical tech',['Automation','Helping people with computers','Digital organization']],['Media tech',['Video tools','Audio tools','Creative software']]]],
 ['Helping people',[['Learning',['Tutoring','Teaching adults','Helping students']],['Everyday support',['Helping older adults','Busy families','Community groups']],['Connection',['Listening','Bringing people together','Customer service']]]],
 ['Food',[['Home cooking',['Meal planning','Recipe development','Cooking lessons']],['Baking',['Bread','Cookies','Celebration treats']],['Food culture',['Local restaurants','Food photography','Food writing']]]],
 ['Outdoors',[['Gardens',['Growing food','Houseplants','Native plants']],['Outdoor spaces',['Yard care','Garden design','Seasonal cleanup']],['Nature',['Hiking','Camping','Birdwatching']]]],
 ['Stories',[['Words',['Writing','Reading','Newsletters']],['Screen stories',['Film','YouTube','Short videos']],['People',['Interviews','Local history','Personal stories']]]],
 ['Business',[['Small businesses',['Local shops','Independent professionals','Solo founders']],['Operations',['Organizing','Spreadsheets','Making systems']],['Marketing',['Social media','Email newsletters','Finding customers']]]],
 ['Games',[['Game worlds',['Pixel art','Tabletop games','Worldbuilding']],['Game communities',['Community moderation','Gaming events','Video creators']],['Making games',['Game design','Writing for games','Game tutorials']]]],
 ['Homes',[['Living spaces',['Decluttering','Interior styling','Home organization']],['Home projects',['Furniture','DIY','Repairs']],['Home care',['Cleaning','Moving','Houseplants']]]],
 ['Learning',[['Subjects',['Math','Languages','Science']],['How people learn',['Study skills','Workshops','Tutorials']],['Sharing knowledge',['Writing guides','Teaching children','Teaching adults']]]],
 ['Events',[['Gatherings',['Community events','Weddings','Small celebrations']],['Behind the scenes',['Planning','Logistics','Decorating']],['Capturing events',['Photography','Videography','Live sound']]]],
 ['Fitness & movement',[['Activities',['Walking','Cycling','Dance']],['Creative movement',['Sports photography','Fitness videos','Dance events']],['Community',['Local clubs','Outdoor groups','Team events']]]]
]);
export function allLabels(nodes){return nodes.flatMap(n=>[n.label,...allLabels(n.children)]);}
// Generated from the repository-native, reviewed catalog; see docs/business-catalog-contract.md.
export {BUSINESSES} from './business-catalog.js';
import {BUSINESSES} from './business-catalog.js';
export function cleanSelections(values){
 if(!Array.isArray(values))return [];
 return [...new Set(values.filter(v=>typeof v==='string').map(v=>v.trim().replace(/\s+/g,' ')).filter(v=>v && v.length<=60 && !/[\x00-\x1f\x7f]/.test(v)))].slice(0,LIMIT);
}

const knownSkills=new Set(allLabels(SKILLS)), knownInterests=new Set(allLabels(INTERESTS));
const depths=nodes=>nodes.flatMap(n=>[[n.label,n.children.length?1:3],...n.children.flatMap(c=>[[c.label,2],...c.children.map(l=>[l.label,3])])]);
const skillDepth=new Map(depths(SKILLS)),interestDepth=new Map(depths(INTERESTS));
const exact=(answers,allowed)=>answers.filter(label=>allowed.includes(label));
export function recommend(skills,interests){
 skills=cleanSelections(skills).filter(v=>knownSkills.has(v));
 interests=cleanSelections(interests).filter(v=>knownInterests.has(v));
 const eligible=BUSINESSES.flatMap(b=>{
  const skillMatches=exact(skills,b.skills),interestMatches=exact(interests,b.interests);
  if(!skillMatches.length||!interestMatches.length)return [];
  if((b.allInterests||[]).some(group=>!exact(interests,group).length))return [];
  const requiredMatches=(b.allInterests||[]).flatMap(group=>exact(interests,group));
  const matchedInterests=[...new Set([...interestMatches,...requiredMatches])].sort();
  const score=Math.max(...skillMatches.map(v=>skillDepth.get(v))) * 4
   +Math.max(...matchedInterests.map(v=>interestDepth.get(v))) * 3
   +Math.min(skillMatches.length,3)+Math.min(matchedInterests.length,3);
  return [{...b,skillMatches:skillMatches.sort(),interestMatches:matchedInterests,score}];
 }).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id,'en'));
 const selected=[];
 while(selected.length<3&&eligible.length){
  // Prefer a different daily-work family among candidates of comparable fit.
  const floor=eligible[0].score-4;
  const index=eligible.findIndex(b=>b.score>=floor&&!selected.some(s=>s.family===b.family));
  selected.push(eligible.splice(index<0?0:index,1)[0]);
 }
 return selected;
}
