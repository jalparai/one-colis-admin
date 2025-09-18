// components/MetricCard.tsx
import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle }) => (
  <div className="p-4 bg-white shadow rounded-md w-full sm:w-1/3">
    <h3 className="text-gray-500 text-sm">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
    {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
  </div>
);
