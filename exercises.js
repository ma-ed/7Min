const stick = (extra) => `
<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none">
  ${extra}
</svg>`;

export const EXERCISES = [
  {
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
    name: "Seitlicher Unterarmstütz",
    svg: stick(`
      <line x1="10" y1="115" x2="90" y2="115"/>
      <circle cx="25" cy="60" r="8"/>
      <line x1="20" y1="115" x2="28" y2="68"/>
      <line x1="32" y1="65" x2="85" y2="110"/>
      <line x1="50" y1="80" x2="50" y2="55"/>
    `),
  },
];

export const PREPARE_SECONDS = 10;
export const WORK_SECONDS = 30;
export const REST_SECONDS = 10;
