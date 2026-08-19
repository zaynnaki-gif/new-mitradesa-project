import { useState, useEffect, useCallback } from 'react';

// ============================================================
// Types
// ============================================================

export type FieldType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'DATETIME'
  | 'SELECT'
  | 'MULTISELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'TEXTAREA'
  | 'FILE'
  | 'NIK'
  | 'EMAIL'
  | 'PHONE'
  | 'ADDRESS';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface FieldDefinition {
  id: string | number;
  key: string;
  label: string;
  type: FieldType;
  source?: string;
  required?: boolean;
  validation?: FieldValidation;
  defaultValue?: string;
  description?: string;
  options?: FieldOption[];
  placeholder?: string;
  orderIndex?: number;
}

export interface DynamicFormProps {
  fields: FieldDefinition[];
  initialValues?: Record<string, unknown>;
  onSubmit?: (values: Record<string, unknown>) => void;
  onChange?: (values: Record<string, unknown>) => void;
  disabled?: boolean;
  showLabels?: boolean;
  className?: string;
}

export interface FieldError {
  field: string;
  message: string;
}

// ============================================================
// Validation
// ============================================================

export function validateField(
  field: FieldDefinition,
  value: unknown
): string | null {
  const { label, type, required, validation } = field;

  // Required check
  if (required) {
    if (value === undefined || value === null || value === '') {
      return `${label} wajib diisi`;
    }
    if (Array.isArray(value) && value.length === 0) {
      return `${label} wajib diisi`;
    }
  }

  // Skip further validation if empty and not required
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const stringValue = String(value);

  // Type-specific validation
  switch (type) {
    case 'NIK':
      if (!/^\d{16}$/.test(stringValue)) {
        return 'NIK harus 16 digit angka';
      }
      break;

    case 'EMAIL':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
        return 'Format email tidak valid';
      }
      break;

    case 'PHONE':
      if (!/^[\d\s\-\+\(\)]+$/.test(stringValue)) {
        return 'Format nomor telepon tidak valid';
      }
      break;

    case 'NUMBER':
      if (isNaN(Number(stringValue))) {
        return `${label} harus berupa angka`;
      }
      if (validation?.min !== undefined && Number(stringValue) < validation.min) {
        return `${label} minimal ${validation.min}`;
      }
      if (validation?.max !== undefined && Number(stringValue) > validation.max) {
        return `${label} maksimal ${validation.max}`;
      }
      break;

    case 'TEXT':
    case 'TEXTAREA':
      if (validation?.minLength && stringValue.length < validation.minLength) {
        return `${label} minimal ${validation.minLength} karakter`;
      }
      if (validation?.maxLength && stringValue.length > validation.maxLength) {
        return `${label} maksimal ${validation.maxLength} karakter`;
      }
      break;
  }

  // Pattern validation
  if (validation?.pattern && !new RegExp(validation.pattern).test(stringValue)) {
    return validation.message || `Format ${label} tidak valid`;
  }

  return null;
}

export function validateForm(
  fields: FieldDefinition[],
  values: Record<string, unknown>
): FieldError[] {
  const errors: FieldError[] = [];

  for (const field of fields) {
    const error = validateField(field, values[field.key]);
    if (error) {
      errors.push({ field: field.key, message: error });
    }
  }

  return errors;
}

// ============================================================
// Field Renderer
// ============================================================

interface FieldInputProps {
  field: FieldDefinition;
  value: unknown;
  onChange: (key: string, value: unknown) => void;
  error?: string;
  disabled?: boolean;
  showLabel?: boolean;
}

