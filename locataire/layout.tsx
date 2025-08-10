import Image from "next/image";
import type React from "react";

export default function LocataireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
       <header className="py-8 flex justify-center">
        <Image
          src="/images/logo.png"
          alt="ALV Immobilier Pleyben"
          width={180}
          height={75}
          className="h-auto"
          priority
        />
      </header>
      <main className="container mx-auto px-4 pb-8 max-w-4xl">
        {children}
      </main>
    </div>
  );
}
