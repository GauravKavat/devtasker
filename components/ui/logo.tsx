'use client';

import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative h-8 w-8 flex items-center justify-center">
        <p className="text-xl font-bold text-center">
            &#123;&lt;/&gt;&#125;
        </p>
      </div>
    </Link>
  );
}