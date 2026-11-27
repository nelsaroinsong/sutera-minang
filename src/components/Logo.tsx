import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'emblem' | 'full' | 'compact';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'full',
  showSubtitle = true,
  className = '',
}) => {
  const sizeMap = {
    sm: { box: 'w-9 h-9', title: 'text-sm tracking-[0.16em]', sub: 'text-[9px]' },
    md: { box: 'w-12 h-12', title: 'text-base tracking-[0.2em]', sub: 'text-[10px]' },
    lg: { box: 'w-16 h-16', title: 'text-xl sm:text-2xl tracking-[0.24em]', sub: 'text-xs' },
  };

  const { box, title, sub } = sizeMap[size];

  const Emblem = (
    <div
      className={`relative shrink-0 aspect-square rounded-full border border-[#C9B99E] bg-[#FFFDF9] flex items-center justify-center p-1 shadow-xs ${box}`}
    >
      <img
        src="/assets/logo_raw.png"
        alt="Lambang Sutera Minang"
        className="w-full h-full object-contain"
      />
    </div>
  );

  if (variant === 'emblem') {
    return <div className={className}>{Emblem}</div>;
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 shrink-0 ${className}`}>
        {Emblem}
        <div className="flex flex-col text-left">
          <span className={`font-cinzel font-bold uppercase text-[#261C14] leading-none whitespace-nowrap ${title}`}>
            Sutera Minang
          </span>
          <span className="text-[9.5px] tracking-[0.12em] text-[#857464] uppercase mt-0.5 whitespace-nowrap">
            Pusaka Minangkabau
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {Emblem}
      <h1 className={`font-cinzel font-bold uppercase text-[#261C14] mt-2.5 leading-tight ${title}`}>
        Sutera Minang
      </h1>
      {showSubtitle && (
        <p className={`font-serif-menu italic text-[#5C4D40] tracking-wide mt-0.5 ${sub}`}>
          Haute Gastronomy • Cita Rasa Pusaka &amp; Tradisi Luhur Nusantara
        </p>
      )}
    </div>
  );
};
