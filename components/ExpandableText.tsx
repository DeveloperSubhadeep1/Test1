import React, { useState } from 'react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ text, maxLength = 280 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) {
    return <p className="text-light-muted dark:text-muted italic">No overview available.</p>;
  }

  if (text.length <= maxLength) {
    return <p className="text-light-text dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{text}</p>;
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <p className="text-light-text dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </p>
      <button
        onClick={toggleExpanded}
        className="text-light-accent dark:text-accent font-semibold hover:underline mt-2 text-sm"
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Read less' : 'Read more'}
      </button>
    </div>
  );
};

export default ExpandableText;
