import React from 'react';

interface UserViewModalProps {
  user: any;
  onClose: () => void;
}

const UserViewModal: React.FC<UserViewModalProps> = ({ user, onClose }) => {
  if (!user) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">User Details</h2>
        <div className="mb-2"><strong>Name:</strong> {user.first_name} {user.last_name}</div>
        <div className="mb-2"><strong>Email:</strong> {user.email}</div>
        <div className="mb-2"><strong>Phone:</strong> {user.phone_number}</div>
        <div className="mb-2"><strong>Status:</strong> {user.status}</div>
        <div className="mb-2"><strong>KYC Status:</strong> {user.kyc_status}</div>
      </div>
    </div>
  );
};

export default UserViewModal;
