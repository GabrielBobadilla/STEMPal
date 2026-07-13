import React from 'react';

const ProfilePicture = ({ user, fullname, uploading, onUpload }) => (
  <div className="relative">
    <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 p-1">
      <div className="w-full h-full rounded-full bg-[var(--bg-primary)] flex items-center justify-center overflow-hidden">
        {user?.profile_picture ? (
          <img src={user.profile_picture} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-bold gradient-text">
            {fullname?.charAt(0)?.toUpperCase() || '?'}
          </span>
        )}
      </div>
    </div>
    <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary-500 hover:bg-primary-600 cursor-pointer flex items-center justify-center text-white text-sm shadow-lg transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <input type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
    </label>
    {uploading && (
      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
      </div>
    )}
  </div>
);

export default ProfilePicture;
