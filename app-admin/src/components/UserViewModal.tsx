import React from 'react';
import { FiX, FiMail, FiPhone, FiCheckCircle, FiAlertCircle, FiUser, FiCalendar, FiShield, FiCreditCard } from 'react-icons/fi';

interface UserViewModalProps {
  user: any;
  onClose: () => void;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ user, onClose }) => {
  if (!user) return null;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'suspended': return 'bg-red-100 text-red-700 border-red-200';
      case 'inactive': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getKycColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pending': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-green-600 to-emerald-600 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar & Main Info */}
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-6 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-4xl font-bold text-slate-400 border border-slate-100">
                {user.first_name?.[0]}{user.last_name?.[0]}
              </div>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 text-center">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-slate-500 text-sm font-mono bg-slate-50 px-3 py-1 rounded-full border border-slate-100 mt-2">
              ID: {user._id}
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6">
            {/* Contact Info Group */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h3>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-green-600 shadow-sm">
                  <FiMail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Email Address</p>
                  <p className="font-medium text-slate-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-green-600 shadow-sm">
                  <FiPhone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Phone Number</p>
                  <p className="font-medium text-slate-900">{user.phone_number || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Account Status Group */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <FiShield className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Account Status</span>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(user.status)}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
                  {user.status?.toUpperCase()}
                </span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <FiCheckCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">KYC Level</span>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getKycColor(user.kyc_status)}`}>
                  {user.kyc_status?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex items-center justify-between text-sm text-slate-400 px-2">
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCreditCard className="w-4 h-4" />
                <span>Wallet: ₦{user.wallet_balance?.toLocaleString() || '0.00'}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium transition-all shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserViewModal;
