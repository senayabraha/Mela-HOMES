import { supabase } from './supabase';

/*
  Supabase listings table columns needed:
  id, seller_id, property_type, listing_type, title,
  bedrooms, bathrooms, size_sqm, floor, total_floors, furnished, parking, garden, rent_period,
  price, currency, condition,
  country, region, city, area, location, landmark, gps_lat, gps_lng,
  description, features (jsonb), photos (jsonb),
  financing_available, negotiable, exchange_accepted,
  status, featured, created_at, updated_at
*/

let _cachedUser = null;

export async function getCurrentUser() {
  if (_cachedUser) return _cachedUser;
  const { data, error } = await supabase.auth.getUser();
  if (error) { console.error('getUser:', error); return null; }
  _cachedUser = data.user ?? null;
  return _cachedUser;
}

export function setCachedUser(user) {
  _cachedUser = user ?? null;
}

const uid = async () => (await getCurrentUser())?.id || null;

/* ---------- LISTINGS ---------- */

export async function loadListings() {
  const { data, error } = await supabase
    .from('listings')
    .select('*, seller:profiles!seller_id(id, name, phone, email, business_name, role)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) { console.error('loadListings:', error); return []; }
  return data.map(rowToListing);
}

export async function createListing(listing) {
  const sellerId = await uid();
  if (!sellerId) throw new Error('You must be signed in to post a listing.');
  const { data, error } = await supabase
    .from('listings')
    .insert(listingToRow(listing, sellerId))
    .select('*, seller:profiles!seller_id(id, name, phone, email, business_name, role)')
    .single();
  if (error) throw error;
  return rowToListing(data);
}

export async function deleteListing(id) {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw error;
}

/* ---------- SAVED LISTINGS ---------- */

export async function loadSavedIds(userId) {
  const id = userId || await uid();
  if (!id) return [];
  const { data, error } = await supabase
    .from('saved_listings')
    .select('listing_id')
    .eq('user_id', id);
  if (error) { console.error('loadSavedIds:', error); return []; }
  return (data || []).map(r => r.listing_id);
}

export async function toggleSaved(listingId, currentlySaved) {
  const userId = await uid();
  if (!userId) throw new Error('You must be signed in to save listings.');
  if (currentlySaved) {
    const { error } = await supabase
      .from('saved_listings')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('saved_listings')
      .insert({ user_id: userId, listing_id: listingId });
    if (error) throw error;
  }
}

/* ---------- PHOTO UPLOAD ---------- */

export async function uploadPhoto(file) {
  const userId = await uid();
  if (!userId) throw new Error('You must be signed in to upload photos.');
  const ext = file.name.split('.').pop();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('listing-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('listing-photos').getPublicUrl(path);
  return data.publicUrl;
}

/* ---------- AUTH ---------- */

export async function getCurrentUserId() {
  return (await getCurrentUser())?.id || null;
}

export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signUpWithEmail(email, password, profileData = {}) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (data.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email,
      name: profileData.name?.trim() || email.split('@')[0],
      phone: profileData.phone || null,
      role: 'buyer',
      account_type: profileData.accountType || 'standard',
    });
    if (profileError) console.error('Profile creation failed:', profileError);
  }
  return data.user;
}

export async function signOut() {
  _cachedUser = null;
  await supabase.auth.signOut();
}

export async function getCurrentProfile(userId) {
  const id = userId || await uid();
  if (!id) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) { console.error('getCurrentProfile:', error); return null; }
  return data;
}

