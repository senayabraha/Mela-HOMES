import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bath,
  BedDouble,
  Building2,
  Camera,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Filter,
  Heart,
  Home,
  LogOut,
  Map,
  MapPin,
  MessageCircle,
  Navigation,
  Palette,
  Pencil,
  PlusSquare,
  Ruler,
  Search,
  Share2,
  Shield,
  Star,
  Store,
  Trash2,
  UserRound,
  X,
  CalendarDays,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  createListing,
  adminDeleteListing,
  adminUpdateListing,
  adminUpdateProfile,
  adminUpdateReport,
  deleteListing,
  ensureCurrentProfile,
  getAdminStats,
  getAllListings,
  getAllReports,
  getAllUsers,
  getCurrentUser,
  getCurrentProfile,
  getCurrentUserId,
  loadThreadReadMap,
  loadUnreadMessageCount,
  loadThreadMessages,
  loadListings,
  loadMyListings,
  loadSavedIds,
  loadThreads,
  markThreadRead,
  resetPassword,
  sendThreadMessage,
  setCachedUser,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  startThreadForListing,
  toggleSaved,
  updateListing,
  updateProfile,
  uploadPhoto,
} from './lib/storage';

const PROPERTY_TYPES = ['Apartment', 'House', 'Villa', 'Townhouse', 'Studio', 'Land', 'Commercial', 'Office'];
const LISTING_TYPES = ['For Sale', 'For Rent'];
const ACCOUNT_ROLES = ['buyer', 'owner', 'agent', 'broker', 'developer'];
const LISTING_STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Sold', value: 'sold' },
  { label: 'Rented', value: 'rented' },
];
const FURNISHED_OPTIONS = ['Furnished', 'Semi-Furnished', 'Unfurnished'];
const CONDITIONS = ['new', 'used', 'renovated'];
const FEATURES = ['Parking', 'Garden', 'Security', 'Balcony', 'Elevator', 'Backup Generator', 'Water Tank', 'CCTV', 'Gym', 'Pool'];
const COUNTRIES = ['Ethiopia', 'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Djibouti', 'Somalia', 'South Sudan'];
const CURRENCIES = ['ETB', 'KES', 'UGX', 'TZS', 'RWF', 'USD'];
const COUNTRY_LIST = COUNTRIES;
const COUNTRIES_DATA = {
  Ethiopia: { flag: 'ET', currency: 'ETB', regions: ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'South Ethiopia', 'South West Ethiopia', 'Tigray', 'Central Ethiopia'] },
  Kenya: { flag: 'KE', currency: 'KES', regions: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu', 'Machakos', 'Kajiado', 'Kilifi', 'Meru', 'Nyeri', 'Kakamega'] },
  Uganda: { flag: 'UG', currency: 'UGX', regions: ['Central', 'Eastern', 'Northern', 'Western'] },
  Tanzania: { flag: 'TZ', currency: 'TZS', regions: ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Morogoro', 'Tanga'] },
  Rwanda: { flag: 'RW', currency: 'RWF', regions: ['Kigali', 'Eastern', 'Northern', 'Southern', 'Western'] },
  Djibouti: { flag: 'DJ', currency: 'DJF', regions: ['Djibouti', 'Ali Sabieh', 'Dikhil', 'Tadjourah', 'Obock', 'Arta'] },
  Somalia: { flag: 'SO', currency: 'SOS', regions: ['Banadir', 'Awdal', 'Bari', 'Bay', 'Mudug', 'Nugaal', 'Woqooyi Galbeed'] },
  'South Sudan': { flag: 'SS', currency: 'SSP', regions: ['Central Equatoria', 'Eastern Equatoria', 'Jonglei', 'Unity', 'Upper Nile', 'Lakes', 'Warrap'] },
};
const CITIES_BY_COUNTRY_REGION = {
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
const AREAS_BY_COUNTRY_CITY = {
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
const CURRENCY_BY_COUNTRY = {
  Ethiopia: 'ETB',
  Kenya: 'KES',
  Uganda: 'UGX',
  Tanzania: 'TZS',
  Rwanda: 'RWF',
  Djibouti: 'DJF',
  Somalia: 'SOS',
  'South Sudan': 'SSP',
};
const FILTER_SECTIONS = ['Location', 'Listing type', 'Property type', 'Price & payment', 'Bedrooms', 'Bathrooms', 'Size', 'Furnishing', 'Condition', 'Features'];
const PRICE_MIN_BOUND = 0;
const PRICE_MAX_BOUND = 100000000;
const SIZE_MIN_BOUND = 0;
const SIZE_MAX_BOUND = 5000;
const ADMIN_EMAILS = ['senayabraha.w@gmail.com'];
const SELL_DRAFT_KEY = 'mela_homes_listing_draft';
const MAX_LISTING_PHOTOS = 10;
const LISTING_STEP_KEYS = ['details', 'location', 'photos', 'review'];
const LISTING_STEP_LABELS = {
  details: 'Details',
  location: 'Location',
  photos: 'Photos',
  review: 'Review',
};

const INITIAL_FILTERS = {
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

const INITIAL_FORM = {
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

function useToast() {
  const [toast, setToast] = useState(null);

  const show = (message, type = 'info') => {
    setToast({ id: Date.now(), message, type });
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  return { toast, show, clear: () => setToast(null) };
}

function formatPrice(value, currency = 'ETB') {
  const amount = Number(value || 0);
  if (!amount) return `0 ${currency}`;
  return `${new Intl.NumberFormat().format(amount)} ${currency}`;
}

function listingTitle(listing) {
  if (listing.title?.trim()) return listing.title.trim();
  const beds = listing.bedrooms ? `${listing.bedrooms} Bed` : '';
  return [beds, listing.propertyType].filter(Boolean).join(' ') || 'Property Listing';
}

function listingLocation(listing) {
  return [listing.area, listing.city, listing.country].filter(Boolean).join(', ');
}

function generatedListingTitle(form) {
  const beds = form.bedrooms ? `${form.bedrooms} Bed` : '';
  const type = form.propertyType || 'Property';
  const listingType = form.listingType ? form.listingType.toLowerCase() : 'listing';
  const place = form.area || form.city;
  return `${[beds, type].filter(Boolean).join(' ')} ${listingType}${place ? ` in ${place}` : ''}`;
}

function regionsOf(country) {
  return (COUNTRIES_DATA[country] || {}).regions || [];
}

function citiesOf(country, region) {
  return CITIES_BY_COUNTRY_REGION[`${country}|${region}`] || [];
}

function areasOf(country, city) {
  return AREAS_BY_COUNTRY_CITY[`${country}|${city}`] || [];
}

function formatCompactMoney(value, currency = 'ETB') {
  if (value == null) return `${currency} 0`;
  if (value >= 1000000) return `${currency} ${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
  if (value >= 1000) return `${currency} ${(value / 1000).toFixed(0)}K`;
  return `${currency} ${Number(value).toLocaleString()}`;
}

function normalizeEmail(value) {
  return String(value || '').replace(/\s+/g, '').toLowerCase();
}

function isAdminProfile(profile, authEmail = '') {
  return profile?.is_admin === true || ADMIN_EMAILS.includes(normalizeEmail(profile?.email)) || ADMIN_EMAILS.includes(normalizeEmail(authEmail));
}

function matchesFilters(listing, query, filters) {
  const text = query.trim().toLowerCase();
  if (text) {
    const haystack = [
      listingTitle(listing),
      listing.propertyType,
      listing.listingType,
      listing.city,
      listing.area,
      listing.country,
      listing.description,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(text)) return false;
  }

  if (filters.listingType && listing.listingType !== filters.listingType) return false;
  if (filters.propertyType && listing.propertyType !== filters.propertyType) return false;
  if (filters.country && listing.country !== filters.country) return false;
  if (filters.region && listing.region !== filters.region) return false;
  if (filters.city && listing.city !== filters.city) return false;
  if (filters.area && listing.area !== filters.area) return false;
  if (filters.bedrooms != null && Number(listing.bedrooms || 0) < Number(filters.bedrooms)) return false;
  if (filters.bathrooms != null && Number(listing.bathrooms || 0) < Number(filters.bathrooms)) return false;
  if (filters.minPrice != null && Number(listing.price || 0) < Number(filters.minPrice)) return false;
  if (filters.maxPrice != null && Number(listing.price || 0) > Number(filters.maxPrice)) return false;
  if (filters.sizeMin != null && Number(listing.sizeSqm || 0) < Number(filters.sizeMin)) return false;
  if (filters.sizeMax != null && Number(listing.sizeSqm || 0) > Number(filters.sizeMax)) return false;
  if (filters.furnished && listing.furnished !== filters.furnished) return false;
  if (filters.condition && String(listing.condition || '').toLowerCase() !== String(filters.condition).toLowerCase()) return false;
  if (filters.rentPeriod && listing.rentPeriod !== filters.rentPeriod) return false;
  if (filters.financingAvailable && !listing.financingAvailable) return false;
  if (filters.negotiable && !listing.negotiable) return false;
  if (filters.exchangeAccepted && !listing.exchangeAccepted) return false;
  if (filters.features?.length) {
    const searchableFeatures = filters.features.filter((feature) => FEATURES.includes(feature) || ['Pet friendly', 'Family only', 'Students allowed', 'Short-term allowed', 'Long-term preferred', 'Utilities included', 'Available now', 'Deposit required', 'Title deed available', 'By owner', 'By agent', 'New construction'].includes(feature));
    for (const feature of searchableFeatures) {
      if (!(listing.features || []).includes(feature)) return false;
    }
  }
  return true;
}

function countActiveFilters(filters) {
  let count = 0;
  ['listingType', 'propertyType', 'region', 'city', 'area', 'furnished', 'condition'].forEach((key) => {
    if (filters[key]) count += 1;
  });
  if (filters.country && filters.country !== 'Ethiopia') count += 1;
  if (filters.minPrice != null || filters.maxPrice != null) count += 1;
  if (filters.bedrooms != null) count += 1;
  if (filters.bathrooms != null) count += 1;
  if (filters.sizeMin != null || filters.sizeMax != null) count += 1;
  if (filters.rentPeriod) count += 1;
  if (filters.landSizeMin != null || filters.landSizeMax != null) count += 1;
  if (filters.yearBuiltMin != null || filters.yearBuiltMax != null) count += 1;
  ['petFriendly', 'familyOnly', 'studentsAllowed', 'shortTermAllowed', 'longTermPreferred', 'utilitiesIncluded', 'availableNow', 'depositRequired', 'financingAvailable', 'negotiable', 'exchangeAccepted', 'titleDeedAvailable', 'byOwner', 'byAgent'].forEach((key) => {
    if (filters[key]) count += 1;
  });
  if (filters.features?.length) count += 1;
  return count;
}

function RangeSlider({ min, max, step = 1, valueMin, valueMax, onChange, format = (value) => value }) {
  const lo = Math.max(min, Math.min(valueMin == null ? min : valueMin, max));
  const hi = Math.max(min, Math.min(valueMax == null ? max : valueMax, max));
  const pct = (value) => ((value - min) / (max - min)) * 100;

  return (
    <div className="px-5 pt-4 pb-4">
      <div className="mb-5 flex justify-between text-sm font-medium text-white">
        <span>{format(lo)}</span>
        <span>{format(hi)}</span>
      </div>
      <div className="relative h-6">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-neutral-800" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-emerald-500" style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(event) => {
            const value = Math.min(Number(event.target.value), hi);
            onChange({ min: value, max: hi });
          }}
          className="range-input absolute inset-0 h-6 w-full appearance-none bg-transparent"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(event) => {
            const value = Math.max(Number(event.target.value), lo);
            onChange({ min: lo, max: value });
          }}
          className="range-input absolute inset-0 h-6 w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}

function Shell({ children, themeMode = 'dark' }) {
  return (
    <div className={`${themeMode === 'dark' ? 'dark theme-dark' : 'theme-light'} min-h-screen bg-stone-950 text-stone-50`}>
      <div className="mx-auto min-h-screen max-w-md bg-[radial-gradient(circle_at_top,#1f3a2e,transparent_35%),linear-gradient(180deg,#111827_0%,#09090b_48%,#111827_100%)]">
        {children}
      </div>
    </div>
  );
}

function TopBar({ title, right, subtitle }) {
  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-stone-950/80 px-4 py-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl bg-emerald-500/15 p-2 text-emerald-300">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
              {subtitle ? <p className="text-xs text-stone-400">{subtitle}</p> : null}
            </div>
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}

function TabBar({ tab, onChange, unreadSaved, unreadMessages }) {
  const items = [
    ['discover', Home, 'Shop'],
    ['saved', Heart, 'Saved'],
    ['messages', MessageCircle, 'Messages'],
    ['sell', PlusSquare, 'List'],
    ['account', UserRound, 'Account'],
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-white/10 bg-stone-950/95 px-2 py-2 backdrop-blur">
      <div className="grid grid-cols-5 gap-1">
        {items.map(([key, Icon, label]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs ${active ? 'bg-emerald-500/15 text-emerald-300' : 'text-stone-400'}`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
              {key === 'saved' && unreadSaved > 0 ? (
                <span className="absolute right-3 top-2 rounded-full bg-emerald-500 px-1.5 text-[10px] text-white">
                  {unreadSaved}
                </span>
              ) : null}
              {key === 'messages' && unreadMessages > 0 ? (
                <span className="absolute right-3 top-2 rounded-full bg-emerald-500 px-1.5 text-[10px] text-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SearchBar({ query, onChange, onSubmit }) {
  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-950 px-5">
        <Search className="h-5 w-5 text-neutral-400" />
        <label className="flex flex-1 items-center gap-3 py-4">
          <input
            value={query}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onSubmit();
            }}
            placeholder="Search neighborhood, city, or property type"
            className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-neutral-500"
          />
        </label>
        {query ? (
          <button type="button" onClick={onSubmit} className="h-9 shrink-0 rounded-full bg-emerald-700 px-4 text-sm font-medium text-white">
            Go
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ShopLocationCard({ onApply }) {
  const [country, setCountry] = useState('Ethiopia');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const selectCls = 'w-full h-12 rounded-xl bg-neutral-950 border border-neutral-800 px-4 text-white text-sm outline-none focus:border-emerald-500';

  const apply = () => {
    onApply({
      country,
      region: region || null,
      city: city || null,
      area: area || null,
    });
  };

  return (
    <div className="mx-4 mt-8 overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-700 to-emerald-900 p-6 pb-8">
      <h2 className="text-center text-2xl font-bold text-white">Find homes near you</h2>
      <p className="mt-1.5 text-center text-emerald-100">Pick your country and area to see local listings.</p>
      <div className="mt-5 space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div>
          <div className="mb-1.5 text-xs text-neutral-400">Country</div>
          <select
            value={country}
            onChange={(event) => {
              setCountry(event.target.value);
              setRegion('');
              setCity('');
              setArea('');
            }}
            className={selectCls}
          >
            {COUNTRY_LIST.map((item) => (
              <option key={item} value={item}>
                {COUNTRIES_DATA[item]?.flag} {item}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-1.5 text-xs text-neutral-400">Region / Province</div>
          <select
            value={region}
            onChange={(event) => {
              setRegion(event.target.value);
              setCity('');
              setArea('');
            }}
            className={selectCls}
          >
            <option value="">Any region</option>
            {regionsOf(country).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {region && citiesOf(country, region).length > 0 ? (
          <div>
            <div className="mb-1.5 text-xs text-neutral-400">City / Town</div>
            <select
              value={city}
              onChange={(event) => {
                setCity(event.target.value);
                setArea('');
              }}
              className={selectCls}
            >
              <option value="">Any city</option>
              {citiesOf(country, region).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {city && areasOf(country, city).length > 0 ? (
          <div>
            <div className="mb-1.5 text-xs text-neutral-400">Area / Neighborhood</div>
            <select value={area} onChange={(event) => setArea(event.target.value)} className={selectCls}>
              <option value="">Any area</option>
              {areasOf(country, city).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <button type="button" onClick={apply} className="mt-2 h-12 w-full rounded-full bg-emerald-700 font-medium text-white">
          Show homes in this area
        </button>
      </div>
    </div>
  );
}

function SectionTitle({ title, action, onAction }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-semibold text-stone-100">{title}</h2>
      {action ? (
        <button type="button" onClick={onAction} className="text-sm text-emerald-300">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function Chip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-sm ${active ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-white/5 text-stone-300'}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ title, text, action, onAction }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-8 text-center">
      <Building2 className="mx-auto mb-3 h-10 w-10 text-stone-500" />
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-stone-400">{text}</p>
      {action ? (
        <button type="button" onClick={onAction} className="mt-4 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-medium text-stone-950">
          {action}
        </button>
      ) : null}
    </div>
  );
}

function ListingCard({ listing, saved, onOpen, onToggleSave, ownListing }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
      <button type="button" onClick={() => onOpen(listing)} className="block w-full text-left">
        <div className="relative h-52 bg-stone-900">
          {listing.photoUrl ? (
            <img src={listing.photoUrl} alt={listingTitle(listing)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#1c2d25,#171717)]">
              <Home className="h-14 w-14 text-stone-500" />
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-full bg-stone-950/75 px-3 py-1 text-xs text-stone-200">{listing.listingType}</div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave(listing.id);
            }}
            className="absolute right-3 top-3 rounded-full bg-stone-950/75 p-2 text-white"
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-emerald-500 text-emerald-500' : ''}`} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="line-clamp-1 text-base font-semibold">{listingTitle(listing)}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-stone-400">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{listingLocation(listing) || 'Location not set'}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-emerald-300">{formatPrice(listing.price, listing.currency)}</div>
              {listing.listingType === 'For Rent' && listing.rentPeriod ? <div className="text-xs text-stone-400">/{listing.rentPeriod.toLowerCase()}</div> : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-stone-300">
            {listing.bedrooms ? <Stat icon={BedDouble} label={`${listing.bedrooms} bed`} /> : null}
            {listing.bathrooms ? <Stat icon={Bath} label={`${listing.bathrooms} bath`} /> : null}
            {listing.sizeSqm ? <Stat icon={Ruler} label={`${listing.sizeSqm} sqm`} /> : null}
            <span className="rounded-full bg-white/5 px-2 py-1">{listing.propertyType}</span>
          </div>
          {ownListing ? <div className="text-xs text-emerald-300">Your listing</div> : null}
        </div>
      </button>
    </div>
  );
}

function FeaturedListingCard({ listing, saved, onOpen, onToggleSave }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <button type="button" onClick={() => onOpen(listing)} className="block w-full text-left">
        <div className="relative h-28 bg-stone-900">
          {listing.photoUrl ? (
            <img src={listing.photoUrl} alt={listingTitle(listing)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#1c2d25,#171717)]">
              <Home className="h-9 w-9 text-stone-500" />
            </div>
          )}
          <div className="absolute left-2 top-2 rounded-full bg-stone-950/75 px-2 py-1 text-[10px] text-stone-200">{listing.listingType}</div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onToggleSave(listing.id);
            }}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-stone-950/75 text-white"
          >
            <Heart className={`h-4 w-4 ${saved ? 'fill-emerald-500 text-emerald-500' : ''}`} />
          </button>
        </div>
        <div className="space-y-1.5 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold text-white">{listingTitle(listing)}</h3>
          <p className="line-clamp-1 text-xs text-stone-400">{listingLocation(listing) || 'Location not set'}</p>
          <div className="truncate text-sm font-semibold text-emerald-300">{formatPrice(listing.price, listing.currency)}</div>
          <div className="flex items-center gap-1 text-[11px] text-stone-300">
            {listing.bedrooms ? <span>{listing.bedrooms} bed</span> : null}
            {listing.bedrooms && listing.bathrooms ? <span>·</span> : null}
            {listing.bathrooms ? <span>{listing.bathrooms} bath</span> : null}
          </div>
        </div>
      </button>
    </div>
  );
}

function FeaturedListings({ listings, onOpen, savedIds, onToggleSave }) {
  const scrollRef = React.useRef(null);
  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -scrollRef.current.offsetWidth * 0.7 : scrollRef.current.offsetWidth * 0.7,
      behavior: 'smooth',
    });
  };

  if (!listings || listings.length === 0) return null;

  return (
    <div className="mb-2 mt-4 px-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Featured</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => scroll('left')} className="rounded-full bg-neutral-800 p-1.5">
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>
          <button type="button" onClick={() => scroll('right')} className="rounded-full bg-neutral-800 p-1.5">
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="no-scrollbar flex gap-2 overflow-x-auto scroll-smooth">
        {listings.map((listing) => (
          <div key={listing.id} className="min-w-[calc((100%-0.5rem)/2)] max-w-[calc((100%-0.5rem)/2)] shrink-0">
            <FeaturedListingCard listing={listing} onOpen={onOpen} saved={savedIds.includes(listing.id)} onToggleSave={onToggleSave} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function ResultListingCard({ listing, saved, onOpen, onToggleSave, onMessage }) {
  return (
    <div className="bg-[#111216]">
      <button type="button" onClick={() => onOpen(listing)} className="block w-full text-left">
        <div className="relative h-[220px] bg-neutral-800">
          {listing.photoUrl ? (
            <img src={listing.photoUrl} alt={listingTitle(listing)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#dfe4dc,#7d846a)]">
              <Home className="h-20 w-20 text-black/20" />
            </div>
          )}
          {listing.listingType === 'For Rent' ? (
            <div className="absolute left-3 top-3 rounded-full bg-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-950">
              1 Month Free
            </div>
          ) : null}
          <div className="absolute right-3 top-3 rounded-lg bg-[#111216] px-3 py-2 text-xs font-bold text-emerald-300">
            3D Tour
          </div>
          <div className="absolute right-0 top-1/2 flex h-16 w-10 -translate-y-1/2 items-center justify-center rounded-l-full bg-black/35 text-white">
            <ChevronRight className="h-7 w-7" />
          </div>
        </div>
      </button>
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold tracking-wide text-stone-100">
              {listing.listingType === 'For Rent' ? `${formatPrice(listing.price, listing.currency)}+` : formatPrice(listing.price, listing.currency)}
            </div>
            <div className="mt-2 text-sm tracking-wide text-stone-200">
              {listing.location || listingLocation(listing) || 'Map Location'}
            </div>
            <div className="mt-1.5 text-sm tracking-wide text-stone-200">
              {listing.bedrooms || 0} Bd {listing.listingType === 'For Rent' ? `${formatPrice(listing.price, listing.currency)}+` : `${listing.bathrooms || 0} Ba`}
            </div>
            <div className="mt-1.5 text-sm tracking-wide text-stone-200">{listingTitle(listing)}</div>
            <div className="mt-1.5 text-sm tracking-wide text-stone-200">
              {listing.listingType === 'For Rent' ? '4 Units Available' : `${listing.sizeSqm || 'Any'} sqm`}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/12 text-stone-100">
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onToggleSave(listing.id)}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/12 text-stone-100"
            >
              <Heart className={`h-5 w-5 ${saved ? 'fill-white' : ''}`} />
            </button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-[0.75fr_2.5fr] gap-3">
          <button type="button" className="h-11 rounded-full bg-emerald-50 text-sm font-bold text-emerald-950">
            Call
          </button>
          <button type="button" onClick={() => onMessage(listing)} className="h-11 rounded-full bg-emerald-600 text-sm font-bold text-white">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchResultsScreen({ listings, query, setQuery, filters, savedIds, onOpenListing, onToggleSave, onOpenFilters, onMessage }) {
  const results = useMemo(() => listings.filter((listing) => matchesFilters(listing, query, filters)), [filters, listings, query]);
  const featuredListings = useMemo(() => listings.filter((listing) => listing.featured), [listings]);
  const activeFilters = countActiveFilters(filters);
  return (
    <div className="min-h-screen bg-black pb-28">
      <div className="sticky top-0 z-20 bg-black">
        <div className="flex items-center gap-3 px-4 pt-4">
          <Map className="h-5 w-5 text-emerald-300" />
          <label className="flex h-11 flex-1 items-center gap-2 rounded-sm border border-white/25 bg-[#15161b] px-3">
            <Search className="h-4 w-4 text-stone-200" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Map Location"
              className="w-full bg-transparent text-sm tracking-wide text-stone-100 outline-none placeholder:text-stone-300"
            />
          </label>
          <Navigation className="h-5 w-5 text-emerald-300" />
        </div>
        <div className="mt-4 px-4">
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={onOpenFilters}
              className="h-8 rounded-md border-2 border-emerald-500 px-4 text-xs font-bold tracking-wide text-emerald-300"
            >
              Filters{activeFilters ? ` ${activeFilters}` : ''}
            </button>
            <button type="button" className="h-8 rounded-md bg-emerald-600 px-4 text-xs font-bold tracking-wide text-white">
              Save Search
            </button>
          </div>
        </div>
      </div>

      <FeaturedListings listings={featuredListings} onOpen={onOpenListing} savedIds={savedIds} onToggleSave={onToggleSave} />

      <div className="mt-3 space-y-4">
        {results.length ? (
          results.map((listing) => (
            <ResultListingCard
              key={listing.id}
              listing={listing}
              saved={savedIds.includes(listing.id)}
              onOpen={onOpenListing}
              onToggleSave={onToggleSave}
              onMessage={onMessage}
            />
          ))
        ) : (
          <div className="px-4 pt-8">
            <EmptyState title="No homes match yet" text="Try changing filters or search a different area." />
          </div>
        )}
      </div>
    </div>
  );
}

function DiscoverScreen({ listings, query, setQuery, filters, setFilters, savedIds, onOpenListing, onToggleSave, onOpenFilters, onMessage, resultsOpen, setResultsOpen }) {
  const featuredListings = useMemo(() => listings.filter((listing) => listing.featured), [listings]);
  const submit = () => {
    setQuery((value) => value.trim());
    setResultsOpen(true);
  };

  if (resultsOpen) {
    return (
      <SearchResultsScreen
        listings={listings}
        query={query}
        setQuery={setQuery}
        filters={filters}
        setFilters={setFilters}
        savedIds={savedIds}
        onOpenListing={onOpenListing}
        onToggleSave={onToggleSave}
        onOpenFilters={onOpenFilters}
        onMessage={onMessage}
      />
    );
  }

  return (
    <div className="pb-24">
      <div className="relative flex h-56 flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black via-emerald-950/40 to-neutral-950">
        <h1 className="text-center text-5xl font-bold leading-tight tracking-tight text-white">
          Mela <span className="text-emerald-500">Homes</span>
        </h1>
        <p className="mt-3 text-[15px] tracking-wide text-neutral-300">Discover your dream home</p>
      </div>
      <SearchBar query={query} onChange={setQuery} onSubmit={submit} />
      <div className="px-5 pt-6">
        <button
          type="button"
          onClick={() => {
            setFilters((prev) => ({ ...prev, listingType: 'For Sale' }));
            setResultsOpen(true);
          }}
          className="h-14 w-full rounded-full bg-emerald-700 text-[16px] font-medium text-white"
        >
          House for Sale
        </button>
        <button
          type="button"
          onClick={() => {
            setFilters((prev) => ({ ...prev, listingType: 'For Rent' }));
            setResultsOpen(true);
          }}
          className="mt-3 h-14 w-full rounded-full border border-neutral-600 text-[16px] font-medium text-white"
        >
          House for Rent
        </button>
      </div>
      <ShopLocationCard
        onApply={(locationFilters) =>
          {
            setFilters((prev) => ({
              ...prev,
              ...locationFilters,
            }));
            setResultsOpen(true);
          }
        }
      />
      <FeaturedListings listings={featuredListings} onOpen={onOpenListing} savedIds={savedIds} onToggleSave={onToggleSave} />
    </div>
  );
}

function SavedScreen({ listings, savedIds, onOpenListing, onToggleSave, requireAuth }) {
  const savedListings = listings.filter((listing) => savedIds.includes(listing.id));

  return (
    <div className="pb-24">
      <TopBar title="Saved Homes" subtitle="Your shortlist of properties" />
      <div className="space-y-4 px-4 pt-4">
        {!requireAuth ? (
          <EmptyState title="Sign in to save homes" text="Your saved listings will show up here." />
        ) : savedListings.length ? (
          savedListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} saved onOpen={onOpenListing} onToggleSave={onToggleSave} />
          ))
        ) : (
          <EmptyState title="Nothing saved yet" text="Tap the heart on any property to keep it here." />
        )}
      </div>
    </div>
  );
}

function DetailScreen({ listing, saved, onBack, onToggleSave, ownListing, onEdit, onDelete, onMessage }) {
  const info = [
    ['Property type', listing.propertyType],
    ['Listing type', listing.listingType],
    ['Bedrooms', listing.bedrooms || '-'],
    ['Bathrooms', listing.bathrooms || '-'],
    ['Size', listing.sizeSqm ? `${listing.sizeSqm} sqm` : '-'],
    ['Condition', listing.condition || '-'],
    ['Furnishing', listing.furnished || '-'],
    ['Location', listingLocation(listing) || '-'],
  ];

  return (
    <div className="pb-24">
      <div className="relative h-72 bg-stone-900">
        {listing.photoUrl ? (
          <img src={listing.photoUrl} alt={listingTitle(listing)} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#1c2d25,#171717)]">
            <Home className="h-16 w-16 text-stone-500" />
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button type="button" onClick={onBack} className="rounded-full bg-stone-950/75 px-3 py-2 text-sm">
            Back
          </button>
          <button type="button" onClick={() => onToggleSave(listing.id)} className="rounded-full bg-stone-950/75 p-2">
            <Heart className={`h-4 w-4 ${saved ? 'fill-emerald-500 text-emerald-500' : ''}`} />
          </button>
        </div>
      </div>
      <div className="space-y-5 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">{listingTitle(listing)}</h2>
            <p className="mt-2 flex items-center gap-1 text-sm text-stone-400">
              <MapPin className="h-4 w-4" />
              {listingLocation(listing) || 'Location not set'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-emerald-300">{formatPrice(listing.price, listing.currency)}</div>
            {listing.listingType === 'For Rent' && listing.rentPeriod ? <div className="text-xs text-stone-400">per {listing.rentPeriod.toLowerCase()}</div> : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <QuickFact icon={BedDouble} label="Bedrooms" value={listing.bedrooms || '-'} />
          <QuickFact icon={Bath} label="Bathrooms" value={listing.bathrooms || '-'} />
          <QuickFact icon={Ruler} label="Size" value={listing.sizeSqm ? `${listing.sizeSqm} sqm` : '-'} />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <SectionTitle title="Details" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            {info.map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-stone-950/40 p-3">
                <div className="text-xs uppercase tracking-wide text-stone-500">{label}</div>
                <div className="mt-1 text-stone-100">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {listing.description ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <SectionTitle title="Description" />
            <p className="text-sm leading-6 text-stone-300">{listing.description}</p>
          </div>
        ) : null}

        {listing.features?.length ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <SectionTitle title="Features" />
            <div className="flex flex-wrap gap-2">
              {listing.features.map((feature) => (
                <span key={feature} className="rounded-full bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {ownListing ? (
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={onEdit} className="flex items-center justify-center gap-2 rounded-2xl bg-white/8 px-4 py-3 text-sm">
              <Pencil className="h-4 w-4" />
              Edit
            </button>
            <button type="button" onClick={onDelete} className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => onMessage(listing)} className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950">
            Send Message
          </button>
        )}
      </div>
    </div>
  );
}

function QuickFact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-center">
      <Icon className="mx-auto h-5 w-5 text-emerald-300" />
      <div className="mt-2 text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function FiltersPanel({ filters, setFilters, onClose, totalResults }) {
  const mode = filters.listingType === 'For Sale' ? 'For Sale' : 'For Rent';
  const update = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const toggleProperty = (type) => update('propertyType', filters.propertyType === type ? null : type);
  const toggleFlag = (key, feature) => {
    setFilters((prev) => {
      const active = !prev[key];
      const current = prev.features || [];
      const nextFeatures = feature
        ? active
          ? [...new Set([...current, feature])]
          : current.filter((item) => item !== feature)
        : current;
      return { ...prev, [key]: active, features: nextFeatures.length ? nextFeatures : null };
    });
  };
  const toggleFeature = (feature) => {
    const current = filters.features || [];
    const next = current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature];
    update('features', next.length ? next : null);
  };
  const activeCount = countActiveFilters(filters);

  return (
    <div className="fixed inset-0 z-30 bg-black">
      <div className="mx-auto flex h-dvh max-w-md flex-col overflow-hidden rounded-t-[1.25rem] bg-[#17181b] text-stone-100">
        <div className="shrink-0 px-4 pb-3 pt-5">
          <div className="flex items-center justify-between">
            <button type="button" onClick={onClose} className="h-9 rounded-full border border-white/10 px-5 text-sm tracking-wide text-emerald-300">
              Cancel
            </button>
            <h2 className="text-lg font-bold">Filters{activeCount ? ` ${activeCount}` : ''}</h2>
            <button type="button" onClick={() => setFilters({ ...INITIAL_FILTERS, listingType: mode })} className="h-9 rounded-full border border-white/10 px-5 text-sm tracking-wide text-emerald-300">
              Reset
            </button>
          </div>
          <div className="mt-5 grid grid-cols-2 overflow-hidden rounded bg-[#25262a]">
            {['For Sale', 'For Rent'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => update('listingType', item)}
                className={`h-9 text-sm tracking-wide ${mode === item ? 'bg-emerald-700 text-white' : 'text-stone-400'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-28">
          {mode === 'For Rent' ? (
            <EnhancedRentFilters filters={filters} update={update} toggleProperty={toggleProperty} toggleFeature={toggleFeature} toggleFlag={toggleFlag} />
          ) : (
            <EnhancedSaleFilters filters={filters} update={update} toggleProperty={toggleProperty} toggleFeature={toggleFeature} toggleFlag={toggleFlag} />
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 mx-auto grid max-w-md grid-cols-2 gap-3 bg-[#17181b]/95 px-4 py-3 backdrop-blur">
          <button type="button" className="h-11 rounded-lg bg-emerald-50 text-sm font-bold tracking-wide text-emerald-950">
            Save Search
          </button>
          <button type="button" onClick={onClose} className="h-11 rounded-lg bg-emerald-700 text-sm font-bold tracking-wide text-white">
            Show {totalResults} homes
          </button>
        </div>
      </div>
    </div>
  );
}

function SegmentGroup({ value, options, onChange }) {
  return (
    <div className="grid overflow-hidden rounded bg-[#292a2e]" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`h-9 text-sm tracking-wide ${value === option.value ? 'bg-emerald-700 text-white' : 'text-stone-100'}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FilterSectionTitle({ children }) {
  return <h3 className="border-t border-white/10 px-4 pb-2 pt-5 text-base font-bold tracking-wide text-stone-300">{children}</h3>;
}

function FilterBlock({ title, children }) {
  return (
    <div className="border-t border-white/10 px-4 py-5">
      <div className="mb-3 text-base font-semibold tracking-wide text-stone-100">{title}</div>
      {children}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, disabled = false }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <select value={value || ''} onChange={(event) => onChange(event.target.value || null)} disabled={disabled} className="h-11 w-full rounded-lg border border-white/10 bg-stone-950/50 px-3 text-sm text-white outline-none disabled:opacity-45">
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberFilter({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <input value={value ?? ''} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)} type="number" min="0" placeholder={placeholder} className="h-11 w-full rounded-lg border border-white/10 bg-stone-950/50 px-3 text-sm text-white outline-none placeholder:text-stone-600" />
    </label>
  );
}

function SwitchRow({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex h-13 w-full items-center justify-between border-t border-white/10 px-4 py-4 text-left">
      <span className="text-base tracking-wide text-stone-100">{label}</span>
      <span className={`relative h-7 w-14 rounded-full transition ${active ? 'bg-emerald-700' : 'bg-[#62636a]'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${active ? 'right-1' : 'left-1'}`} />
      </span>
    </button>
  );
}

function RentFilters({ filters, update, toggleProperty, toggleFeature }) {
  return (
    <>
      <FilterRow label="Price Range" />
      <div className="border-t border-white/10 px-4 py-5">
        <div className="mb-3 text-base tracking-wide">Beds</div>
        <SegmentGroup
          value={filters.bedrooms || 0}
          options={[{ label: 'Studio+', value: 0 }, { label: '1+', value: 1 }, { label: '2+', value: 2 }, { label: '3+', value: 3 }, { label: '4+', value: 4 }, { label: '5+', value: 5 }]}
          onChange={(value) => update('bedrooms', value || null)}
        />
      </div>
      <div className="border-t border-white/10 px-4 py-5">
        <div className="mb-3 text-base tracking-wide">Baths</div>
        <SegmentGroup
          value={filters.bathrooms || 0}
          options={[{ label: 'Any', value: 0 }, { label: '1+', value: 1 }, { label: '2+', value: 2 }, { label: '3+', value: 3 }, { label: '4+', value: 4 }, { label: '5+', value: 5 }]}
          onChange={(value) => update('bathrooms', value || null)}
        />
      </div>
      <div className="border-t border-white/10 px-4 py-5">
        <div className="mb-3 text-base tracking-wide">Pets</div>
        <SegmentGroup value="None" options={[{ label: 'None', value: 'None' }, { label: 'Cat', value: 'Cat' }, { label: 'Dog', value: 'Dog' }]} onChange={() => {}} />
      </div>
      <div className="border-t border-white/10 px-4 py-5">
        <div className="mb-3 text-base tracking-wide">Move In Date</div>
        <div className="flex h-13 items-center justify-between rounded-lg border border-white/15 px-4 py-4 text-base text-stone-400">
          mm/dd/yyyy
          <span className="text-xl">□</span>
        </div>
        <p className="mt-3 text-sm tracking-wide text-stone-400">Show listings that are available before or on this date.</p>
      </div>
      <FilterSectionTitle>Property Types</FilterSectionTitle>
      {[
        ['Single-Family', 'House'],
        ['Apartment/Condo/Loft', 'Apartment'],
        ['Townhome', 'Townhouse'],
      ].map(([label, type]) => (
        <SwitchRow key={type} label={label} active={filters.propertyType === type} onClick={() => toggleProperty(type)} />
      ))}
      <div className="px-4 py-5">
        <div className="mb-3 text-base tracking-wide">Space</div>
        <SegmentGroup value="Entire Home" options={[{ label: 'Entire Home', value: 'Entire Home' }, { label: 'Room', value: 'Room' }, { label: 'Any Type', value: 'Any Type' }]} onChange={() => {}} />
      </div>
      <FilterSectionTitle>Listing Features</FilterSectionTitle>
      <FilterRow label="Unit Amenities" value="All" />
      <FilterRow label="Building Amenities" value="All" />
      <SwitchRow label="Furnished" active={filters.furnished === 'Furnished'} onClick={() => update('furnished', filters.furnished === 'Furnished' ? null : 'Furnished')} />
      <SwitchRow label="Income Restricted" active={false} onClick={() => {}} />
      <FilterSectionTitle>Property Details</FilterSectionTitle>
      <FilterRow label="Square Feet" />
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3 text-base tracking-wide">Keywords</div>
        <input placeholder="Pool, Garage, Water Front" className="h-13 w-full rounded-lg border border-white/25 bg-transparent px-4 py-4 text-base outline-none placeholder:text-stone-500" />
      </div>
    </>
  );
}

function SaleFilters({ filters, update, toggleProperty, toggleFeature }) {
  return (
    <>
      <FilterRow label="Price Range" />
      <FilterRow label="Max HOA Fees" />
      <div className="border-t border-white/10 px-4 py-5">
        <div className="mb-3 text-base tracking-wide">Beds</div>
        <SegmentGroup
          value={filters.bedrooms || 0}
          options={[{ label: 'Studio+', value: 0 }, { label: '1+', value: 1 }, { label: '2+', value: 2 }, { label: '3+', value: 3 }, { label: '4+', value: 4 }, { label: '5+', value: 5 }]}
          onChange={(value) => update('bedrooms', value || null)}
        />
      </div>
      <div className="border-t border-white/10 px-4 py-5">
        <div className="mb-3 text-base tracking-wide">Baths</div>
        <SegmentGroup
          value={filters.bathrooms || 0}
          options={[{ label: 'Any', value: 0 }, { label: '1+', value: 1 }, { label: '2+', value: 2 }, { label: '3+', value: 3 }, { label: '4+', value: 4 }, { label: '5+', value: 5 }]}
          onChange={(value) => update('bathrooms', value || null)}
        />
      </div>
      <FilterSectionTitle>Property Types</FilterSectionTitle>
      {[
        ['Single-Family', 'House'],
        ['Condo', 'Apartment'],
        ['Townhome', 'Townhouse'],
        ['Multi-Family', 'Villa'],
        ['Lots/Land', 'Land'],
      ].map(([label, type]) => (
        <SwitchRow key={type} label={label} active={filters.propertyType === type} onClick={() => toggleProperty(type)} />
      ))}
      <FilterSectionTitle>Listing Types</FilterSectionTitle>
      {['For Sale by Agent', 'For Sale by Owner', 'New Construction', 'Foreclosures', 'Coming Soon'].map((feature) => (
        <SwitchRow key={feature} label={feature} active={(filters.features || []).includes(feature)} onClick={() => toggleFeature(feature)} />
      ))}
      <FilterSectionTitle>Listing Status</FilterSectionTitle>
      {['Accepting Backup Offers', 'Pending & Under Contract'].map((feature) => (
        <SwitchRow key={feature} label={feature} active={(filters.features || []).includes(feature)} onClick={() => toggleFeature(feature)} />
      ))}
      <FilterSectionTitle>Property Details</FilterSectionTitle>
      <FilterRow label="Square Feet" />
      <FilterRow label="Lot Size" />
      <FilterRow label="Year Built" />
      <FilterSectionTitle>Amenities</FilterSectionTitle>
      {['Air Conditioning', 'Garage', 'Pool', 'Waterfront'].map((feature) => (
        <SwitchRow key={feature} label={feature} active={(filters.features || []).includes(feature)} onClick={() => toggleFeature(feature)} />
      ))}
    </>
  );
}

function LocationFilters({ filters, update }) {
  const country = filters.country || 'Ethiopia';
  const regions = regionsOf(country);
  const cities = filters.region ? citiesOf(country, filters.region) : [];
  const areas = filters.city ? areasOf(country, filters.city) : [];

  return (
    <FilterBlock title="Location">
      <div className="grid grid-cols-2 gap-3">
        <FilterSelect label="Country" value={country} onChange={(value) => { update('country', value || 'Ethiopia'); update('region', null); update('city', null); update('area', null); }} options={COUNTRY_LIST.map((item) => ({ label: item, value: item }))} />
        <FilterSelect label="Region" value={filters.region} onChange={(value) => { update('region', value); update('city', null); update('area', null); }} options={[{ label: 'Any region', value: '' }, ...regions.map((item) => ({ label: item, value: item }))]} />
        <FilterSelect label="City" value={filters.city} onChange={(value) => { update('city', value); update('area', null); }} disabled={!filters.region} options={[{ label: 'Any city', value: '' }, ...cities.map((item) => ({ label: item, value: item }))]} />
        <FilterSelect label="Area" value={filters.area} onChange={(value) => update('area', value)} disabled={!filters.city} options={[{ label: 'Any area', value: '' }, ...areas.map((item) => ({ label: item, value: item }))]} />
      </div>
    </FilterBlock>
  );
}

function PriceFilters({ filters, update, title }) {
  return (
    <FilterBlock title={title}>
      <div className="grid grid-cols-2 gap-3">
        <NumberFilter label="Min price" value={filters.minPrice} onChange={(value) => update('minPrice', value)} placeholder="0" />
        <NumberFilter label="Max price" value={filters.maxPrice} onChange={(value) => update('maxPrice', value)} placeholder="Any" />
      </div>
    </FilterBlock>
  );
}

function BedBathFilters({ filters, update }) {
  return (
    <>
      <FilterBlock title="Bedrooms">
        <SegmentGroup value={filters.bedrooms || 0} options={[{ label: 'Any', value: 0 }, { label: '1+', value: 1 }, { label: '2+', value: 2 }, { label: '3+', value: 3 }, { label: '4+', value: 4 }, { label: '5+', value: 5 }]} onChange={(value) => update('bedrooms', value || null)} />
      </FilterBlock>
      <FilterBlock title="Bathrooms">
        <SegmentGroup value={filters.bathrooms || 0} options={[{ label: 'Any', value: 0 }, { label: '1+', value: 1 }, { label: '2+', value: 2 }, { label: '3+', value: 3 }, { label: '4+', value: 4 }, { label: '5+', value: 5 }]} onChange={(value) => update('bathrooms', value || null)} />
      </FilterBlock>
    </>
  );
}

function SizeFilters({ filters, update, title = 'Size' }) {
  return (
    <FilterBlock title={title}>
      <div className="grid grid-cols-2 gap-3">
        <NumberFilter label="Min sqm" value={filters.sizeMin} onChange={(value) => update('sizeMin', value)} placeholder="0" />
        <NumberFilter label="Max sqm" value={filters.sizeMax} onChange={(value) => update('sizeMax', value)} placeholder="Any" />
      </div>
    </FilterBlock>
  );
}

function EnhancedRentFilters({ filters, update, toggleProperty, toggleFeature, toggleFlag }) {
  return (
    <>
      <LocationFilters filters={filters} update={update} />
      <PriceFilters filters={filters} update={update} title="Monthly Rent" />
      <BedBathFilters filters={filters} update={update} />
      <FilterSectionTitle>Property Type</FilterSectionTitle>
      {['Apartment', 'House', 'Villa', 'Studio', 'Commercial', 'Office'].map((type) => (
        <SwitchRow key={type} label={type} active={filters.propertyType === type} onClick={() => toggleProperty(type)} />
      ))}
      <FilterBlock title="Rent Period">
        <SegmentGroup value={filters.rentPeriod || ''} options={[{ label: 'Any', value: '' }, { label: 'Monthly', value: 'Monthly' }, { label: 'Quarterly', value: 'Quarterly' }, { label: 'Yearly', value: 'Yearly' }]} onChange={(value) => update('rentPeriod', value || null)} />
      </FilterBlock>
      <FilterBlock title="Furnishing">
        <SegmentGroup value={filters.furnished || ''} options={[{ label: 'Any', value: '' }, { label: 'Furnished', value: 'Furnished' }, { label: 'Semi', value: 'Semi-Furnished' }, { label: 'Unfurnished', value: 'Unfurnished' }]} onChange={(value) => update('furnished', value || null)} />
      </FilterBlock>
      <FilterSectionTitle>Rental Details</FilterSectionTitle>
      <SwitchRow label="Available now" active={filters.availableNow} onClick={() => toggleFlag('availableNow', 'Available now')} />
      <SwitchRow label="Utilities included" active={filters.utilitiesIncluded} onClick={() => toggleFlag('utilitiesIncluded', 'Utilities included')} />
      <SwitchRow label="Deposit required" active={filters.depositRequired} onClick={() => toggleFlag('depositRequired', 'Deposit required')} />
      <SwitchRow label="Pet friendly" active={filters.petFriendly} onClick={() => toggleFlag('petFriendly', 'Pet friendly')} />
      <SwitchRow label="Family only" active={filters.familyOnly} onClick={() => toggleFlag('familyOnly', 'Family only')} />
      <SwitchRow label="Students allowed" active={filters.studentsAllowed} onClick={() => toggleFlag('studentsAllowed', 'Students allowed')} />
      <SwitchRow label="Short-term allowed" active={filters.shortTermAllowed} onClick={() => toggleFlag('shortTermAllowed', 'Short-term allowed')} />
      <SwitchRow label="Long-term preferred" active={filters.longTermPreferred} onClick={() => toggleFlag('longTermPreferred', 'Long-term preferred')} />
      <FilterSectionTitle>Amenities</FilterSectionTitle>
      {['Parking', 'Security', 'Water Tank', 'Backup Generator', 'Balcony', 'Elevator', 'CCTV', 'Garden', 'Gym', 'Pool'].map((feature) => (
        <SwitchRow key={feature} label={feature} active={(filters.features || []).includes(feature)} onClick={() => toggleFeature(feature)} />
      ))}
      <SizeFilters filters={filters} update={update} title="Size" />
    </>
  );
}

function EnhancedSaleFilters({ filters, update, toggleProperty, toggleFeature, toggleFlag }) {
  return (
    <>
      <LocationFilters filters={filters} update={update} />
      <PriceFilters filters={filters} update={update} title="Sale Price" />
      <BedBathFilters filters={filters} update={update} />
      <FilterSectionTitle>Property Type</FilterSectionTitle>
      {['Apartment', 'House', 'Villa', 'Townhouse', 'Land', 'Commercial', 'Office'].map((type) => (
        <SwitchRow key={type} label={type} active={filters.propertyType === type} onClick={() => toggleProperty(type)} />
      ))}
      <SizeFilters filters={filters} update={update} title="Building Size" />
      <FilterBlock title="Land Size">
        <div className="grid grid-cols-2 gap-3">
          <NumberFilter label="Min sqm" value={filters.landSizeMin} onChange={(value) => update('landSizeMin', value)} placeholder="0" />
          <NumberFilter label="Max sqm" value={filters.landSizeMax} onChange={(value) => update('landSizeMax', value)} placeholder="Any" />
        </div>
      </FilterBlock>
      <FilterBlock title="Year Built">
        <div className="grid grid-cols-2 gap-3">
          <NumberFilter label="From" value={filters.yearBuiltMin} onChange={(value) => update('yearBuiltMin', value)} placeholder="Any" />
          <NumberFilter label="To" value={filters.yearBuiltMax} onChange={(value) => update('yearBuiltMax', value)} placeholder="Any" />
        </div>
      </FilterBlock>
      <FilterBlock title="Condition">
        <SegmentGroup value={filters.condition || ''} options={[{ label: 'Any', value: '' }, { label: 'New', value: 'new' }, { label: 'Used', value: 'used' }, { label: 'Renovated', value: 'renovated' }]} onChange={(value) => update('condition', value || null)} />
      </FilterBlock>
      <FilterSectionTitle>Buying Options</FilterSectionTitle>
      <SwitchRow label="Negotiable" active={filters.negotiable} onClick={() => toggleFlag('negotiable')} />
      <SwitchRow label="Financing available" active={filters.financingAvailable} onClick={() => toggleFlag('financingAvailable')} />
      <SwitchRow label="Exchange accepted" active={filters.exchangeAccepted} onClick={() => toggleFlag('exchangeAccepted')} />
      <SwitchRow label="Title deed available" active={filters.titleDeedAvailable} onClick={() => toggleFlag('titleDeedAvailable', 'Title deed available')} />
      <SwitchRow label="By owner" active={filters.byOwner} onClick={() => toggleFlag('byOwner', 'By owner')} />
      <SwitchRow label="By agent" active={filters.byAgent} onClick={() => toggleFlag('byAgent', 'By agent')} />
      <SwitchRow label="New construction" active={(filters.features || []).includes('New construction')} onClick={() => toggleFeature('New construction')} />
      <FilterSectionTitle>Amenities</FilterSectionTitle>
      {['Parking', 'Garden', 'Security', 'Balcony', 'Water Tank', 'Backup Generator', 'CCTV', 'Pool'].map((feature) => (
        <SwitchRow key={feature} label={feature} active={(filters.features || []).includes(feature)} onClick={() => toggleFeature(feature)} />
      ))}
    </>
  );
}

function SellScreen({ currentUserId, currentProfile, onCreated, onNeedAuth, editingListing, onCancelEdit, onSaved, onToast }) {
  const [form, setForm] = useState(() => {
    if (editingListing) return toForm(editingListing);
    try {
      const draft = window.localStorage.getItem(SELL_DRAFT_KEY);
      return draft ? { ...INITIAL_FORM, ...JSON.parse(draft) } : INITIAL_FORM;
    } catch {
      return INITIAL_FORM;
    }
  });
  const [step, setStep] = useState('details');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editingListing) {
      setForm(toForm(editingListing));
      setStep('details');
    }
  }, [editingListing]);

  const stepIndex = LISTING_STEP_KEYS.indexOf(step);
  const cityOptions = form.region ? citiesOf(form.country, form.region) : [];
  const areaOptions = form.city ? areasOf(form.country, form.city) : [];
  const generatedTitle = generatedListingTitle(form);
  const visibleFeatures = FEATURES.filter((feature) => !['Parking', 'Garden'].includes(feature));
  const previewListing = {
    ...form,
    title: form.title || generatedTitle,
    photoUrl: form.photos[0] || null,
    sellerId: currentUserId,
    sellerName: currentProfile?.name || currentProfile?.email || 'Seller',
  };

  const validation = useMemo(() => {
    const errors = {};
    if (!currentUserId) errors.auth = 'Sign in before publishing a listing.';
    if (!form.propertyType) errors.propertyType = 'Choose a property type.';
    if (!form.listingType) errors.listingType = 'Choose sale or rent.';
    if (!form.price || Number(form.price) <= 0) errors.price = 'Add a valid price.';
    if (!form.country) errors.country = 'Choose a country.';
    if (!form.region) errors.region = 'Choose a region.';
    if (!form.city) errors.city = 'Choose a city.';
    if (!form.photos.length) errors.photos = 'Add at least one property photo.';
    if (uploading) errors.photos = 'Wait for photos to finish uploading.';
    if (String(form.description || '').trim().length < 30) errors.description = 'Write at least 30 characters.';
    if (form.listingType === 'For Rent' && !form.rentPeriod) errors.rentPeriod = 'Choose a rent period.';
    return errors;
  }, [currentUserId, form, uploading]);

  const stepErrors = {
    details: ['auth', 'propertyType', 'listingType', 'price', 'rentPeriod'],
    location: ['country', 'region', 'city'],
    photos: ['photos'],
    review: ['description'],
  };
  const currentStepErrors = stepErrors[step].map((key) => validation[key]).filter(Boolean);
  const canSubmit = currentUserId && Object.keys(validation).length === 0 && !submitting;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateCountry = (value) => {
    setForm((prev) => ({
      ...prev,
      country: value,
      region: '',
      city: '',
      area: '',
      currency: CURRENCY_BY_COUNTRY[value] || prev.currency,
    }));
  };
  const updateRegion = (value) => setForm((prev) => ({ ...prev, region: value, city: '', area: '' }));
  const updateCity = (value) => setForm((prev) => ({ ...prev, city: value, area: '' }));
  const toggleFeature = (feature) => {
    setForm((prev) => {
      const features = prev.features || [];
      return { ...prev, features: features.includes(feature) ? features.filter((item) => item !== feature) : [...features, feature] };
    });
  };
  const movePhoto = (from, to) => {
    if (to < 0 || to >= form.photos.length) return;
    setForm((prev) => {
      const photos = [...prev.photos];
      const [photo] = photos.splice(from, 1);
      photos.splice(to, 0, photo);
      return { ...prev, photos };
    });
  };
  const saveDraft = () => {
    window.localStorage.setItem(SELL_DRAFT_KEY, JSON.stringify(form));
    onToast('Draft saved on this device', 'success');
  };
  const clearDraft = () => {
    window.localStorage.removeItem(SELL_DRAFT_KEY);
    if (!editingListing) setForm(INITIAL_FORM);
    onToast('Draft cleared', 'info');
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []).slice(0, Math.max(0, MAX_LISTING_PHOTOS - form.photos.length));
    event.target.value = '';
    if (!files.length) {
      if (form.photos.length >= MAX_LISTING_PHOTOS) onToast(`You can upload up to ${MAX_LISTING_PHOTOS} photos`, 'info');
      return;
    }
    if (!currentUserId) {
      onNeedAuth();
      return;
    }
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        uploaded.push(await uploadPhoto(file));
      }
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded].slice(0, MAX_LISTING_PHOTOS) }));
    } catch (error) {
      onToast(error.message || 'Could not upload photos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const goNext = () => {
    if (currentStepErrors.length) {
      onToast(currentStepErrors[0], 'error');
      return;
    }
    setStep(LISTING_STEP_KEYS[Math.min(LISTING_STEP_KEYS.length - 1, stepIndex + 1)]);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!currentUserId) {
      onNeedAuth();
      return;
    }
    if (!canSubmit) {
      onToast(Object.values(validation)[0] || 'Finish the listing first', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await ensureCurrentProfile(currentProfile || {});
      const payload = { ...form, title: form.title || generatedTitle };
      if (editingListing) {
        await updateListing(editingListing.id, payload);
        await onSaved();
      } else {
        await createListing(payload);
        window.localStorage.removeItem(SELL_DRAFT_KEY);
        setForm(INITIAL_FORM);
        setStep('details');
        await onCreated();
      }
    } catch (error) {
      onToast(error.message || 'Could not publish listing', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-24">
      <TopBar title={editingListing ? 'Edit Listing' : 'List a Property'} subtitle={currentProfile ? `Posting as ${currentProfile.name || currentProfile.email}` : 'Post for sale or rent'} />
      <form onSubmit={submit} className="space-y-5 px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {LISTING_STEP_KEYS.map((item, index) => (
            <button key={item} type="button" onClick={() => setStep(item)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold ${step === item ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-white/5 text-stone-400'}`}>
              {index + 1}. {LISTING_STEP_LABELS[item]}
            </button>
          ))}
        </div>

        {currentStepErrors.length ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-100">
            {currentStepErrors[0]}
          </div>
        ) : null}

        {!currentProfile?.phone && currentUserId ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs leading-relaxed text-stone-300">
            Add a phone number in Account so buyers can reach you faster.
          </div>
        ) : null}

        {step === 'details' ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <SectionTitle title="Details" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Custom title" value={form.title} onChange={(value) => update('title', value)} placeholder={generatedTitle} className="col-span-2" />
              <SelectField label="Property type" value={form.propertyType} onChange={(value) => update('propertyType', value)} options={PROPERTY_TYPES} />
              <SelectField label="Listing type" value={form.listingType} onChange={(value) => update('listingType', value)} options={LISTING_TYPES} />
              <InputField label="Bedrooms" value={form.bedrooms} onChange={(value) => update('bedrooms', value)} type="number" min="0" />
              <InputField label="Bathrooms" value={form.bathrooms} onChange={(value) => update('bathrooms', value)} type="number" min="0" />
              <InputField label="Size (sqm)" value={form.sizeSqm} onChange={(value) => update('sizeSqm', value)} type="number" min="0" />
              <InputField label="Price" value={form.price} onChange={(value) => update('price', value)} type="number" min="0" />
              <SelectField label="Currency" value={form.currency} onChange={(value) => update('currency', value)} options={CURRENCIES} />
              <SelectField label="Condition" value={form.condition} onChange={(value) => update('condition', value)} options={CONDITIONS} />
              <SelectField label="Furnishing" value={form.furnished} onChange={(value) => update('furnished', value)} options={['', ...FURNISHED_OPTIONS]} />
              {form.listingType === 'For Rent' ? <SelectField label="Rent period" value={form.rentPeriod} onChange={(value) => update('rentPeriod', value)} options={['Monthly', 'Quarterly', 'Yearly']} /> : null}
            </div>
            <div className="mt-4 rounded-2xl bg-stone-950/40 p-3 text-xs text-stone-400">
              Suggested title: <span className="text-stone-200">{generatedTitle}</span>
            </div>
          </div>
        ) : null}

        {step === 'location' ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <SectionTitle title="Location" />
            <div className="grid grid-cols-2 gap-3">
              <SelectField label="Country" value={form.country} onChange={updateCountry} options={COUNTRIES} />
              <SelectField label="Region" value={form.region} onChange={updateRegion} options={['', ...regionsOf(form.country)]} />
              {cityOptions.length ? (
                <SelectField label="City" value={form.city} onChange={updateCity} options={['', ...cityOptions]} />
              ) : (
                <InputField label="City" value={form.city} onChange={updateCity} />
              )}
              {areaOptions.length ? (
                <SelectField label="Area" value={form.area} onChange={(value) => update('area', value)} options={['', ...areaOptions]} />
              ) : (
                <InputField label="Area" value={form.area} onChange={(value) => update('area', value)} />
              )}
              <InputField label="Landmark" value={form.landmark} onChange={(value) => update('landmark', value)} className="col-span-2" />
              <InputField label="Address / location" value={form.location} onChange={(value) => update('location', value)} className="col-span-2" />
            </div>
          </div>
        ) : null}

        {step === 'photos' ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <SectionTitle title="Photos" />
            <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-stone-950/40 px-4 py-4 text-sm text-stone-300 ${uploading || form.photos.length >= MAX_LISTING_PHOTOS ? 'opacity-60' : ''}`}>
              <Camera className="h-4 w-4" />
              {uploading ? 'Uploading photos...' : form.photos.length >= MAX_LISTING_PHOTOS ? 'Photo limit reached' : `Upload property photos (${form.photos.length}/${MAX_LISTING_PHOTOS})`}
              <input type="file" accept="image/*" multiple disabled={uploading || form.photos.length >= MAX_LISTING_PHOTOS} onChange={handleFiles} className="hidden" />
            </label>
            {form.photos.length ? (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {form.photos.map((url, index) => (
                  <div key={url} className="relative overflow-hidden rounded-2xl border border-white/10">
                    <img src={url} alt="Listing" className="h-32 w-full object-cover" />
                    {index === 0 ? <div className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-stone-950">Cover</div> : null}
                    <button type="button" onClick={() => update('photos', form.photos.filter((item) => item !== url))} className="absolute right-2 top-2 rounded-full bg-stone-950/75 p-1">
                      <X className="h-3 w-3" />
                    </button>
                    <div className="grid grid-cols-3 gap-1 bg-stone-950/90 p-1 text-[10px]">
                      <button type="button" onClick={() => movePhoto(index, 0)} className="rounded bg-white/10 px-1 py-1 text-stone-200">Cover</button>
                      <button type="button" onClick={() => movePhoto(index, index - 1)} className="rounded bg-white/10 px-1 py-1 text-stone-200">Left</button>
                      <button type="button" onClick={() => movePhoto(index, index + 1)} className="rounded bg-white/10 px-1 py-1 text-stone-200">Right</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <SectionTitle title="Features" />
            <div className="flex flex-wrap gap-2">
              {visibleFeatures.map((feature) => (
                <Chip key={feature} active={form.features.includes(feature)} onClick={() => toggleFeature(feature)}>
                  {feature}
                </Chip>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ToggleField label="Parking" checked={form.parking} onChange={(value) => update('parking', value)} />
              <ToggleField label="Garden" checked={form.garden} onChange={(value) => update('garden', value)} />
              {form.listingType === 'For Rent' ? (
                <>
                  <ToggleField label="Utilities included" checked={form.features.includes('Utilities included')} onChange={() => toggleFeature('Utilities included')} />
                  <ToggleField label="Available now" checked={form.features.includes('Available now')} onChange={() => toggleFeature('Available now')} />
                </>
              ) : (
                <>
                  <ToggleField label="Negotiable" checked={form.negotiable} onChange={(value) => update('negotiable', value)} />
                  <ToggleField label="Financing available" checked={form.financingAvailable} onChange={(value) => update('financingAvailable', value)} />
                  <ToggleField label="Title deed available" checked={form.features.includes('Title deed available')} onChange={() => toggleFeature('Title deed available')} />
                  <ToggleField label="New construction" checked={form.features.includes('New construction')} onChange={() => toggleFeature('New construction')} />
                </>
              )}
            </div>
          </div>
        ) : null}

        {step === 'review' ? (
          <>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <SectionTitle title="Description" />
              <textarea
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                rows={5}
                placeholder="Tell buyers or renters what makes this property special."
                className="w-full rounded-2xl border border-white/10 bg-stone-950/40 px-4 py-3 text-sm outline-none placeholder:text-stone-500"
              />
              <div className="mt-2 text-xs text-stone-500">{String(form.description || '').trim().length}/30 minimum characters</div>
            </div>
            <div>
              <SectionTitle title="Preview" />
              <ListingCard listing={previewListing} saved={false} onOpen={() => {}} onToggleSave={() => {}} ownListing />
            </div>
          </>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          {stepIndex > 0 ? (
            <button type="button" onClick={() => setStep(LISTING_STEP_KEYS[stepIndex - 1])} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-stone-200">
              Back
            </button>
          ) : (
            <button type="button" onClick={saveDraft} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-stone-200">
              Save draft
            </button>
          )}
          {step !== 'review' ? (
            <button type="button" onClick={goNext} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950">
              Continue
            </button>
          ) : (
            <button type="submit" disabled={!canSubmit} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950 disabled:opacity-50">
              {submitting ? 'Saving...' : editingListing ? 'Update listing' : 'Publish listing'}
            </button>
          )}
        </div>
        <div className="flex justify-center gap-4 text-sm">
          <button type="button" onClick={saveDraft} className="text-stone-400">Save draft</button>
          {!editingListing ? <button type="button" onClick={clearDraft} className="text-stone-500">Clear draft</button> : null}
          {editingListing ? <button type="button" onClick={onCancelEdit} className="text-stone-400">Cancel editing</button> : null}
        </div>
      </form>
    </div>
  );
}

function AgentsScreen({ listings, onOpenListing }) {
  const agents = useMemo(() => {
    const grouped = new Map();
    listings.forEach((listing) => {
      const key = listing.sellerId || listing.sellerName || 'seller';
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          name: listing.sellerName || 'Property agent',
          phone: listing.sellerPhone,
          email: listing.sellerEmail,
          listings: [],
        });
      }
      grouped.get(key).listings.push(listing);
    });
    return [...grouped.values()].sort((a, b) => b.listings.length - a.listings.length);
  }, [listings]);

  return (
    <div className="pb-24">
      <TopBar title="Agents" subtitle="Browse sellers and property agents" />
      <div className="space-y-4 px-4 pt-4">
        {agents.length ? (
          agents.map((agent) => (
            <div key={agent.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                    <Store className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{agent.name}</h3>
                    <p className="text-sm text-stone-400">{agent.listings.length} listing{agent.listings.length === 1 ? '' : 's'}</p>
                  </div>
                </div>
                {agent.phone ? <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-stone-300">{agent.phone}</span> : null}
              </div>
              <div className="mt-4 space-y-2">
                {agent.listings.slice(0, 3).map((listing) => (
                  <button
                    key={listing.id}
                    type="button"
                    onClick={() => onOpenListing(listing)}
                    className="flex w-full items-center justify-between rounded-2xl bg-stone-950/40 px-3 py-3 text-left"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{listingTitle(listing)}</div>
                      <div className="mt-0.5 text-xs text-stone-400">{formatPrice(listing.price, listing.currency)} · {listing.listingType}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-stone-500" />
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="No agents yet" text="Agents and sellers will appear here after properties are listed." />
        )}
      </div>
    </div>
  );
}

function MessagesScreen({ currentUserId, selectedThreadId, readAtByThread, onSelectThread, onThreadRead, onOpenAuth, onOpenListing, onBrowseHomes, onToast }) {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const threadLabel = (thread) => {
    const other = thread.buyer_id === currentUserId ? thread.seller : thread.buyer;
    return other?.business_name || other?.name || other?.email || 'Conversation';
  };

  const threadRole = (thread) => (thread.buyer_id === currentUserId ? 'buying' : 'selling');
  const listingLabel = (listing) => listing?.title || listing?.property_type || 'Property listing';

  const formatTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const sameDay = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (sameDay) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const dateLabel = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === now.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    return threads.filter((thread) => {
      if (filter === 'buying' && threadRole(thread) !== 'buying') return false;
      if (filter === 'selling' && threadRole(thread) !== 'selling') return false;
      if (filter === 'unread' && !thread.unreadCount) return false;
      if (!q) return true;
      const haystack = [
        threadLabel(thread),
        listingLabel(thread.listing),
        thread.listing?.city,
        thread.listing?.area,
        thread.listing?.location,
        thread.lastMessage?.body,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [threads, filter, query, currentUserId]);

  const activeThread = filteredThreads.find((thread) => thread.id === selectedThreadId) || filteredThreads[0] || null;

  const appendMessage = (message) => {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev;
      return [...prev, message].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });
  };

  const refreshThreads = async () => {
    const data = await loadThreads(readAtByThread);
    setThreads(data);
    if (!selectedThreadId && data[0]) onSelectThread(data[0].id);
  };

  useEffect(() => {
    if (!currentUserId) {
      setThreads([]);
      setMessages([]);
      return;
    }
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const data = await loadThreads(readAtByThread);
        if (!active) return;
        setThreads(data);
        if (!selectedThreadId && data[0]) onSelectThread(data[0].id);
      } catch (error) {
        onToast(error.message || 'Could not load messages', 'error');
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [currentUserId, readAtByThread]);

  useEffect(() => {
    if (!activeThread?.id) {
      setMessages([]);
      return;
    }
    let active = true;
    const run = async () => {
      try {
        const data = await loadThreadMessages(activeThread.id);
        if (active) setMessages(data);
      } catch (error) {
        onToast(error.message || 'Could not load conversation', 'error');
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [activeThread?.id]);

  useEffect(() => {
    if (!activeThread?.id || !currentUserId) return;
    onThreadRead(activeThread.id);
    markThreadRead(activeThread.id).catch((error) => console.info('markThreadRead:', error.message));
  }, [activeThread?.id, currentUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, activeThread?.id]);

  useEffect(() => {
    if (!currentUserId) return undefined;
    const channel = supabase
      .channel(`messages-inbox-${currentUserId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const message = payload.new;
        setThreads((prev) => prev.map((thread) => (thread.id === message.thread_id ? { ...thread, lastMessage: message, unreadCount: message.sender_id === currentUserId || thread.id === activeThread?.id ? 0 : (thread.unreadCount || 0) + 1 } : thread)));
        if (message.thread_id === activeThread?.id) {
          appendMessage(message);
          onThreadRead(message.thread_id);
          markThreadRead(message.thread_id).catch(() => {});
        } else {
          try {
            await refreshThreads();
          } catch (error) {
            console.info('refreshThreads:', error.message);
          }
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, activeThread?.id, readAtByThread]);

  const send = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!activeThread || !text) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      thread_id: activeThread.id,
      sender_id: currentUserId,
      body: text,
      created_at: new Date().toISOString(),
      sending: true,
    };
    setSending(true);
    setDraft('');
    appendMessage(optimistic);
    setThreads((prev) => prev.map((thread) => (thread.id === activeThread.id ? { ...thread, lastMessage: optimistic } : thread)));
    try {
      const message = await sendThreadMessage(activeThread.id, text);
      setMessages((prev) => prev.map((item) => (item.id === tempId ? message : item)).filter((item, index, arr) => arr.findIndex((candidate) => candidate.id === item.id) === index));
      setThreads((prev) => prev.map((thread) => (thread.id === activeThread.id ? { ...thread, lastMessage: message } : thread)));
    } catch (error) {
      setMessages((prev) => prev.map((item) => (item.id === tempId ? { ...item, sending: false, failed: true } : item)));
      setDraft(text);
      onToast(error.message || 'Could not send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="pb-24">
      <TopBar title="Messages" subtitle="Conversations with sellers and renters" />
      <div className="space-y-4 px-4 pt-4">
        {!currentUserId ? (
          <EmptyState
            title="Sign in to message sellers"
            text="After sign-in, your property conversations will live here."
            action="Sign in"
            onAction={onOpenAuth}
          />
        ) : loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-stone-400">Loading messages...</div>
        ) : threads.length ? (
          <>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-stone-950/40 px-3">
                <Search className="h-4 w-4 text-stone-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search conversations"
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-stone-500"
                />
                {query ? <button type="button" onClick={() => setQuery('')} className="rounded-full p-1 text-stone-500"><X className="h-4 w-4" /></button> : null}
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[
                  ['all', 'All'],
                  ['buying', 'Buying'],
                  ['selling', 'Selling'],
                  ['unread', 'Unread'],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-2xl border px-2 py-2 text-xs ${filter === value ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-stone-950/40 text-stone-400'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {filteredThreads.length ? (
              <div className="space-y-2">
                {filteredThreads.map((thread) => {
                  const unread = thread.unreadCount || 0;
                  const listing = thread.listing || {};
                  const lastMessage = thread.lastMessage;
                  return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onSelectThread(thread.id)}
                      className={`flex w-full items-center gap-3 rounded-3xl border p-3 text-left ${activeThread?.id === thread.id ? 'border-emerald-400 bg-emerald-400/15' : unread ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}
                >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-stone-900">
                        {listing.photos?.[0] ? <img src={listing.photos[0]} alt="" className="h-full w-full object-cover" /> : <Building2 className="m-4 h-6 w-6 text-stone-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="truncate text-sm font-semibold text-white">{listingLabel(listing)}</div>
                          {unread ? <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" /> : null}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-stone-400">{threadLabel(thread)} - {threadRole(thread) === 'buying' ? 'Buying' : 'Selling'}</div>
                        <div className={`mt-1 truncate text-xs ${unread ? 'font-semibold text-emerald-200' : 'text-stone-500'}`}>{lastMessage?.body || 'No messages yet'}</div>
                        <div className="mt-1 truncate text-[11px] text-stone-500">{listing.city || listing.area || listing.location || 'Location not set'} - {listing.status || 'active'}</div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="text-[11px] text-stone-500">{formatTime(lastMessage?.created_at || thread.created_at)}</span>
                        {unread ? <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span> : <ChevronRight className="h-4 w-4 text-stone-500" />}
                      </div>
                </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-stone-400">No conversations match your filters.</div>
            )}

            {activeThread ? (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <button type="button" onClick={() => activeThread.listing ? onOpenListing(rowToThreadListing(activeThread.listing)) : null} className="flex w-full items-center gap-3 border-b border-white/10 p-4 text-left">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-stone-900">
                    {activeThread.listing?.photos?.[0] ? <img src={activeThread.listing.photos[0]} alt="" className="h-full w-full object-cover" /> : <Building2 className="m-4 h-6 w-6 text-stone-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">{activeThread.listing?.title || activeThread.listing?.property_type || 'Property listing'}</div>
                    <div className="mt-1 truncate text-xs text-stone-400">{formatPrice(activeThread.listing?.price, activeThread.listing?.currency)} - {activeThread.listing?.listing_type || 'Listing'}</div>
                    <div className="mt-0.5 truncate text-xs text-stone-500">{activeThread.listing?.city || activeThread.listing?.area || activeThread.listing?.location || 'Location not set'} - {threadLabel(activeThread)}</div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-stone-950/40 px-2 py-1 text-[10px] uppercase tracking-wide text-stone-400">{activeThread.listing?.status || 'active'}</span>
                </button>

                <div className="max-h-[52vh] space-y-3 overflow-y-auto p-4">
                  {messages.length ? (
                    messages.map((message, index) => {
                      const mine = message.sender_id === currentUserId;
                      const prev = messages[index - 1];
                      const showDate = !prev || dateLabel(prev.created_at) !== dateLabel(message.created_at);
                      return (
                        <React.Fragment key={message.id}>
                          {showDate ? <div className="py-1 text-center text-[11px] uppercase tracking-wide text-stone-500">{dateLabel(message.created_at)}</div> : null}
                          <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${mine ? 'bg-emerald-500 text-stone-950' : 'bg-stone-950/70 text-stone-100'}`}>
                              {!mine ? <div className="mb-1 text-[11px] font-semibold text-stone-400">{threadLabel(activeThread)}</div> : null}
                              <div>{message.body}</div>
                              <div className={`mt-1 text-[10px] ${mine ? 'text-stone-800/70' : 'text-stone-500'}`}>{message.failed ? 'Failed - tap send again' : message.sending ? 'Sending...' : formatTime(message.created_at)}</div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-sm text-stone-400">Write the first message.</div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={send} className="flex gap-2 border-t border-white/10 p-3">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Write a message"
                    className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-stone-950/60 px-4 py-3 text-sm outline-none placeholder:text-stone-500"
                  />
                  <button type="submit" disabled={sending || !draft.trim()} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950 disabled:opacity-50">
                    {sending ? 'Sending' : 'Send'}
                  </button>
                </form>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState title="No messages yet" text="Open a listing and tap Send Message to start a conversation." action="Browse homes" onAction={onBrowseHomes} />
        )}
      </div>
    </div>
  );
}

function rowToThreadListing(row) {
  const photos = Array.isArray(row.photos) ? row.photos : [];
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    currency: row.currency,
    photos,
    photoUrl: photos[0] || null,
    propertyType: row.property_type,
    listingType: row.listing_type,
    location: row.location,
    city: row.city,
    area: row.area,
    sellerId: row.seller_id,
    status: row.status,
  };
}

function AdminScreen({ onBack, onToast, onListingsChanged }) {
  const [tab, setTab] = useState('listings');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [listingSearch, setListingSearch] = useState('');
  const [featuredUpdatingIds, setFeaturedUpdatingIds] = useState(() => new Set());
  const [adminActionError, setAdminActionError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [nextStats, nextUsers, nextListings, nextReports] = await Promise.all([
          getAdminStats(),
          getAllUsers(),
          getAllListings(),
          getAllReports(),
        ]);
        if (!active) return;
        setStats(nextStats);
        setUsers(nextUsers);
        setListings(nextListings);
        setReports(nextReports);
      } catch (error) {
        onToast(error.message || 'Could not load admin data', 'error');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [onToast]);

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Delete this listing permanently?')) return;
    try {
      await adminDeleteListing(id);
      setListings((prev) => prev.filter((listing) => listing.id !== id));
      setStats((prev) => (prev ? { ...prev, listings: Math.max(0, prev.listings - 1) } : prev));
      await onListingsChanged();
      onToast('Listing deleted', 'success');
    } catch (error) {
      onToast(error.message || 'Delete failed', 'error');
    }
  };

  const handleToggleDisable = async (user) => {
    const disabled = !user.disabled;
    try {
      await adminUpdateProfile(user.id, { disabled });
      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, disabled } : item)));
      onToast(disabled ? 'User disabled' : 'User enabled', 'success');
    } catch (error) {
      onToast(error.message || 'Could not update user', 'error');
    }
  };

  const handleResolveReport = async (reportId, status) => {
    try {
      await adminUpdateReport(reportId, { status });
      setReports((prev) => prev.map((report) => (report.id === reportId ? { ...report, status } : report)));
      onToast(`Report marked ${status}`, 'success');
    } catch (error) {
      onToast(error.message || 'Could not update report', 'error');
    }
  };

  const handleToggleFeatured = async (listing) => {
    if (featuredUpdatingIds.has(listing.id)) return;
    const featured = !listing.featured;
    setFeaturedUpdatingIds((prev) => new Set(prev).add(listing.id));
    setAdminActionError('');
    try {
      const updatedListing = await adminUpdateListing(listing.id, {
        featured,
      });
      setListings((prev) => prev.map((item) => (item.id === listing.id ? updatedListing : item)));
      await onListingsChanged();
      onToast(featured ? 'Listing featured' : 'Listing removed from featured', 'success');
    } catch (error) {
      const message = error.message || 'Could not update featured listing';
      setAdminActionError(message);
      onToast(message, 'error');
    } finally {
      setFeaturedUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(listing.id);
        return next;
      });
    }
  };

  const featuredCount = useMemo(() => listings.filter((listing) => listing.featured).length, [listings]);
  const filteredListings = useMemo(() => {
    const text = listingSearch.trim().toLowerCase();
    return listings.filter((listing) => {
      if (featuredFilter === 'featured' && !listing.featured) return false;
      if (featuredFilter === 'not_featured' && listing.featured) return false;
      if (!text) return true;
      const haystack = [
        listingTitle(listing),
        listing.propertyType,
        listing.listingType,
        listing.status,
        listing.country,
        listing.region,
        listing.city,
        listing.area,
        listing.location,
        listing.sellerName,
        listing.sellerEmail,
      ].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(text);
    });
  }, [featuredFilter, listingSearch, listings]);

  const tabClass = (value) => `relative flex-1 py-3 text-sm font-medium ${tab === value ? 'text-emerald-300' : 'text-stone-400'}`;
  const statCard = (label, value, className = 'text-white') => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className={`text-2xl font-bold ${className}`}>{value}</div>
      <div className="mt-1 text-xs uppercase tracking-wide text-stone-500">{label}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="pb-24">
        <TopBar title="Admin Dashboard" subtitle="Loading marketplace data" />
        <div className="px-4 pt-8 text-center text-sm text-stone-400">Loading admin data...</div>
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="sticky top-0 z-20 border-b border-white/10 bg-stone-950/90 px-4 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="rounded-full border border-white/10 bg-white/5 p-2">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            <p className="text-xs text-stone-400">Manage your marketplace</p>
          </div>
          <Shield className="h-6 w-6 text-emerald-300" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {stats ? (
          <>
            {statCard('Total Users', stats.users, 'text-emerald-300')}
            {statCard('Listings', stats.listings)}
            {statCard('Featured', featuredCount, featuredCount ? 'text-amber-300' : 'text-white')}
            {statCard('Reports', stats.reports, stats.reports ? 'text-amber-300' : 'text-white')}
            {statCard('Messages', stats.messages)}
          </>
        ) : null}
      </div>

      <div className="mt-5 grid grid-cols-3 border-b border-white/10">
        {[
          ['users', `Users (${users.length})`],
          ['listings', `Listings (${listings.length})`],
          ['reports', `Reports (${reports.length})`],
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={tabClass(id)}>
            {label}
            {tab === id ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-500" /> : null}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <div className="mt-2">
          {users.length ? users.map((user) => {
            const admin = isAdminProfile(user);
            return (
              <div key={user.id} className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5">
                  <UserRound className="h-5 w-5 text-stone-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{user.name || 'User'}</div>
                  <div className="truncate text-xs text-stone-400">{user.email}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                    <span className="rounded bg-white/8 px-1.5 py-0.5 text-stone-300">{user.role || 'buyer'}</span>
                    {admin ? <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-200">Admin</span> : null}
                    {user.disabled ? <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-red-200">Disabled</span> : null}
                  </div>
                </div>
                {!admin ? (
                  <button type="button" onClick={() => handleToggleDisable(user)} className={`rounded-xl border px-3 py-2 text-xs ${user.disabled ? 'border-emerald-500/40 text-emerald-200' : 'border-red-500/40 text-red-200'}`}>
                    {user.disabled ? 'Enable' : 'Disable'}
                  </button>
                ) : null}
              </div>
            );
          }) : <EmptyState title="No users yet" text="User accounts will appear here." />}
        </div>
      ) : null}

      {tab === 'listings' ? (
        <div className="mt-2">
          <div className="space-y-3 border-b border-white/5 px-4 py-3">
            {adminActionError ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs leading-relaxed text-red-100">
                {adminActionError}
              </div>
            ) : null}
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-stone-950/60 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-stone-400" />
              <input
                value={listingSearch}
                onChange={(event) => setListingSearch(event.target.value)}
                placeholder="Search listings, sellers, location"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-500"
              />
              {listingSearch ? (
                <button type="button" onClick={() => setListingSearch('')} className="rounded-lg p-1 text-stone-400">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {[
                ['all', `All (${listings.length})`],
                ['featured', `Featured (${featuredCount})`],
                ['not_featured', `Not featured (${listings.length - featuredCount})`],
              ].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setFeaturedFilter(id)} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-medium ${featuredFilter === id ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-white/5 text-stone-400'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {filteredListings.length ? filteredListings.map((listing) => (
            <div key={listing.id} className={`flex items-center gap-3 border-b px-4 py-3 ${listing.featured ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/5'}`}>
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-white/5">
                {listing.photos?.[0] ? (
                  <img src={listing.photos[0]} alt={listingTitle(listing)} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Home className="h-5 w-5 text-stone-600" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{listingTitle(listing)}</span>
                  {listing.featured ? <span className="shrink-0 rounded border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">Featured</span> : null}
                </div>
                <div className="truncate text-xs text-stone-400">{formatPrice(listing.price, listing.currency)} - {listing.location || listing.city || listing.country || 'No location'}</div>
                <div className="truncate text-xs text-stone-500">Seller: {listing.sellerName || listing.sellerEmail || 'Unknown'}</div>
                <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                  <span className="rounded bg-white/8 px-1.5 py-0.5 text-stone-300">{listing.status || 'active'}</span>
                  {listing.createdAt ? <span className="rounded bg-white/8 px-1.5 py-0.5 text-stone-300">{new Date(listing.createdAt).toLocaleDateString()}</span> : null}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" disabled={featuredUpdatingIds.has(listing.id)} onClick={() => handleToggleFeatured(listing)} className={`rounded-lg border px-2 py-1 text-[10px] font-semibold disabled:opacity-50 ${listing.featured ? 'border-amber-500/40 bg-amber-500/20 text-amber-300' : 'border-white/10 bg-white/5 text-stone-400'}`}>
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {featuredUpdatingIds.has(listing.id) ? 'Saving' : listing.featured ? 'Unfeature' : 'Feature'}
                  </span>
                </button>
                <button type="button" onClick={() => handleDeleteListing(listing.id)} className="rounded-lg border border-red-500/40 p-2 text-red-200">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )) : <EmptyState title="No listings match" text="Try a different admin search or filter." />}
        </div>
      ) : null}

      {tab === 'reports' ? (
        <div className="mt-2">
          {reports.length ? reports.map((report) => {
            const listing = listings.find((item) => item.id === report.listing_id);
            const reporter = users.find((user) => user.id === report.reporter_id);
            return (
              <div key={report.id} className="border-b border-white/5 px-4 py-4">
                <div className="text-sm font-medium">{listing ? listingTitle(listing) : 'Unknown listing'}</div>
                <div className="mt-1 text-xs text-stone-400">Reported by: {reporter?.name || reporter?.email || 'Unknown'}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-1 text-amber-200">{report.reason || 'Report'}</span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-stone-300">{report.status || 'pending'}</span>
                </div>
                {report.status === 'pending' || !report.status ? (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button type="button" onClick={() => handleResolveReport(report.id, 'resolved')} className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-stone-950">Resolve</button>
                    <button type="button" onClick={() => handleResolveReport(report.id, 'dismissed')} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-stone-300">Dismiss</button>
                    {listing ? <button type="button" onClick={() => { handleDeleteListing(listing.id); handleResolveReport(report.id, 'resolved'); }} className="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white">Delete</button> : null}
                  </div>
                ) : null}
              </div>
            );
          }) : <EmptyState title="No reports yet" text="Reported listings will appear here." />}
        </div>
      ) : null}
    </div>
  );
}

function AccountScreen({ currentProfile, currentUserId, currentUserEmail, myListings, savedCount, unreadMessages, themeMode, onThemeChange, onOpenListing, onDeleteListing, onStartEdit, onOpenAuth, onSignOut, onProfileSaved, onOpenAdmin, onNavigate, onUpdateListingStatus }) {
  const [name, setName] = useState(currentProfile?.name || '');
  const [phone, setPhone] = useState(currentProfile?.phone || '');
  const [businessName, setBusinessName] = useState(currentProfile?.business_name || '');
  const [role, setRole] = useState(currentProfile?.role || 'buyer');
  const [telegram, setTelegram] = useState(currentProfile?.telegram || '');
  const [openSection, setOpenSection] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusSavingId, setStatusSavingId] = useState(null);

  useEffect(() => {
    setName(currentProfile?.name || '');
    setPhone(currentProfile?.phone || '');
    setBusinessName(currentProfile?.business_name || '');
    setRole(currentProfile?.role || 'buyer');
    setTelegram(currentProfile?.telegram || '');
  }, [currentProfile]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() || null,
        businessName: businessName.trim() || null,
        role,
        telegram: telegram.trim() || null,
      });
      await onProfileSaved();
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (listing, status) => {
    if ((listing.status || 'active') === status) return;
    setStatusSavingId(listing.id);
    try {
      await onUpdateListingStatus(listing.id, status);
    } finally {
      setStatusSavingId(null);
    }
  };

  const activeListings = myListings.filter((listing) => (listing.status || 'active') === 'active').length;
  const statItems = [
    ['My Listings', myListings.length],
    ['Active', activeListings],
    ['Saved', savedCount],
    ['Unread', unreadMessages],
  ];

  const toggleSection = (section) => setOpenSection((current) => (current === section ? null : section));

  const SectionButton = ({ section, icon: Icon, label, detail, onClick }) => {
    const expanded = openSection === section;
    return (
      <button
        type="button"
        onClick={onClick || (() => toggleSection(section))}
        className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left active:bg-white/10"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-950/50 text-emerald-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">{label}</div>
          {detail ? <div className="mt-0.5 truncate text-xs text-stone-400">{detail}</div> : null}
        </div>
        {onClick ? <ChevronRight className="h-5 w-5 text-stone-500" /> : expanded ? <ChevronUp className="h-5 w-5 text-stone-500" /> : <ChevronDown className="h-5 w-5 text-stone-500" />}
      </button>
    );
  };

  const ThemeButton = ({ value, label }) => {
    const active = themeMode === value;
    return (
      <button
        type="button"
        onClick={() => onThemeChange(value)}
        className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold ${active ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-stone-950/40 text-stone-400'}`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="pb-24">
      <TopBar title="Account" subtitle={currentUserId ? 'Manage your profile and listings' : 'Sign in to post and save'} />
      <div className="space-y-4 px-4 pt-4">
        {!currentUserId ? (
          <EmptyState title="Your account is not connected" text="Sign in to save homes and manage listings." action="Sign in" onAction={onOpenAuth} />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {statItems.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3 text-center">
                  <div className="text-lg font-semibold text-white">{value}</div>
                  <div className="mt-1 text-[11px] text-stone-400">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => onNavigate('sell')} className="rounded-2xl bg-emerald-500 px-3 py-3 text-sm font-semibold text-stone-950">
                Post listing
              </button>
              <button type="button" onClick={() => onNavigate('saved')} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-stone-200">
                Saved homes
              </button>
              <button type="button" onClick={() => onNavigate('messages')} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-stone-200">
                Messages
              </button>
            </div>

            <div className="space-y-2">
              <SectionButton section="profile" icon={UserRound} label="Profile" detail={currentProfile?.email || currentUserEmail || 'Edit account details'} />
              {openSection === 'profile' ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="grid grid-cols-1 gap-3">
                    <InputField label="Name" value={name} onChange={setName} />
                    <InputField label="Phone" value={phone} onChange={setPhone} />
                    <InputField label="Business name" value={businessName} onChange={setBusinessName} placeholder="Agency, company, or trade name" />
                    <SelectField label="Role" value={role} onChange={setRole} options={ACCOUNT_ROLES} />
                    <InputField label="Telegram / WhatsApp" value={telegram} onChange={setTelegram} placeholder="@username or phone number" />
                    <div className="rounded-2xl bg-stone-950/40 px-4 py-3 text-sm text-stone-400">{currentProfile?.email || currentUserEmail || 'Signed in'}</div>
                    <button type="button" onClick={saveProfile} disabled={saving} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950">
                      {saving ? 'Saving...' : 'Save profile'}
                    </button>
                  </div>
                </div>
              ) : null}

              {isAdminProfile(currentProfile, currentUserEmail) ? (
                <SectionButton section="admin" icon={Shield} label="Admin Dashboard" detail="Manage users, listings, and reports" onClick={onOpenAdmin} />
              ) : null}

              <SectionButton section="appearance" icon={Palette} label="Appearance" detail={`Current: ${themeMode}`} />
              {openSection === 'appearance' ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Appearance</div>
                      <p className="mt-1 text-xs text-stone-500">Keep the premium dark look or preview a cleaner light marketplace style.</p>
                    </div>
                    <div className="rounded-full border border-white/10 bg-stone-950/40 px-2 py-1 text-[10px] uppercase tracking-wide text-stone-400">
                      {themeMode}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <ThemeButton value="dark" label="Dark" />
                    <ThemeButton value="light" label="Light" />
                  </div>
                </div>
              ) : null}

              <SectionButton section="listings" icon={Store} label="My Listings" detail={`${myListings.length} total, ${activeListings} active`} />
              {openSection === 'listings' ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="space-y-3">
                {myListings.length ? (
                  myListings.map((listing) => (
                    <div key={listing.id} className="rounded-2xl bg-stone-950/40 p-3">
                      <button type="button" onClick={() => onOpenListing(listing)} className="flex w-full items-center justify-between gap-3 text-left">
                        <div>
                          <div className="font-medium">{listingTitle(listing)}</div>
                          <div className="mt-1 text-xs text-stone-500">{listing.city || listing.location || 'Location not set'} - {(listing.photos || []).length} photo{(listing.photos || []).length === 1 ? '' : 's'}</div>
                          <div className="mt-1 text-sm text-stone-400">{formatPrice(listing.price, listing.currency)} - {listing.listingType}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-stone-500" />
                      </button>
                      <div className="mt-3">
                        <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
                          <span>Status</span>
                          {statusSavingId === listing.id ? <span>Saving...</span> : <span className="capitalize">{listing.status || 'active'}</span>}
                        </div>
                        <SegmentGroup value={listing.status || 'active'} options={LISTING_STATUS_OPTIONS} onChange={(status) => updateStatus(listing, status)} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => onStartEdit(listing)} className="rounded-2xl bg-white/8 px-3 py-2 text-sm">
                          Edit
                        </button>
                        <button type="button" onClick={() => onDeleteListing(listing)} className="rounded-2xl bg-red-500/15 px-3 py-2 text-sm text-red-200">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-stone-400">No listings posted yet.</p>
                )}
                  </div>
                </div>
              ) : null}
            </div>

            <button type="button" onClick={onSignOut} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AuthModal({ mode, onClose, onSuccess, onToast }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, { name, phone });
      }
      onSuccess();
    } catch (error) {
      onToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      onToast('Enter your email first', 'info');
      return;
    }
    try {
      await resetPassword(email);
      onToast('Password reset email sent', 'success');
    } catch (error) {
      onToast(error.message || 'Could not send reset email', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-stone-950/70 backdrop-blur-sm">
      <div className="w-full rounded-t-[2rem] border-t border-white/10 bg-stone-950 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{mode === 'signin' ? 'Sign in' : 'Create account'}</h2>
          <button type="button" onClick={onClose} className="rounded-full bg-white/5 p-2">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' ? <InputField label="Name" value={name} onChange={setName} /> : null}
          {mode === 'signup' ? <InputField label="Phone" value={phone} onChange={setPhone} /> : null}
          <InputField label="Email" value={email} onChange={setEmail} type="email" />
          <InputField label="Password" value={password} onChange={setPassword} type="password" />
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950">
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
        <div className="mt-3 flex items-center justify-between text-sm">
          <button type="button" onClick={handleReset} className="text-stone-400">
            Reset password
          </button>
          <button type="button" onClick={() => onSuccess(mode === 'signin' ? 'signup' : 'signin')} className="text-emerald-300">
            {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
          </button>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = 'text', className = '', placeholder = '', min }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} min={min} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-stone-950/40 px-4 py-3 text-sm outline-none placeholder:text-stone-600" />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-stone-950/40 px-4 py-3 text-sm outline-none">
        {options.map((option) => (
          <option key={option} value={option}>
            {option || 'Any'}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`rounded-2xl border px-4 py-3 text-sm ${checked ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-stone-950/40'}`}>
      {label}
    </button>
  );
}

function toForm(listing) {
  return {
    ...INITIAL_FORM,
    ...listing,
    photos: listing.photos || [],
    features: listing.features || [],
  };
}

export default function App() {
  const { toast, show, clear } = useToast();
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('themeMode') || 'dark';
  });
  const [tab, setTab] = useState('discover');
  const [listings, setListings] = useState([]);
  const [myListingRows, setMyListingRows] = useState([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [currentProfile, setCurrentProfile] = useState(null);
  const [savedIds, setSavedIds] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [authOpen, setAuthOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [readAtByThread, setReadAtByThread] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('melaHomesThreadReads') || '{}');
    } catch {
      return {};
    }
  });
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingDeleteListing, setPendingDeleteListing] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshListings = async () => {
    const [data, mine] = await Promise.all([
      loadListings(),
      currentUserId ? loadMyListings(currentUserId) : Promise.resolve([]),
    ]);
    setListings(data);
    setMyListingRows(mine);
    if (selectedListing) {
      const fresh = data.find((item) => item.id === selectedListing.id);
      setSelectedListing(fresh || null);
    }
  };

  const refreshProfile = async (userId) => {
    if (!userId) {
      setCurrentProfile(null);
      setCurrentUserEmail('');
      setSavedIds([]);
      setMyListingRows([]);
      return;
    }
    let profile = await getCurrentProfile(userId);
    if (!profile) {
      try {
        profile = await ensureCurrentProfile();
      } catch (error) {
        console.error('ensureCurrentProfile:', error);
      }
    }
    const [saved, mine] = await Promise.all([
      loadSavedIds(userId),
      loadMyListings(userId),
    ]);
    setCurrentProfile(profile);
    setSavedIds(saved);
    setMyListingRows(mine);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.classList.toggle('theme-dark', themeMode === 'dark');
    document.documentElement.classList.toggle('theme-light', themeMode === 'light');
    window.localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        const user = await getCurrentUser();
        const userId = user?.id || null;
        const data = await loadListings();
        if (!active) return;
        setListings(data);
        setCurrentUserId(userId);
        setCurrentUserEmail(user?.email || '');
        await refreshProfile(userId);
      } catch (error) {
        show(error.message || 'Could not load app', 'error');
      } finally {
        if (active) setLoading(false);
      }
    };
    boot();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;
      setCachedUser(user);
      const userId = user?.id || null;
      setCurrentUserId(userId);
      setCurrentUserEmail(user?.email || '');
      await refreshProfile(userId);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleNavigate = (event) => {
      if (typeof event.detail !== 'string') return;
      setResultsOpen(false);
      setSelectedListing(null);
      setTab(event.detail);
    };
    window.addEventListener('mela:navigate', handleNavigate);
    return () => window.removeEventListener('mela:navigate', handleNavigate);
  }, []);

  useEffect(() => {
    if (!currentUserId) {
      setUnreadMessages(0);
      setReadAtByThread({});
      return undefined;
    }

    let active = true;
    const refreshUnread = async () => {
      try {
        const count = await loadUnreadMessageCount(readAtByThread);
        if (active) setUnreadMessages(count);
      } catch (error) {
        console.error('loadUnreadMessageCount:', error);
      }
    };

    refreshUnread();
    const timer = window.setInterval(refreshUnread, 15000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [currentUserId, readAtByThread]);

  useEffect(() => {
    try {
      window.localStorage.setItem('melaHomesThreadReads', JSON.stringify(readAtByThread));
    } catch {
      // localStorage can be unavailable in private browsing modes.
    }
  }, [readAtByThread]);

  useEffect(() => {
    if (!currentUserId) return;
    let active = true;
    loadThreadReadMap()
      .then((readMap) => {
        if (active && Object.keys(readMap).length) {
          setReadAtByThread((prev) => ({ ...readMap, ...prev }));
        }
      })
      .catch((error) => console.info('loadThreadReadMap:', error.message));
    return () => {
      active = false;
    };
  }, [currentUserId]);

  useEffect(() => {
    if (tab !== 'messages' || !selectedThreadId) return;
    setReadAtByThread((prev) => ({ ...prev, [selectedThreadId]: Date.now() }));
  }, [tab, selectedThreadId]);

  const markThreadLocallyRead = (threadId) => {
    if (!threadId) return;
    setReadAtByThread((prev) => ({ ...prev, [threadId]: Date.now() }));
  };

  const myListings = useMemo(() => myListingRows.filter((listing) => currentUserId && listing.sellerId === currentUserId), [currentUserId, myListingRows]);
  const isAdmin = isAdminProfile(currentProfile, currentUserEmail);

  const handleToggleSave = async (listingId) => {
    if (!currentUserId) {
      setAuthMode('signin');
      setAuthOpen(true);
      return;
    }
    const currentlySaved = savedIds.includes(listingId);
    try {
      await toggleSaved(listingId, currentlySaved);
      setSavedIds((prev) => (currentlySaved ? prev.filter((id) => id !== listingId) : [...prev, listingId]));
    } catch (error) {
      show(error.message || 'Could not update saved list', 'error');
    }
  };

  const requestDeleteListing = (listing) => {
    if (!listing) return;
    setPendingDeleteListing(typeof listing === 'object' ? listing : { id: listing });
  };

  const handleDeleteListing = async () => {
    const listingId = pendingDeleteListing?.id;
    if (!listingId) return;
    try {
      await deleteListing(listingId);
      await refreshListings();
      setSelectedListing(null);
      setPendingDeleteListing(null);
      show('Listing deleted', 'success');
    } catch (error) {
      show(error.message || 'Could not delete listing', 'error');
    }
  };

  const handleUpdateListingStatus = async (listingId, status) => {
    try {
      await updateListing(listingId, { status });
      await refreshListings();
      show(`Listing marked ${status}`, 'success');
    } catch (error) {
      show(error.message || 'Could not update listing status', 'error');
      throw error;
    }
  };

  const handleStartMessage = async (listing) => {
    if (!currentUserId) {
      openAuth('signin');
      return;
    }
    try {
      const thread = await startThreadForListing(listing);
      setSelectedThreadId(thread.id);
      setSelectedListing(null);
      setResultsOpen(false);
      setTab('messages');
    } catch (error) {
      show(error.message || 'Could not start message', 'error');
    }
  };

  const openAuth = (mode = 'signin') => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  const content = () => {
    if (adminOpen && isAdmin) {
      return (
        <AdminScreen
          onBack={() => setAdminOpen(false)}
          onToast={show}
          onListingsChanged={refreshListings}
        />
      );
    }

    if (selectedListing) {
      return (
        <DetailScreen
          listing={selectedListing}
          saved={savedIds.includes(selectedListing.id)}
          ownListing={selectedListing.sellerId === currentUserId}
          onBack={() => setSelectedListing(null)}
          onToggleSave={handleToggleSave}
          onMessage={handleStartMessage}
          onEdit={() => {
            setEditingListing(selectedListing);
            setSelectedListing(null);
            setTab('sell');
          }}
          onDelete={() => requestDeleteListing(selectedListing)}
        />
      );
    }

    if (tab === 'discover') {
      return (
        <DiscoverScreen
          listings={listings}
          query={query}
          setQuery={setQuery}
          filters={filters}
          setFilters={setFilters}
          savedIds={savedIds}
          onOpenListing={setSelectedListing}
          onToggleSave={handleToggleSave}
          onOpenFilters={() => setFiltersOpen(true)}
          onMessage={handleStartMessage}
          resultsOpen={resultsOpen}
          setResultsOpen={setResultsOpen}
        />
      );
    }

    if (tab === 'saved') {
      return (
        <SavedScreen
          listings={listings}
          savedIds={savedIds}
          onOpenListing={setSelectedListing}
          onToggleSave={handleToggleSave}
          requireAuth={Boolean(currentUserId)}
        />
      );
    }

    if (tab === 'messages') {
      return (
        <MessagesScreen
          currentUserId={currentUserId}
          selectedThreadId={selectedThreadId}
          readAtByThread={readAtByThread}
          onSelectThread={setSelectedThreadId}
          onThreadRead={markThreadLocallyRead}
          onOpenAuth={() => openAuth('signin')}
          onOpenListing={setSelectedListing}
          onBrowseHomes={() => {
            setResultsOpen(false);
            setTab('discover');
          }}
          onToast={show}
        />
      );
    }

    if (tab === 'sell') {
      return (
        <SellScreen
          currentUserId={currentUserId}
          currentProfile={currentProfile}
          editingListing={editingListing}
          onNeedAuth={() => openAuth('signin')}
          onCancelEdit={() => setEditingListing(null)}
          onToast={show}
          onCreated={async () => {
            await refreshListings();
            show('Listing published', 'success');
            setTab('account');
          }}
          onSaved={async () => {
            await refreshListings();
            setEditingListing(null);
            show('Listing updated', 'success');
            setTab('account');
          }}
        />
      );
    }

    return (
        <AccountScreen
          currentProfile={currentProfile}
          currentUserId={currentUserId}
          currentUserEmail={currentUserEmail}
        myListings={myListings}
        savedCount={savedIds.length}
        unreadMessages={unreadMessages}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        onOpenListing={setSelectedListing}
        onDeleteListing={requestDeleteListing}
        onStartEdit={(listing) => {
          setEditingListing(listing);
          setTab('sell');
        }}
        onOpenAuth={() => openAuth('signin')}
        onProfileSaved={async () => {
          await refreshProfile(currentUserId);
          show('Profile saved', 'success');
        }}
        onOpenAdmin={() => setAdminOpen(true)}
        onNavigate={(nextTab) => {
          setAdminOpen(false);
          setEditingListing(null);
          setResultsOpen(false);
          setTab(nextTab);
        }}
        onUpdateListingStatus={handleUpdateListingStatus}
        onSignOut={async () => {
          await signOut();
          setCurrentUserId(null);
          setCurrentUserEmail('');
          setCurrentProfile(null);
          setSavedIds([]);
          setMyListingRows([]);
          setAdminOpen(false);
          setReadAtByThread({});
          setUnreadMessages(0);
          show('Signed out', 'info');
        }}
      />
    );
  };

  return (
    <Shell themeMode={themeMode}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center text-sm text-stone-400">Loading marketplace...</div>
      ) : (
        <>
          {content()}
          {!selectedListing && !adminOpen ? <TabBar tab={tab} onChange={(nextTab) => { setAdminOpen(false); setTab(nextTab); if (nextTab !== 'sell') setEditingListing(null); if (nextTab !== 'discover') setResultsOpen(false); }} unreadSaved={savedIds.length} unreadMessages={unreadMessages} /> : null}
        </>
      )}

      {filtersOpen ? (
        <FiltersPanel
          filters={filters}
          setFilters={setFilters}
          onClose={() => setFiltersOpen(false)}
          totalResults={listings.filter((listing) => matchesFilters(listing, query, filters)).length}
        />
      ) : null}

      {authOpen ? (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthOpen(false)}
          onToast={show}
          onSuccess={(value) => {
            if (value === 'signin' || value === 'signup') {
              setAuthMode(value);
              return;
            }
            setAuthOpen(false);
            show(authMode === 'signin' ? 'Signed in' : 'Account created', 'success');
          }}
        />
      ) : null}

      {pendingDeleteListing ? (
        <div className="fixed inset-0 z-40 flex items-end bg-stone-950/70 px-4 pb-4 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-stone-950 p-4">
            <h2 className="text-lg font-semibold">Delete this listing?</h2>
            <p className="mt-2 text-sm text-stone-400">
              {listingTitle(pendingDeleteListing)} will be removed from the marketplace. This cannot be undone.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPendingDeleteListing(null)} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-stone-200">
                Cancel
              </button>
              <button type="button" onClick={handleDeleteListing} className="rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2">
          <button
            type="button"
            onClick={clear}
            className={`w-full rounded-2xl border px-4 py-3 text-left text-sm shadow-xl ${toast.type === 'error' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : toast.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-stone-900/95 text-stone-100'}`}
          >
            {toast.message}
          </button>
        </div>
      ) : null}
    </Shell>
  );
}
