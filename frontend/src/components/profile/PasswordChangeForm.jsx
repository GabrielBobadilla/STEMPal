import React from 'react';

const PasswordChangeForm = ({ passwordData, onChange, onSubmit }) => (
  <div>
    <h2 className="text-lg font-semibold mb-6">Change Password</h2>
    <form onSubmit={onSubmit} className="space-y-4">
      {[
        { label: 'Current Password', name: 'currentPassword', type: 'password' },
        { label: 'New Password', name: 'newPassword', type: 'password' },
        { label: 'Confirm New Password', name: 'confirmPassword', type: 'password' }
      ].map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{field.label}</label>
          <input
            type={field.type}
            value={passwordData[field.name]}
            onChange={(e) => onChange({ ...passwordData, [field.name]: e.target.value })}
            className="input-field"
            required
          />
        </div>
      ))}
      <button type="submit" className="btn-primary">Change Password</button>
    </form>
  </div>
);

export default PasswordChangeForm;
