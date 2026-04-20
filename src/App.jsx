import React, { useEffect, useMemo, useState } from 'react';
import {
  Bath,
  BedDouble,
  Building2,
  Camera,
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
  Pencil,
  PlusSquare,
  Ruler,
  Search,
  Share2,
  Store,
  Trash2,
  UserRound,
  X,
  CalendarDays,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  createListing,
  deleteListing,
  ensureCurrentProfile,
  getCurrentProfile,
  getCurrentUserId,
  loadUnreadMessageCount,
  loadThreadMessages,
  loadListings,
  loadSavedIds,
  loadThreads,
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

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-50">
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
  const filtered = useMemo(() => listings.filter((listing) => matchesFilters(listing, query, filters)), [filters, listings, query]);
  const activeFilters = countActiveFilters(filters);
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
      <div className="px-4">
        <div className="mb-4 mt-6 flex gap-2 overflow-x-auto pb-1">
          {LISTING_TYPES.map((item) => (
            <Chip key={item} active={filters.listingType === item} onClick={() => setFilters((prev) => ({ ...prev, listingType: prev.listingType === item ? '' : item }))}>
              {item}
            </Chip>
          ))}
          {PROPERTY_TYPES.slice(0, 4).map((item) => (
            <Chip key={item} active={filters.propertyType === item} onClick={() => setFilters((prev) => ({ ...prev, propertyType: prev.propertyType === item ? '' : item }))}>
              {item}
            </Chip>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <SectionTitle title={`${filtered.length} listings`} />
          <button type="button" onClick={onOpenFilters} className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 text-white">
            <Filter className="h-4 w-4" />
            {activeFilters ? <span className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">{activeFilters}</span> : null}
          </button>
        </div>
        <div className="space-y-4">
          {filtered.length ? (
            filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} saved={savedIds.includes(listing.id)} onOpen={onOpenListing} onToggleSave={onToggleSave} />
            ))
          ) : (
            <EmptyState title="No properties yet" text="Try a broader search or clear some filters to see more listings." />
          )}
        </div>
      </div>
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
      <div className="mx-auto flex min-h-screen max-w-md flex-col overflow-hidden rounded-t-[1.25rem] bg-[#17181b] text-stone-100">
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

        <div className="flex-1 overflow-y-auto pb-20">
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
  const [form, setForm] = useState(editingListing ? toForm(editingListing) : INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm(editingListing ? toForm(editingListing) : INITIAL_FORM);
  }, [editingListing]);

  const canSubmit = currentUserId && form.propertyType && form.listingType && form.price && form.city;
  const publishHint = !currentUserId
    ? 'Sign in before publishing a listing.'
    : !canSubmit
      ? 'Add property type, listing type, price, and city to publish.'
      : '';
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
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
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded] }));
    } catch (error) {
      onToast(error.message || 'Could not upload photos', 'error');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!currentUserId) {
      onNeedAuth();
      return;
    }
    setSubmitting(true);
    try {
      await ensureCurrentProfile(currentProfile || {});
      if (editingListing) {
        await updateListing(editingListing.id, { ...form });
        await onSaved();
      } else {
        await createListing({ ...form });
        setForm(INITIAL_FORM);
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
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <SectionTitle title="Basic info" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="Custom title" value={form.title} onChange={(value) => update('title', value)} className="col-span-2" />
            <SelectField label="Property type" value={form.propertyType} onChange={(value) => update('propertyType', value)} options={PROPERTY_TYPES} />
            <SelectField label="Listing type" value={form.listingType} onChange={(value) => update('listingType', value)} options={LISTING_TYPES} />
            <InputField label="Bedrooms" value={form.bedrooms} onChange={(value) => update('bedrooms', value)} type="number" />
            <InputField label="Bathrooms" value={form.bathrooms} onChange={(value) => update('bathrooms', value)} type="number" />
            <InputField label="Size (sqm)" value={form.sizeSqm} onChange={(value) => update('sizeSqm', value)} type="number" />
            <InputField label="Price" value={form.price} onChange={(value) => update('price', value)} type="number" />
            <SelectField label="Currency" value={form.currency} onChange={(value) => update('currency', value)} options={CURRENCIES} />
            <SelectField label="Condition" value={form.condition} onChange={(value) => update('condition', value)} options={CONDITIONS} />
            <SelectField label="Furnishing" value={form.furnished} onChange={(value) => update('furnished', value)} options={['', ...FURNISHED_OPTIONS]} />
            {form.listingType === 'For Rent' ? <SelectField label="Rent period" value={form.rentPeriod} onChange={(value) => update('rentPeriod', value)} options={['Monthly', 'Quarterly', 'Yearly']} /> : null}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <SectionTitle title="Location" />
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Country" value={form.country} onChange={(value) => update('country', value)} options={COUNTRIES} />
            <InputField label="Region" value={form.region} onChange={(value) => update('region', value)} />
            <InputField label="City" value={form.city} onChange={(value) => update('city', value)} />
            <InputField label="Area" value={form.area} onChange={(value) => update('area', value)} />
            <InputField label="Landmark" value={form.landmark} onChange={(value) => update('landmark', value)} className="col-span-2" />
            <InputField label="Address / location" value={form.location} onChange={(value) => update('location', value)} className="col-span-2" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <SectionTitle title="Photos and features" />
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-stone-950/40 px-4 py-4 text-sm text-stone-300">
            <Camera className="h-4 w-4" />
            {uploading ? 'Uploading photos...' : 'Upload property photos'}
            <input type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          </label>
          {form.photos.length ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {form.photos.map((url) => (
                <div key={url} className="relative overflow-hidden rounded-2xl">
                  <img src={url} alt="Listing" className="h-24 w-full object-cover" />
                  <button type="button" onClick={() => update('photos', form.photos.filter((item) => item !== url))} className="absolute right-2 top-2 rounded-full bg-stone-950/75 p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {FEATURES.map((feature) => {
              const active = form.features.includes(feature);
              return (
                <Chip
                  key={feature}
                  active={active}
                  onClick={() => update('features', active ? form.features.filter((item) => item !== feature) : [...form.features, feature])}
                >
                  {feature}
                </Chip>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ToggleField label="Parking" checked={form.parking} onChange={(value) => update('parking', value)} />
            <ToggleField label="Garden" checked={form.garden} onChange={(value) => update('garden', value)} />
            <ToggleField label="Negotiable" checked={form.negotiable} onChange={(value) => update('negotiable', value)} />
            <ToggleField label="Financing available" checked={form.financingAvailable} onChange={(value) => update('financingAvailable', value)} />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <SectionTitle title="Description" />
          <textarea
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            rows={5}
            placeholder="Tell buyers or renters what makes this property special."
            className="w-full rounded-2xl border border-white/10 bg-stone-950/40 px-4 py-3 text-sm outline-none placeholder:text-stone-500"
          />
        </div>

        <button type="submit" disabled={!canSubmit || submitting} className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950 disabled:opacity-50">
          {submitting ? 'Saving...' : editingListing ? 'Update listing' : 'Publish listing'}
        </button>
        {publishHint ? <p className="text-center text-xs text-stone-400">{publishHint}</p> : null}
        {editingListing ? <button type="button" onClick={onCancelEdit} className="w-full text-sm text-stone-400">Cancel editing</button> : null}
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

function MessagesScreen({ currentUserId, selectedThreadId, onSelectThread, onOpenAuth, onOpenListing, onToast }) {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const activeThread = threads.find((thread) => thread.id === selectedThreadId) || threads[0] || null;

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
        const data = await loadThreads();
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
  }, [currentUserId, selectedThreadId]);

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

  const send = async (event) => {
    event.preventDefault();
    if (!activeThread) return;
    setSending(true);
    try {
      const message = await sendThreadMessage(activeThread.id, draft);
      setMessages((prev) => [...prev, message]);
      setDraft('');
    } catch (error) {
      onToast(error.message || 'Could not send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const threadLabel = (thread) => {
    const other = thread.buyer_id === currentUserId ? thread.seller : thread.buyer;
    return other?.business_name || other?.name || other?.email || 'Conversation';
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
            <div className="flex gap-2 overflow-x-auto pb-1">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onSelectThread(thread.id)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-sm ${activeThread?.id === thread.id ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-white/5 text-stone-300'}`}
                >
                  {threadLabel(thread)}
                </button>
              ))}
            </div>

            {activeThread ? (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <button type="button" onClick={() => activeThread.listing ? onOpenListing(rowToThreadListing(activeThread.listing)) : null} className="flex w-full items-center gap-3 border-b border-white/10 p-4 text-left">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-stone-900">
                    {activeThread.listing?.photos?.[0] ? <img src={activeThread.listing.photos[0]} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{activeThread.listing?.title || activeThread.listing?.property_type || 'Property listing'}</div>
                    <div className="mt-1 truncate text-xs text-stone-400">{threadLabel(activeThread)}</div>
                  </div>
                </button>

                <div className="max-h-[48vh] space-y-3 overflow-y-auto p-4">
                  {messages.length ? (
                    messages.map((message) => {
                      const mine = message.sender_id === currentUserId;
                      return (
                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm ${mine ? 'bg-emerald-500 text-stone-950' : 'bg-stone-950/70 text-stone-100'}`}>
                            {message.body}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-sm text-stone-400">Write the first message.</div>
                  )}
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
          <EmptyState title="No messages yet" text="Open a listing and tap Send Message to start a conversation." />
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
  };
}

function AccountScreen({ currentProfile, currentUserId, myListings, onOpenListing, onDeleteListing, onStartEdit, onOpenAuth, onSignOut, onProfileSaved }) {
  const [name, setName] = useState(currentProfile?.name || '');
  const [phone, setPhone] = useState(currentProfile?.phone || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(currentProfile?.name || '');
    setPhone(currentProfile?.phone || '');
  }, [currentProfile]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, phone });
      await onProfileSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24">
      <TopBar title="Account" subtitle={currentUserId ? 'Manage your profile and listings' : 'Sign in to post and save'} />
      <div className="space-y-4 px-4 pt-4">
        {!currentUserId ? (
          <EmptyState title="Your account is not connected" text="Sign in to save homes and manage listings." action="Sign in" onAction={onOpenAuth} />
        ) : (
          <>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <SectionTitle title="Profile" />
              <div className="grid grid-cols-1 gap-3">
                <InputField label="Name" value={name} onChange={setName} />
                <InputField label="Phone" value={phone} onChange={setPhone} />
                <div className="rounded-2xl bg-stone-950/40 px-4 py-3 text-sm text-stone-400">{currentProfile?.email || 'Signed in'}</div>
                <button type="button" onClick={saveProfile} disabled={saving} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950">
                  {saving ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <SectionTitle title="My Listings" />
              <div className="space-y-3">
                {myListings.length ? (
                  myListings.map((listing) => (
                    <div key={listing.id} className="rounded-2xl bg-stone-950/40 p-3">
                      <button type="button" onClick={() => onOpenListing(listing)} className="flex w-full items-center justify-between gap-3 text-left">
                        <div>
                          <div className="font-medium">{listingTitle(listing)}</div>
                          <div className="mt-1 text-sm text-stone-400">{formatPrice(listing.price, listing.currency)} · {listing.listingType}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-stone-500" />
                      </button>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => onStartEdit(listing)} className="rounded-2xl bg-white/8 px-3 py-2 text-sm">
                          Edit
                        </button>
                        <button type="button" onClick={() => onDeleteListing(listing.id)} className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-sm text-emerald-200">
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

function InputField({ label, value, onChange, type = 'text', className = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} className="w-full rounded-2xl border border-white/10 bg-stone-950/40 px-4 py-3 text-sm outline-none" />
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
  const [tab, setTab] = useState('discover');
  const [listings, setListings] = useState([]);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [savedIds, setSavedIds] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [authMode, setAuthMode] = useState('signin');
  const [authOpen, setAuthOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [readAtByThread, setReadAtByThread] = useState({});
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loading, setLoading] = useState(true);

  const refreshListings = async () => {
    const data = await loadListings();
    setListings(data);
    if (selectedListing) {
      const fresh = data.find((item) => item.id === selectedListing.id);
      setSelectedListing(fresh || null);
    }
  };

  const refreshProfile = async (userId) => {
    if (!userId) {
      setCurrentProfile(null);
      setSavedIds([]);
      return;
    }
    const [profile, saved] = await Promise.all([getCurrentProfile(userId), loadSavedIds(userId)]);
    setCurrentProfile(profile);
    setSavedIds(saved);
  };

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        const userId = await getCurrentUserId();
        const data = await loadListings();
        if (!active) return;
        setListings(data);
        setCurrentUserId(userId);
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
    if (tab !== 'messages' || !selectedThreadId) return;
    setReadAtByThread((prev) => ({ ...prev, [selectedThreadId]: Date.now() }));
  }, [tab, selectedThreadId]);

  const myListings = useMemo(() => listings.filter((listing) => currentUserId && listing.sellerId === currentUserId), [currentUserId, listings]);

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

  const handleDeleteListing = async (listingId) => {
    const confirmed = window.confirm('Delete this listing?');
    if (!confirmed) return;
    try {
      await deleteListing(listingId);
      await refreshListings();
      setSelectedListing(null);
      show('Listing deleted', 'success');
    } catch (error) {
      show(error.message || 'Could not delete listing', 'error');
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
          onDelete={() => handleDeleteListing(selectedListing.id)}
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
          onSelectThread={setSelectedThreadId}
          onOpenAuth={() => openAuth('signin')}
          onOpenListing={setSelectedListing}
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
        myListings={myListings}
        onOpenListing={setSelectedListing}
        onDeleteListing={handleDeleteListing}
        onStartEdit={(listing) => {
          setEditingListing(listing);
          setTab('sell');
        }}
        onOpenAuth={() => openAuth('signin')}
        onProfileSaved={async () => {
          await refreshProfile(currentUserId);
          show('Profile saved', 'success');
        }}
        onSignOut={async () => {
          await signOut();
          setCurrentUserId(null);
          setCurrentProfile(null);
          setSavedIds([]);
          setReadAtByThread({});
          setUnreadMessages(0);
          show('Signed out', 'info');
        }}
      />
    );
  };

  return (
    <Shell>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center text-sm text-stone-400">Loading marketplace...</div>
      ) : (
        <>
          {content()}
          {!selectedListing ? <TabBar tab={tab} onChange={(nextTab) => { setTab(nextTab); if (nextTab !== 'sell') setEditingListing(null); if (nextTab !== 'discover') setResultsOpen(false); }} unreadSaved={savedIds.length} unreadMessages={unreadMessages} /> : null}
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
