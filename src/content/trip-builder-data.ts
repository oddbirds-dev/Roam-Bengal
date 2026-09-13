/** Static dataset behind the homepage trip builder — areas grouped by region plus a
 *  handful of preset combos. Hardcoded rather than admin-editable content because it
 *  changes rarely and pairs tightly with the picker's layout/copy. */

export interface TripBuilderArea {
  id: string;
  label: string;
  region: string;
  /** Typical length this area adds to an itinerary, used for the running total estimate. */
  days: number;
  blurb: string;
}

export interface TripBuilderPreset {
  id: string;
  label: string;
  sublabel: string;
  areaIds: string[];
}

export const TRIP_BUILDER_REGIONS = [
  "Dhaka & Central",
  "Barisal & The Rivers",
  "Khulna & Sundarbans",
  "Rajshahi Region",
  "Sylhet & Tea Gardens",
  "Chittagong & The Hills",
] as const;

export const TRIP_BUILDER_AREAS: TripBuilderArea[] = [
  {
    id: "dhaka",
    label: "Dhaka",
    region: "Dhaka & Central",
    days: 1,
    blurb: "Lalbagh Fort, Old Dhaka bazaars, Buriganga boats",
  },
  {
    id: "sonargaon",
    label: "Sonargaon & Panam Nagar",
    region: "Dhaka & Central",
    days: 1,
    blurb: "Old capital, abandoned merchant city, Meghna char",
  },
  {
    id: "dhaka-archaeology",
    label: "Dhaka Archaeological Sites",
    region: "Dhaka & Central",
    days: 1,
    blurb: "Mughal forts and mosques, Ahsan Manzil, National Museum",
  },
  {
    id: "dhaka-photography",
    label: "Dhaka Photography Trail",
    region: "Dhaka & Central",
    days: 1,
    blurb: "Sadarghat dawn, rickshaw art, markets at full pace",
  },
  {
    id: "brass-pottery",
    label: "Brass & Pottery Villages",
    region: "Dhaka & Central",
    days: 1,
    blurb: "Dhamrai brass casting, village potters at the wheel",
  },
  {
    id: "overnight-river",
    label: "Overnight River Cruise",
    region: "Barisal & The Rivers",
    days: 1,
    blurb: "Dhaka → Barisal, AC first-class cabin",
  },
  {
    id: "barisal-backwaters",
    label: "Barisal Backwaters",
    region: "Barisal & The Rivers",
    days: 2,
    blurb: "Floating guava markets, canals, timber bazaars",
  },
  {
    id: "bagerhat",
    label: "Bagerhat",
    region: "Khulna & Sundarbans",
    days: 1,
    blurb: "UNESCO mosque city, 60 Dome Mosque",
  },
  {
    id: "sundarbans",
    label: "Sundarbans",
    region: "Khulna & Sundarbans",
    days: 3,
    blurb: "Private houseboat, Kotka, Jamtola Beach, tigers",
  },
  {
    id: "puthia",
    label: "Puthia Temple Complex",
    region: "Rajshahi Region",
    days: 1,
    blurb: "Terracotta temples, Rajbari, Rajshahi silk",
  },
  {
    id: "natore-bagha",
    label: "Natore & Bagha",
    region: "Rajshahi Region",
    days: 1,
    blurb: "Rajbari palaces, Bagha Mosque, Padma sunset boat",
  },
  {
    id: "gaur",
    label: "Gaur (Chapainawabganj)",
    region: "Rajshahi Region",
    days: 1,
    blurb: "Medieval capital, Choto Sona Mosque, Tahkhana",
  },
  {
    id: "rajshahi-city",
    label: "Rajshahi City",
    region: "Rajshahi Region",
    days: 1,
    blurb: "Varendra Museum, stone Sultanate mosque",
  },
  {
    id: "paharpur",
    label: "Paharpur",
    region: "Rajshahi Region",
    days: 1,
    blurb: "UNESCO Somapura Mahavihara, largest monastery",
  },
  {
    id: "sreemangal",
    label: "Sreemangal Tea Gardens",
    region: "Sylhet & Tea Gardens",
    days: 2,
    blurb: "Rolling tea estates, seven-layer tea, Lawachara forest",
  },
  {
    id: "chittagong",
    label: "Chittagong",
    region: "Chittagong & The Hills",
    days: 1,
    blurb: "Port city heritage, Ethnological Museum, hill views",
  },
  {
    id: "bandarban",
    label: "Bandarban",
    region: "Chittagong & The Hills",
    days: 2,
    blurb: "Hill tribes, Nilgiri viewpoint, Golden Temple",
  },
];

export const TRIP_BUILDER_PRESETS: TripBuilderPreset[] = [
  {
    id: "first-time",
    label: "First time in Bangladesh",
    sublabel: "The classic loop",
    areaIds: ["dhaka", "sonargaon", "bagerhat", "sundarbans", "sreemangal", "chittagong", "bandarban"],
  },
  {
    id: "archaeology-heritage",
    label: "Archaeology & heritage",
    sublabel: "UNESCO sites, ruins, temples",
    areaIds: ["dhaka-archaeology", "sonargaon", "bagerhat", "puthia", "natore-bagha", "gaur", "paharpur"],
  },
  {
    id: "nature-wildlife",
    label: "Nature & wildlife",
    sublabel: "Forest, tigers, tea, birds",
    areaIds: ["sundarbans", "sreemangal", "bandarban", "barisal-backwaters"],
  },
  {
    id: "photography",
    label: "Photography trip",
    sublabel: "Rivers, ships, markets, hills",
    areaIds: ["dhaka-photography", "barisal-backwaters", "sundarbans", "bandarban", "chittagong"],
  },
];
