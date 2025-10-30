import React from 'react';

interface PageProps {
    title?: string;
    children: React.ReactNode;
}

const Page: React.FC<PageProps> = ({ title, children }) => {
    return (
        <div className="p-4 sm:p-6 w-full">
            <div className="max-w-xl mx-auto flex flex-col gap-6 pb-24 pt-8">
                 {title && <h1 className="text-2xl font-semibold" style={{ color: 'var(--primary-text)' }}>{title}</h1>}
                 {children}
            </div>
        </div>
    );
};

export default Page;