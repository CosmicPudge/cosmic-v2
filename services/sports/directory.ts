import type { SportKind } from "@/core/contracts/Sports";

export interface SportsDirectoryEntry {
  id: string;
  sport: SportKind;
  entityType?: "team" | "driver" | "constructor";
  name: string;
  shortName?: string;
  abbreviation?: string;
  provider?: "mlb" | "espn" | "pending";
  providerId?: string;
  season?: number;
  fullTime?: boolean;
  carNumber?: string;
  driverNumber?: string;
}

export const SPORTS_DIRECTORY_SEASON = 2026;

const team = (sport: SportKind, id: string, name: string, abbreviation?: string, provider: SportsDirectoryEntry["provider"] = "pending", providerId?: string): SportsDirectoryEntry => ({ id: `${sport}-${id}`, sport, entityType: "team", name, abbreviation, provider, providerId, season: SPORTS_DIRECTORY_SEASON });
const entries = (sport: SportKind, values: string[][], provider: SportsDirectoryEntry["provider"] = "pending") => values.map(([id, name, abbreviation, providerId]) => team(sport, id, name, abbreviation, provider, providerId));

export const sportsDirectory: SportsDirectoryEntry[] = [
  ...entries("nfl", [["cardinals", "Arizona Cardinals", "ARI", "22"], ["falcons", "Atlanta Falcons", "ATL", "1"], ["ravens", "Baltimore Ravens", "BAL", "33"], ["bills", "Buffalo Bills", "BUF", "2"], ["panthers", "Carolina Panthers", "CAR", "29"], ["bears", "Chicago Bears", "CHI", "3"], ["bengals", "Cincinnati Bengals", "CIN", "4"], ["browns", "Cleveland Browns", "CLE", "5"], ["cowboys", "Dallas Cowboys", "DAL", "6"], ["broncos", "Denver Broncos", "DEN", "7"], ["lions", "Detroit Lions", "DET", "8"], ["packers", "Green Bay Packers", "GB", "9"], ["texans", "Houston Texans", "HOU", "34"], ["colts", "Indianapolis Colts", "IND", "11"], ["jaguars", "Jacksonville Jaguars", "JAX", "30"], ["chiefs", "Kansas City Chiefs", "KC", "12"], ["raiders", "Las Vegas Raiders", "LV", "13"], ["chargers", "Los Angeles Chargers", "LAC", "24"], ["rams", "Los Angeles Rams", "LAR", "14"], ["dolphins", "Miami Dolphins", "MIA", "15"], ["vikings", "Minnesota Vikings", "MIN", "16"], ["patriots", "New England Patriots", "NE", "17"], ["saints", "New Orleans Saints", "NO", "18"], ["giants", "New York Giants", "NYG", "19"], ["jets", "New York Jets", "NYJ", "20"], ["eagles", "Philadelphia Eagles", "PHI", "21"], ["steelers", "Pittsburgh Steelers", "PIT", "23"], ["49ers", "San Francisco 49ers", "SF", "25"], ["seahawks", "Seattle Seahawks", "SEA", "26"], ["buccaneers", "Tampa Bay Buccaneers", "TB", "27"], ["titans", "Tennessee Titans", "TEN", "10"], ["commanders", "Washington Commanders", "WSH", "28"]], "espn"),
  ...entries("mlb", [["diamondbacks", "Arizona Diamondbacks", "ARI", "109"], ["braves", "Atlanta Braves", "ATL", "144"], ["orioles", "Baltimore Orioles", "BAL", "110"], ["red-sox", "Boston Red Sox", "BOS", "111"], ["cubs", "Chicago Cubs", "CHC", "112"], ["white-sox", "Chicago White Sox", "CWS", "145"], ["reds", "Cincinnati Reds", "CIN", "113"], ["guardians", "Cleveland Guardians", "CLE", "114"], ["rockies", "Colorado Rockies", "COL", "115"], ["tigers", "Detroit Tigers", "DET", "116"], ["astros", "Houston Astros", "HOU", "117"], ["royals", "Kansas City Royals", "KC", "118"], ["angels", "Los Angeles Angels", "LAA", "108"], ["dodgers", "Los Angeles Dodgers", "LAD", "119"], ["marlins", "Miami Marlins", "MIA", "146"], ["brewers", "Milwaukee Brewers", "MIL", "158"], ["twins", "Minnesota Twins", "MIN", "142"], ["mets", "New York Mets", "NYM", "121"], ["yankees", "New York Yankees", "NYY", "147"], ["athletics", "Athletics", "OAK", "133"], ["phillies", "Philadelphia Phillies", "PHI", "143"], ["pirates", "Pittsburgh Pirates", "PIT", "134"], ["padres", "San Diego Padres", "SD", "135"], ["giants", "San Francisco Giants", "SF", "137"], ["mariners", "Seattle Mariners", "SEA", "136"], ["cardinals", "St. Louis Cardinals", "STL", "138"], ["rays", "Tampa Bay Rays", "TB", "139"], ["rangers", "Texas Rangers", "TEX", "140"], ["blue-jays", "Toronto Blue Jays", "TOR", "141"], ["nationals", "Washington Nationals", "WSH", "120"]], "mlb"),
  ...entries("nba", [["hawks", "Atlanta Hawks", "ATL"], ["celtics", "Boston Celtics", "BOS"], ["nets", "Brooklyn Nets", "BKN"], ["hornets", "Charlotte Hornets", "CHA"], ["bulls", "Chicago Bulls", "CHI"], ["cavaliers", "Cleveland Cavaliers", "CLE"], ["mavericks", "Dallas Mavericks", "DAL"], ["nuggets", "Denver Nuggets", "DEN"], ["pistons", "Detroit Pistons", "DET"], ["warriors", "Golden State Warriors", "GSW"], ["rockets", "Houston Rockets", "HOU"], ["pacers", "Indiana Pacers", "IND"], ["clippers", "LA Clippers", "LAC"], ["lakers", "Los Angeles Lakers", "LAL"], ["grizzlies", "Memphis Grizzlies", "MEM"], ["heat", "Miami Heat", "MIA"], ["bucks", "Milwaukee Bucks", "MIL"], ["timberwolves", "Minnesota Timberwolves", "MIN"], ["pelicans", "New Orleans Pelicans", "NOP"], ["knicks", "New York Knicks", "NYK"], ["thunder", "Oklahoma City Thunder", "OKC"], ["magic", "Orlando Magic", "ORL"], ["76ers", "Philadelphia 76ers", "PHI"], ["suns", "Phoenix Suns", "PHX"], ["blazers", "Portland Trail Blazers", "POR"], ["kings", "Sacramento Kings", "SAC"], ["spurs", "San Antonio Spurs", "SAS"], ["raptors", "Toronto Raptors", "TOR"], ["jazz", "Utah Jazz", "UTA"], ["wizards", "Washington Wizards", "WAS"]]),
  ...entries("mls", [["atlanta", "Atlanta United", "ATL"], ["austin", "Austin FC", "ATX"], ["charlotte", "Charlotte FC", "CLT"], ["chicago", "Chicago Fire FC", "CHI"], ["cincinnati", "FC Cincinnati", "CIN"], ["colorado", "Colorado Rapids", "COL"], ["columbus", "Columbus Crew", "CLB"], ["dallas", "FC Dallas", "DAL"], ["dc", "D.C. United", "DC"], ["houston", "Houston Dynamo FC", "HOU"], ["miami", "Inter Miami CF", "MIA"], ["lafc", "Los Angeles FC", "LAFC"], ["galaxy", "LA Galaxy", "LA"], ["minnesota", "Minnesota United FC", "MIN"], ["montreal", "CF Montréal", "MTL"], ["nashville", "Nashville SC", "NSH"], ["new-england", "New England Revolution", "NE"], ["nycfc", "New York City FC", "NYC"], ["red-bulls", "New York Red Bulls", "RBNY"], ["orlando", "Orlando City SC", "ORL"], ["philadelphia", "Philadelphia Union", "PHI"], ["portland", "Portland Timbers", "POR"], ["real-salt-lake", "Real Salt Lake", "RSL"], ["san-diego", "San Diego FC", "SD"], ["san-jose", "San Jose Earthquakes", "SJ"], ["seattle", "Seattle Sounders FC", "SEA"], ["sporting-kc", "Sporting Kansas City", "SKC"], ["st-louis", "St. Louis CITY SC", "STL"], ["toronto", "Toronto FC", "TOR"], ["vancouver", "Vancouver Whitecaps FC", "VAN"]]),
  team("college-football", "usu", "Utah State Aggies", undefined, "espn", "328"),
];

