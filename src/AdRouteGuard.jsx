import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncAdsWithRoute } from './ads';

function reloadDocument() {
  window.location.reload();
}

/**
 * Starts the ad scripts only on routes that may show ads. Auto ads keep
 * running across client-side navigation, so moving from an ad page to a hub,
 * legal page or the 404 reloads the document to drop the ad script there.
 */
export default function AdRouteGuard({ onReloadRequired = reloadDocument }) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (syncAdsWithRoute(pathname)) {
      onReloadRequired();
    }
  }, [pathname, onReloadRequired]);

  return null;
}
