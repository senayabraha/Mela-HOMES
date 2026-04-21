export const LISTING_TYPES = ['For Sale', 'For Rent'];
export const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Studio', 'Townhouse', 'Land', 'Commercial', 'Office'];
export const ACCOUNT_ROLES = ['buyer', 'owner', 'agent', 'broker', 'developer'];
export const LISTING_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Sold', value: 'sold' },
  { label: 'Rented', value: 'rented' },
];
export const FURNISHED_OPTIONS = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
export const CONDITIONS = ['new', 'used', 'renovated'];
export const FEATURES = ['Parking', 'Garden', 'Security', 'Balcony', 'Elevator', 'Backup Generator', 'Water Tank', 'CCTV', 'Gym', 'Pool'];
export const COUNTRIES = ['Ethiopia', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Djibouti', 'Somalia', 'South Sudan'];
export const CURRENCIES = ['ETB', 'KES', 'UGX', 'TZS', 'RWF', 'USD'];
export const COUNTRY_LIST = COUNTRIES;
export const COUNTRIES_DATA = {
  Ethiopia: { flag: 'ET', currency: 'ETB', regions: ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'South Ethiopia', 'South West Ethiopia', 'Tigray', 'Central Ethiopia'] },
  Kenya: { flag: 'KE', currency: 'KES', regions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu', 'Machakos', 'Kajiado', 'Kilifi', 'Meru', 'Nyeri', 'Kakamega'] },
  Uganda: { flag: 'UG', currency: 'UGX', regions: ['Central', 'Eastern', 'Northern', 'Western'] },
  Tanzania: { flag: 'TZ', currency: 'TZS', regions: ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga'] },
  Rwanda: { flag: 'RW', currency: 'RWF', regions: ['Kigali', 'Eastern', 'Northern', 'Southern', 'Western'] },
  Djibouti: { flag: 'DJ', currency: 'DJF', regions: ['Djibouti', 'Ali Sabieh', 'Dikhil', 'Tadjourah', 'Obock', 'Arta'] },
  Somalia: { flag: 'SO', currency: 'SOS', regions: ['Banadir', 'Awdal', 'Bari', 'Bay', 'Mudug', 'Nugaal', 'Woqooyi Galbeed'] },
  'South Sudan': { flag: 'SS', currency: 'SSP', regions: ['Central Equatoria', 'Eastern Equatoria', 'Jonglei', 'Unity', 'Upper Nile', 'Lakes', 'Warrap'] },
};
export const CITIES_BY_COUNTRY_REGION = {
  'Ethiopia|Addis Ababa': ['Addis Ababa'],
  'Ethiopia|Amhara': ['Bahir Dar', 'Gondar', 'Dessie', 'Debre Birhan', 'Lalibela', 'Debre Markos', 'Woldia', 'Kombolcha'],
  'Ethiopia|Oromia': ['Adama', 'Jimma', 'Bishoftu', 'Shashemene', 'Sebeta', 'Nekemte', 'Asella', 'Ambo', 'Burayu', 'Holeta', 'Woliso'],
  'Ethiopia|Sidama': ['Hawassa'],
  'Ethiopia|South Ethiopia': ['Arba Minch', 'Wolaita Sodo', 'Dilla', 'Hosaena'],
  'Ethiopia|Tigray': ['Mekelle', 'Adigrat', 'Axum', 'Shire', 'Adwa'],
  'Ethiopia|Dire Dawa': ['Dire Dawa'],
  'Ethiopia|Harari': ['Harar'],
  'Ethiopia|Afar': ['Semera', 'Logia', 'Chifra'],
  'Ethiopia|Somali': ['Jigjiga', 'Gode', 'Dolo Odo'],
  'Kenya|Nairobi': ['Nairobi'],
  'Kenya|Mombasa': ['Mombasa'],
  'Kenya|Kisumu': ['Kisumu'],
  'Kenya|Nakuru': ['Nakuru', 'Naivasha', 'Gilgil'],
  'Kenya|Kiambu': ['Thika', 'Kiambu', 'Ruiru', 'Limuru', 'Githunguri'],
  'Kenya|Uasin Gishu': ['Eldoret', 'Turbo', 'Moiben'],
  'Kenya|Machakos': ['Machakos', 'Athi River', 'Kangundo'],
  'Uganda|Central': ['Kampala', 'Entebbe', 'Wakiso', 'Mukono', 'Jinja'],
  'Uganda|Eastern': ['Jinja', 'Mbale', 'Tororo', 'Iganga'],
  'Uganda|Northern': ['Gulu', 'Lira', 'Arua'],
  'Uganda|Western': ['Mbarara', 'Kasese', 'Fort Portal', 'Masindi'],
  'Tanzania|Dar es Salaam': ['Dar es Salaam'],
  'Tanzania|Arusha': ['Arusha', 'Moshi'],
  'Tanzania|Mwanza': ['Mwanza'],
  'Tanzania|Dodoma': ['Dodoma'],
  'Rwanda|Kigali': ['Kigali'],
  'Rwanda|Eastern': ['Rwamagana', 'Nyagatare', 'Kibungo'],
  'Rwanda|Southern': ['Huye', 'Muhanga', 'Ruhango'],
  'Rwanda|Northern': ['Musanze', 'Byumba'],
  'Rwanda|Western': ['Rubavu', 'Rusizi', 'Karongi'],
  'Djibouti|Djibouti': ['Djibouti'],
  'Djibouti|Ali Sabieh': ['Ali Sabieh'],
  'Somalia|Banadir': ['Mogadishu'],
  'Somalia|Woqooyi Galbeed': ['Hargeisa', 'Berbera'],
};
export const AREAS_BY_COUNTRY_CITY = {
  'Ethiopia|Addis Ababa': ['Alem Bank', 'Arat Kilo', 'Ayat', 'Bole', 'CMC', 'Gerji', 'Jemo', 'Kazanchis', 'Mexico', 'Old Airport', 'Piazza', 'Sarbet', 'Summit', 'Yeka'],
  'Ethiopia|Bahir Dar': ['Abay Mado', 'Ghion', 'Shimbit', 'Stadium Area', 'Tana Sub-City'],
  'Ethiopia|Gondar': ['Azezo', 'Fasil Ghebbi Area', 'Maraki', 'Piazza Gondar', 'University Area'],
  'Ethiopia|Adama': ['Adama City Center', 'Boku', 'Industrial Area', 'Nazret', 'Stadium Area'],
  'Ethiopia|Jimma': ['Jimma City Center', 'Jiren', 'Merkato Jimma', 'Stadium Area', 'University Area'],
  'Ethiopia|Hawassa': ['Lake Side', 'Mehal Ketema', 'Piassa Hawassa', 'Secha', 'University Area'],
  'Ethiopia|Mekelle': ['Adi Haki', 'Ayder', 'Hadnet', 'Quiha', 'University Area'],
  'Ethiopia|Dire Dawa': ['Addis Ketema', 'Kezira', 'Legehare', 'Railway Area', 'Sabian'],
  'Kenya|Nairobi': ['CBD', 'Karen', 'Kilimani', 'Kileleshwa', 'Lavington', 'Parklands', 'Runda', 'Westlands'],
  'Kenya|Mombasa': ['Bamburi', 'Kisauni', 'Nyali', 'Old Town', 'Tudor'],
  'Kenya|Kisumu': ['Kisumu CBD', 'Milimani', 'Mamboleo', 'Migosi'],
  'Uganda|Kampala': ['Bugolobi', 'Bukoto', 'Kololo', 'Muyenga', 'Nakasero', 'Ntinda'],
  'Uganda|Entebbe': ['Airport Zone', 'Bugonga', 'Entebbe Town', 'Katabi'],
  'Tanzania|Dar es Salaam': ['Kariakoo', 'Masaki', 'Mikocheni', 'Msasani', 'Oyster Bay', 'Upanga'],
  'Tanzania|Arusha': ['Arusha CBD', 'Njiro', 'Sanawari', 'Sekei'],
  'Rwanda|Kigali': ['Kacyiru', 'Kibagabaga', 'Kimihurura', 'Kimironko', 'Remera'],
  'Djibouti|Djibouti': ['Arhiba', 'Balbala', 'Gabode', 'Port Area'],
  'Somalia|Mogadishu': ['Hodan', 'Karaan', 'Shangani', 'Waberi', 'Wadajir'],
};
export const CURRENCY_BY_COUNTRY = {
  Ethiopia: 'ETB',
  Kenya: 'KES',
  Uganda: 'UGX',
  Tanzania: 'TZS',
  Rwanda: 'RWF',
  Djibouti: 'DJF',
  Somalia: 'SOS',
  'South Sudan': 'SSP',
};
export const FILTER_SECTIONS = ['Location', 'Listing type', 'Property type', 'Price & payment', 'Bedrooms', 'Bathrooms', 'Size', 'Furnishing', 'Condition', 'Features'];
export const PRICE_MIN_BOUND = 0;
export const PRICE_MAX_BOUND = 100000000;
export const SIZE_MIN_BOUND = 0;
export const SIZE_MAX_BOUND = 5000;
export const SELL_DRAFT_KEY = 'mela_homes_listing_draft';
export const MAX_LISTING_PHOTOS = 10;
export const LISTING_STEP_KEYS = ['details', 'location', 'photos', 'review'];
export const LISTING_STEP_LABELS = {
  details: 'Details',
  location: 'Location',
  photos: 'Photos',
  review: 'Review',
};

export const INITIAL_FILTERS = {
  listingType: '',
  propertyType: '',
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  bathrooms: null,
  country: 'Ethiopia',
  region: null,
  city: null,
  area: null,
  furnished: null,
  condition: null,
  sizeMin: null,
  sizeMax: null,
  rentPeriod: null,
  petFriendly: false,
  familyOnly: false,
  studentsAllowed: false,
  shortTermAllowed: false,
  longTermPreferred: false,
  utilitiesIncluded: false,
  availableNow: false,
  depositRequired: false,
  financingAvailable: false,
  negotiable: false,
  exchangeAccepted: false,
  titleDeedAvailable: false,
  byOwner: false,
  byAgent: false,
  landSizeMin: null,
  landSizeMax: null,
  yearBuiltMin: null,
  yearBuiltMax: null,
  features: null,
};

export const INITIAL_FORM = {
  title: '',
  propertyType: 'Apartment',
  listingType: 'For Sale',
  bedrooms: '',
  bathrooms: '',
  sizeSqm: '',
  floor: '',
  totalFloors: '',
  furnished: '',
  parking: false,
  garden: false,
  rentPeriod: '',
  price: '',
  currency: 'ETB',
  condition: 'used',
  country: 'Ethiopia',
  region: '',
  city: '',
  area: '',
  location: '',
  landmark: '',
  description: '',
  features: [],
  negotiable: false,
  financingAvailable: false,
  exchangeAccepted: false,
  photos: [],
};
