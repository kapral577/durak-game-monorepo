import React, { createContext, useContext, ReactNode } from 'react';
import { useDeviceType, DeviceInfo } from '../hooks/useDeviceType';

interface DeviceContextType {
  device: DeviceInfo;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const device = useDeviceType();

  return (
    <DeviceContext.Provider value={{ device }}>
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevice = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
};
