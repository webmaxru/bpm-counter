import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { isNativeApp, shareBpm } from './nativePlatform';

function NativeShareButton({ bpm, mode, className = '' }) {
  const [isSharing, setIsSharing] = useState(false);

  if (!bpm || !isNativeApp()) {
    return null;
  }

  const handleShare = async () => {
    setIsSharing(true);

    try {
      await shareBpm({ bpm, mode });
    } catch (error) {
      console.error('Unable to open the iOS share sheet.', error);
      toast.error('Sharing is unavailable right now. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      className={`native-share-button ${className}`.trim()}
      type="button"
      onClick={handleShare}
      disabled={isSharing}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 16V3m0 0L7.5 7.5M12 3l4.5 4.5" />
        <path d="M5 11v8h14v-8" />
      </svg>
      <span>{isSharing ? 'Opening share sheet...' : 'Share BPM'}</span>
    </button>
  );
}

export default NativeShareButton;
