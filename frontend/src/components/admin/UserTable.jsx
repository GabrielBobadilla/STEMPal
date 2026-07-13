import React from 'react';

const UserTable = ({ users, searchQuery, onSearchChange, onRoleUpdate, onDelete, actionLoading }) => (
  <div>
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <h2 className="text-lg font-semibold">User Management</h2>
      <div className="relative w-full md:w-72">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search users..." value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="input-field pl-10 text-sm" />
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[var(--text-secondary)] border-b border-[var(--glass-border)]">
            <th className="text-left py-3 px-2 font-medium">Name</th>
            <th className="text-left py-3 px-2 font-medium">Email</th>
            <th className="text-left py-3 px-2 font-medium">Role</th>
            <th className="text-left py-3 px-2 font-medium">Joined</th>
            <th className="text-right py-3 px-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan={5} className="py-8 text-center text-[var(--text-secondary)]">No users found</td></tr>
          ) : (
            users.map((u) => (
              <tr key={u._id} className="border-b border-[var(--glass-border)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                <td className="py-3 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {(u.fullname || u.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{u.fullname || u.name || 'N/A'}</span>
                  </div>
                </td>
                <td className="py-3 px-2 text-[var(--text-secondary)]">{u.email}</td>
                <td className="py-3 px-2">
                  <span className={`badge text-xs ${u.role === 'admin' ? 'badge-primary' : u.role === 'moderator' ? 'badge-warning' : 'badge-success'}`}>
                    {u.role || 'user'}
                  </span>
                </td>
                <td className="py-3 px-2 text-[var(--text-secondary)] text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2 justify-end">
                    {u.role !== 'admin' && (
                      <>
                        <button onClick={() => onRoleUpdate(u._id, u.role === 'moderator' ? 'user' : 'moderator')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[#60C5FF] hover:bg-[#60C5FF]/10 transition-all disabled:opacity-50">
                          {u.role === 'moderator' ? 'Demote' : 'Promote'}
                        </button>
                        <button onClick={() => onRoleUpdate(u._id, 'admin')}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-green-400 hover:bg-green-500/10 transition-all disabled:opacity-50">
                          Make Admin
                        </button>
                      </>
                    )}
                    <button onClick={() => onDelete(u._id)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default UserTable;
