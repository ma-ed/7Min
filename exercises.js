const stick = (extra) => `
<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
  ${extra}
</svg>`;

export const EXERCISES = [
  {
    id: "hampelmann",
    name: "Hampelmann",
    svg: stick(`
      <circle cx="50" cy="22" r="9"/>
      <line x1="50" y1="31" x2="50" y2="78"/>
      <line x1="50" y1="40" x2="20" y2="20"/>
      <line x1="50" y1="40" x2="80" y2="20"/>
      <line x1="50" y1="78" x2="25" y2="125"/>
      <line x1="50" y1="78" x2="75" y2="125"/>
    `),
  },
  {
    id: "wandsitzen",
    name: "Wandsitzen",
    svg: stick(`
      <line x1="15" y1="20" x2="15" y2="130"/>
      <circle cx="38" cy="42" r="8"/>
      <line x1="38" y1="50" x2="38" y2="80"/>
      <line x1="38" y1="80" x2="80" y2="80"/>
      <line x1="80" y1="80" x2="80" y2="125"/>
      <line x1="38" y1="60" x2="65" y2="75"/>
    `),
  },
  {
    id: "liegestuetze",
    name: "Liegestütze",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="22" cy="70" r="8"/>
      <line x1="30" y1="73" x2="85" y2="95"/>
      <line x1="35" y1="78" x2="35" y2="115"/>
      <line x1="75" y1="92" x2="75" y2="115"/>
    `),
  },
  {
    id: "bauchpressen",
    name: "Bauchpressen",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="30" cy="70" r="8"/>
      <line x1="35" y1="75" x2="60" y2="95"/>
      <line x1="60" y1="95" x2="85" y2="95"/>
      <line x1="60" y1="95" x2="60" y2="115"/>
      <line x1="80" y1="95" x2="80" y2="115"/>
    `),
  },
  {
    id: "auf-den-stuhl-steigen",
    name: "Auf-den-Stuhl-Steigen",
    svg: stick(`
      <rect x="55" y="80" width="35" height="45" />
      <circle cx="30" cy="35" r="8"/>
      <line x1="30" y1="43" x2="30" y2="78"/>
      <line x1="30" y1="55" x2="55" y2="50"/>
      <line x1="30" y1="78" x2="55" y2="80"/>
      <line x1="30" y1="78" x2="20" y2="125"/>
    `),
  },
  {
    id: "kniebeugen",
    name: "Kniebeugen",
    svg: stick(`
      <circle cx="50" cy="25" r="9"/>
      <line x1="50" y1="34" x2="50" y2="75"/>
      <line x1="50" y1="48" x2="25" y2="60"/>
      <line x1="50" y1="48" x2="75" y2="60"/>
      <line x1="50" y1="75" x2="30" y2="100"/>
      <line x1="30" y1="100" x2="35" y2="125"/>
      <line x1="50" y1="75" x2="70" y2="100"/>
      <line x1="70" y1="100" x2="65" y2="125"/>
    `),
  },
  {
    id: "trizeps-dips",
    name: "Trizeps-Dips",
    svg: stick(`
      <rect x="60" y="70" width="30" height="40" />
      <circle cx="35" cy="35" r="8"/>
      <line x1="35" y1="43" x2="35" y2="80"/>
      <line x1="35" y1="50" x2="65" y2="70"/>
      <line x1="35" y1="80" x2="20" y2="120"/>
      <line x1="35" y1="80" x2="55" y2="120"/>
    `),
  },
  {
    id: "unterarmstuetz",
    name: "Unterarmstütz",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="22" cy="80" r="8"/>
      <line x1="15" y1="115" x2="25" y2="88"/>
      <line x1="30" y1="80" x2="85" y2="95"/>
      <line x1="80" y1="95" x2="80" y2="115"/>
    `),
  },
  {
    id: "hoher-kniehebelauf",
    name: "Hoher Kniehebelauf",
    svg: stick(`
      <circle cx="50" cy="22" r="9"/>
      <line x1="50" y1="31" x2="50" y2="75"/>
      <line x1="50" y1="45" x2="25" y2="35"/>
      <line x1="50" y1="45" x2="80" y2="55"/>
      <line x1="50" y1="75" x2="35" y2="90"/>
      <line x1="35" y1="90" x2="50" y2="110"/>
      <line x1="50" y1="75" x2="65" y2="65"/>
      <line x1="65" y1="65" x2="55" y2="55"/>
    `),
  },
  {
    id: "ausfallschritte",
    name: "Ausfallschritte",
    svg: stick(`
      <circle cx="40" cy="25" r="9"/>
      <line x1="40" y1="34" x2="40" y2="75"/>
      <line x1="40" y1="45" x2="20" y2="55"/>
      <line x1="40" y1="45" x2="60" y2="55"/>
      <line x1="40" y1="75" x2="25" y2="115"/>
      <line x1="25" y1="115" x2="25" y2="130"/>
      <line x1="40" y1="75" x2="75" y2="115"/>
      <line x1="75" y1="115" x2="85" y2="130"/>
    `),
  },
  {
    id: "liegestuetze-rotation",
    name: "Liegestütze mit Rotation",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="35" cy="50" r="8"/>
      <line x1="40" y1="55" x2="78" y2="92"/>
      <line x1="35" y1="58" x2="55" y2="30"/>
      <line x1="35" y1="58" x2="40" y2="115"/>
      <line x1="75" y1="92" x2="78" y2="115"/>
    `),
  },
  {
    id: "seitlicher-unterarmstuetz",
    name: "Seitlicher Unterarmstütz",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="25" cy="60" r="8"/>
      <line x1="20" y1="115" x2="28" y2="68"/>
      <line x1="32" y1="65" x2="85" y2="110"/>
      <line x1="50" y1="80" x2="50" y2="55"/>
    `),
  },
  {
    id: "burpees",
    name: "Burpees",
    svg: stick(`
      <circle cx="50" cy="18" r="8"/>
      <line x1="50" y1="26" x2="50" y2="70"/>
      <line x1="50" y1="32" x2="28" y2="8"/>
      <line x1="50" y1="32" x2="72" y2="8"/>
      <line x1="50" y1="70" x2="32" y2="105"/>
      <line x1="50" y1="70" x2="68" y2="105"/>
      <line x1="32" y1="105" x2="30" y2="122"/>
      <line x1="68" y1="105" x2="70" y2="122"/>
      <line x1="10" y1="130" x2="90" y2="130"/>
    `),
  },
  {
    id: "bergsteiger",
    name: "Bergsteiger",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="22" cy="70" r="8"/>
      <line x1="30" y1="73" x2="85" y2="95"/>
      <line x1="35" y1="78" x2="35" y2="115"/>
      <line x1="63" y1="90" x2="52" y2="102"/>
      <line x1="52" y1="102" x2="78" y2="115"/>
    `),
  },
  {
    id: "russische-drehungen",
    name: "Russische Drehungen",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="35" cy="55" r="8"/>
      <line x1="40" y1="62" x2="55" y2="95"/>
      <line x1="55" y1="95" x2="42" y2="115"/>
      <line x1="55" y1="95" x2="85" y2="92"/>
      <line x1="85" y1="92" x2="80" y2="115"/>
      <line x1="40" y1="68" x2="65" y2="78"/>
      <line x1="65" y1="78" x2="48" y2="80"/>
    `),
  },
  {
    id: "fahrrad-crunches",
    name: "Fahrrad-Crunches",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="22" cy="100" r="8"/>
      <line x1="30" y1="100" x2="62" y2="100"/>
      <line x1="42" y1="100" x2="55" y2="78"/>
      <line x1="62" y1="100" x2="48" y2="72"/>
      <line x1="48" y1="72" x2="72" y2="68"/>
      <line x1="62" y1="100" x2="88" y2="108"/>
    `),
  },
  {
    id: "beckenheben",
    name: "Beckenheben",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="18" cy="95" r="8"/>
      <line x1="26" y1="95" x2="55" y2="78"/>
      <line x1="55" y1="78" x2="72" y2="100"/>
      <line x1="72" y1="100" x2="72" y2="115"/>
      <line x1="22" y1="103" x2="38" y2="115"/>
    `),
  },
  {
    id: "superman",
    name: "Superman",
    svg: stick(`
      <line x1="10" y1="120" x2="90" y2="120"/>
      <circle cx="30" cy="80" r="8"/>
      <line x1="38" y1="82" x2="80" y2="85"/>
      <line x1="30" y1="74" x2="15" y2="58"/>
      <line x1="35" y1="76" x2="50" y2="60"/>
      <line x1="80" y1="85" x2="95" y2="65"/>
      <line x1="78" y1="88" x2="60" y2="72"/>
    `),
  },
  {
    id: "strecksprunge",
    name: "Strecksprünge",
    svg: stick(`
      <circle cx="50" cy="22" r="9"/>
      <line x1="50" y1="31" x2="50" y2="75"/>
      <line x1="50" y1="38" x2="25" y2="12"/>
      <line x1="50" y1="38" x2="75" y2="12"/>
      <line x1="50" y1="75" x2="35" y2="110"/>
      <line x1="50" y1="75" x2="65" y2="110"/>
      <line x1="10" y1="125" x2="90" y2="125"/>
    `),
  },
  {
    id: "wadenheben",
    name: "Wadenheben",
    svg: stick(`
      <line x1="10" y1="125" x2="90" y2="125"/>
      <circle cx="50" cy="22" r="9"/>
      <line x1="50" y1="31" x2="50" y2="78"/>
      <line x1="50" y1="45" x2="32" y2="58"/>
      <line x1="50" y1="45" x2="68" y2="58"/>
      <line x1="50" y1="78" x2="40" y2="115"/>
      <line x1="50" y1="78" x2="60" y2="115"/>
      <line x1="40" y1="115" x2="50" y2="122"/>
      <line x1="60" y1="115" x2="50" y2="122"/>
    `),
  },
  {
    id: "bird-dog",
    name: "Bird Dog",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="30" cy="70" r="8"/>
      <line x1="38" y1="72" x2="72" y2="78"/>
      <line x1="38" y1="76" x2="25" y2="115"/>
      <line x1="72" y1="80" x2="72" y2="115"/>
      <line x1="28" y1="62" x2="8" y2="55"/>
      <line x1="72" y1="78" x2="95" y2="65"/>
    `),
  },
  {
    id: "ausfallschritte-rueckwaerts",
    name: "Ausfallschritte rückwärts",
    svg: stick(`
      <circle cx="55" cy="25" r="9"/>
      <line x1="55" y1="34" x2="55" y2="75"/>
      <line x1="55" y1="45" x2="38" y2="55"/>
      <line x1="55" y1="45" x2="72" y2="55"/>
      <line x1="55" y1="75" x2="75" y2="115"/>
      <line x1="75" y1="115" x2="75" y2="130"/>
      <line x1="55" y1="75" x2="22" y2="110"/>
      <line x1="22" y1="110" x2="15" y2="130"/>
    `),
  },
  {
    id: "seitliche-ausfallschritte",
    name: "Seitliche Ausfallschritte",
    svg: stick(`
      <line x1="8" y1="125" x2="92" y2="125"/>
      <circle cx="50" cy="22" r="9"/>
      <line x1="50" y1="31" x2="50" y2="80"/>
      <line x1="50" y1="45" x2="32" y2="65"/>
      <line x1="50" y1="45" x2="68" y2="65"/>
      <line x1="50" y1="80" x2="20" y2="120"/>
      <line x1="20" y1="120" x2="14" y2="125"/>
      <line x1="50" y1="80" x2="85" y2="120"/>
      <line x1="85" y1="120" x2="90" y2="125"/>
    `),
  },
  {
    id: "plank-jacks",
    name: "Plank Jacks",
    svg: stick(`
      <line x1="5" y1="115" x2="95" y2="115"/>
      <circle cx="20" cy="70" r="8"/>
      <line x1="28" y1="73" x2="78" y2="92"/>
      <line x1="33" y1="78" x2="15" y2="115"/>
      <line x1="73" y1="90" x2="95" y2="115"/>
    `),
  },
  {
    id: "baerengang",
    name: "Bärengang",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="22" cy="78" r="8"/>
      <line x1="30" y1="78" x2="55" y2="60"/>
      <line x1="55" y1="60" x2="80" y2="78"/>
      <line x1="32" y1="82" x2="22" y2="115"/>
      <line x1="80" y1="80" x2="88" y2="115"/>
      <line x1="55" y1="60" x2="52" y2="92"/>
      <line x1="52" y1="92" x2="58" y2="115"/>
    `),
  },
  {
    id: "eselskick",
    name: "Eselskick",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="22" cy="78" r="8"/>
      <line x1="30" y1="80" x2="62" y2="86"/>
      <line x1="30" y1="84" x2="22" y2="115"/>
      <line x1="62" y1="88" x2="62" y2="115"/>
      <line x1="62" y1="86" x2="85" y2="55"/>
      <line x1="85" y1="55" x2="92" y2="68"/>
    `),
  },
  {
    id: "diamant-liegestuetze",
    name: "Diamant-Liegestütze",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="20" cy="70" r="8"/>
      <line x1="28" y1="73" x2="85" y2="95"/>
      <line x1="40" y1="80" x2="48" y2="108"/>
      <line x1="48" y1="108" x2="55" y2="108"/>
      <line x1="55" y1="108" x2="45" y2="80"/>
      <line x1="75" y1="92" x2="75" y2="115"/>
    `),
  },
  {
    id: "beinheben",
    name: "Beinheben",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="15" cy="100" r="8"/>
      <line x1="23" y1="100" x2="62" y2="100"/>
      <line x1="62" y1="100" x2="78" y2="50"/>
      <line x1="15" y1="92" x2="8" y2="78"/>
      <line x1="15" y1="92" x2="22" y2="78"/>
    `),
  },
  {
    id: "flatterkicks",
    name: "Flatterkicks",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="15" cy="100" r="8"/>
      <line x1="23" y1="100" x2="58" y2="100"/>
      <line x1="58" y1="100" x2="88" y2="78"/>
      <line x1="58" y1="100" x2="90" y2="110"/>
      <line x1="15" y1="92" x2="8" y2="80"/>
    `),
  },
  {
    id: "v-ups",
    name: "V-Ups",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="22" cy="55" r="8"/>
      <line x1="27" y1="62" x2="55" y2="95"/>
      <line x1="55" y1="95" x2="82" y2="55"/>
      <line x1="27" y1="58" x2="55" y2="85"/>
    `),
  },
  {
    id: "skater-spruenge",
    name: "Skater-Sprünge",
    svg: stick(`
      <line x1="10" y1="125" x2="90" y2="125"/>
      <circle cx="42" cy="25" r="9"/>
      <line x1="44" y1="34" x2="55" y2="70"/>
      <line x1="44" y1="42" x2="22" y2="62"/>
      <line x1="44" y1="42" x2="68" y2="32"/>
      <line x1="55" y1="70" x2="38" y2="105"/>
      <line x1="38" y1="105" x2="32" y2="125"/>
      <line x1="55" y1="70" x2="82" y2="92"/>
    `),
  },
  {
    id: "schattenboxen",
    name: "Schattenboxen",
    svg: stick(`
      <line x1="10" y1="125" x2="90" y2="125"/>
      <circle cx="45" cy="25" r="9"/>
      <line x1="45" y1="34" x2="48" y2="78"/>
      <line x1="45" y1="42" x2="82" y2="38"/>
      <line x1="45" y1="45" x2="38" y2="55"/>
      <line x1="38" y1="55" x2="48" y2="62"/>
      <line x1="48" y1="78" x2="32" y2="108"/>
      <line x1="32" y1="108" x2="28" y2="125"/>
      <line x1="48" y1="78" x2="62" y2="105"/>
      <line x1="62" y1="105" x2="58" y2="125"/>
    `),
  },
];

export const EXERCISE_BY_ID = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const CLASSIC_EXERCISE_IDS = [
  "hampelmann",
  "wandsitzen",
  "liegestuetze",
  "bauchpressen",
  "auf-den-stuhl-steigen",
  "kniebeugen",
  "trizeps-dips",
  "unterarmstuetz",
  "hoher-kniehebelauf",
  "ausfallschritte",
  "liegestuetze-rotation",
  "seitlicher-unterarmstuetz",
];

export const PREPARE_SECONDS = 10;
export const WORK_SECONDS = 30;
export const REST_SECONDS = 10;