export async function ensureCurrentProfile(profileData = {}) {
  const user = await getCurrentUser();
  if (!user) throw new Error('You must be signed in to continue.');

  const existing = await getCurrentProfile(user.id);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      email: user.email,
      name: profileData.name?.trim() || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      phone: profileData.phone || null,
      role: 'buyer',
      account_type: profileData.accountType || 'standard',
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/* ---------- MAPPERS ---------- */

function rowToListing(r) {
  const seller = r.seller || {};
  const photos = Array.isArray(r.photos) ? r.photos : [];
  return {
    id: r.id,
    propertyType: r.property_type,
    listingType: r.listing_type,
    title: r.title,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    sizeSqm: r.size_sqm,
    floor: r.floor,
    totalFloors: r.total_floors,
    furnished: r.furnished,
    parking: r.parking || false,
    garden: r.garden || false,
    rentPeriod: r.rent_period,
    price: r.price,
    currency: r.currency,
    condition: r.condition,
    country: r.country,
    region: r.region,
    city: r.city,
    area: r.area,
    location: r.location,
    landmark: r.landmark,
    gpsLat: r.gps_lat,
    gpsLng: r.gps_lng,
    description: r.description,
    features: r.features || [],
    photos,
    photoUrl: photos[0] || null,
    financingAvailable: r.financing_available,
    negotiable: r.negotiable || false,
    exchangeAccepted: r.exchange_accepted || false,
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
    sellerId: r.seller_id,
    userId: r.seller_id,
    sellerName: seller.business_name || seller.name || 'Seller',
    sellerPhone: seller.phone || '',
    sellerEmail: seller.email || '',
    dealer: seller.role === 'dealer',
    featured: r.featured || false,
  };
}

function listingToRow(l, sellerId) {
  const photos = l.photos ?? (l.photoUrl ? [l.photoUrl] : []);
  return {
    seller_id: sellerId,
    property_type: l.propertyType ?? null,
    listing_type: l.listingType ?? 'For Sale',
    title: l.title ?? null,
    bedrooms: l.bedrooms ?? null,
    bathrooms: l.bathrooms ?? null,
    size_sqm: l.sizeSqm ? Number(l.sizeSqm) : null,
    floor: l.floor ? Number(l.floor) : null,
    total_floors: l.totalFloors ? Number(l.totalFloors) : null,
    furnished: l.furnished ?? null,
    parking: l.parking ?? false,
    garden: l.garden ?? false,
    rent_period: l.rentPeriod ?? null,
    price: l.price,
    currency: l.currency ?? 'ETB',
    condition: l.condition ?? 'used',
    country: l.country ?? null,
    region: l.region ?? null,
    city: l.city ?? null,
    area: l.area ?? null,
    location: l.location ?? null,
    landmark: l.landmark ?? null,
    gps_lat: l.gpsLat ?? null,
    gps_lng: l.gpsLng ?? null,
    description: l.description ?? '',
    features: l.features ?? [],
    photos,
    financing_available: l.financingAvailable ?? false,
    negotiable: l.negotiable || false,
    exchange_accepted: l.exchangeAccepted || false,
    status: l.status ?? 'active',
  };
}

export async function updateProfile(updates) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Not signed in");
  const snakeUpdates = {};
  if (updates.name !== undefined) snakeUpdates.name = updates.name;
  if (updates.phone !== undefined) snakeUpdates.phone = updates.phone;
  if (updates.businessName !== undefined) snakeUpdates.business_name = updates.businessName;
  if (updates.role !== undefined) snakeUpdates.role = updates.role;
  if (updates.telegram !== undefined) snakeUpdates.telegram = updates.telegram;
  if (updates.accountType !== undefined) snakeUpdates.account_type = updates.accountType;
  if (updates.dealerActive !== undefined) snakeUpdates.dealer_active = updates.dealerActive;
  if (updates.dealerActivatedAt !== undefined) snakeUpdates.dealer_activated_at = updates.dealerActivatedAt;
  snakeUpdates.updated_at = new Date().toISOString();
  const { error } = await supabase.from("profiles").update(snakeUpdates).eq("id", userId);
  if (error) throw error;
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

/* ---------- ADMIN ---------- */

export async function getAdminStats() {
  const [users, listings, reports, threads, messages] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }),
    supabase.from("threads").select("id", { count: "exact", head: true }),
    supabase.from("messages").select("id", { count: "exact", head: true }),
  ]);
  return {
    users: users.count || 0,
    listings: listings.count || 0,
    reports: reports.count || 0,
    threads: threads.count || 0,
    messages: messages.count || 0,
  };
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAllListings() {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(r => ({
    id: r.id,
    sellerId: r.seller_id,
    propertyType: r.property_type,
    listingType: r.listing_type,
    title: r.title,
    bedrooms: r.bedrooms,
    price: r.price,
    currency: r.currency || "ETB",
    status: r.status,
    country: r.country,
    region: r.region,
    city: r.city,
    location: r.location,
    photos: r.photos || [],
    featured: r.featured || false,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export async function getAllReports() {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function adminDeleteListing(id) {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw error;
}

export async function adminUpdateProfile(userId, updates) {
  const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
  if (error) throw error;
}

export async function adminUpdateReport(reportId, updates) {
  const { error } = await supabase.from("reports").update(updates).eq("id", reportId);
  if (error) throw error;
}

export async function updateListing(id, updates) {
  const snakeUpdates = {};
  if (updates.propertyType !== undefined) snakeUpdates.property_type = updates.propertyType;
  if (updates.listingType !== undefined) snakeUpdates.listing_type = updates.listingType;
  if (updates.title !== undefined) snakeUpdates.title = updates.title;
  if (updates.bedrooms !== undefined) snakeUpdates.bedrooms = updates.bedrooms;
  if (updates.bathrooms !== undefined) snakeUpdates.bathrooms = updates.bathrooms;
  if (updates.sizeSqm !== undefined) snakeUpdates.size_sqm = updates.sizeSqm ? Number(updates.sizeSqm) : null;
  if (updates.floor !== undefined) snakeUpdates.floor = updates.floor ? Number(updates.floor) : null;
  if (updates.totalFloors !== undefined) snakeUpdates.total_floors = updates.totalFloors ? Number(updates.totalFloors) : null;
  if (updates.furnished !== undefined) snakeUpdates.furnished = updates.furnished;
  if (updates.parking !== undefined) snakeUpdates.parking = updates.parking;
  if (updates.garden !== undefined) snakeUpdates.garden = updates.garden;
  if (updates.rentPeriod !== undefined) snakeUpdates.rent_period = updates.rentPeriod;
  if (updates.price !== undefined) snakeUpdates.price = updates.price;
  if (updates.currency !== undefined) snakeUpdates.currency = updates.currency;
  if (updates.condition !== undefined) snakeUpdates.condition = updates.condition;
  if (updates.country !== undefined) snakeUpdates.country = updates.country;
  if (updates.region !== undefined) snakeUpdates.region = updates.region;
  if (updates.city !== undefined) snakeUpdates.city = updates.city;
  if (updates.area !== undefined) snakeUpdates.area = updates.area;
  if (updates.location !== undefined) snakeUpdates.location = updates.location;
  if (updates.landmark !== undefined) snakeUpdates.landmark = updates.landmark;
  if (updates.gpsLat !== undefined) snakeUpdates.gps_lat = updates.gpsLat;
  if (updates.gpsLng !== undefined) snakeUpdates.gps_lng = updates.gpsLng;
  if (updates.description !== undefined) snakeUpdates.description = updates.description;
  if (updates.features !== undefined) snakeUpdates.features = updates.features;
  if (updates.photos !== undefined) snakeUpdates.photos = updates.photos;
  if (updates.financingAvailable !== undefined) snakeUpdates.financing_available = updates.financingAvailable;
  if (updates.negotiable !== undefined) snakeUpdates.negotiable = updates.negotiable;
  if (updates.exchangeAccepted !== undefined) snakeUpdates.exchange_accepted = updates.exchangeAccepted;
  if (updates.status !== undefined) snakeUpdates.status = updates.status;
  snakeUpdates.updated_at = new Date().toISOString();
  const { error } = await supabase.from("listings").update(snakeUpdates).eq("id", id);
  if (error) throw error;
}
