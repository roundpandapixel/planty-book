// Known houseplant species and their care, used to fill a plant's Watering, Sunlight and Soil notes.
// sp(id, common name, scientific name, [other names], [watering], [sunlight], [soil])
const SPECIES = (() => {
  const list = [];
  const sp = (id, name, sci, aka, water, sun, dirt) => list.push({ id, name, sci, aka, water, sun, dirt });

  // Shared bits
  const DRAIN = "Water until it runs out the bottom, then empty the saucer";
  const AROID = ["Chunky aroid mix: potting soil, orchid bark and perlite", "Pot with drainage holes"];
  const AIRY = ["Well-draining potting mix with extra perlite", "Pot with drainage holes"];
  const SUCC = ["Cactus / succulent mix (add extra perlite or grit)", "Terracotta pot with drainage holes helps it dry"];
  const MOIST = ["Rich, moisture-holding mix (peat or coco coir with some perlite)", "Pot with drainage holes"];
  const EPI = ["Airy mix: potting soil, orchid bark and perlite", "Likes to be a little snug in its pot"];
  const CALATHEA_WATER = ["Keep evenly moist but never soggy", "Use filtered, distilled or rain water (tap water browns the edges)", "Loves humidity: group plants or use a humidifier"];
  const CALATHEA_SUN = ["Medium to bright indirect light", "No direct sun: it fades and crisps the leaves"];

  // ---- Monstera, Pothos, Philodendron ----
  // kind(...) = sp(...) with a shared care template; `add` puts a kind's own notes first.
  const care = (water, sun, dirt) => ({ water, sun, dirt });
  const kind = (id, name, sci, aka, c, add = {}) =>
    sp(id, name, sci, aka, [...(add.water || []), ...c.water], [...(add.sun || []), ...c.sun], [c.dirt[0], ...(add.dirt || []), ...c.dirt.slice(1)]);
  const PALE = "The pale parts brown easily if the soil stays wet";

  const MON_BIG = care(
    ["Water when the top 2 in. of soil is dry: about every 7-10 days in spring and summer, every 10-14 days in winter",
     DRAIN,
     "Likes humidity of 50% or more; wipe the leaves now and then so they can breathe",
     "Tap water is usually fine; if the leaf tips brown, use filtered or rain water",
     "Yellowing leaves usually mean too much water; crispy edges mean too dry or too little humidity"],
    ["Bright, indirect light", "Tolerates medium light but grows fewer splits", "Avoid harsh afternoon sun"],
    ["Chunky aroid mix: 1 part potting soil, 1 part orchid bark, 1 part perlite (a handful of charcoal is a bonus)",
     "Pot with drainage holes, only 1-2 in. wider than the roots", "Repot every 1-2 years in spring. A moss pole gives bigger leaves as it climbs"]);
  const MON_VAR = care(
    ["Water when the top 2-3 in. of soil is dry: about every 8-12 days in summer, every 12-18 days in winter",
     PALE,
     DRAIN,
     "Variegated plants have less chlorophyll, so they use less water: when unsure, wait a day",
     "Likes humidity of 50% or more"],
    ["Bright, indirect light: more than a green Monstera", "A little gentle morning sun is fine", "Too little light and it grows mostly-green leaves"],
    ["Airy aroid mix: 1 part potting soil, 1 part orchid bark, 1-2 parts perlite or pumice",
     "Variegated plants grow slowly and rot faster in wet soil: use a snug pot, not an oversized one",
     "Pot with drainage holes; give it a moss pole to climb"]);
  const MON_VINE = care(
    ["Water when the top 1 in. of soil is dry: about every 5-7 days in summer, every 7-10 days in winter",
     "Thin leaves like steady, light moisture, but never soggy soil",
     DRAIN,
     "Likes humidity of 60% or more"],
    ["Medium to bright indirect light", "Avoid direct sun"],
    ["Medium-chunky aroid mix: 2 parts potting soil, 1 part orchid bark, 1 part perlite",
     "Thin leaves like soil that holds a little more moisture than a big Monstera's mix",
     "Pot with drainage holes; give it a pole or plank to climb, or let it trail"]);
  const POTHOS = care(
    ["Water when the top 2 in. of soil is dry: about every 7-10 days, every 10-14 days in winter",
     "Drooping leaves mean it's thirsty and it perks up within hours; yellow leaves mean too much water",
     DRAIN,
     "Forgiving: better to water a little late than too often"],
    ["Low to bright indirect light", "Grows fastest in bright, indirect light", "Avoid harsh direct sun"],
    ["Chunky aroid mix: 1 part potting soil, 1 part orchid bark, 1 part perlite", "Forgiving, but it grows best and rots least in a chunky, fast-draining mix", "Pot with drainage holes; repot only when the roots fill the pot", "Let it trail, or train it up a pole"]);
  const POTHOS_VAR = care(
    ["Water when the top 2 in. of soil is dry: about every 7-10 days, every 10-14 days in winter",
     "Drooping leaves mean it's thirsty and it perks up within hours; yellow leaves mean too much water",
     DRAIN,
     "Variegated types use a little less water than green ones"],
    ["Bright, indirect light keeps the variegation", "In low light it slows down and turns greener", "Avoid harsh direct sun"],
    ["Chunky aroid mix: 1 part potting soil, 1 part orchid bark, 1 part perlite", "Variegated pothos grow more slowly than green ones: don't oversize the pot", "Pot with drainage holes; repot only when the roots fill the pot", "Let it trail, or train it up a pole"]);
  // Epipremnum pinnatum types (Cebu Blue, Baltic Blue...): the same chunky mix, and they split their leaves on a pole
  const POTHOS_PIN = care(POTHOS.water, POTHOS.sun,
    ["Chunky aroid mix: 1 part potting soil, 1 part orchid bark, 1 part perlite", "Pot with drainage holes"]);
  const POTHOS_PIN_VAR = care(POTHOS_VAR.water, POTHOS_VAR.sun,
    ["Chunky aroid mix: 1 part potting soil, 1 part orchid bark, 1 part perlite", "Variegated types grow slowly: don't oversize the pot", "Pot with drainage holes"]);
  const SCIND = care(
    ["Let the top 2 in. of soil dry out: about every 10-14 days, every 14-21 days in winter",
     "Curling leaves mean it's thirsty; yellowing means too wet",
     DRAIN,
     "Thick leaves store water, so underwater rather than overwater"],
    ["Medium to bright indirect light", "Avoid direct sun"],
    ["Gritty aroid mix: 1 part potting soil, 1 part orchid bark, 1 part perlite",
     "A slow grower that rots if kept wet: use a snug pot with drainage holes (terracotta helps)",
     "Let it trail, or give it a pole to climb"]);
  const PH_VINE = care(
    ["Water when the top 1-2 in. of soil is dry: about every 7-10 days, every 10-14 days in winter",
     DRAIN,
     "Droopy, curling leaves mean thirsty; likes humidity of 40-60%",
     "Tap water is fine for most; let it sit overnight if yours is heavily treated"],
    ["Medium to bright indirect light", "Tolerates low light, with smaller leaves"],
    ["Well-draining mix: 2 parts potting soil, 1 part perlite, 1 part orchid bark", "Forgiving", "Pot with drainage holes",
     "Let it trail, or give it a pole to climb"]);
  const PH_CLIMB = care(
    ["Water when the top 2 in. of soil is dry: about every 7-10 days in summer, every 10-14 days in winter",
     DRAIN,
     "Likes humidity of 50% or more",
     "Keep a moss pole slightly damp so its aerial roots grab on"],
    ["Bright, indirect light", "Avoid harsh direct sun"],
    ["Chunky aroid mix: 1 part potting soil, 1 part orchid bark, 1 part perlite, plus a handful of charcoal",
     "Pot with drainage holes; a snug pot dries faster and avoids rot", "Give it a moss pole: leaves grow bigger as it climbs"]);
  const PH_SELF = care(
    ["Water when the top 2 in. of soil is dry: about every 7-10 days in summer, every 10-14 days in winter",
     DRAIN,
     "A heavy drinker in summer when root-bound: check more often",
     "Water the soil, not the centre of the plant"],
    ["Medium to bright indirect light", "Avoid harsh direct sun"],
    ["Sturdy aroid mix: 2 parts potting soil, 1 part orchid bark, 1 part perlite",
     "A heavy feeder that dries fast when root-bound: repot yearly into a pot only 2 in. wider",
     "Pot with drainage holes; it grows upright, so no pole is needed"]);
  const PH_VAR = care(
    ["Water when the top 2 in. of soil is dry: about every 8-12 days in summer, every 12-18 days in winter",
     PALE,
     DRAIN,
     "Variegated leaves use less water: when unsure, wait a day"],
    ["Bright, indirect light keeps the variegation", "A little gentle morning sun is fine"],
    ["Airy aroid mix: 1 part potting soil, 1 part orchid bark, 1-2 parts perlite",
     "Variegated plants grow slowly and rot faster in wet soil: use a snug pot",
     "Pot with drainage holes; if it grows all-green leaves, cut back to the last variegated one"]);
  const VELVET = ["Keep lightly moist: water when the top 1 in. of soil is dry, about every 4-6 days in summer, every 7-10 days in winter",
    "Never let it dry out completely, and never let it sit soggy",
    "Likes humidity of 60% or more: a humidifier or pebble tray helps",
    "Water the soil, not the leaves: velvet leaves spot and rot when wet"];
  const VELVET_SUN = ["Medium to bright indirect light", "No direct sun: the velvet leaves scorch"];
  const VELVET_MIX = "Airy but moisture-holding mix: 1 part potting soil or coco coir, 2 parts orchid bark, 1 part perlite, plus a handful of sphagnum moss";
  const PH_VELVET = care(VELVET, VELVET_SUN,
    [VELVET_MIX, "Roots need air as well as moisture: never use dense soil", "Pot with drainage holes; give it a moss pole to climb"]);
  const PH_CRAWL = care(VELVET, VELVET_SUN,
    [VELVET_MIX, "Use a wide, shallow pot: it crawls along the surface", "Keep the thick stem lying on top of the soil, with only the roots buried"]);
  const THAUM = care(
    ["Water when the top 2 in. of soil is dry: about every 7-10 days in summer, every 12-14 days in winter",
     DRAIN,
     "A large plant: it drinks a lot in summer and little in winter",
     "Likes humidity of 40-60%"],
    ["Bright light; some direct sun is fine"],
    ["Rich, well-draining mix: 2 parts potting soil, 1 part perlite, 1 part orchid or pine bark",
     "Big, heavy plant: use a wide, sturdy pot with drainage holes", "Repot every 2 years; give it room to spread"]);

  // Monstera
  kind("monstera-deliciosa", "Monstera", "Monstera deliciosa", ["swiss cheese plant", "split-leaf philodendron", "monstera deliciosa"], MON_BIG);
  kind("monstera-borsigiana", "Monstera Borsigiana", "Monstera deliciosa 'Borsigiana'", ["borsigiana", "monstera"], MON_BIG,
       { dirt: ["Smaller, faster-climbing form of Monstera deliciosa"] });
  kind("monstera-thai-constellation", "Monstera Thai Constellation", "Monstera deliciosa 'Thai Constellation'", ["thai con", "thai constellation", "variegated monstera"], MON_VAR,
       { sun: ["Its cream speckles are stable: they won't revert to green"] });
  kind("monstera-albo", "Monstera Albo", "Monstera deliciosa 'Albo Variegata'", ["albo", "albo variegata", "borsigiana albo", "variegated monstera", "half moon"], MON_VAR,
       { sun: ["Its white variegation is unstable: cut back to a variegated node if it reverts"] });
  kind("monstera-aurea", "Monstera Aurea", "Monstera deliciosa 'Aurea'", ["aurea", "marmorata", "yellow monstera", "variegated monstera"], MON_VAR);
  kind("monstera-mint", "Monstera Mint", "Monstera deliciosa 'Mint'", ["mint", "variegated monstera"], MON_VAR);
  kind("monstera-adansonii", "Swiss Cheese Vine", "Monstera adansonii", ["monkey mask", "adansonii", "monstera adansonii"], MON_VINE);
  kind("monstera-adansonii-laniata", "Monstera Adansonii Laniata", "Monstera adansonii var. laniata", ["laniata", "adansonii"], MON_VINE,
       { dirt: ["Bigger leaves than the common adansonii once it climbs"] });
  kind("monstera-adansonii-variegated", "Variegated Adansonii", "Monstera adansonii 'Variegata'", ["variegated adansonii", "adansonii albo", "archipelago"], MON_VINE,
       { water: [PALE], sun: ["Needs brighter indirect light than a green adansonii"] });
  kind("monstera-obliqua", "Monstera Obliqua", "Monstera obliqua", ["obliqua"], MON_VINE,
       { water: ["Paper-thin leaves: never let it dry out", "Needs high humidity (70%+): a cabinet or terrarium is best"],
         dirt: ["Very airy mix with long-fibre sphagnum moss: its paper-thin leaves need steady moisture and air at the roots",
                "Very rare: many plants sold as obliqua are adansonii"] });
  kind("monstera-acuminata", "Monstera Acuminata", "Monstera acuminata", ["acuminata"], MON_VINE);
  kind("monstera-dubia", "Monstera Dubia", "Monstera dubia", ["dubia", "shingle plant"], MON_VINE,
       { dirt: ["Young leaves 'shingle' flat against a plank or board"] });
  kind("monstera-siltepecana", "Silver Monstera", "Monstera siltepecana", ["siltepecana", "silver monstera"], MON_VINE,
       { dirt: ["Young silver leaves shingle up a plank; adult leaves split"] });
  kind("monstera-standleyana", "Monstera Standleyana", "Monstera standleyana", ["standleyana", "philodendron cobra", "five holes plant", "standleyana albo", "standleyana aurea"], MON_VINE,
       { sun: ["Variegated kinds need brighter indirect light"] });
  kind("monstera-peru", "Monstera Peru", "Monstera sp. 'Peru' (M. karstenianum)", ["peru", "karstenianum"], MON_VINE,
       { water: ["Thick, leathery leaves: it handles drying out better than most"] });
  kind("monstera-pinnatipartita", "Monstera Pinnatipartita", "Monstera pinnatipartita", ["pinnatipartita"], MON_VINE,
       { dirt: ["Leaves only split once it climbs: give it a pole"] });
  kind("monstera-subpinnata", "Monstera Subpinnata", "Monstera subpinnata", ["subpinnata"], MON_VINE);
  kind("monstera-epipremnoides", "Monstera Epipremnoides", "Monstera epipremnoides", ["esqueleto", "epipremnoides"], MON_VINE,
       { water: ["Likes humidity (60%+)"] });
  kind("monstera-lechleriana", "Monstera Lechleriana", "Monstera lechleriana", ["lechleriana"], MON_VINE);
  kind("monstera-spruceana", "Monstera Spruceana", "Monstera spruceana", ["spruceana"], MON_VINE);
  kind("monstera-burle-marx-flame", "Monstera Burle Marx Flame", "Monstera sp. 'Burle Marx Flame'", ["burle marx flame", "flame"], MON_VINE,
       { sun: ["Bright, indirect light for the deep 'flame' cuts"] });
  kind("rhaphidophora-tetrasperma", "Mini Monstera", "Rhaphidophora tetrasperma", ["monstera minima", "ginny philodendron", "philodendron minima"], MON_VINE,
       { dirt: ["Not a true Monstera, but grows like one"] });

  // Pothos
  kind("pothos", "Golden Pothos", "Epipremnum aureum", ["pothos", "devil's ivy", "golden"], POTHOS);
  kind("pothos-jade", "Jade Pothos", "Epipremnum aureum 'Jade'", ["jade", "pothos", "green pothos"], POTHOS);
  kind("pothos-emerald", "Emerald Pothos", "Epipremnum aureum 'Emerald'", ["emerald", "pothos"], POTHOS);
  kind("pothos-global-green", "Global Green Pothos", "Epipremnum aureum 'Global Green'", ["global green", "pothos"], POTHOS);
  kind("pothos-hawaiian", "Hawaiian Pothos", "Epipremnum aureum 'Hawaiian'", ["hawaiian", "pothos", "giant pothos"], POTHOS,
       { dirt: ["Big leaves, especially on a moss pole"] });
  kind("pothos-shangri-la", "Shangri-La Pothos", "Epipremnum aureum 'Shangri-La'", ["shangri la", "curly pothos", "pothos"], POTHOS);
  kind("pothos-neon", "Neon Pothos", "Epipremnum aureum 'Neon'", ["neon", "pothos", "lime pothos"], care(POTHOS.water,
       ["Bright, indirect light keeps the neon colour", "In low light it turns darker green", "Avoid harsh direct sun"], POTHOS.dirt));
  kind("pothos-marble-queen", "Marble Queen Pothos", "Epipremnum aureum 'Marble Queen'", ["marble queen", "pothos"], POTHOS_VAR);
  kind("pothos-snow-queen", "Snow Queen Pothos", "Epipremnum aureum 'Snow Queen'", ["snow queen", "pothos"], POTHOS_VAR, { water: [PALE] });
  kind("pothos-njoy", "N'Joy Pothos", "Epipremnum aureum 'N'Joy'", ["njoy", "n joy", "pothos"], POTHOS_VAR);
  kind("pothos-pearls-and-jade", "Pearls and Jade Pothos", "Epipremnum aureum 'Pearls and Jade'", ["pearls and jade", "pothos"], POTHOS_VAR);
  kind("pothos-manjula", "Manjula Pothos", "Epipremnum aureum 'Manjula'", ["manjula", "happy leaf", "pothos"], POTHOS_VAR, { water: [PALE] });
  kind("pothos-glacier", "Glacier Pothos", "Epipremnum aureum 'Glacier'", ["glacier", "pothos"], POTHOS_VAR);
  kind("pothos-jessenia", "Jessenia Pothos", "Epipremnum aureum 'Jessenia'", ["jessenia", "pothos"], POTHOS_VAR);
  kind("pothos-harlequin", "Harlequin Pothos", "Epipremnum aureum 'Harlequin'", ["harlequin", "pothos"], POTHOS_VAR, { water: [PALE] });
  kind("epipremnum-pinnatum", "Dragon Tail Pothos", "Epipremnum pinnatum", ["dragon tail", "pinnatum", "pothos"], POTHOS_PIN,
       { dirt: ["Leaves split as it matures on a moss pole"] });
  kind("cebu-blue-pothos", "Cebu Blue Pothos", "Epipremnum pinnatum 'Cebu Blue'", ["cebu blue", "pothos", "pinnatum"], POTHOS_PIN,
       { sun: ["Bright, indirect light brings out the silvery blue"], dirt: ["Leaves split as it matures on a moss pole"] });
  kind("pothos-baltic-blue", "Baltic Blue Pothos", "Epipremnum pinnatum 'Baltic Blue'", ["baltic blue", "pothos", "pinnatum"], POTHOS_PIN,
       { dirt: ["Splits younger than most pothos, especially on a pole"] });
  kind("pothos-skeleton-key", "Skeleton Key Pothos", "Epipremnum pinnatum 'Skeleton Key'", ["skeleton key", "pothos", "pinnatum"], POTHOS_PIN);
  kind("pothos-pinnatum-marble", "Marble Pinnatum", "Epipremnum pinnatum 'Marble'", ["pinnatum marble", "marble planet", "pothos"], POTHOS_PIN_VAR);
  kind("pothos-pinnatum-albo", "Pinnatum Albo", "Epipremnum pinnatum 'Albo Variegata'", ["pinnatum albo", "albo pothos", "pothos"], POTHOS_PIN_VAR, { water: [PALE] });
  kind("satin-pothos", "Satin Pothos", "Scindapsus pictus 'Argyraeus'", ["silver pothos", "silver philodendron", "scindapsus", "argyraeus", "pothos"], SCIND);
  kind("scindapsus-exotica", "Scindapsus Exotica", "Scindapsus pictus 'Exotica'", ["exotica", "satin pothos", "scindapsus", "pothos"], SCIND);
  kind("scindapsus-silvery-ann", "Silvery Ann", "Scindapsus pictus 'Silvery Ann'", ["silvery ann", "satin pothos", "scindapsus", "pothos"], SCIND);
  kind("scindapsus-jade-satin", "Jade Satin", "Scindapsus pictus 'Jade Satin'", ["jade satin", "satin pothos", "scindapsus", "pothos"], SCIND);
  kind("scindapsus-moonlight", "Scindapsus Moonlight", "Scindapsus treubii 'Moonlight'", ["moonlight", "treubii", "scindapsus", "pothos"], SCIND,
       { sun: ["Handles lower light well"] });
  kind("scindapsus-dark-form", "Scindapsus Dark Form", "Scindapsus treubii 'Dark Form'", ["dark form", "treubii", "scindapsus", "pothos"], SCIND,
       { sun: ["Handles lower light well"] });

  // Philodendron: vining
  kind("heartleaf-philodendron", "Heartleaf Philodendron", "Philodendron hederaceum", ["sweetheart vine", "philodendron cordatum", "heartleaf"], PH_VINE);
  kind("philodendron-brasil", "Philodendron Brasil", "Philodendron hederaceum 'Brasil'", ["brasil", "brazil"], PH_VINE,
       { sun: ["Brighter light keeps the yellow stripes"] });
  kind("philodendron-lemon-lime", "Philodendron Lemon Lime", "Philodendron hederaceum 'Lemon Lime'", ["lemon lime", "neon philodendron"], PH_VINE);
  kind("philodendron-rio", "Philodendron Rio", "Philodendron hederaceum 'Rio'", ["rio"], PH_VINE,
       { sun: ["Bright, indirect light keeps the silver and cream stripes"] });
  kind("philodendron-micans", "Philodendron Micans", "Philodendron hederaceum var. hederaceum", ["micans", "velvet leaf philodendron"], PH_VINE,
       { water: ["Velvet leaves: likes a bit more humidity"], sun: ["Bright, indirect light keeps the bronze sheen"] });
  kind("philodendron-brandtianum", "Silver Leaf Philodendron", "Philodendron brandtianum", ["brandtianum", "silver philodendron"], PH_VINE);
  kind("philodendron-sodiroi", "Philodendron Sodiroi", "Philodendron sodiroi", ["sodiroi", "silver heart"], PH_CLIMB,
       { water: ["Likes humidity"] });
  kind("philodendron-mexicanum", "Philodendron Mexicanum", "Philodendron mexicanum", ["mexicanum"], PH_CLIMB);
  kind("philodendron-squamiferum", "Philodendron Squamiferum", "Philodendron squamiferum", ["squamiferum", "red bristle", "hairy philodendron"], PH_CLIMB,
       { water: ["Likes humidity"] });
  kind("philodendron-pedatum", "Oak Leaf Philodendron", "Philodendron pedatum", ["pedatum", "oak leaf"], PH_CLIMB);
  kind("philodendron-florida-ghost", "Philodendron Florida Ghost", "Philodendron 'Florida Ghost'", ["florida ghost", "ghost"], PH_CLIMB,
       { sun: ["New leaves come out white and turn green as they age"] });
  kind("philodendron-florida-beauty", "Philodendron Florida Beauty", "Philodendron 'Florida Beauty'", ["florida beauty", "variegated florida"], PH_VAR,
       { dirt: ["Give it a moss pole to climb"] });
  kind("philodendron-bipennifolium", "Fiddleleaf Philodendron", "Philodendron bipennifolium", ["bipennifolium", "horsehead philodendron", "panduriforme"], PH_CLIMB);
  kind("philodendron-hastatum", "Silver Sword Philodendron", "Philodendron hastatum", ["silver sword", "hastatum", "domesticum glaucophyllum"], PH_CLIMB,
       { sun: ["Bright light brings out the silvery sheen"] });
  kind("philodendron-domesticum", "Spadeleaf Philodendron", "Philodendron domesticum", ["domesticum", "spade leaf", "elephant ear philodendron"], PH_CLIMB);
  kind("philodendron-golden-goddess", "Philodendron Golden Goddess", "Philodendron domesticum 'Golden Goddess'", ["golden goddess", "malay gold", "golden dragon"], PH_CLIMB,
       { sun: ["Bright light keeps it bright yellow; low light turns it green"] });
  kind("philodendron-billietiae", "Philodendron Billietiae", "Philodendron billietiae", ["billietiae", "orange stem philodendron"], PH_CLIMB);
  kind("philodendron-burle-marx", "Philodendron Burle Marx", "Philodendron 'Burle Marx'", ["burle marx"], PH_CLIMB);
  kind("philodendron-elegans", "Philodendron Elegans", "Philodendron elegans", ["elegans", "skeleton key philodendron"], PH_CLIMB);
  kind("philodendron-tortum", "Philodendron Tortum", "Philodendron tortum", ["tortum", "skeleton philodendron"], PH_CLIMB);
  kind("philodendron-radiatum", "Philodendron Radiatum", "Philodendron radiatum", ["radiatum"], PH_CLIMB);
  kind("philodendron-atabapoense", "Philodendron Atabapoense", "Philodendron atabapoense", ["atabapoense"], PH_CLIMB);
  kind("philodendron-grazielae", "Philodendron Grazielae", "Philodendron grazielae", ["grazielae", "round leaf"], PH_VINE);
  kind("philodendron-rugosum", "Pigskin Philodendron", "Philodendron rugosum", ["rugosum", "naugahyde", "pigskin"], PH_CLIMB);
  kind("philodendron-subhastatum", "Philodendron Subhastatum", "Philodendron subhastatum", ["subhastatum"], PH_CLIMB);
  kind("philodendron-erubescens", "Blushing Philodendron", "Philodendron erubescens", ["erubescens", "red leaf philodendron"], PH_CLIMB);
  kind("philodendron-serpens", "Philodendron Serpens", "Philodendron serpens", ["serpens", "hairy philodendron"], PH_CLIMB,
       { water: ["Likes humidity"] });
  kind("philodendron-paraiso-verde", "Philodendron Paraiso Verde", "Philodendron 'Paraiso Verde'", ["paraiso verde", "paraíso verde"], PH_VINE,
       { sun: ["Bright, indirect light keeps the marbling"] });
  kind("philodendron-ring-of-fire", "Philodendron Ring of Fire", "Philodendron 'Ring of Fire'", ["ring of fire"], PH_VAR,
       { dirt: ["Give it a moss pole to climb"] });
  kind("philodendron-joepii", "Philodendron Joepii", "Philodendron joepii", ["joepii"], PH_CLIMB);
  kind("philodendron-spiritus-sancti", "Philodendron Spiritus-Sancti", "Philodendron spiritus-sancti", ["spiritus sancti", "santa leopoldina"], PH_CLIMB,
       { water: ["Likes humidity (60%+)", "Very rare: worth watching closely"] });

  // Philodendron: velvet climbers and crawlers
  kind("philodendron-melanochrysum", "Black Gold Philodendron", "Philodendron melanochrysum", ["melanochrysum", "black gold", "melano"], PH_VELVET);
  kind("philodendron-verrucosum", "Philodendron Verrucosum", "Philodendron verrucosum", ["verrucosum", "ecuador philodendron"], PH_VELVET);
  kind("philodendron-splendid", "Philodendron Splendid", "Philodendron 'Splendid' (melanochrysum × verrucosum)", ["splendid"], PH_VELVET);
  kind("philodendron-majestic", "Philodendron Majestic", "Philodendron 'Majestic' (sodiroi × verrucosum)", ["majestic"], PH_VELVET);
  kind("philodendron-camposportoanum", "Philodendron Camposportoanum", "Philodendron camposportoanum", ["camposportoanum", "shapeshifter"], PH_VELVET,
       { dirt: ["Leaves change shape as the plant matures"] });
  kind("philodendron-el-choco-red", "Philodendron El Choco Red", "Philodendron 'El Choco Red'", ["el choco red", "choco red"], PH_CRAWL);
  kind("philodendron-gloriosum", "Philodendron Gloriosum", "Philodendron gloriosum", ["gloriosum", "crawling philodendron"], PH_CRAWL);
  kind("philodendron-glorious", "Philodendron Glorious", "Philodendron 'Glorious' (gloriosum × melanochrysum)", ["glorious"], PH_VELVET);
  kind("philodendron-plowmanii", "Philodendron Plowmanii", "Philodendron plowmanii", ["plowmanii"], PH_CRAWL);
  kind("philodendron-pastazanum", "Philodendron Pastazanum", "Philodendron pastazanum", ["pastazanum"], PH_CRAWL);
  kind("philodendron-mamei", "Silver Cloud Philodendron", "Philodendron mamei", ["mamei", "silver cloud"], PH_CRAWL);

  // Philodendron: self-heading (grows upright, no pole)
  kind("philodendron-birkin", "Philodendron Birkin", "Philodendron 'Birkin'", ["birkin"], PH_SELF,
       { sun: ["Bright, indirect light keeps the white pinstripes"] });
  kind("philodendron-congo-rojo", "Philodendron Congo Rojo", "Philodendron 'Rojo Congo'", ["congo rojo", "rojo congo", "red congo"], PH_SELF);
  kind("philodendron-imperial-green", "Philodendron Imperial Green", "Philodendron 'Imperial Green'", ["imperial green", "imperial"], PH_SELF);
  kind("philodendron-imperial-red", "Philodendron Imperial Red", "Philodendron 'Imperial Red'", ["imperial red", "imperial"], PH_SELF);
  kind("philodendron-prince-of-orange", "Philodendron Prince of Orange", "Philodendron 'Prince of Orange'", ["prince of orange", "orange"], PH_SELF,
       { sun: ["Bright, indirect light for the orange new leaves"] });
  kind("philodendron-moonlight", "Philodendron Moonlight", "Philodendron 'Moonlight'", ["moonlight", "lime philodendron"], PH_SELF);
  kind("philodendron-mccolleys-finale", "Philodendron McColley's Finale", "Philodendron 'McColley's Finale'", ["mccolley's finale", "mccolleys"], PH_SELF);
  kind("philodendron-black-cardinal", "Philodendron Black Cardinal", "Philodendron 'Black Cardinal'", ["black cardinal"], PH_SELF);
  kind("philodendron-atom", "Philodendron Atom", "Philodendron 'Atom'", ["atom", "super atom"], PH_SELF);
  kind("philodendron-shangri-la", "Philodendron Shangri-La", "Philodendron 'Shangri-La'", ["shangri la"], PH_SELF);
  kind("philodendron-pink-congo", "Philodendron Pink Congo", "Philodendron 'Pink Congo'", ["pink congo"], PH_SELF,
       { sun: ["Its pink is usually from a chemical treatment and fades back to green within months"] });

  // Philodendron: variegated
  kind("philodendron-pink-princess", "Pink Princess Philodendron", "Philodendron erubescens 'Pink Princess'", ["pink princess", "ppp"], PH_VAR,
       { sun: ["Needs bright light to keep the pink"] });
  kind("philodendron-white-princess", "Philodendron White Princess", "Philodendron erubescens 'White Princess'", ["white princess"], PH_VAR);
  kind("philodendron-white-knight", "Philodendron White Knight", "Philodendron 'White Knight'", ["white knight"], PH_VAR);
  kind("philodendron-white-wizard", "Philodendron White Wizard", "Philodendron 'White Wizard'", ["white wizard"], PH_VAR);
  kind("philodendron-painted-lady", "Philodendron Painted Lady", "Philodendron 'Painted Lady'", ["painted lady"], PH_VAR);
  kind("philodendron-caramel-marble", "Philodendron Caramel Marble", "Philodendron 'Caramel Marble'", ["caramel marble", "caramel pluto"], PH_VAR);
  kind("philodendron-strawberry-shake", "Philodendron Strawberry Shake", "Philodendron 'Strawberry Shake'", ["strawberry shake"], PH_VAR);
  kind("philodendron-jose-buono", "Philodendron Jose Buono", "Philodendron 'Jose Buono'", ["jose buono"], PH_VAR);

  // Philodendron: tree types (Thaumatophyllum)
  kind("tree-philodendron", "Tree Philodendron", "Thaumatophyllum bipinnatifidum", ["philodendron selloum", "selloum", "hope philodendron", "split-leaf philodendron", "lacy tree philodendron"], THAUM);
  kind("philodendron-xanadu", "Philodendron Xanadu", "Thaumatophyllum xanadu", ["xanadu", "winterbourn"], THAUM,
       { dirt: ["Stays more compact than a tree philodendron"] });
  kind("philodendron-warszewiczii", "Philodendron Warszewiczii", "Philodendron warszewiczii", ["warszewiczii", "snowflake"], THAUM);

  // ---- Other aroids ----
  sp("zz-plant", "ZZ Plant", "Zamioculcas zamiifolia", ["zanzibar gem", "zz", "raven zz"],
     ["Let the soil dry out completely between waterings: about every 14-21 days, monthly in winter",
     "Its thick rhizomes store water, so it forgives a missed watering but not soggy soil",
     "Wrinkled, limp stems mean very dry; yellow, mushy stems mean too wet",
     DRAIN],
     ["Low to bright indirect light", "Avoid harsh direct sun"],
     ["Gritty, fast-draining mix: 1 part potting soil, 1 part perlite or pumice (or cactus mix with a little bark)",
      "Thick rhizomes store water, so they rot in wet soil",
      "Snug pot with drainage holes (terracotta helps); keep the rhizomes at soil level, not buried deep"]);
  sp("peace-lily", "Peace Lily", "Spathiphyllum wallisii", ["spathiphyllum", "spath"],
     ["Keep the soil lightly moist: water when the top 1 in. is dry, about every 5-7 days",
     "It droops dramatically when thirsty and perks up within hours of a drink",
     "Filtered or rain water prevents brown tips; the chemicals in tap water build up",
     "Likes humidity of 50% or more",
     DRAIN],
     ["Low to medium indirect light", "More light means more flowers", "No direct sun"],
     ["Moisture-holding potting mix with some drainage: 2 parts potting soil, 1 part perlite or orchid bark",
      "Pot with drainage holes; it flowers better when slightly root-bound"]);
  sp("chinese-evergreen", "Chinese Evergreen", "Aglaonema", ["aglaonema", "red aglaonema", "silver bay"],
     ["Water when the top 2 in. of soil is dry: about every 7-10 days, every 10-14 days in winter",
     DRAIN,
     "Tolerates some neglect; dislikes cold water and drafts"],
     ["Low to medium indirect light", "Pink and red kinds like brighter light"],
     ["Standard potting mix with perlite: 3 parts mix, 1 part perlite",
      "Pot with drainage holes; it is happy slightly root-bound"]);
  sp("dieffenbachia", "Dumb Cane", "Dieffenbachia", ["dieffenbachia", "camille"],
     ["Water when the top 2 in. of soil is dry: about every 7-10 days, every 10-14 days in winter",
     DRAIN,
     "Likes humidity; yellow lower leaves usually mean too much water"],
     ["Medium to bright indirect light", "Rotate it so it grows evenly"],
     ["Rich, well-draining mix: 3 parts potting soil, 1 part perlite",
      "Pot with drainage holes; repot yearly while young"]);
  sp("arrowhead-plant", "Arrowhead Plant", "Syngonium podophyllum", ["syngonium", "arrowhead vine", "nephthytis"],
     ["Water when the top 1-2 in. of soil is dry: about every 5-7 days, every 7-10 days in winter",
     DRAIN,
     "Drooping means thirsty; likes humidity of 50% or more"],
     ["Medium to bright indirect light", "Pink kinds need brighter light"],
     ["Light, slightly chunky mix: 2 parts potting soil, 1 part perlite, 1 part orchid bark",
      "Pot with drainage holes; let it trail, or give it a pole to climb"]);
  sp("anthurium", "Anthurium", "Anthurium andraeanum", ["flamingo flower", "laceleaf", "painter's palette"],
     ["Water when the top 1-2 in. of soil is dry: about every 5-7 days",
     "Water thoroughly, then let it drain: its roots must never sit in water",
     "Likes humidity of 60% or more",
     "Filtered or rain water avoids mineral build-up on the roots"],
     ["Bright, indirect light for flowers", "Avoid direct sun"], ["Very chunky epiphyte mix: equal parts orchid bark, coco chips and perlite, with a little potting soil",
      "Its roots need lots of air: never use dense soil",
      "Small pot with drainage holes; repot when the roots circle"]);
  sp("alocasia-polly", "Alocasia Polly", "Alocasia × amazonica 'Polly'", ["african mask", "elephant ear", "alocasia", "kris plant"],
     ["Let the top 1-2 in. dry, then water: about every 5-7 days in summer",
     "It may go dormant in winter: water only about every 10-14 days then, keeping the corm barely moist",
     "Likes humidity of 60% or more",
     "Yellowing leaves usually mean too much water or cold"],
     ["Bright, indirect light", "Avoid direct sun"],
     ["Airy, slightly moist mix: 1 part potting soil (or coco coir), 1 part perlite, 1 part orchid bark",
      "It grows from a corm that rots in soggy soil",
      "Small, snug pot with drainage holes; keep it nearly dry when dormant in winter"]);
  sp("colocasia", "Elephant Ear", "Colocasia esculenta", ["taro", "colocasia"],
     ["Keep the soil consistently moist: water about every 2-3 days in summer, weekly in winter",
     "A thirsty plant: in summer it can stand in a shallow saucer of water",
     "Droopy leaves in the afternoon mean it needs more water"],
     ["Bright light; some direct sun is fine"],
     ["Rich, heavy, moisture-holding mix: potting soil with compost and a little perlite",
      "It loves wet feet: in summer it can stand in a shallow saucer of water",
      "Large pot with drainage holes; a heavy feeder"]);

  // ---- Snake plants, dracaenas, yucca ----
  sp("snake-plant", "Snake Plant", "Dracaena trifasciata", ["sansevieria", "mother-in-law's tongue", "laurentii", "whale fin", "cylindrica"],
     ["Let the soil dry out completely", "Every 2-6 weeks; barely at all in winter", "Overwatering is the main thing that kills it"],
     ["Low to bright light", "Some direct sun is fine", "Grows faster in brighter light"], SUCC);
  sp("dragon-tree", "Dragon Tree", "Dracaena marginata", ["madagascar dragon tree", "dracaena", "red edge dracaena"],
     ["Water when the top 1-2 in. of soil is dry", "Sensitive to fluoride: filtered water prevents brown tips"],
     ["Medium to bright indirect light"], AIRY);
  sp("corn-plant", "Corn Plant", "Dracaena fragrans", ["dracaena", "mass cane", "janet craig", "lemon lime dracaena"],
     ["Water when the top 1-2 in. of soil is dry", "Sensitive to fluoride: filtered water prevents brown tips"],
     ["Low to medium indirect light", "Avoid direct sun"], AIRY);
  sp("lucky-bamboo", "Lucky Bamboo", "Dracaena sanderiana", ["ribbon plant", "bamboo"],
     ["In water: keep the roots covered and change the water every 1-2 weeks", "Use filtered or distilled water", "In soil: keep it lightly moist"],
     ["Medium, indirect light", "Direct sun scorches the leaves"], ["Grows in water with pebbles, or in well-draining potting mix"]);
  sp("yucca", "Spineless Yucca", "Yucca gigantea", ["yucca", "yucca elephantipes", "yucca cane"],
     ["Let the top half of the soil dry out", "Water sparingly in winter"],
     ["Bright light; direct sun is fine"], ["Sandy, fast-draining mix (cactus mix works)", "Pot with drainage holes"]);
  sp("cast-iron-plant", "Cast Iron Plant", "Aspidistra elatior", ["aspidistra", "bar room plant"],
     ["Water when the top 2 in. of soil is dry", "Very forgiving"],
     ["Low to medium indirect light", "Direct sun burns the leaves"], AIRY);

  // ---- Figs and trees ----
  sp("fiddle-leaf-fig", "Fiddle Leaf Fig", "Ficus lyrata", ["fiddle leaf", "flf", "ficus"],
     ["Water when the top 2 in. of soil is dry", DRAIN, "Dislikes being moved and drafts"],
     ["Bright, indirect light", "Some morning direct sun is good", "Rotate a quarter turn now and then"], AIRY);
  sp("rubber-plant", "Rubber Plant", "Ficus elastica", ["rubber tree", "ficus", "tineke", "ruby", "burgundy"],
     ["Water when the top 1-2 in. of soil is dry", DRAIN],
     ["Bright, indirect light", "Variegated kinds need more light"], AIRY);
  sp("weeping-fig", "Weeping Fig", "Ficus benjamina", ["ficus", "benjamin fig"],
     ["Water when the top 1 in. of soil is dry", "Drops leaves if moved or chilled"],
     ["Bright, indirect light"], AIRY);
  sp("ficus-audrey", "Ficus Audrey", "Ficus benghalensis", ["audrey", "banyan", "ficus"],
     ["Water when the top 2 in. of soil is dry", DRAIN],
     ["Bright, indirect light; some direct sun is fine"], AIRY);
  sp("money-tree", "Money Tree", "Pachira aquatica", ["pachira", "guiana chestnut"],
     ["Water when the top 2-4 in. of soil is dry", DRAIN],
     ["Bright, indirect light", "Rotate it so it grows evenly"], ["Well-draining peat-based mix with sand or perlite", "Pot with drainage holes"]);
  sp("umbrella-plant", "Umbrella Plant", "Heptapleurum arboricola", ["schefflera", "dwarf umbrella tree"],
     ["Water when the top 1-2 in. of soil is dry", DRAIN],
     ["Bright, indirect light"], AIRY);
  sp("norfolk-pine", "Norfolk Island Pine", "Araucaria heterophylla", ["norfolk pine", "living christmas tree"],
     ["Water when the top 1 in. of soil is dry", "Likes humidity"],
     ["Bright, indirect light", "Rotate it so it stays straight"], ["Peat-based potting mix", "Pot with drainage holes"]);
  sp("croton", "Croton", "Codiaeum variegatum", ["joseph's coat", "petra", "mammy croton"],
     ["Water when the top 1 in. of soil is dry", "Drops leaves if it dries out completely"],
     ["Bright light with some direct sun for the best colours"], AIRY);
  sp("meyer-lemon", "Meyer Lemon", "Citrus × meyeri", ["lemon tree", "citrus"],
     ["Water deeply when the top 1-2 in. of soil is dry", DRAIN],
     ["Lots of light: 8+ hours, with direct sun", "A grow light helps in winter"], ["Citrus potting mix (well-draining)", "Pot with drainage holes"]);
  sp("coffee-plant", "Coffee Plant", "Coffea arabica", ["coffee", "arabica"],
     ["Keep the soil lightly moist", "Likes humidity"],
     ["Bright, indirect light", "Avoid harsh direct sun"], ["Rich potting mix", "Pot with drainage holes"]);

  // ---- Palms ----
  sp("parlor-palm", "Parlor Palm", "Chamaedorea elegans", ["parlour palm", "neanthe bella", "bamboo palm"],
     ["Water when the top 1 in. of soil is dry", DRAIN],
     ["Low to medium indirect light", "Avoid direct sun"], ["Peat-based potting mix", "Pot with drainage holes"]);
  sp("areca-palm", "Areca Palm", "Dypsis lutescens", ["butterfly palm", "golden cane palm"],
     ["Water when the top 1 in. of soil is dry", "Sensitive to fluoride: filtered water prevents brown tips"],
     ["Bright, indirect light"], AIRY);
  sp("kentia-palm", "Kentia Palm", "Howea forsteriana", ["kentia", "thatch palm"],
     ["Water when the top 2 in. of soil is dry", DRAIN],
     ["Low to bright indirect light"], AIRY);
  sp("majesty-palm", "Majesty Palm", "Ravenea rivularis", ["majestic palm"],
     ["Keep the soil consistently moist", "Likes humidity"],
     ["Bright, indirect light"], MOIST);
  sp("ponytail-palm", "Ponytail Palm", "Beaucarnea recurvata", ["elephant's foot"],
     ["Let the soil dry out completely", "Stores water in its swollen trunk"],
     ["Bright light; direct sun is fine"], SUCC);
  sp("sago-palm", "Sago Palm", "Cycas revoluta", ["sago", "cycad"],
     ["Water when the top 2 in. of soil is dry", "Water less in winter"],
     ["Bright light with some direct sun"], ["Sandy, fast-draining mix", "Pot with drainage holes"]);
  sp("bird-of-paradise", "Bird of Paradise", "Strelitzia reginae", ["strelitzia", "white bird of paradise", "strelitzia nicolai"],
     ["Water when the top 2 in. of soil is dry", DRAIN],
     ["Bright light, with several hours of direct sun"], ["Rich, well-draining potting mix", "Pot with drainage holes"]);

  // ---- Prayer plants ----
  sp("calathea", "Calathea", "Goeppertia", ["calathea", "medallion", "zebra plant", "pinstripe", "orbifolia"], CALATHEA_WATER, CALATHEA_SUN, MOIST);
  sp("rattlesnake-plant", "Rattlesnake Plant", "Goeppertia insignis", ["calathea lancifolia", "calathea"], CALATHEA_WATER, CALATHEA_SUN, MOIST);
  sp("prayer-plant", "Prayer Plant", "Maranta leuconeura", ["maranta", "red prayer plant", "lemon lime maranta"], CALATHEA_WATER,
     ["Medium, indirect light", "Folds its leaves up at night", "No direct sun"], MOIST);
  sp("stromanthe", "Stromanthe Triostar", "Stromanthe sanguinea 'Triostar'", ["triostar", "stromanthe"], CALATHEA_WATER,
     ["Bright, indirect light for the pink colour", "No direct sun"], MOIST);

  // ---- Ferns ----
  sp("boston-fern", "Boston Fern", "Nephrolepis exaltata", ["sword fern", "fern"],
     ["Keep the soil consistently moist", "Loves humidity (a bathroom is great)"],
     ["Bright, indirect light"], MOIST);
  sp("maidenhair-fern", "Maidenhair Fern", "Adiantum raddianum", ["maidenhair", "fern"],
     ["Never let it dry out", "Needs high humidity"],
     ["Medium, indirect light", "No direct sun"], MOIST);
  sp("birds-nest-fern", "Bird's Nest Fern", "Asplenium nidus", ["asplenium", "fern"],
     ["Keep the soil lightly moist", "Water around the edge, not into the centre"],
     ["Medium to bright indirect light"], ["Airy peat-based mix with some bark", "Pot with drainage holes"]);
  sp("staghorn-fern", "Staghorn Fern", "Platycerium bifurcatum", ["staghorn", "elkhorn fern", "fern"],
     ["Soak the mount about once a week; let it dry a little between", "Mist when the air is dry"],
     ["Bright, indirect light"], ["Mounted on wood with sphagnum moss, or in orchid bark"]);
  sp("rabbits-foot-fern", "Rabbit's Foot Fern", "Davallia fejeensis", ["davallia", "fern"],
     ["Keep the soil lightly moist", "Don't bury the furry rhizomes"],
     ["Medium to bright indirect light"], ["Airy mix: potting soil, bark and perlite"]);
  sp("asparagus-fern", "Asparagus Fern", "Asparagus densiflorus 'Sprengeri'", ["asparagus aethiopicus", "foxtail fern", "fern"],
     ["Keep the soil lightly moist", "Mist when the air is dry"],
     ["Bright, indirect light"], AIRY);

  // ---- Vines and trailers ----
  sp("spider-plant", "Spider Plant", "Chlorophytum comosum", ["airplane plant", "spider ivy", "ribbon plant"],
     ["Water when the top 1 in. of soil is dry", "Sensitive to fluoride: filtered or rain water prevents brown tips"],
     ["Bright, indirect light", "Tolerates medium light"], AIRY);
  sp("english-ivy", "English Ivy", "Hedera helix", ["ivy"],
     ["Water when the top 1 in. of soil is dry", "Likes cooler rooms and humidity"],
     ["Bright, indirect light"], AIRY);
  sp("tradescantia-zebrina", "Inch Plant", "Tradescantia zebrina", ["wandering dude", "wandering jew", "tradescantia", "spiderwort"],
     ["Water when the top 1 in. of soil is dry", DRAIN],
     ["Bright, indirect light keeps the purple and silver stripes"], AIRY);
  sp("hoya-carnosa", "Wax Plant", "Hoya carnosa", ["hoya", "krimson queen", "krimson princess", "hindu rope", "compacta"],
     ["Let the soil dry out almost completely", "Don't cut off old flower stems: they bloom again"],
     ["Bright, indirect light (some morning sun helps it flower)"], EPI);
  sp("hoya-kerrii", "Sweetheart Hoya", "Hoya kerrii", ["valentine hoya", "heart plant", "hoya"],
     ["Let the soil dry out almost completely"],
     ["Bright, indirect light"], EPI);
  sp("string-of-pearls", "String of Pearls", "Curio rowleyanus", ["senecio rowleyanus", "string of beads"],
     ["Let the soil dry out almost completely", "Shrivelled pearls mean it's thirsty"],
     ["Bright, indirect light with a little direct sun"], ["Gritty succulent mix", "Shallow pot with drainage holes"]);
  sp("string-of-hearts", "String of Hearts", "Ceropegia woodii", ["rosary vine", "chain of hearts"],
     ["Let the soil dry out completely", "Leaves get soft when it's thirsty"],
     ["Bright, indirect light", "A little direct sun is fine"], SUCC);
  sp("string-of-turtles", "String of Turtles", "Peperomia prostrata", ["turtle vine", "peperomia"],
     ["Water when the top of the soil is dry", "Doesn't like to stay wet"],
     ["Medium to bright indirect light"], AIRY);
  sp("lipstick-plant", "Lipstick Plant", "Aeschynanthus radicans", ["aeschynanthus"],
     ["Water when the top 1 in. of soil is dry"],
     ["Bright, indirect light for flowers"], EPI);

  // ---- Peperomia, pilea and small leafy things ----
  sp("baby-rubber-plant", "Baby Rubber Plant", "Peperomia obtusifolia", ["peperomia", "pepper face"],
     ["Let the top half of the soil dry out", "Thick leaves store water: underwater rather than over"],
     ["Medium to bright indirect light"], AIRY);
  sp("watermelon-peperomia", "Watermelon Peperomia", "Peperomia argyreia", ["peperomia", "watermelon plant"],
     ["Water when the top 1-2 in. of soil is dry"],
     ["Medium, indirect light", "No direct sun"], AIRY);
  sp("ripple-peperomia", "Ripple Peperomia", "Peperomia caperata", ["peperomia", "emerald ripple"],
     ["Water when the top 1-2 in. of soil is dry"],
     ["Medium, indirect light"], AIRY);
  sp("chinese-money-plant", "Chinese Money Plant", "Pilea peperomioides", ["pilea", "pancake plant", "ufo plant", "coin plant"],
     ["Water when the top 1-2 in. of soil is dry", DRAIN],
     ["Bright, indirect light", "Rotate weekly so it grows straight"], AIRY);
  sp("nerve-plant", "Nerve Plant", "Fittonia albivenis", ["fittonia", "mosaic plant"],
     ["Keep the soil moist", "It faints when dry but recovers quickly after a drink", "Likes humidity"],
     ["Medium, indirect light", "No direct sun"], MOIST);
  sp("polka-dot-plant", "Polka Dot Plant", "Hypoestes phyllostachya", ["hypoestes", "freckle face"],
     ["Keep the soil lightly moist"],
     ["Bright, indirect light keeps the spots bright"], AIRY);
  sp("polka-dot-begonia", "Polka Dot Begonia", "Begonia maculata", ["begonia", "wightii"],
     ["Water when the top 1 in. of soil is dry", "Keep water off the leaves"],
     ["Bright, indirect light", "Avoid direct sun"], AIRY);
  sp("rex-begonia", "Rex Begonia", "Begonia rex-cultorum", ["begonia", "painted leaf begonia"],
     ["Water when the top 1 in. of soil is dry", "Keep water off the leaves"],
     ["Medium to bright indirect light"], AIRY);
  sp("purple-shamrock", "Purple Shamrock", "Oxalis triangularis", ["oxalis", "false shamrock", "love plant"],
     ["Water when the top 1 in. of soil is dry", "If it dies back, it's resting: water lightly until it regrows"],
     ["Bright, indirect light", "Folds its leaves at night"], AIRY);

  // ---- Succulents and cacti ----
  sp("aloe-vera", "Aloe Vera", "Aloe barbadensis miller", ["aloe", "burn plant"],
     ["Soak, then let the soil dry out completely", "About every 2-3 weeks; monthly in winter"],
     ["Bright light; direct sun is fine once it's used to it"], SUCC);
  sp("jade-plant", "Jade Plant", "Crassula ovata", ["jade", "money plant", "lucky plant", "gollum"],
     ["Let the soil dry out completely", "Wrinkly leaves mean it's thirsty"],
     ["Bright light with at least 4 hours of direct sun"], SUCC);
  sp("echeveria", "Echeveria", "Echeveria", ["hens and chicks", "succulent", "rosette"],
     ["Soak, then let the soil dry out completely", "Don't leave water sitting in the rosette"],
     ["Full sun: your brightest window"], ["Gritty succulent mix", "Terracotta pot with drainage holes"]);
  sp("zebra-haworthia", "Zebra Haworthia", "Haworthiopsis attenuata", ["haworthia", "zebra cactus", "zebra plant", "succulent"],
     ["Let the soil dry out completely", "About every 2-3 weeks"],
     ["Bright, indirect light", "Some morning sun is fine; harsh sun turns it red"], SUCC);
  sp("burros-tail", "Burro's Tail", "Sedum morganianum", ["donkey's tail", "sedum", "succulent"],
     ["Let the soil dry out completely"],
     ["Bright light with some direct sun"], SUCC);
  sp("panda-plant", "Panda Plant", "Kalanchoe tomentosa", ["kalanchoe", "pussy ears", "succulent"],
     ["Let the soil dry out completely"],
     ["Bright light with some direct sun"], SUCC);
  sp("kalanchoe", "Flaming Katy", "Kalanchoe blossfeldiana", ["kalanchoe", "florist kalanchoe"],
     ["Let the soil dry out between waterings"],
     ["Bright light with some direct sun", "Needs long nights (14 hours dark) for 6 weeks to bloom again"], SUCC);
  sp("crown-of-thorns", "Crown of Thorns", "Euphorbia milii", ["christ plant", "euphorbia"],
     ["Let the soil dry out between waterings"],
     ["Full sun: your brightest window"], SUCC);
  sp("bunny-ear-cactus", "Bunny Ear Cactus", "Opuntia microdasys", ["polka dot cactus", "opuntia", "cactus"],
     ["Let the soil dry out completely", "Barely water in winter"],
     ["Full sun: your brightest window"], SUCC);
  sp("christmas-cactus", "Christmas Cactus", "Schlumbergera", ["thanksgiving cactus", "holiday cactus", "schlumbergera", "cactus"],
     ["Water when the top 1 in. of soil is dry", "A little more often while it's budding"],
     ["Bright, indirect light", "Needs long nights (12+ hours dark) in fall to bloom"], EPI);
  sp("fishbone-cactus", "Fishbone Cactus", "Disocactus anguliger", ["epiphyllum anguliger", "zig zag cactus", "ric rac cactus", "cactus"],
     ["Water when the top 1-2 in. of soil is dry"],
     ["Bright, indirect light"], EPI);
  sp("mistletoe-cactus", "Mistletoe Cactus", "Rhipsalis baccifera", ["rhipsalis", "cactus"],
     ["Water when the top 1 in. of soil is dry"],
     ["Bright, indirect light", "Avoid direct sun"], EPI);

  // ---- Flowering ----
  sp("moth-orchid", "Moth Orchid", "Phalaenopsis", ["orchid", "phalaenopsis", "phal"],
     ["Water when the roots look silvery and the bark is dry (about weekly)", "Soak, then let it drain completely", "Never leave water in the crown"],
     ["Bright, indirect light (an east window is ideal)", "No direct midday sun"], ["Orchid bark mix, not soil", "A clear pot lets you see the roots"]);
  sp("african-violet", "African Violet", "Saintpaulia ionantha", ["saintpaulia", "violet"],
     ["Keep the soil evenly moist", "Water from below with room-temperature water", "Keep water off the leaves"],
     ["Bright, indirect light", "No direct sun"], ["Light African violet mix", "Small pot with drainage holes"]);
  sp("bromeliad", "Bromeliad", "Guzmania", ["guzmania", "bromeliad", "vriesea", "aechmea"],
     ["Keep a little water in the central cup; flush it monthly", "Keep the soil barely moist"],
     ["Bright, indirect light"], ["Orchid or bromeliad mix", "Small pot with drainage holes"]);
  sp("air-plant", "Air Plant", "Tillandsia", ["tillandsia", "airplant"],
     ["Soak for 20-30 minutes once a week", "Shake off and dry upside down within 4 hours"],
     ["Bright, indirect light"], ["No soil needed"]);
  sp("poinsettia", "Poinsettia", "Euphorbia pulcherrima", ["christmas star", "christmas flower"],
     ["Water when the top 1 in. of soil is dry", "Don't let it sit in water (remove foil wraps)"],
     ["Bright, indirect light", "Keep away from cold drafts"], AIRY);
  sp("cyclamen", "Cyclamen", "Cyclamen persicum", ["florist's cyclamen"],
     ["Water from below when the top of the soil is dry", "Keep water off the crown", "Rests in summer: water much less then"],
     ["Bright, indirect light", "Likes cool rooms"], AIRY);
  sp("gardenia", "Gardenia", "Gardenia jasminoides", ["cape jasmine"],
     ["Keep the soil evenly moist", "Likes humidity"],
     ["Bright light with some direct sun"], ["Acidic potting mix (azalea mix works)", "Pot with drainage holes"]);

  // ---- Carnivorous ----
  sp("venus-flytrap", "Venus Flytrap", "Dionaea muscipula", ["flytrap", "carnivorous"],
     ["Keep the soil wet: stand the pot in a tray of water", "Only distilled or rain water", "Needs a cool winter rest"],
     ["Full sun: 4+ hours of direct light"], ["Peat moss and perlite, no fertilizer", "Plastic pot with drainage holes"]);
  sp("pitcher-plant", "Tropical Pitcher Plant", "Nepenthes", ["nepenthes", "monkey cup", "carnivorous"],
     ["Keep the soil moist", "Only distilled or rain water", "Likes humidity"],
     ["Bright, indirect light"], ["Sphagnum moss, or orchid bark with perlite", "No fertilizer"]);

  return list;
})();

