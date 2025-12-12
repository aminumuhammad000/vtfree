import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
    noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = '',
    title,
    action,
    noPadding = false,
}) => {
    return (
        <div className={`card ${className}`}>
            {(title || action) && (
                <div className="card-header">
                    {title && <h3>{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className={noPadding ? 'card-body-no-padding' : 'card-body'}>
                {children}
            </div>
        </div>
    );
};
