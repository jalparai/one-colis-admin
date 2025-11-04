// components/PermissionGuard.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function PermissionGuard({ employee, requiredPermission, children }: any) {
  const router = useRouter();

  useEffect(() => {
    if (!employee?.permissions?.[requiredPermission]) {
      toast.error("You don’t have permission to access this page.");
      router.push('/employee'); // or wherever you want to redirect
    }
  }, [employee, requiredPermission, router]);

  // only render content if permission is valid
  if (!employee?.permissions?.[requiredPermission]) return null;

  return children;
}
