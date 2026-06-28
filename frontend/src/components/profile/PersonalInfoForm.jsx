import React from 'react';

const FIELDS = [
  { label: 'Full Name', name: 'fullname', type: 'text' },
  { label: 'Email', name: 'email', type: 'email', readOnly: true },
  { label: 'Phone', name: 'phone', type: 'tel' },
  { label: 'Grade Level', name: 'grade_level', type: 'text' },
  { label: 'School', name: 'school', type: 'text' },
  { label: 'STEM Strand', name: 'stem_strand', type: 'text' }
];

const PersonalInfoForm = ({ form, onChange, onSave, saving }) => (
  <div>
    <h2 className="text-lg font-semibold mb-6">Personal Information</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {FIELDS.map(field => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{field.label}</label>
          <input
            type={field.type}
            name={field.name}
            value={form[field.name]}
            onChange={onChange}
            readOnly={field.readOnly}
            className={`input-field ${field.readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
          />
        </div>
      ))}
    </div>
    <button onClick={onSave} disabled={saving} className="btn-primary mt-6 flex items-center gap-2">
      {saving && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
      {saving ? 'Saving...' : 'Save Changes'}
    </button>
  </div>
);

export default PersonalInfoForm;