const driver = (id: string, name: string, carNumber: string): SportsDirectoryEntry => ({ id: ["kyle-larson", "ryan-blaney", "chase-elliott"].includes(id) ? id : `nascar-${id}`, sport: "nascar", entityType: "driver", name, shortName: name.replace(/\s+(Jr\.|Jr|III)$/, ""), carNumber, season: SPORTS_DIRECTORY_SEASON, fullTime: true });
const f1Driver = (id: string, name: string, driverNumber: string): SportsDirectoryEntry => ({ id, sport: "f1", entityType: "driver", name, shortName: name.split(" ").at(-1), driverNumber, season: SPORTS_DIRECTORY_SEASON });
const constructor = (id: string, name: string): SportsDirectoryEntry => ({ id, sport: "f1", entityType: "constructor", name, season: SPORTS_DIRECTORY_SEASON });

export const f1Drivers: SportsDirectoryEntry[] = [
  f1Driver("george-russell", "George Russell", "63"), f1Driver("kimi-antonelli", "Kimi Antonelli", "12"), f1Driver("charles-leclerc", "Charles Leclerc", "16"), f1Driver("lewis-hamilton", "Lewis Hamilton", "44"),
  f1Driver("lando-norris", "Lando Norris", "1"), f1Driver("oscar-piastri", "Oscar Piastri", "81"), f1Driver("max-verstappen", "Max Verstappen", "3"), f1Driver("isack-hadjar", "Isack Hadjar", "6"),
  f1Driver("liam-lawson", "Liam Lawson", "30"), f1Driver("arvid-lindblad", "Arvid Lindblad", "41"), f1Driver("pierre-gasly", "Pierre Gasly", "10"), f1Driver("franco-colapinto", "Franco Colapinto", "43"),
  f1Driver("esteban-ocon", "Esteban Ocon", "31"), f1Driver("oliver-bearman", "Oliver Bearman", "87"), f1Driver("nico-hulkenberg", "Nico Hulkenberg", "27"), f1Driver("gabriel-bortoleto", "Gabriel Bortoleto", "5"),
  f1Driver("carlos-sainz", "Carlos Sainz", "55"), f1Driver("alex-albon", "Alexander Albon", "23"), f1Driver("fernando-alonso", "Fernando Alonso", "14"), f1Driver("lance-stroll", "Lance Stroll", "18"),
  f1Driver("sergio-perez", "Sergio Perez", "11"), f1Driver("valtteri-bottas", "Valtteri Bottas", "77"),
];