// Goes up whenever the care text changes; the app offers to refresh saved plants' notes.
const CARE_VERSION = 5;

// The soil types a plant can be given (plant.soilType holds the id).
const SOIL_TYPES = [
  { id: "chunky", name: "Fast-draining chunky aroid mix",
    recipe: "1 part potting soil, 1 part orchid bark, 1 part perlite (plus a handful of charcoal)",
    about: "Lots of air around the roots and it dries quickly. For climbers and epiphytes that hate wet feet." },
  { id: "moist", name: "Moisture-retaining aroid mix",
    recipe: "2 parts potting soil or coco coir, 1 part orchid bark, 1 part perlite, plus a handful of sphagnum moss",
    about: "Holds steady moisture and still has air. For thirsty plants and velvet-leaved aroids." },
  { id: "succ", name: "Succulent / cactus mix",
    recipe: "Cactus mix with extra perlite or pumice (about 2 parts mix to 1 part grit)",
    about: "Drains very fast and dries out between waterings. For succulents, cacti, and plants with rhizomes or corms." },
  { id: "outdoor", name: "Outdoor potting mix",
    recipe: "Container or patio-pot mix with compost and a little perlite",
    about: "Heavier and holds more water. For pots outside and big, thirsty plants." },
];

// Which soil type a species suggests, read from its first soil note (null if it doesn't say).
function soilDefault(sp) {
  if (sp.id === "colocasia") return "outdoor";
  const d = (sp.dirt[0] || "").toLowerCase();
  if (/cactus|succulent|gritty|sandy/.test(d) && !/aroid/.test(d)) return "succ";
  if (/moisture-holding|moist|standard potting mix|rich/.test(d)) return "moist";
  if (/chunky|orchid bark|aroid|epiphyte|airy|well-draining mix/.test(d)) return "chunky";
  return null;
}
