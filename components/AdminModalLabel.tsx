/**
 * AdminModalLabel - Muestra el nombre del modal solo para el administrador
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AdminModalLabelProps {
  modalName: string;
}

const AdminModalLabel: React.FC<AdminModalLabelProps> = ({ modalName }) => {
  const { user } = useAuth();
  
  // Solo mostrar para el administrador
  if (!user || user.email !== 'ueservicesllc1@gmail.com') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-mono shadow-lg border-2 border-red-400">
      📋 {modalName}
    </div>
  );
};

export default AdminModalLabel;

