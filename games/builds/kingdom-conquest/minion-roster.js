/* Stable species keys are shared by gameplay, the GLB pipeline and the gallery.
 * Heights are metres, excluding weapons and spell effects. */
const MINION_SPECIES = [
 ['mouse','Mouse','melee','sword','#9b7854','#af4e39',.30,285,14,48,1.15,'round ears, pointed whiskered muzzle, long thin pink tail','small sword and round wooden buckler'],
 ['shrew','Shrew','melee','spear','#776556','#486d8b',.28,260,15,72,1.25,'very long pointed snout, tiny ears, thin tail','long wooden spear with steel point'],
 ['hedgehog','Hedgehog','melee','mace','#9b8059','#57713d',.32,365,18,50,1.55,'dense crown of short brown spines, cream face, small round ears','spiked mace and kite shield'],
 ['mole','Mole','melee','pickaxe','#504943','#8e6744',.29,310,19,48,1.45,'black velvety fur, tiny eyes, wide digging paws, pink nose','steel pickaxe and leather mining cap with brass goggles'],
 ['vole','Vole','melee','halberd','#9a7251','#9d4939',.27,285,16,78,1.4,'short blunt muzzle, small round ears, short thin tail','wooden halberd with silver axe head'],
 ['box-turtle','Box Turtle','melee','shield','#947a3d','#557442',.34,440,10,44,1.7,'domed brown shell with golden geometric scutes, beaked face, squat legs','large wooden oval shield'],
 ['chipmunk','Chipmunk','ranged','bow','#a17c4b','#65783d',.30,205,16,245,1.3,'dark and cream stripes across face and back, fluffy upright tail','wooden shortbow and quiver'],
 ['red-squirrel','Red Squirrel','ranged','sling','#c56c39','#a04936',.34,210,18,225,1.4,'bright russet fur, tufted pointed ears, huge bushy curled tail','leather sling holding a round stone'],
 ['pika','Pika','ranged','crossbow','#a58b61','#476581',.26,225,22,265,1.65,'round ears, blunt rabbitlike muzzle, no visible long tail','small wooden crossbow'],
 ['jerboa','Jerboa','ranged','javelin','#c8a16d','#ae5140',.32,190,23,250,1.65,'very long rabbit ears, long hind feet, thin long tail ending in dark tuft','bundle of small javelins and one throwing spear'],
 ['gecko','Gecko','ranged','blowpipe','#61a88a','#79639b',.28,200,12,235,1.05,'turquoise green spotted skin, very large eyes, splayed toes, thick curved tail','thin bamboo blowpipe'],
 ['sparrow','Sparrow','ranged','bow','#89725a','#63723e',.26,185,16,255,1.25,'brown and cream feathers, small pointed beak, folded wings and short feather tail','tiny shortbow and quiver'],
 ['tree-frog','Tree Frog','mage','water','#76ad49','#4e80a2',.30,190,19,235,1.5,'bright green skin, orange red eyes, white throat and splayed toe pads','wooden staff with swirling blue water orb'],
 ['newt','Newt','mage','fire','#d37d3a','#68504b',.30,185,24,240,1.8,'orange amphibian skin, long tapered tail, small rounded face','short fire wand with orange flame'],
 ['dormouse','Dormouse','mage','heal','#a58b63','#ddd5b2',.28,215,12,220,1.55,'soft golden brown fur, large round pink ears, fluffy bushy tail','healing staff with green leaves and golden crystal'],
 ['pygmy-owl','Pygmy Owl','mage','air','#8f7c61','#716189',.29,185,18,260,1.45,'round feathered head, huge golden eyes, little beak, folded wings','rolled parchment scroll and slender air staff with pale blue orb'],
 ['chameleon','Chameleon','mage','illusion','#69a261','#76559b',.31,195,17,245,1.5,'raised head crest, bulging eyes, green turquoise scales, tightly spiral curled tail','purple illusion wand with violet orb'],
 ['toad','Toad','mage','earth','#9b8348','#586f3e',.33,290,27,215,1.9,'broad squat body, bumpy golden brown skin, wide mouth, very short legs','gnarled earth staff with amber crystal']
].map(([id,name,role,weapon,fur,cloth,height,hp,damage,range,cooldown,silhouette,gear])=>({id,name,role,weapon,fur,cloth,height,hp,damage,range,cooldown,silhouette,gear,model:`assets/minions/${id}.glb`,projectile:role==='mage'?weapon:weapon==='sling'?'stone':weapon==='javelin'?'javelin':weapon==='blowpipe'?'dart':weapon==='crossbow'?'bolt':'arrow'}));
if(typeof module!=='undefined')module.exports=MINION_SPECIES;
