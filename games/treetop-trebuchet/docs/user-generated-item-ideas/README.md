# User-generated item ideas

Source: Phil's shop brainstorming in this chat, October 21, 2026. These are the user's ideas, separate from the pre-existing assistant-generated catalog. Only the Guillotine and combined Counterweight presentation are implemented in this change. All other entries remain proposals, not functioning equipment or promised specifications.

## Player-facing categories

Foundation; Throwing arm; Frame; Counterweight; Sling; Sling cords; Axle; Release finger; Crank wheel; Launch trough.

Counterweight is one equipped item: weight + holder/straps + connection to the arm. Internally the existing ballast/material/mount IDs remain for physics and save compatibility. The old "basket" meant a holder for the heavy weight, not the animal's sling; the current renderer mostly depicts straps. User requested no separate holder/material/joint shopping. Preserve existing custom combinations until the player chooses another item. Foundation remains separate from Launch trough and can extend below/beyond it.

## Foundation

- Tree roots: real visible roots extending into the ground.
- Steel-bolted anchors.
- Climbing bolts: drilled-in climbing anchors.
- Bubble gum: sticks the frame to the ground, with elastic bounce under launch forces.
- Mistletoe: gently attracts the animal toward the launch rail, like a magnet. An explicit magical effect; exact force and activation are not yet specified.

## Crank wheel

- Clock: grants one player-activated slow-motion use per run. Everything slows except the left/right flight-control responsiveness/authority. Duration, activation UI, and slowdown factor are undecided. The mechanical clock wheel still winds/pays out with mechanism travel and stays still when paused.
- Windmill: wind physically assists the winding/launch transmission; no arbitrary velocity bonus.
- Water mill: water drives the wheel on launch/release, helping the transmission turn and pull.
- Mechanical gear.

## Frame

Iron; Egyptian pyramid; party hat; Christmas tree; house; Native American tipi/teepee.

## Sling (all the user's earlier "basket" ideas belong HERE)

- Fishing net.
- Woven basket.
- Basketball hoop/net: too-small animals can pass through the open bottom; appropriately sized animals can be supported, while animals too large for the opening cannot load. Size and contacts determine this rather than a hidden universal fit. Player can dunk the animal; proposed achievement name "Dunked" (tentative). "Swish" requires release from above and passage through without touching the net/hoop. Both are future achievements, not implemented.
- Trampoline basket / elastic-band sling: real elastic energy stored during loading/draw and released physically, adding punch. No free release impulse.

Every item has particular real dimensions; players can mix and match. Failed fits teach through physical behavior. Do not automatically resize the item or animal to make a combination succeed.

## Counterweight

- Existing boulder/rock remains suitable for the starter.
- Small log; big log (user prefers "log" to "trunk").
- Obsidian.
- Small tungsten cube; large cut tungsten cube.
- Moana's tear: preserve this exact supplied name. Glowing blue sphere; reduces the launched critter's gravity for the entire run. Explicit magic, not a claim about a real material.
- Pumpkin; banana; apple; "all the main fruit."
- Turtle; elephant; walrus.
- Guillotine: cable attached to blade; winding raises it, release lets gravity drop it and drive the throw. At the lower stop, a cartoon snake head separates, without blood or wound detail. Working item requested now; must suit the default 60 cm trebuchet.

Physical size and density determine mass. Research densities/specimen masses when implementing those items; no numerical fruit, animal, timber, obsidian or tungsten specifications have been asserted in this note.

Requested fruit expansion, provisionally enumerated by the assistant (not additional individually dictated ideas): orange, lemon, lime, grapefruit, mandarin, pear, peach, nectarine, plum, apricot, cherry, strawberry, blueberry, raspberry, blackberry, grape, watermelon, cantaloupe, honeydew, pineapple, mango, papaya, kiwi, coconut, avocado, pomegranate, fig, date and passion fruit, alongside the explicitly named apple, banana and pumpkin. Exact variants/sizes remain open.

## Throwing arm

- A literal arm, refined to a stiff gorilla-arm STATUE; hand holds the sling rope. The live monkey-arm idea was withdrawn.
- Magical staff with a gemstone at the end.
- Large flexible palm tree.
- Small stick bug.
- Bo staff.
- Flexible diving board.
- Giant ruler.
- Protractor: hole sits at the axle; shape and cord-attachment location need a physical layout.

The user considered snakes too weak for the arm and did not select a snake arm. Do not add human arms or operators.

## Sling cords

Existing braided cord; grass; horse hair; unicorn hair; steel chains; spaghetti/pasta; one long snake with its head at one end and tail at the other; electric eel.

## Axle

Eyeball; mechanical gear.

## Release finger

No new user idea yet. This is the remaining category without a proposed new item.

## Physics contract

For wind, water, flexible wood, gum and elastic slings, implement forces, contacts, compliance, stored energy and energy transfer in the solver, not cosmetic movement or launch-speed multipliers. Clock slow-motion and Moana's tear are intentionally magical simulation rules. Preserve loose critter loading, actual pose/momentum transfer and cancel/blur/modal no-launch behavior.

## Working Guillotine specification

Fixed-size compact item: 58 cm guide height above a 3.5 cm foot, 22 cm guide width; blade 17 cm wide by 10 cm high; 13 cm cable-drum radius; blade-centre travel from 12 cm to 50 cm above the support origin. Default 2,000 g mass is preserved on fitting, adjustable up to 5,000 g. Support adds 450 g to the frame. Price 180 Bells is an assistant-selected provisional balance value, not user-supplied canon.

The blade is a separate polygon body on a frame-relative prismatic guide. A passive GearJoint couples its translation to arm-axle rotation, representing a no-slip cable on the drum. Winding changes gravitational potential; release restores dynamic bodies with no launch impulse. Lower joint limit stops the blade. The cartoon gag is triggered by measured blade position and supplies no force. Item size stays fixed when fitted to a different/custom rig. Existing starter dimensions and saved custom maps are not migrated.