function FieldInput({
  field,
  value,
  onChange,
  error,
  disabled = false,
  showLabel = true,
}: FieldInputProps) {
  const { key, label, type, placeholder, options, required } = field;
  const fieldId = `field-${key}`;
  const errorId = `error-${key}`;

  const handleChange = (newValue: unknown) => {
    onChange(key, newValue);
  };

  const baseClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
    error
      ? 'border-red-500 focus:ring-red-200'
      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
  }`;
  const disabledClass = disabled ? 'bg-gray-100 cursor-not-allowed' : '';

  const renderInput = () => {
    const commonProps = {
      id: fieldId,
      'aria-describedby': error ? errorId : undefined,
      'aria-invalid': error ? true : undefined,
      'aria-required': required ? true : undefined,
    };

    switch (type) {
      case 'TEXT':
      case 'NIK':
      case 'EMAIL':
      case 'PHONE':
        return (
          <input
            type={type === 'EMAIL' ? 'email' : type === 'PHONE' ? 'tel' : 'text'}
            name={key}
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || `Masukkan ${label.toLowerCase()}`}
            disabled={disabled}
            className={`${baseClass} ${disabledClass}`}
            maxLength={type === 'NIK' ? 16 : undefined}
            autoComplete={type === 'EMAIL' ? 'email' : type === 'PHONE' ? 'tel' : undefined}
            {...commonProps}
          />
        );

      case 'NUMBER':
        return (
          <input
            type="number"
            name={key}
            value={(value as number) ?? ''}
            onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
            placeholder={placeholder || `Masukkan angka`}
            disabled={disabled}
            className={`${baseClass} ${disabledClass}`}
            {...commonProps}
          />
        );

      case 'DATE':
        return (
          <input
            type="date"
            name={key}
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={`${baseClass} ${disabledClass}`}
            {...commonProps}
          />
        );

      case 'DATETIME':
        return (
          <input
            type="datetime-local"
            name={key}
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={`${baseClass} ${disabledClass}`}
            {...commonProps}
          />
        );

      case 'TEXTAREA':
        return (
          <textarea
            name={key}
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || `Masukkan ${label.toLowerCase()}`}
            disabled={disabled}
            rows={4}
            className={`${baseClass} ${disabledClass} resize-none`}
            {...commonProps}
          />
        );

      case 'SELECT':
        return (
          <select
            name={key}
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            className={`${baseClass} ${disabledClass}`}
            {...commonProps}
          >
            <option value="">Pilih {label}</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'MULTISELECT':
        const multiValue = (value as string[]) || [];
        return (
          <div className="space-y-1" role="group" aria-labelledby={`${fieldId}-label`}>
            {options?.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={multiValue.includes(opt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleChange([...multiValue, opt.value]);
                    } else {
                      handleChange(multiValue.filter((v) => v !== opt.value));
                    }
                  }}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'RADIO':
        return (
          <div className="space-y-1">
            {options?.map((opt) => (
              <label key={opt.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={key}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => handleChange(e.target.value)}
                  disabled={disabled}
                  className="w-4 h-4 text-blue-600 border-gray-300"
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        );

      case 'CHECKBOX':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={(value as boolean) || false}
              onChange={(e) => handleChange(e.target.checked)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 rounded border-gray-300"
            />
            <span>{placeholder || label}</span>
          </label>
        );

      case 'ADDRESS':
        return (
          <textarea
            name={key}
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || 'Masukkan alamat lengkap'}
            disabled={disabled}
            rows={3}
            className={`${baseClass} ${disabledClass} resize-none`}
          />
        );

      case 'FILE':
        return (
          <div>
            <input
              type="file"
              name={key}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleChange(file);
                }
              }}
              disabled={disabled}
              className={`${baseClass} ${disabledClass} file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100`}
            />
            {(value && typeof value === 'object' && !!(value as File).name) ? (
              <p className="mt-1 text-sm text-gray-500">
                File terunggah: {(value as File).name}
              </p>
            ) : null}
          </div>
        );

      default:
        return (
          <input
            type="text"
            name={key}
            value={(value as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseClass} ${disabledClass}`}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      {showLabel && (
        <label id={`${fieldId}-label`} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="wajib">*</span>}
        </label>
      )}
      {renderInput()}
      {field.description && !showLabel && (
        <p className="text-xs text-gray-500">{field.description}</p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-500" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Dynamic Form Component
// ============================================================

export function DynamicForm({
  fields,
  initialValues = {},
  onSubmit,
  onChange,
  disabled = false,
  showLabels = true,
  className = '',
}: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    // Initialize with default values
    const defaults: Record<string, unknown> = {};
    for (const field of fields) {
      if (field.defaultValue !== undefined) {
        defaults[field.key] = field.defaultValue;
      }
    }
    return { ...defaults, ...initialValues };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update values when initialValues changes
  useEffect(() => {
    setValues((prev) => ({ ...prev, ...initialValues }));
  }, [initialValues]);

  // Sort fields by orderIndex
  const sortedFields = [...fields].sort(
    (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
  );

  const handleChange = useCallback(
    (key: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [key]: value }));
      setTouched((prev) => ({ ...prev, [key]: true }));

      // Validate on change if field was touched
      if (touched[key]) {
        const field = fields.find((f) => f.key === key);
        if (field) {
          const error = validateField(field, value);
          setErrors((prev) => ({
            ...prev,
            [key]: error || '',
          }));
        }
      }

      // Call onChange callback
      if (onChange) {
        const newValues = { ...values, [key]: value };
        onChange(newValues);
      }
    },
    [fields, onChange, touched, values]
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();

      // Validate all fields
      const validationErrors = validateForm(fields, values);
      const errorMap: Record<string, string> = {};
      for (const err of validationErrors) {
        errorMap[err.field] = err.message;
      }
      setErrors(errorMap);
      setTouched(
        fields.reduce((acc, f) => ({ ...acc, [f.key]: true }), {})
      );

      if (validationErrors.length === 0 && onSubmit) {
        onSubmit(values);
      }
    },
    [fields, values, onSubmit]
  );

  // Group fields by type for better layout
  const textFields = sortedFields.filter((f) =>
    ['TEXT', 'NIK', 'EMAIL', 'PHONE'].includes(f.type)
  );
  const textareaFields = sortedFields.filter((f) => ['TEXTAREA', 'ADDRESS'].includes(f.type));
  const selectFields = sortedFields.filter((f) =>
    ['SELECT', 'RADIO'].includes(f.type)
  );
  const otherFields = sortedFields.filter(
    (f) =>
      !textFields.includes(f) &&
      !textareaFields.includes(f) &&
      !selectFields.includes(f)
  );

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Text inputs - 2 columns */}
      {textFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {textFields.map((field) => (
            <div key={field.key as string}>
              <FieldInput
                field={field}
                value={values[field.key]}
                onChange={handleChange}
                error={errors[field.key]}
                disabled={disabled}
                showLabel={showLabels}
              />
            </div>
          ))}
        </div>
      )}

      {/* Textarea fields - full width */}
      {textareaFields.map((field) => (
        <div key={field.key as string}>
          <FieldInput
            field={field}
            value={values[field.key]}
            onChange={handleChange}
            error={errors[field.key]}
            disabled={disabled}
            showLabel={showLabels}
          />
        </div>
      ))}

      {/* Select fields */}
      {selectFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectFields.map((field) => (
            <div key={field.key as string}>
              <FieldInput
                field={field}
                value={values[field.key]}
                onChange={handleChange}
                error={errors[field.key]}
                disabled={disabled}
                showLabel={showLabels}
              />
            </div>
          ))}
        </div>
      )}

      {/* Other fields */}
      {otherFields.map((field) => (
        <div key={field.key as string}>
          <FieldInput
            field={field}
            value={values[field.key]}
            onChange={handleChange}
            error={errors[field.key]}
            disabled={disabled}
            showLabel={showLabels}
          />
        </div>
      ))}

      {/* Submit trigger (hidden, can be triggered programmatically) */}
      <input type="submit" hidden />
    </form>
  );
}

// ============================================================
// Utility exports
// ============================================================

export function serializeFormValues(
  values: Record<string, unknown>
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      result[key] = '';
    } else if (Array.isArray(value)) {
      result[key] = JSON.stringify(value);
    } else if (typeof value === 'object' && value instanceof File) {
      // File handling would be done separately
      continue;
    } else {
      result[key] = String(value);
    }
  }
  return result;
}

export default DynamicForm;
