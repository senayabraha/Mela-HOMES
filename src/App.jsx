import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bath,
  BedDouble,
  Building2,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Heart,
  Home,
  LogOut,
  Map,
  MapPin,
  MessageCircle,
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
} from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  deleteListing,
  ensureCurrentProfile,
  getCurrentUser,
  getCurrentProfile,
  loadThreadMessages,
  loadThreadReadMap,
  loadThreads,
  loadUnreadMessageCount,
  loadListings,
  loadMyListings,
  loadSavedIds,
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
} from './lib/storage';
import {
  ACCOUNT_ROLES,
  CONDITIONS,
  COUNTRIES,
  COUNTRIES_DATA,
  COUNTRY_LIST,
  CURRENCIES,
  CURRENCY_BY_COUNTRY,
  FEATURES,
  FILTER_SECTIONS,
  FURNISHED_OPTIONS,
  INITIAL_FILTERS,
  LISTING_STATUS_OPTIONS,
  PRICE_MAX_BOUND,
  PRICE_MIN_BOUND,
  SIZE_MAX_BOUND,
  SIZE_MIN_BOUND,
} from './houseData';
import { AdminScreen } from './lib/AdminScreen';
import { SellScreen } from './lib/SellScreen';
import { areasOf, citiesOf, countActiveFilters, formatPrice, isAdminProfile, listingLocation, listingTitle, matchesFilters, regionsOf } from './lib/houseUtils';

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

const APP_BOOT_TIMEOUT_MS = 12000;
const APP_ACCOUNT_TIMEOUT_MS = 7000;
const APP_LISTINGS_TIMEOUT_MS = 9000;
const APP_BOOT_SPLASH_MS = 1800;
const SHOP_STATE_STORAGE_KEY = 'melaHomesShopState';
const TAB_SCROLL_STORAGE_KEY = 'melaHomesTabScroll';

function withTimeout(promise, timeoutMessage, timeoutMs = APP_BOOT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function readSessionJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeSessionJson(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Session storage can be unavailable in strict privacy modes.
  }
}

function InstantButton({ children, className = '', onPress, onClick, type = 'button', disabled = false, ...props }) {
  const ignoreNextClickRef = useRef(false);
  const touchStartRef = useRef(null);
  const press = onPress || onClick;

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse') return;
    touchStartRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event) => {
    if (disabled || event.pointerType === 'mouse') return;
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (start && (Math.abs(event.clientX - start.x) > 10 || Math.abs(event.clientY - start.y) > 10)) {
      return;
    }
    ignoreNextClickRef.current = true;
    event.preventDefault();
    press?.(event);
  };

  const handleClick = (event) => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    press?.(event);
  };

  return (
    <button
      {...props}
      type={type}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        touchStartRef.current = null;
      }}
      onClick={handleClick}
      className={`touch-manipulation ${className}`}
    >
      {children}
    </button>
  );
}

