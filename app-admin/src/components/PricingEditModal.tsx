import React, { useState } from 'react';

interface PricingEditModalProps {
  plan: any;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
  isCreate?: boolean;
}

const PROVIDERS = [
  { id: 1, name: 'MTN' },
  { id: 2, name: 'Glo' },
  { id: 3, name: 'Airtel' },
  { id: 4, name: '9mobile' }
];

const TYPES = ['AIRTIME', 'DATA'];

const PricingEditModal: React.FC<PricingEditModalProps> = ({ plan, onClose, onSave, isSaving, isCreate }) => {
  const [formData, setFormData] = useState({
    providerId: plan?.providerId || 1,
    providerName: plan?.providerName || 'MTN',
    externalPlanId: plan?.externalPlanId || '',
    code: plan?.code || '',
    name: plan?.name || '',
    price: plan?.price || '',
    buyingPrice: plan?.meta?.original_price || plan?.meta?.price || '',
    type: plan?.type || 'AIRTIME',
    discount: plan?.discount || 0,
    source_provider: plan?.source_provider || '',
    active: plan?.active !== false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    const provider = PROVIDERS.find(p => p.id === id);
    setFormData(prev => ({
      ...prev,
      providerId: id,
      providerName: provider?.name || ''
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Plan name is required';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Price must be greater than 0';
    if (formData.discount < 0 || formData.discount > 100) newErrors.discount = 'Discount must be between 0 and 100';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const payload = {
        ...formData,
        meta: {
          ...(plan?.meta || {}),
          original_price: Number(formData.buyingPrice)
        }
      };
      onSave(payload);
    }
  };

  const isCloning = plan && !plan.app_id;
  const profit = formData.price && formData.buyingPrice ? Number(formData.price) - Number(formData.buyingPrice) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">
          {isCreate ? 'Create New Plan' : isCloning ? 'Clone & Customize System Plan' : 'Edit Plan'}
        </h2>
        {isCloning && (
          <p className="text-xs font-bold text-amber-600 mb-4 bg-amber-50 p-2 rounded border border-amber-100 italic">
            Note: You are customizing a system default plan. Saving will create a private version for your app.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Provider *</label>
              <select
                name="providerId"
                value={formData.providerId}
                onChange={handleProviderChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Source Provider (e.g. vtplug)</label>
            <input
              type="text"
              name="source_provider"
              value={formData.source_provider}
              onChange={handleChange}
              placeholder="Source API code (e.g. vtplug, smeplug)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Plan Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., MTN 1GB Daily"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Selling Price (₦) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              {profit !== 0 && (
                <p className={`text-[10px] font-black mt-1 uppercase ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Expected Profit: ₦{profit.toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Buying Price (Cost) (₦)</label>
              <input
                type="number"
                name="buyingPrice"
                value={formData.buyingPrice}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${errors.discount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
              />
              {errors.discount && <p className="text-red-500 text-sm mt-1">{errors.discount}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Code</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="Plan code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="h-4 w-4 text-green-600 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">Active</label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-lg transition"
            >
              {isSaving ? 'Saving...' : 'Save Plan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PricingEditModal;
