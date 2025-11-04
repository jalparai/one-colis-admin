'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Permissions {
  addStock: boolean;
  manageOrders: boolean;
  scanOrders: boolean;
  assignProducts: boolean;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  customRole: string;
  permissions: Permissions;
}

interface EmployeeContextType {
  employee: Employee | null;
  setEmployee: (employee: Employee | null) => void;
}

const EmployeeContext = createContext<EmployeeContextType>({
  employee: null,
  setEmployee: () => {},
});

export const EmployeeProvider = ({ children }: { children: React.ReactNode }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);

  // Load from localStorage on page load
  useEffect(() => {
    const stored = localStorage.getItem('employee');
    if (stored) {
      try {
        setEmployee(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse employee from localStorage', e);
      }
    }
  }, []);

  // Save employee in localStorage when it changes
  useEffect(() => {
    if (employee) {
      localStorage.setItem('employee', JSON.stringify(employee));
    }
  }, [employee]);

  return (
    <EmployeeContext.Provider value={{ employee, setEmployee }}>
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployee = () => useContext(EmployeeContext);
