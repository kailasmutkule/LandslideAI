import React, { createContext, useContext, useState } from 'react';

interface FilterContextType {
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  timeHorizon: '24h' | '7d' | '30d';
  setTimeHorizon: (horizon: '24h' | '7d' | '30d') => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeHorizon, setTimeHorizon] = useState<'24h' | '7d' | '30d'>('24h');

  const resetFilters = () => {
    setSelectedState('ALL');
    setSelectedDistrict('');
    setSearchQuery('');
    setTimeHorizon('24h');
  };

  return (
    <FilterContext.Provider
      value={{
        selectedState,
        setSelectedState,
        selectedDistrict,
        setSelectedDistrict,
        searchQuery,
        setSearchQuery,
        timeHorizon,
        setTimeHorizon,
        resetFilters
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};
