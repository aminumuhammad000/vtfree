import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    fullWidth = true,
    className = '',
    id,
    ...props
}) => {
    const inputId = id || props.name;

    return (
        <div className={`form-group ${fullWidth ? 'w-full' : ''}`}>
            {label && (
                <label htmlFor={inputId} className="form-label">
                    {label}
                </label>
            )}
            <div className="form-input-wrapper">
                {leftIcon && (
                    <div className="form-icon-left">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`form-input ${leftIcon ? 'form-input-with-left-icon' : ''} ${rightIcon ? 'form-input-with-right-icon' : ''} ${error ? 'error' : ''} ${className}`}
                    {...props}
                />
                {rightIcon && (
                    <div className="form-icon-right">
                        {rightIcon}
                    </div>
                )}
            </div>
            {error && (
                <p className="form-error">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
};
