import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { AlertCircle, CheckCircle2, MapPin, Crosshair } from 'lucide-react';
import LocationPickerModal from '../map/LocationPickerModal';

export default function EditListingModal({ listing, isOpen, onClose, onListingUpdated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'cooked meals',
    quantity: '',
    unit: 'boxes',
    servingsCount: '',
    imageUrl: '',
    pickupAddress: '',
    pickupInstructions: '',
    pickupStartTime: '',
    pickupEndTime: '',
    expiryTime: '',
    allergenInformation: '',
    foodHandlingNotes: '',
  });

  // Coordinates state [longitude, latitude] GeoJSON
  const [coordinates, setCoordinates] = useState([77.5946, 12.9716]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Helper to format ISO date to datetime-local input string
  const toLocalISO = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        category: listing.category || 'cooked meals',
        quantity: listing.quantity || '',
        unit: listing.unit || 'boxes',
        servingsCount: listing.servingsCount || '',
        imageUrl: listing.imageUrl || '',
        pickupAddress: listing.pickupAddress || '',
        pickupInstructions: listing.pickupInstructions || '',
        pickupStartTime: toLocalISO(listing.pickupStartTime),
        pickupEndTime: toLocalISO(listing.pickupEndTime),
        expiryTime: toLocalISO(listing.expiryTime),
        allergenInformation: listing.allergenInformation || '',
        foodHandlingNotes: listing.foodHandlingNotes || '',
      });
      if (listing.location?.coordinates && Array.isArray(listing.location.coordinates)) {
        setCoordinates(listing.location.coordinates);
      } else {
        setCoordinates([77.5946, 12.9716]);
      }
      setError('');
      setSuccess(false);
    }
  }, [listing]);

  if (!listing) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/food/${listing._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          servingsCount: formData.servingsCount ? Number(formData.servingsCount) : null,
          pickupStartTime: new Date(formData.pickupStartTime).toISOString(),
          pickupEndTime: new Date(formData.pickupEndTime).toISOString(),
          expiryTime: new Date(formData.expiryTime).toISOString(),
          location: coordinates ? { type: 'Point', coordinates } : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update listing');
      }

      setSuccess(true);
      setTimeout(() => {
        if (onListingUpdated) onListingUpdated(data.listing);
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Food Listing" maxWidth="max-w-2xl">
      {success ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-forest-900">Listing Updated Successfully!</h3>
          <p className="text-xs text-charcoal-500">Your changes have been saved to MongoDB.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
              Food Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white"
              >
                <option value="cooked meals">Cooked Meals</option>
                <option value="bakery">Bakery</option>
                <option value="fruits and vegetables">Fruits & Veggies</option>
                <option value="packaged food">Packaged Food</option>
                <option value="groceries">Groceries</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white"
              >
                <option value="boxes">Boxes</option>
                <option value="servings">Servings</option>
                <option value="kg">kg</option>
                <option value="loaves">Loaves</option>
                <option value="packets">Packets</option>
                <option value="packs">Packs</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
              Description *
            </label>
            <textarea
              rows="3"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm focus:ring-2 focus:ring-forest-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                Pickup Start *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.pickupStartTime}
                onChange={(e) => setFormData({ ...formData, pickupStartTime: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                Pickup End *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.pickupEndTime}
                onChange={(e) => setFormData({ ...formData, pickupEndTime: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                Expiry Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.expiryTime}
                onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
                Pickup Address *
              </label>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-forest-800 hover:text-forest-900 bg-forest-50 hover:bg-forest-100 px-2.5 py-0.5 rounded-lg border border-forest-200"
              >
                <MapPin className="w-3.5 h-3.5 text-forest-700" />
                <span>Adjust on Map</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={formData.pickupAddress}
              onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-sm"
            />
            {coordinates && (
              <div className="mt-2 p-2 bg-forest-50/60 border border-forest-200/70 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-forest-900">
                  <Crosshair className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold">GeoJSON Coordinates:</span>
                  <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-forest-200 text-forest-800 font-bold">
                    [{coordinates[0].toFixed(5)}, {coordinates[1].toFixed(5)}]
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLocationModalOpen(true)}
                  className="text-xs text-forest-800 hover:underline font-medium"
                >
                  Reposition Pin
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <Button variant="ghost" size="md" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit" loading={loading}>
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* Geospatial Map Picker Modal */}
      <LocationPickerModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        initialCoordinates={coordinates}
        initialAddress={formData.pickupAddress}
        onConfirmCoordinates={(newCoords) => setCoordinates(newCoords)}
      />
    </Modal>
  );
}
