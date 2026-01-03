"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <header className="border-b p-4 flex items-center justify-between bg-background">
      <h2 className="font-semibold">Dashboard</h2>
      <Button variant="outline" onClick={handleLogout}>Гарах</Button>
    </header>
  );
}
