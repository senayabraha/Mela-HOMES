import { Bath, BedDouble, Building2, Heart, Home, MapPin, Ruler } from 'lucide-react';
import { formatPrice, listingLocation, listingTitle } from './houseUtils';

export function TopBar({ title, right, subtitle }) {
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

export function SectionTitle({ title, action, onAction }) {
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

export function Chip({ active, children, onClick }) {
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

export function EmptyState({ title, text, action, onAction }) {
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

function Stat({ icon: Icon, label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

export function ListingCard({ listing, saved, onOpen, onToggleSave, ownListing }) {
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

export function InputField({ label, value, onChange, type = 'text', className = '', placeholder = '', min }) {
  return (
    <label className={`block ${className}`}>
      <div className="mb-1 text-xs uppercase tracking-wide text-stone-500">{label}</div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        min={min}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-stone-950/40 px-4 py-3 text-sm outline-none placeholder:text-stone-600"
      />
    </label>
  );
}

export function SelectField({ label, value, onChange, options }) {
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

export function ToggleField({ label, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`rounded-2xl border px-4 py-3 text-sm ${checked ? 'border-emerald-400 bg-emerald-400/15 text-emerald-200' : 'border-white/10 bg-stone-950/40'}`}>
      {label}
    </button>
  );
}
