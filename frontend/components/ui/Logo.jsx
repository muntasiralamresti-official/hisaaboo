import React from 'react';
import Image from 'next/image';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const sizeMap = {
    sm: { img: 32, text: 'text-lg', sub: 'text-[10px]' },
    md: { img: 44, text: 'text-2xl', sub: 'text-xs' },
    lg: { img: 64, text: 'text-3xl', sub: 'text-sm' },
    xl: { img: 88, text: 'text-4xl', sub: 'text-base' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100 flex items-center justify-center">
        <Image
          src="/logo.jpg"
          alt="Hisaaboo Logo"
          width={currentSize.img}
          height={currentSize.img}
          className="object-contain"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black tracking-tight text-slate-900 leading-none ${currentSize.text}`}>
            Hisaaboo
          </span>
          <span className={`font-medium text-slate-500 tracking-normal ${currentSize.sub}`}>
            হিসাব খাতা ও ইনভেন্টরি
          </span>
        </div>
      )}
    </div>
  );
}
