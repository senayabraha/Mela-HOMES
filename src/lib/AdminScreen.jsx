import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Home, Search, Shield, Star, Trash2, UserRound, X } from 'lucide-react';
import { adminDeleteListing, adminUpdateListing, adminUpdateProfile, adminUpdateReport, getAdminStats, getAllListings, getAllReports, getAllUsers } from './storage';
import { formatPrice, isAdminProfile, listingTitle } from './houseUtils';
import { EmptyState, TopBar } from './appUi';

export function AdminScreen({ onBack, onToast, onListingsChanged }) {
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
      const updatedListing = await adminUpdateListing(listing.id, { featured });
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
          ['listings', `All Listings (${listings.length})`],
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
