"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoProps = {
  isScrolled?: boolean;
  className?: string;
};

export function Logo({ isScrolled, className }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center", className)}>
      <div className="relative flex items-center">
        <Image 
          src="/images/logo.svg" 
          alt="Logo" 
          width={isScrolled ? 36 : 40} 
          height={isScrolled ? 36 : 40} 
          className="transition-all duration-300 hover:scale-110"
        />
        <div className="ml-3 flex flex-col items-start">
          <p className={cn(
            "font-semibold text-gray-800 dark:text-gray-100 transition-all duration-300",
            isScrolled ? "text-base" : "text-lg"
          )}>Елиса Иванова</p>
          <p className={cn(
            "text-gray-600 dark:text-gray-300 transition-all duration-300",
            isScrolled ? "text-[10px]" : "text-xs"
          )}>Психолог & Арт Терапевт</p>
        </div>
      </div>
    </Link>
  );
} 