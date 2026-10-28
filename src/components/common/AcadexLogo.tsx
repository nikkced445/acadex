import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  textColor?: string;
}

export const AcadexLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textColor = 'text-slate-900',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Custom stylized logo icon combining Cloud, Academic Cap and Storage Layer */}
      <div
        className={`${iconSizes[size]} rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 p-0.5 shadow-sm flex items-center justify-center shrink-0 text-white`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/5 h-4/5 drop-shadow-xs"
        >
          {/* Cloud base with folder-like academic arch */}
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
          {/* Graduation cap / academic diamond emblem inside */}
          <path d="M12 9l3 2-3 2-3-2z" fill="currentColor" fillOpacity="0.4" stroke="none" />
          <path d="M10 13v2a2 2 0 0 0 4 0v-2" strokeWidth="1.5" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight ${textSizes[size]} ${textColor} leading-tight`}>
            Acadex <span className="font-medium text-sky-500">StudyCloud</span>
          </span>
          {size === 'lg' && (
            <span className="text-xs text-sky-100 font-medium tracking-wide">
              Academic Cloud Storage & Dashboard
            </span>
          )}
        </div>
      )}
    </div>
  );
};
