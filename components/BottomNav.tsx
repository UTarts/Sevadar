'use client';
import Link from "next/link";
import { MapPin, Download, User, Grid } from "lucide-react";
import { usePathname } from "next/navigation";

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 py-3 px-2 flex justify-around items-center z-50 text-[10px] font-medium text-gray-500 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
      
      {/* HOME: Use replace={true} so Back button doesn't loop */}
      <Link href="/" replace={true} className={`flex flex-col items-center gap-1 ${isActive('/') ? 'text-primary' : ''}`}>
        <Download size={22} strokeWidth={isActive('/') ? 2.5 : 2} />
        <span>Home</span>
      </Link>

      {/* OTHERS: Normal push navigation so Back button works correctly */}
      <Link href="/all-posters" className={`flex flex-col items-center gap-1 ${isActive('/all-posters') ? 'text-primary' : ''}`}>
        <Grid size={22} strokeWidth={isActive('/all-posters') ? 2.5 : 2} />
        <span>Gallery</span>
      </Link>

      <Link href="/#pratapgarh-section" className={`flex flex-col items-center gap-1`}>
        <MapPin size={22} />
        <span>Pratapgarh</span>
      </Link>

      <Link href="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-primary' : ''}`}>
        <User size={22} strokeWidth={isActive('/profile') ? 2.5 : 2} />
        <span>Profile</span>
      </Link>

    </nav>
  );
}