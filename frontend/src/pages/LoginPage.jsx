import React from 'react';
import AdminLoginView from '../components/admin/views/AdminLoginView';

export default function LoginPage({ onSuccess, onSwitchRegister }) {
  return (
    <AdminLoginView
      onLoginSuccess={(targetRole) => {
        if (onSuccess) onSuccess(targetRole);
      }}
      onSwitchRegister={onSwitchRegister}
    />
  );
}
