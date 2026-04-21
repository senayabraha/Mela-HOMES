import React, { useEffect, useMemo, useState } from 'react';
import { Camera, X } from 'lucide-react';
import {
  CONDITIONS,
  COUNTRIES,
  CURRENCIES,
  CURRENCY_BY_COUNTRY,
  FEATURES,
  FURNISHED_OPTIONS,
  INITIAL_FORM,
  LISTING_STEP_KEYS,
  LISTING_STEP_LABELS,
  LISTING_TYPES,
  MAX_LISTING_PHOTOS,
  PROPERTY_TYPES,
  SELL_DRAFT_KEY,
} from '../houseData';
import { areasOf, citiesOf, generatedListingTitle, regionsOf, toForm } from './houseUtils';
import { Chip, InputField, ListingCard, SectionTitle, SelectField, ToggleField, TopBar } from './appUi';
import { createListing, ensureCurrentProfile, updateListing, uploadPhoto } from './storage';

export function SellScreen({ currentUserId, currentProfile, onCreated, onNeedAuth, editingListing, onCancelEdit, onSaved, onToast }) {
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
