
import React from 'react';
import { DollarSignIcon } from './Icons';

interface AdPlaceholderProps {
  width: string;
  height: string;
  label: string;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ width, height, label }) => {
  return (
    <div
      className={`bg-secondary border-2 border-dashed border-gray-700 flex flex-col justify-center items-center text-muted ${width} ${height} my-4 mx-auto`}
    >
        <DollarSignIcon className="h-8 w-8 mb-2" />
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs">(Ad Placeholder)</span>
    </div>
  );
};

export default AdPlaceholder;