function scheduleSessionJson(key, value) {
  if (typeof window === 'undefined') return;
  const save = () => writeSessionJson(key, value);
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(save, { timeout: 500 });
    return;
  }
  window.setTimeout(save, 0);
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
            <InstantButton
              key={key}
              onPress={() => onChange(key)}
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
            </InstantButton>
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
        <InstantButton onPress={onAction} className="mt-4 rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-medium text-stone-950">
          {action}
        </InstantButton>
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
  const handleShare = async () => {
    const title = listingTitle(listing);
    const location = listingLocation(listing);
    const text = `${title} - ${formatPrice(listing.price, listing.currency)}${location ? ` in ${location}` : ''}`;
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
    } catch {
      // Sharing can be canceled by the user.
    }
  };

  const handleCall = () => {
    if (!listing.sellerPhone) return;
    window.location.href = `tel:${listing.sellerPhone}`;
  };

  return (
    <div className="result-listing-card bg-[#111216]">
      <button type="button" onClick={() => onOpen(listing)} className="block w-full text-left">
        <div className="relative h-[220px] bg-neutral-800">
          {listing.photoUrl ? (
            <img src={listing.photoUrl} alt={listingTitle(listing)} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#dfe4dc,#7d846a)]">
              <Home className="h-20 w-20 text-black/20" />
            </div>
          )}
          <div className="absolute right-0 top-1/2 flex h-16 w-10 -translate-y-1/2 items-center justify-center rounded-l-full bg-black/35 text-white">
            <ChevronRight className="h-7 w-7" />
          </div>
        </div>
      </button>
      <div className="result-listing-details p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-bold tracking-wide text-stone-100">
              {listing.listingType === 'For Rent' ? `${formatPrice(listing.price, listing.currency)}+` : formatPrice(listing.price, listing.currency)}
            </div>
            <div className="mt-2 text-sm tracking-wide text-stone-200">
              {listing.location || listingLocation(listing) || 'Location not set'}
            </div>
            <div className="mt-1.5 text-sm tracking-wide text-stone-200">
              {listing.bedrooms || 0} Bd {listing.listingType === 'For Rent' ? `${formatPrice(listing.price, listing.currency)}+` : `${listing.bathrooms || 0} Ba`}
            </div>
            <div className="mt-1.5 text-sm tracking-wide text-stone-200">{listingTitle(listing)}</div>
            <div className="mt-1.5 text-sm tracking-wide text-stone-200">
              {listing.sizeSqm ? `${listing.sizeSqm} sqm` : listing.propertyType}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={handleShare} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/12 text-stone-100" aria-label="Share listing">
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
          <button type="button" onClick={handleCall} disabled={!listing.sellerPhone} className="h-11 rounded-full bg-emerald-50 text-sm font-bold text-emerald-950 disabled:opacity-50">
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
              placeholder="Search location or listing"
              className="w-full bg-transparent text-sm tracking-wide text-stone-100 outline-none placeholder:text-stone-300"
            />
          </label>
        </div>
        <div className="mt-4 px-4">
          <div className="flex items-center justify-between gap-2 pb-2">
            <button
              type="button"
              onClick={onOpenFilters}
              className="h-8 rounded-md border-2 border-emerald-500 px-4 text-xs font-bold tracking-wide text-emerald-300"
            >
              Filters{activeFilters ? ` ${activeFilters}` : ''}
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

        <div className="fixed bottom-0 left-0 right-0 mx-auto max-w-md bg-[#17181b]/95 px-4 py-3 backdrop-blur">
          <button type="button" onClick={onClose} className="h-11 w-full rounded-lg bg-emerald-700 text-sm font-bold tracking-wide text-white">
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
    ['Live', activeListings],
    ['Saved', savedCount],
    ['Unread', unreadMessages],
  ];
  const tapClass = 'select-none';

  const toggleSection = (section) => setOpenSection((current) => (current === section ? null : section));

  const SectionButton = ({ section, icon: Icon, label, detail, onClick }) => {
    const expanded = openSection === section;
    return (
      <InstantButton
        onPress={onClick || (() => toggleSection(section))}
        className={`flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left active:bg-white/10 ${tapClass}`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-950/50 text-emerald-300">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">{label}</div>
          {detail ? <div className="mt-0.5 truncate text-xs text-stone-400">{detail}</div> : null}
        </div>
        {onClick ? <ChevronRight className="h-5 w-5 text-stone-500" /> : expanded ? <ChevronUp className="h-5 w-5 text-stone-500" /> : <ChevronDown className="h-5 w-5 text-stone-500" />}
      </InstantButton>
    );
  };

  const ThemeButton = ({ value, label }) => {
    const active = themeMode === value;
    return (
      <InstantButton
        onPress={() => onThemeChange(value)}
        className={`flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold ${tapClass} ${active ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-white/10 bg-stone-950/40 text-stone-400'}`}
      >
        {label}
      </InstantButton>
    );
  };

  const appearanceControls = (
    <>
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
    </>
  );

  return (
    <div className="touch-manipulation pb-24">
      <TopBar title="Account" subtitle={currentUserId ? 'Manage your profile and listings' : 'Sign in to post and save'} />
      <div className="space-y-4 px-4 pt-4">
        {!currentUserId ? (
          <>
            <EmptyState title="Your account is not connected" text="Sign in to save homes and manage listings." action="Sign in" onAction={onOpenAuth} />
            <div className="space-y-2">{appearanceControls}</div>
          </>
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
              <InstantButton onPress={() => onNavigate('sell')} className={`rounded-2xl bg-emerald-500 px-3 py-3 text-sm font-semibold text-stone-950 ${tapClass}`}>
                Post listing
              </InstantButton>
              <InstantButton onPress={() => onNavigate('saved')} className={`rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-stone-200 ${tapClass}`}>
                Saved homes
              </InstantButton>
              <InstantButton onPress={() => onNavigate('messages')} className={`rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-stone-200 ${tapClass}`}>
                Messages
              </InstantButton>
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
                    <InstantButton onPress={saveProfile} disabled={saving} className={`rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950 ${tapClass}`}>
                      {saving ? 'Saving...' : 'Save profile'}
                    </InstantButton>
                  </div>
                </div>
              ) : null}

              {isAdminProfile(currentProfile) ? (
                <SectionButton section="admin" icon={Shield} label="Admin Dashboard" detail="Manage users, listings, and reports" onClick={onOpenAdmin} />
              ) : null}

              {appearanceControls}

              <SectionButton section="listings" icon={Store} label="My Listings" detail={`${myListings.length} total, ${activeListings} active`} />
              {openSection === 'listings' ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="space-y-3">
                {myListings.length ? (
                  myListings.map((listing) => (
                    <div key={listing.id} className="rounded-2xl bg-stone-950/40 p-3">
                      <InstantButton onPress={() => onOpenListing(listing)} className={`flex w-full items-center justify-between gap-3 text-left ${tapClass}`}>
                        <div>
                          <div className="font-medium">{listingTitle(listing)}</div>
                          <div className="mt-1 text-xs text-stone-500">{listing.city || listing.location || 'Location not set'} - {(listing.photos || []).length} photo{(listing.photos || []).length === 1 ? '' : 's'}</div>
                          <div className="mt-1 text-sm text-stone-400">{formatPrice(listing.price, listing.currency)} - {listing.listingType}</div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-stone-500" />
                      </InstantButton>
                      <div className="mt-3">
                        <div className="mb-2 flex items-center justify-between text-xs text-stone-500">
                          <span>Status</span>
                          {statusSavingId === listing.id ? <span>Saving...</span> : <span className="capitalize">{listing.status || 'active'}</span>}
                        </div>
                        <SegmentGroup value={listing.status || 'active'} options={LISTING_STATUS_OPTIONS} onChange={(status) => updateStatus(listing, status)} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <InstantButton onPress={() => onStartEdit(listing)} className={`rounded-2xl bg-white/8 px-3 py-2 text-sm ${tapClass}`}>
                          Edit
                        </InstantButton>
                        <InstantButton onPress={() => onDeleteListing(listing)} className={`rounded-2xl bg-red-500/15 px-3 py-2 text-sm text-red-200 ${tapClass}`}>
                          Delete
                        </InstantButton>
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

            <InstantButton onPress={onSignOut} className={`flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm ${tapClass}`}>
              <LogOut className="h-4 w-4" />
              Sign out
            </InstantButton>
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

  const submitAuth = async () => {
    if (loading) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      onToast('Enter your email and password', 'info');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await withTimeout(
          signInWithEmail(trimmedEmail, password),
          'Sign in is taking too long. Please check your connection and try again.',
        );
      } else {
        await withTimeout(
          signUpWithEmail(trimmedEmail, password, { name, phone }),
          'Account creation is taking too long. Please check your connection and try again.',
        );
      }
      onSuccess();
    } catch (error) {
      onToast(error.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    submitAuth();
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
          <InstantButton onPress={submitAuth} disabled={loading} className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950 disabled:opacity-60">
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </InstantButton>
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

export default function App() {
  const { toast, show, clear } = useToast();
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return window.localStorage.getItem('themeMode') || 'dark';
  });
  const [tab, setTab] = useState('discover');
  const [listings, setListings] = useState([]);
  const [myListingRows, setMyListingRows] = useState([]);
  const initialShopState = useMemo(() => readSessionJson(SHOP_STATE_STORAGE_KEY, null), []);
  const [query, setQuery] = useState(() => initialShopState?.query || '');
  const [filters, setFilters] = useState(() => ({ ...INITIAL_FILTERS, ...(initialShopState?.filters || {}) }));
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
  const [resultsOpen, setResultsOpen] = useState(() => Boolean(initialShopState?.resultsOpen));
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const tabScrollRef = useRef(readSessionJson(TAB_SCROLL_STORAGE_KEY, {}));
  const currentTabRef = useRef(tab);
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
  const [bootError, setBootError] = useState('');
  const [bootAttempt, setBootAttempt] = useState(0);

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
      setBootError('');
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
    if (profile?.disabled) {
      await signOut();
      setCurrentUserId(null);
      setCurrentUserEmail('');
      setCurrentProfile(null);
      setSavedIds([]);
      setMyListingRows([]);
      throw new Error('This account has been disabled. Contact support for help.');
    }
    const [saved, mine] = await Promise.all([
      loadSavedIds(userId),
      loadMyListings(userId),
    ]);
    setCurrentProfile(profile);
    setSavedIds(saved);
    setMyListingRows(mine);
    setBootError('');
  };

  const captureTabScroll = () => {
    if (typeof window === 'undefined') return;
    const activeTab = currentTabRef.current;
    tabScrollRef.current = {
      ...tabScrollRef.current,
      [activeTab]: window.scrollY,
    };
    scheduleSessionJson(TAB_SCROLL_STORAGE_KEY, tabScrollRef.current);
  };

  const navigateTab = (nextTab, { closeShopResults = false } = {}) => {
    if (nextTab === currentTabRef.current && !closeShopResults) return;
    captureTabScroll();
    currentTabRef.current = nextTab;
    setAdminOpen(false);
    setTab(nextTab);
    if (nextTab !== 'sell') setEditingListing(null);
    if (closeShopResults) setResultsOpen(false);
  };

  const openListing = (listing) => {
    captureTabScroll();
    setSelectedListing(listing);
  };

  const openAdmin = () => {
    captureTabScroll();
    setAdminOpen(true);
  };

  useEffect(() => {
    scheduleSessionJson(SHOP_STATE_STORAGE_KEY, {
      query,
      filters,
      resultsOpen,
    });
  }, [filters, query, resultsOpen]);

  useEffect(() => {
    currentTabRef.current = tab;
  }, [tab]);

  useEffect(() => {
    const saveCurrentScroll = () => captureTabScroll();
    window.addEventListener('pagehide', saveCurrentScroll);
    window.addEventListener('beforeunload', saveCurrentScroll);
    return () => {
      saveCurrentScroll();
      window.removeEventListener('pagehide', saveCurrentScroll);
      window.removeEventListener('beforeunload', saveCurrentScroll);
    };
  }, []);

  useEffect(() => {
    if (selectedListing || adminOpen || tab !== 'discover') return undefined;
    const savedScroll = tabScrollRef.current[tab] || 0;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedScroll, left: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [adminOpen, selectedListing, tab]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.classList.toggle('theme-dark', themeMode === 'dark');
    document.documentElement.classList.toggle('theme-light', themeMode === 'light');
    window.localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    let active = true;
    const splashTimer = window.setTimeout(() => {
      if (active) setLoading(false);
    }, APP_BOOT_SPLASH_MS);

    const hydrateAccount = async () => {
      const accountRequest = getCurrentUser().then(async (user) => {
        if (!active) return user;
        const userId = user?.id || null;
        setCurrentUserId(userId);
        setCurrentUserEmail(user?.email || '');
        await refreshProfile(userId);
        if (active) setBootError('');
        return user;
      });

      try {
        await withTimeout(
          accountRequest,
          'Your account is taking too long to load. You can keep browsing while it syncs.',
          APP_ACCOUNT_TIMEOUT_MS,
        );
      } catch (error) {
        if (!active) return;
        console.info('hydrateAccount:', error.message || error);
      }
    };

    const refreshPublicListings = async () => {
      const listingsRequest = loadListings().then((data) => {
        if (active) {
          setListings(data);
          setBootError('');
        }
        return data;
      });

      try {
        await withTimeout(
          listingsRequest,
          'Listings are taking too long to load. Please check your connection and try again.',
          APP_LISTINGS_TIMEOUT_MS,
        );
      } catch (error) {
        if (!active) return;
        const message = error.message || 'Could not refresh listings';
        setBootError(message);
        show(message, 'error');
      } finally {
        if (active) setLoading(false);
      }
    };

    const boot = async () => {
      setLoading(true);
      setBootError('');
      try {
        window.sessionStorage.removeItem('melaHomesListingsCache');
      } catch {
        // Older versions used a listings cache; live data is safer.
      }
      refreshPublicListings();
      hydrateAccount();
    };
    boot();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setCachedUser(user);
      const userId = user?.id || null;
      setCurrentUserId(userId);
      setCurrentUserEmail(user?.email || '');
      window.setTimeout(() => {
        if (!active) return;
        withTimeout(
          refreshProfile(userId),
          'Your account is taking too long to refresh. You can keep browsing while it syncs.',
          APP_ACCOUNT_TIMEOUT_MS,
        )
          .then(() => {
            if (active) setBootError('');
          })
          .catch((error) => {
            console.info('refreshProfile:', error.message || error);
          });
      }, 0);
    });

    return () => {
      active = false;
      window.clearTimeout(splashTimer);
      listener.subscription.unsubscribe();
    };
  }, [bootAttempt]);

  useEffect(() => {
    const handleNavigate = (event) => {
      if (typeof event.detail !== 'string') return;
      setSelectedListing(null);
      navigateTab(event.detail);
    };
    window.addEventListener('mela:navigate', handleNavigate);
    return () => window.removeEventListener('mela:navigate', handleNavigate);
  }, [tab]);

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
  const isAdmin = isAdminProfile(currentProfile);

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
      navigateTab('messages');
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
            navigateTab('sell');
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
          onOpenListing={openListing}
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
          onOpenListing={openListing}
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
          onOpenListing={openListing}
          onBrowseHomes={() => {
            navigateTab('discover', { closeShopResults: true });
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
            navigateTab('account');
          }}
          onSaved={async () => {
            await refreshListings();
            setEditingListing(null);
            show('Listing updated', 'success');
            navigateTab('account');
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
        onOpenListing={openListing}
        onDeleteListing={requestDeleteListing}
        onStartEdit={(listing) => {
          setEditingListing(listing);
          navigateTab('sell');
        }}
        onOpenAuth={() => openAuth('signin')}
        onProfileSaved={async () => {
          await refreshProfile(currentUserId);
          show('Profile saved', 'success');
        }}
        onOpenAdmin={openAdmin}
        onNavigate={(nextTab) => {
          navigateTab(nextTab);
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
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-emerald-500/20" />
            <h2 className="mt-4 text-lg font-semibold text-stone-100">Loading marketplace</h2>
            <p className="mt-2 text-sm text-stone-400">Fetching listings and your account data.</p>
          </div>
        </div>
      ) : (
        <>
          {bootError ? (
            <div className="px-4 pt-6">
              <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-center">
                <h2 className="text-lg font-semibold text-amber-100">Could not finish loading</h2>
                <p className="mt-2 text-sm text-amber-50/80">{bootError}</p>
                <button
                  type="button"
                  onClick={() => setBootAttempt((value) => value + 1)}
                  className="mt-4 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-stone-950"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}
          {content()}
          {!selectedListing && !adminOpen ? <TabBar tab={tab} onChange={(nextTab) => navigateTab(nextTab)} unreadSaved={savedIds.length} unreadMessages={unreadMessages} /> : null}
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