export const f1Constructors: SportsDirectoryEntry[] = [
  constructor("mercedes", "Mercedes"), constructor("ferrari", "Ferrari"), constructor("mclaren", "McLaren"), constructor("red-bull-racing", "Red Bull Racing"),
  constructor("racing-bulls", "Racing Bulls"), constructor("alpine", "Alpine"), constructor("haas-f1-team", "Haas F1 Team"), constructor("audi", "Audi"),
  constructor("williams", "Williams"), constructor("aston-martin", "Aston Martin"), constructor("cadillac", "Cadillac"),
];

export const nascarDrivers: SportsDirectoryEntry[] = [
  driver("aj-allmendinger", "AJ Allmendinger", "16"), driver("christopher-bell", "Christopher Bell", "20"), driver("josh-berry", "Josh Berry", "21"), driver("ryan-blaney", "Ryan Blaney", "12"),
  driver("alex-bowman", "Alex Bowman", "48"), driver("chase-briscoe", "Chase Briscoe", "19"), driver("chris-buescher", "Chris Buescher", "17"), driver("william-byron", "William Byron", "24"),
  driver("ross-chastain", "Ross Chastain", "1"), driver("austin-cindric", "Austin Cindric", "2"), driver("cole-custer", "Cole Custer", "41"), driver("ty-dillon", "Ty Dillon", "10"),
  driver("austin-dillon", "Austin Dillon", "3"), driver("chase-elliott", "Chase Elliott", "9"), driver("ty-gibbs", "Ty Gibbs", "54"), driver("todd-gilliland", "Todd Gilliland", "34"),
  driver("noah-gragson", "Noah Gragson", "4"), driver("denny-hamlin", "Denny Hamlin", "11"), driver("riley-herbst", "Riley Herbst", "35"), driver("carson-hocevar", "Carson Hocevar", "77"),
  driver("erik-jones", "Erik Jones", "43"), driver("brad-keselowski", "Brad Keselowski", "6"), driver("kyle-larson", "Kyle Larson", "5"), driver("joey-logano", "Joey Logano", "22"),
  driver("michael-mcdowell", "Michael McDowell", "71"), driver("john-hunter-nemechek", "John Hunter Nemechek", "42"), driver("ryan-preece", "Ryan Preece", "60"), driver("tyler-reddick", "Tyler Reddick", "45"),
  driver("zane-smith", "Zane Smith", "38"), driver("ricky-stenhouse-jr", "Ricky Stenhouse Jr.", "47"), driver("daniel-suarez", "Daniel Suárez", "7"), driver("shane-van-gisbergen", "Shane van Gisbergen", "97"),
  driver("bubba-wallace", "Bubba Wallace", "23"), driver("cody-ware", "Cody Ware", "51"), driver("connor-zilisch", "Connor Zilisch", "88"),
];

/** The complete local discovery index used by settings and global search. */
export const allSportsDirectoryEntries: SportsDirectoryEntry[] = [
  ...sportsDirectory,
  ...f1Drivers,
  ...f1Constructors,
  ...nascarDrivers,
];

export function validateSportsDirectory(entriesToCheck: SportsDirectoryEntry[] = [...sportsDirectory, ...f1Drivers, ...f1Constructors, ...nascarDrivers]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const providerIds = new Set<string>();
  for (const entry of entriesToCheck) {
    if (ids.has(entry.id)) errors.push(`duplicate id: ${entry.id}`);
    ids.add(entry.id);
    if (!entry.name.trim()) errors.push(`missing name: ${entry.id}`);
    if (entry.providerId && (entry.sport === "nfl" || entry.sport === "mlb")) {
      const providerKey = `${entry.sport}:${entry.providerId}`;
      if (providerIds.has(providerKey)) errors.push(`duplicate provider id: ${providerKey}`);
      providerIds.add(providerKey);
    }
    if ((entry.sport === "f1" || entry.sport === "nascar") && entry.entityType !== "driver" && entry.sport === "nascar") errors.push(`invalid NASCAR entity: ${entry.id}`);
  }
  return errors;
}

export const sportsDirectoryBySport = (sport: SportKind) => sportsDirectory.filter((entry) => entry.sport === sport);
