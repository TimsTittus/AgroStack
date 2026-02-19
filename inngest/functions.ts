import { inngest } from "./client";
import { facebook_createPost } from "@/platform/facebook/core";

// ───────────────────────────────────────────────
// Randomization utilities
// ───────────────────────────────────────────────

/** Returns a random integer between min and max (inclusive). */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Returns a random float between min and max, rounded to `decimals` places. */
function randFloat(min: number, max: number, decimals = 1): number {
  const val = Math.random() * (max - min) + min;
  const factor = 10 ** decimals;
  return Math.round(val * factor) / factor;
}

/** Pick a random element from an array. */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Pick N unique random elements from an array. */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/** Generate a trend indicator with a random percentage. */
function trend(): string {
  const direction = pick(["up", "down", "stable"] as const);
  if (direction === "stable") return pick(["🟢 Stable", "⚪ Stable"]);
  const pct = randFloat(0.5, 4.5, 1);
  return direction === "up" ? `📈 Up ${pct}%` : `🔴 Down ${pct}%`;
}

/** Format the current date as DD-MMM-YYYY (e.g. 19-Feb-2026). */
function formattedDate(): string {
  const d = new Date();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = String(d.getDate()).padStart(2, "0");
  return `${day}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

// ───────────────────────────────────────────────
// Data pools – ranges derived from existing values
// ───────────────────────────────────────────────

interface CommodityConfig {
  name: string;
  unit: string;
  minPrice: number;
  maxPrice: number;
  locations: readonly string[];
}

const COMMODITIES: readonly CommodityConfig[] = [
  { name: "Coconut (Big)", unit: "quintal", minPrice: 5800, maxPrice: 6800, locations: ["Chengannur", "Alappuzha", "Thrissur", "Ernakulam"] },
  { name: "Paddy (Common)", unit: "quintal", minPrice: 2900, maxPrice: 3500, locations: ["Pulpally, Wayanad", "Palakkad", "Kuttanad, Alappuzha", "Mananthavady"] },
  { name: "Coconut (Other)", unit: "quintal", minPrice: 6500, maxPrice: 7800, locations: ["Manjeswaram", "Kannur", "Kasaragod", "Kozhikode"] },
  { name: "Nutmeg (With Shell)", unit: "kg", minPrice: 260, maxPrice: 340, locations: ["Cochin", "Idukki", "Ernakulam", "Thodupuzha"] },
  { name: "Raw Rubber (RSS-4)", unit: "kg", minPrice: 170, maxPrice: 200, locations: ["Kottayam", "Kochi", "Changanassery"] },
  { name: "Black Pepper", unit: "kg", minPrice: 540, maxPrice: 680, locations: ["Idukki", "Wayanad", "Kochi"] },
  { name: "Cardamom (Small)", unit: "kg", minPrice: 1100, maxPrice: 1500, locations: ["Idukki", "Vandanmedu", "Bodinayakanur"] },
  { name: "Banana (Nendran)", unit: "quintal", minPrice: 3000, maxPrice: 4200, locations: ["Thrissur", "Kozhikode", "Wayanad"] },
] as const;

const FORECASTS = [
  "Partly sunny during the day, partly cloudy at night.",
  "Clear skies expected across most districts.",
  "Overcast conditions with occasional drizzle in the evenings.",
  "Warm and humid throughout the day, clearing by night.",
  "Scattered thunderstorms possible in the afternoon.",
  "Mostly cloudy with brief spells of sunshine.",
] as const;

const RAIN_DISTRICTS = [
  "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha",
  "Kottayam", "Idukki", "Ernakulam", "Thrissur", "Palakkad",
  "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod",
] as const;

const WIND_DIRECTIONS = [
  "Northwest", "Southwest", "Northeast", "Southeast", "West", "East",
] as const;

interface PestAlert {
  crop: string;
  warning: string;
  action: string;
}

const PEST_ALERTS: readonly PestAlert[] = [
  {
    crop: "Coconut",
    warning: "Watch for Bud Rot as humidity fluctuates. Ensure proper drainage in southern districts receiving light rain.",
    action: "Apply Bordeaux paste on the crown and cut surfaces to prevent Bud Rot spread.",
  },
  {
    crop: "Vegetables",
    warning: "High temperatures in North Kerala may trigger Powdery Mildew (white patches on leaves).",
    action: "Spray 0.2% Carbendazim for mildew if white spots appear on vegetable crops.",
  },
  {
    crop: "Paddy",
    warning: "Blast disease risk increases in waterlogged fields; monitor leaves for spindle-shaped lesions.",
    action: "Apply Tricyclazole 75 WP at 0.6 g/litre as a preventive spray.",
  },
  {
    crop: "Rubber",
    warning: "Abnormal Leaf Fall (ALF) may intensify if continuous rain persists for more than 3 days.",
    action: "Spray Mancozeb (0.2%) on the canopy during dry intervals to control ALF.",
  },
  {
    crop: "Banana",
    warning: "Panama Wilt reports in Thrissur belt; check for yellowing of older leaves.",
    action: "Drench soil with 1% Carbendazim and avoid planting susceptible Nendran varieties in infected plots.",
  },
  {
    crop: "Pepper",
    warning: "Quick Wilt (Phytophthora) risk high in monsoon tracts with poor drainage.",
    action: "Apply Potassium Phosphonate drench and improve drainage around vine bases.",
  },
] as const;

const DEPT_TIPS = [
  "Prices for Paddy are trending high in Wayanad; farmers are advised to check arrival volumes at Pulpally APMC before transport.",
  "Coconut procurement prices revised upward by Coconut Development Board; check updated MSP at your Krishi Bhavan.",
  "Central subsidy on micro-irrigation systems available until March 31; apply online at pmksy.gov.in.",
  "NABARD has announced concessional crop loans for Kharif 2026; visit your nearest cooperative bank for details.",
  "Kerala Agricultural University releases new high-yield paddy variety 'Jyothi-2'; seeds available at KAU centres.",
  "Organic certification support scheme open for enrollment; contact District Agricultural Office for applications.",
] as const;

const REMINDERS = [
  "Fortnightly agro-advisories are now available digitally at your local Krishi Bhavan.",
  "Next Kisan Mela scheduled for the first week of March at Thrissur Thekkinkad Maidan.",
  "Register on eNAM to access inter-state electronic mandi trading for better price discovery.",
  "Soil health cards available for collection at your nearest Primary Agricultural Cooperative Society.",
  "Free crop insurance enrollment (PMFBY) closes on Feb 28 — register at your bank branch or CSC.",
] as const;

// ───────────────────────────────────────────────
// Content builder
// ───────────────────────────────────────────────

function generateDailyContent(): string {
  const date = formattedDate();

  // Pick 5 random commodities for today's post
  const selectedCommodities = pickN(COMMODITIES, 5);
  const marketLines = selectedCommodities.map((c) => {
    const price = c.unit === "kg" ? randInt(c.minPrice, c.maxPrice) : randInt(c.minPrice, c.maxPrice);
    const priceFormatted = price >= 1000 ? price.toLocaleString("en-IN") : price.toString();
    const location = pick(c.locations);
    const indicative = c.name.includes("Rubber") ? " (Indicative)" : "";
    return `    ${c.name}: ₹${priceFormatted}/${c.unit} at ${location} (${trend()})${indicative}`;
  }).join("\n\n");

  // Weather
  const forecast = pick(FORECASTS);
  const tempHigh = randInt(30, 37);
  const tempLow = randInt(20, 25);
  const rainDistricts = pickN(RAIN_DISTRICTS, randInt(2, 4));
  const humidity = randInt(35, 75);
  const windSpeed = randInt(2, 8);
  const windDir = pick(WIND_DIRECTIONS);

  // Pest alerts – pick 2 random
  const pests = pickN(PEST_ALERTS, 2);

  // Department tips
  const tip = pick(DEPT_TIPS);
  const reminder = pick(REMINDERS);

  return `🌴 KERALA DAILY AGRI-STAT – [${date}] 🌴

Focusing on Paddy, Coconut, Rubber & more
📉 Market Rates (Mandis & Wholesale)

${marketLines}

🌦️ Kerala Weather Update

    General Forecast: ${forecast}

    Temperature: ${tempHigh}°C (High) / ${tempLow}°C (Low)

    Rain Alert: Light rain reported in ${rainDistricts.join(" and ")}. Rains likely to ${pick(["intensify", "persist", "taper off"])} across ${pick(["central", "southern", "northern"])} districts by ${pick(["tomorrow", "mid-week", "the weekend"])}.

    Humidity: ${humidity}% | Wind: ${windSpeed} mph from ${windDir}.

🐛 Pest & Crop Health Alert

    ${pests[0].crop}: ${pests[0].warning}

    ${pests[1].crop}: ${pests[1].warning}

    Action: ${pests[0].action}

🏛️ Department News & Tips

    Market Intelligence: ${tip}

    Reminder: ${reminder}`;
}

// ───────────────────────────────────────────────
// Inngest function
// ───────────────────────────────────────────────

const facebookPoster = inngest.createFunction(
  { id: "facebook-poster" },
  { cron: "* * * * *" },
  async ({ event, step }) => {
    const content = generateDailyContent();
    const result = await facebook_createPost(
      process.env.FACEBOOK_PAGE_ACCESS_TOKEN!,
      content,
    );
    return { message: result, postedContent: content };
  },
);

export const functions = [facebookPoster];