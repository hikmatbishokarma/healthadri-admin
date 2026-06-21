import { useState } from 'react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/config/site';

// Renders the brand logo from /public/logo.png. Until that asset is added it
// falls back to the "HA" tile used elsewhere in the app, so nothing looks broken.
export function Logo({
  className,
  showName = true,
}: {
  className?: string;
  showName?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {imgFailed ? (
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">HA</span>
        </div>
      ) : (
        <img
          src="/logo.png"
          alt={`${APP_NAME} logo`}
          className="w-9 h-9 object-contain"
          onError={() => setImgFailed(true)}
        />
      )}
      {showName ? (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </span>
      ) : null}
    </div>
  );
}
