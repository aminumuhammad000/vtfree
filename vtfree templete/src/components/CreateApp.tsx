import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Palette,
  Building2,
  Settings,
  CheckSquare,
  Shield,
  Rocket,
  Check,
  Upload,
  HelpCircle,
  Smartphone,
  Globe,
  Monitor
} from 'lucide-react';

interface CreateAppProps {
  onNavigate: (page: string) => void;
}

export function CreateApp({ onNavigate }: CreateAppProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Branding
    logo: null as File | null,
    primaryColor: '#16A34A',
    secondaryColor: '#22C55E',
    appName: '',
    tagline: '',
    
    // Step 2: Business Info
    businessName: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    
    // Step 3: VTU Configuration
    apiProvider: 'smeplug',
    apiKey: '',
    webhook: '',
    paymentGateway: 'paystack',
    
    // Step 4: Services
    services: [] as string[],
    
    // Step 5: Admin Panel
    adminEmail: '',
    adminPassword: '',
    
    // Step 6: Build Options
    platforms: [] as string[],
    publishPlayStore: false
  });

  const totalSteps = 7;

  const steps = [
    { number: 1, title: 'Branding', icon: Palette },
    { number: 2, title: 'Business Info', icon: Building2 },
    { number: 3, title: 'VTU Config', icon: Settings },
    { number: 4, title: 'Services', icon: CheckSquare },
    { number: 5, title: 'Admin Panel', icon: Shield },
    { number: 6, title: 'Build Options', icon: Rocket },
    { number: 7, title: 'Review', icon: Check }
  ];

  const services = [
    { id: 'airtime', label: 'Airtime', icon: '📱' },
    { id: 'data', label: 'Data', icon: '📶' },
    { id: 'cable', label: 'Cable TV', icon: '📺' },
    { id: 'electricity', label: 'Electricity', icon: '⚡' },
    { id: 'exam', label: 'Exam Pins', icon: '📝' },
    { id: 'airtime2cash', label: 'Airtime to Cash', icon: '💰' },
    { id: 'sms', label: 'Bulk SMS', icon: '💬' },
    { id: 'others', label: 'Others', icon: '➕' }
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit and navigate to build status
      onNavigate('build-status');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm p-4"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h2>Create New App</h2>
            <p className="text-gray-600 text-sm">Step {currentStep} of {totalSteps}</p>
          </div>
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step.number
                      ? 'bg-[#16A34A] text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </motion.div>
                {index < steps.length - 1 && (
                  <div className="hidden sm:block w-8 lg:w-16 h-1 mx-2">
                    <div
                      className={`h-full ${
                        currentStep > step.number ? 'bg-[#16A34A]' : 'bg-gray-200'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Branding */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-2">Brand Your App</h3>
                <p className="text-gray-600">Customize the look and feel of your app</p>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-gray-700 mb-2">App Logo</label>
                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#16A34A] transition-colors cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">Click to upload logo</p>
                  <p className="text-gray-400 text-sm">PNG, JPG up to 2MB</p>
                </div>
              </div>

              {/* App Name */}
              <div>
                <label className="block text-gray-700 mb-2">App Name</label>
                <input
                  type="text"
                  value={formData.appName}
                  onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  placeholder="My VTU App"
                />
              </div>

              {/* Tagline */}
              <div>
                <label className="block text-gray-700 mb-2">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  placeholder="Recharge made easy"
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Primary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-16 h-12 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Secondary Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-16 h-12 rounded-xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <p className="text-gray-700 mb-4">Live Preview</p>
                <div className="bg-gray-100 rounded-xl p-8 text-center">
                  <div
                    className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    <Smartphone className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="mb-1" style={{ color: formData.primaryColor }}>
                    {formData.appName || 'My VTU App'}
                  </h3>
                  <p className="text-gray-600 text-sm">{formData.tagline || 'Recharge made easy'}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Business Information */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-2">Business Information</h3>
                <p className="text-gray-600">Tell us about your business</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    placeholder="ABC Technologies"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    placeholder="+234 800 000 0000"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    rows={3}
                    placeholder="123 Business Street, Lagos"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Website (Optional)</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: VTU Configuration */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-2">VTU Configuration</h3>
                <p className="text-gray-600">Connect your API provider</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">API Provider</label>
                  <select
                    value={formData.apiProvider}
                    onChange={(e) => setFormData({ ...formData, apiProvider: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  >
                    <option value="smeplug">SMEplug</option>
                    <option value="hawk">Hawk</option>
                    <option value="clubkonnect">ClubKonnect</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2 flex items-center gap-2">
                    API Key
                    <button className="text-[#16A34A]">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </label>
                  <input
                    type="text"
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    placeholder="sk_live_xxxxxxxxxxxxx"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    💡 Find this in your {formData.apiProvider} dashboard
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Webhook URL (Optional)</label>
                  <input
                    type="url"
                    value={formData.webhook}
                    onChange={(e) => setFormData({ ...formData, webhook: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    placeholder="https://yourapp.com/webhook"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Payment Gateway</label>
                  <select
                    value={formData.paymentGateway}
                    onChange={(e) => setFormData({ ...formData, paymentGateway: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  >
                    <option value="paystack">Paystack</option>
                    <option value="flutterwave">Flutterwave</option>
                    <option value="monnify">Monnify</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Services */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-2">Select Services</h3>
                <p className="text-gray-600">Choose which services to enable</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {services.map((service) => (
                  <motion.button
                    key={service.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => toggleService(service.id)}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      formData.services.includes(service.id)
                        ? 'border-[#16A34A] bg-[#DCFCE7]'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-3xl mb-2">{service.icon}</div>
                    <p className={formData.services.includes(service.id) ? 'text-[#16A34A]' : 'text-gray-700'}>
                      {service.label}
                    </p>
                    {formData.services.includes(service.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-2"
                      >
                        <Check className="w-5 h-5 text-[#16A34A] mx-auto" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 5: Admin Panel */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-2">Admin Panel Setup</h3>
                <p className="text-gray-600">Create your admin credentials</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 mb-2">Admin Email</label>
                  <input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">Temporary Password</label>
                  <input
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                    placeholder="••••••••"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You can change this after first login
                  </p>
                </div>

                <div className="bg-[#DCFCE7] p-4 rounded-xl">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-[#16A34A] flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>Security Tip:</strong> Use a strong password with at least 8 characters, including numbers and special characters.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 6: Build Options */}
          {currentStep === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-2">Build Options</h3>
                <p className="text-gray-600">Choose your deployment platforms</p>
              </div>

              <div>
                <label className="block text-gray-700 mb-3">Select Platforms</label>
                <div className="space-y-3">
                  {[
                    { id: 'android', label: 'Android App', icon: Smartphone, desc: 'APK for Android devices' },
                    { id: 'web', label: 'Web App', icon: Globe, desc: 'Progressive web application' },
                    { id: 'admin', label: 'Admin Panel', icon: Monitor, desc: 'Web-based admin dashboard' }
                  ].map((platform) => (
                    <motion.button
                      key={platform.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => togglePlatform(platform.id)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                        formData.platforms.includes(platform.id)
                          ? 'border-[#16A34A] bg-[#DCFCE7]'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          formData.platforms.includes(platform.id)
                            ? 'bg-[#16A34A] text-white'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <platform.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-1">{platform.label}</h3>
                          <p className="text-gray-600 text-sm">{platform.desc}</p>
                        </div>
                        {formData.platforms.includes(platform.id) && (
                          <Check className="w-6 h-6 text-[#16A34A]" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {formData.platforms.includes('android') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <label className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl cursor-pointer hover:border-[#16A34A] transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.publishPlayStore}
                      onChange={(e) => setFormData({ ...formData, publishPlayStore: e.target.checked })}
                      className="w-5 h-5 text-[#16A34A] rounded"
                    />
                    <div>
                      <p className="text-gray-700">Publish to Google Play Store</p>
                      <p className="text-gray-500 text-sm">We'll help you publish your app (additional fees apply)</p>
                    </div>
                  </label>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 7: Review */}
          {currentStep === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="mb-2">Review & Submit</h3>
                <p className="text-gray-600">Double-check your configuration</p>
              </div>

              <div className="space-y-4">
                {/* Branding */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3>Branding</h3>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="text-[#16A34A] text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">App Name: <span className="text-gray-900">{formData.appName || 'Not set'}</span></p>
                    <p className="text-gray-600">Tagline: <span className="text-gray-900">{formData.tagline || 'Not set'}</span></p>
                    <div className="flex gap-2 items-center">
                      <p className="text-gray-600">Colors:</p>
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: formData.primaryColor }} />
                      <div className="w-6 h-6 rounded" style={{ backgroundColor: formData.secondaryColor }} />
                    </div>
                  </div>
                </div>

                {/* Business Info */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3>Business Information</h3>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-[#16A34A] text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">Name: <span className="text-gray-900">{formData.businessName || 'Not set'}</span></p>
                    <p className="text-gray-600">Email: <span className="text-gray-900">{formData.email || 'Not set'}</span></p>
                    <p className="text-gray-600">Phone: <span className="text-gray-900">{formData.phone || 'Not set'}</span></p>
                  </div>
                </div>

                {/* Services */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3>Services</h3>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="text-[#16A34A] text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.services.length > 0 ? (
                      formData.services.map((serviceId) => {
                        const service = services.find(s => s.id === serviceId);
                        return service ? (
                          <span
                            key={serviceId}
                            className="px-3 py-1 bg-[#DCFCE7] text-[#16A34A] rounded-lg text-sm"
                          >
                            {service.icon} {service.label}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <p className="text-gray-500 text-sm">No services selected</p>
                    )}
                  </div>
                </div>

                {/* Platforms */}
                <div className="bg-white p-5 rounded-2xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3>Platforms</h3>
                    <button
                      onClick={() => setCurrentStep(6)}
                      className="text-[#16A34A] text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.platforms.length > 0 ? (
                      formData.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="px-3 py-1 bg-[#DCFCE7] text-[#16A34A] rounded-lg text-sm capitalize"
                        >
                          {platform}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No platforms selected</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Build Time Estimate */}
              <div className="bg-gradient-to-r from-[#16A34A] to-[#22C55E] p-6 rounded-2xl text-white">
                <div className="flex items-center gap-4">
                  <Rocket className="w-12 h-12" />
                  <div>
                    <h3 className="mb-1">Estimated Build Time</h3>
                    <p className="text-white/90">3-5 minutes</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-4 mt-8"
        >
          {currentStep > 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              className="flex-1 bg-white text-gray-700 py-4 rounded-xl border border-gray-200 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-[#16A34A] to-[#22C55E] text-white py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg"
          >
            {currentStep === totalSteps ? 'Start Building' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
