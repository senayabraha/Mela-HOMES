import { AREAS_BY_COUNTRY_CITY, CITIES_BY_COUNTRY_REGION, COUNTRIES_DATA, FEATURES, INITIAL_FORM } from '../houseData';

export function formatPrice(value, currency = 'ETB') {
  const amount = Number(value || 0);
  if (!amount) return `0 ${currency}`;
  return `${new Intl.NumberFormat().format(amount)} ${currency}`;
}

export function listingTitle(listing) {
  if (listing.title?.trim()) return listing.title.trim();
  const beds = listing.bedrooms ? `${listing.bedrooms} Bed` : '';
  return [beds, listing.propertyType].filter(Boolean).join(' ') || 'Property Listing';
}

export function listingLocation(listing) {
  return [listing.area, listing.city, listing.country].filter(Boolean).join(', ');
}

export function generatedListingTitle(form) {
  const beds = form.bedrooms ? `${form.bedrooms} Bed` : '';
  const type = form.propertyType || 'Property';
  const listingType = form.listingType ? form.listingType.toLowerCase() : 'listing';
  const place = form.area || form.city;
  return `${[beds, type].filter(Boolean).join(' ')} ${listingType}${place ? ` in ${place}` : ''}`;
}

export function regionsOf(country) {
  return (COUNTRIES_DATA[country] || {}).regions || [];
}

export function citiesOf(country, region) {
  return CITIES_BY_COUNTRY_REGION[`${country}|${region}`] || [];
}

export function areasOf(country, city) {
  return AREAS_BY_COUNTRY_CITY[`${country}|${city}`] || [];
}

export function isAdminProfile(profile) {
  return profile?.is_admin === true;
}

export function matchesFilters(listing, query, filters) {
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

export function countActiveFilters(filters) {
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

export function toForm(listing) {
  return {
    ...INITIAL_FORM,
    ...listing,
    photos: listing.photos || [],
    features: listing.features || [],
  };
}
