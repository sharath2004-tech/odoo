import type { ReactNode } from 'react';

interface GlassInputProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  icon?: ReactNode;
  required?: boolean;
  name?: string;
}

export const GlassInput = ({
  type = 'text',
  placeholder = '',
  value = '',
  onChange,
  className = '',
  icon,
  required = false,
  name = '',
}: GlassInputProps) => {
  return (
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`glass-input w-full ${icon ? 'pl-10' : ''} ${className}`}
      />
    </div>
  );
};
