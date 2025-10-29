import React from 'react';

const imageUrl = "https://github.com/auliawira/Source/blob/main/jeje.png?raw=true";

export const Illustration: React.FC = () => {
  return (
    <img 
      src={imageUrl} 
      alt="Ticketing system illustration" 
      className="max-w-full h-auto object-contain"
    />
  );
};
