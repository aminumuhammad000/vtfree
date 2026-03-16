import React, { useState } from 'react';
import { FiX, FiZap } from 'react-icons/fi';

interface PricingEditModalProps {
  plan: any;
  onClose: () => void;
  onSave: (data: any) => void;
  isSaving: boolean;
  isCreate?: boolean;
}

const NETWORK_PROVIDERS = [
  { id: 1, name: 'MTN' },
  { id: 2, name: 'Glo' },
  { id: 3, name: 'Airtel' },
  { id: 4, name: '9mobile' },
];

const SOURCE_PROVIDERS = [
  { value: 'smeplug', label: 'SMEPlug', color: 'bg-blue-100 text-blue-700' },
  { value: 'topupmate', label: 'TopupMate', color: 'bg-purple-100 text-purple-700' },
  { value: 'ibdata', label: 'VTPLUG', color: 'bg-green-100 text-green-700' },
  { value: 'manual', label: 'Manual (No API)', color: 'bg-slate-100 text-slate-600' },
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
    type: plan?.type || 'DATA',
    discount: plan?.discount || 0,
    source_provider: plan?.source_provider || 'manual',
    active: plan?.active !== false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: inputType === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNetworkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    const provider = NETWORK_PROVIDERS.find(p => p.id === id);
    setFormData(prev => ({
      ...prev,
      providerId: id,
      providerName: provider?.name || ''
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Plan name is required';
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = 'Price must be greater than 0';
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
          original_price: Number(formData.buyingPrice),
          source_provider: formData.source_provider,
        }
      };
      onSave(payload);
    }
  };

  const isCloning = plan && !plan.app_id;
  const profit = formData.price && formData.buyingPrice
    ? Number(formData.price) - Number(formData.buyingPrice)
    : 0;

  const selectedSource = SOURCE_PROVIDERS.find(s => s.value === formData.source_provider);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {isCreate ? 'Add New Plan' : isCloning ? 'Customize Plan' : 'Edit Plan'}
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {isCreate ? 'Create a new pricing plan manually or from a provider' : isCloning ? 'Saving will create a private copy for your app' : 'Update the plan pricing details'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {isCloning && (
          <div className="mx-6 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-bold text-amber-700">
              ⚠️ You are customizing a system plan. A private version will be created for your app.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Source Provider — most important decision first */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Source Provider <span className="text-slate-400 font-normal normal-case">(Which API is this plan from?)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SOURCE_PROVIDERS.map(sp => (
                <button
                  key={sp.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, source_provider: sp.value }))}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                    formData.source_provider === sp.value
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>
            {selectedSource && (
              <p className="text-[10px] font-bold mt-2 text-slate-400 uppercase tracking-wider">
                Selected: <span className="text-slate-700">{selectedSource.label}</span>
                {formData.source_provider !== 'manual' && ' — Plan ID will be used for API routing'}
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-slate-200" />

          {/* Network Provider + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Network *</label>
              <select
                name="providerId"
                value={formData.providerId}
                onChange={handleNetworkChange}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-bold text-slate-700 text-sm"
              >
                {NETWORK_PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Service Type *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-bold text-slate-700 text-sm"
              >
                {TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Plan Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Plan Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., MTN 1GB Daily"
              className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm font-medium text-slate-700 ${
                errors.name ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-green-500/20 focus:border-green-500'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Selling Price (₦) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm font-bold text-slate-900 ${
                  errors.price ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 focus:ring-green-500/20 focus:border-green-500'
                }`}
              />
              {errors.price && <p className="text-red-500 text-xs mt-1 font-medium">{errors.price}</p>}
              {profit !== 0 && (
                <p className={`text-[10px] font-black mt-1 uppercase tracking-wider ${profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {profit > 0 ? `+₦${profit.toLocaleString()} profit` : `-₦${Math.abs(profit).toLocaleString()} loss`}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cost Price / Buying Price (₦)</label>
              <input
                type="number"
                name="buyingPrice"
                value={formData.buyingPrice}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-medium text-slate-700"
              />
            </div>
          </div>

          {/* Code + Discount */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Plan Code / External ID
                {formData.source_provider !== 'manual' && <span className="ml-1 text-blue-500">• used for API</span>}
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="e.g., SME_1234"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-sm font-mono text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Discount (%)</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                placeholder="0"
                min="0"
                max="100"
                step="0.01"
                className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 text-sm font-medium text-slate-700 ${
                  errors.discount ? 'border-red-400' : 'border-slate-200 focus:ring-green-500/20 focus:border-green-500'
                }`}
              />
              {errors.discount && <p className="text-red-500 text-xs mt-1 font-medium">{errors.discount}</p>}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="active-toggle"
              name="active"
              checked={formData.active}
              onChange={handleChange}
              className="h-4 w-4 rounded text-green-600 border-slate-300 focus:ring-green-500"
            />
            <label htmlFor="active-toggle" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
              Plan is Active
              <span className="font-normal text-slate-400 ml-1">— visible to customers</span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <FiZap className="w-4 h-4" />
              {isSaving ? 'Saving...' : isCreate ? 'Create Plan' : isCloning ? 'Save as Custom' : 'Update Plan'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
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
