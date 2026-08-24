import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import React, { useEffect } from 'react';

export default function SuccessToast({ notification, onClose }) {
  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(onClose, notification.duration || 4500);
    return () => window.clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div className={`success-toast success-toast--${notification.type || 'success'}`} role={notification.type === 'error' ? 'alert' : 'status'} aria-live={notification.type === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
      <span className="success-toast__icon" aria-hidden="true">{notification.type === 'error' ? <AlertCircle /> : notification.type === 'info' ? <Info /> : <CheckCircle2 />}</span>
      <span className="success-toast__copy">
        <strong>{notification.title}</strong>
        <small>{notification.message}</small>
      </span>
      <button type="button" onClick={onClose} aria-label="Đóng thông báo"><X /></button>
      <span className="success-toast__timer" style={{ animationDuration: `${notification.duration || 4500}ms` }} aria-hidden="true" />
    </div>
  );
}
