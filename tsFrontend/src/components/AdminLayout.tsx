
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const AdminLayout: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen w-full bg-gray-50">
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-40">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[75%]">
            <Sidebar />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar />
      )}
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-16 md:pt-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
