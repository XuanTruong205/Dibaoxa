import { useEffect } from 'react';

export default function Analytics({ path }) {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  useEffect(() => {
    if (!measurementId) return undefined;
    if (!document.querySelector(`script[data-ga-id="${measurementId}"]`)) {
      const script = document.createElement('script');
      script.async = true;
      script.dataset.gaId = measurementId;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = (...args) => window.dataLayer.push(args);
      window.gtag('js', new Date());
      window.gtag('config', measurementId, { send_page_view: false });
    }
    window.gtag?.('event', 'page_view', {
      page_path: path,
      page_title: document.title,
      page_location: window.location.href,
    });
    return undefined;
  }, [measurementId, path]);

  return null;
}
