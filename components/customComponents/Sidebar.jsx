'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Logo from "@/public/assets/Logo-1.png";
import { supabase } from "@/lib/supabase";
import { signOut } from "next-auth/react";
import { 
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  IndianRupee,
  User,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  UserRoundCog,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: User, label: 'Donors', href: '/donor' },
  { icon: IndianRupee, label: 'Donations', href: '/donations' },
  { 
    icon: FileText, 
    label: 'Reports', 
    href: '/reports',
    submodules: [
      { label: 'Donors', href: '/reports/donors' },
      { label: 'Donations', href: '/reports/donations' },
      { label: 'Address', href: '/reports/address' },
    ]
  },
  { 
    icon: Settings, 
    label: 'Settings', 
    href: '/settings',
    submodules: [
      { label: 'Donors', href: '/settings/donor' },
      { label: 'Donations', href: '/settings/donations' },
      { label: 'Admin', href: '/settings/admin' },
    ]
  },
];

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  // Don't render the sidebar on print pages
  if (pathname.startsWith('/donations/print/') || pathname.startsWith('/reports/address/print') || pathname.startsWith('/donor/print') || pathname.startsWith('/login')) {
    return null;
  }

  if(pathname === "/") {
    return null;
  }

  const handleLogout = async () => {
   signOut();
  };

  const toggleExpanded = () => {
    const newState = !expanded;
    setExpanded(newState);
    localStorage.setItem('sidebarExpanded', JSON.stringify(newState));
  };

  const toggleSubmenu = (index) => {
    if (!expanded) {
      setExpanded(true);
    }
    setOpenSubmenu(openSubmenu === index ? null : index);
  };

  return (
    <aside className={cn(
      "h-screen bg-[#F3E6D5] dark:bg-black text-[#434B57] dark:text-gray-200 transition-all duration-300 border-r border-gray-200 dark:border-gray-800 flex flex-col",
      expanded ? "w-52" : "w-16"
    )}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className={cn("flex items-center", expanded ? "" : "justify-center")}>
            <Image
              src={Logo}
              alt="MIM Logo"
              width={50}
              height={50}
              className={cn("cursor-pointer", expanded ? "mr-2" : "")}
            />
            {expanded && <h1 className="text-xl font-semibold text-[#434B57] dark:text-gray-200">MIM</h1>}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-[#434B57] dark:text-gray-400 hover:text-[#F3E6D5] hover:bg-[#6C665F] dark:hover:bg-gray-900"
            onClick={toggleExpanded}
          >
            {expanded ? <ChevronLeft /> : <ChevronRight />}
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto overflow-x-hidden">
          <ul>
            <TooltipProvider>
              {menuItems.map((item, index) => {
                const isActive = item.href === '/' 
                  ? pathname === '/' 
                  : pathname.startsWith(item.href);
                const hasSubmodules = item.submodules && item.submodules.length > 0;
                const isOpen = openSubmenu === index;

                return (
                  <li key={index} className="mb-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          {hasSubmodules ? (
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full text-[#434B57] dark:text-gray-400 hover:text-[#F3E6D5] hover:bg-[#6C665F] dark:hover:bg-gray-900",
                                expanded ? "justify-start px-4" : "justify-center px-0",
                                isActive && "bg-[#6C665F] dark:bg-gray-900 text-[#F3E6D5] dark:text-gray-200 font-semibold"
                              )}
                              onClick={() => toggleSubmenu(index)}
                            >
                              <item.icon className={cn("h-5 w-5", isActive && "text-[#F3E6D5]")} />
                              {expanded && (
                                <span className={cn("ml-2 flex-grow text-left", isActive && "text-[#F3E6D5]")}>{item.label}</span>
                              )}
                              {hasSubmodules && (isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                            </Button>
                          ) : (
                            <Link href={item.href} passHref>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "w-full text-[#434B57] dark:text-gray-400 hover:text-[#F3E6D5] hover:bg-[#6C665F] dark:hover:bg-gray-900",
                                  expanded ? "justify-start px-4" : "justify-center px-0",
                                  isActive && "bg-[#6C665F] dark:bg-gray-900 text-[#F3E6D5] dark:text-gray-200 font-semibold"
                                )}
                              >
                                <item.icon className={cn("h-5 w-5", isActive && "text-[#F3E6D5]")} />
                                {expanded && (
                                  <span className={cn("ml-2 flex-grow text-left", isActive && "text-[#F3E6D5]")}>{item.label}</span>
                                )}
                              </Button>
                            </Link>
                          )}
                          {hasSubmodules && isOpen && expanded && (
                            <ul className="ml-6 mt-2">
                              {item.submodules.map((submodule, subIndex) => (
                                <li key={subIndex}>
                                  <Link href={submodule.href} passHref>
                                    <Button
                                      variant="ghost"
                                      className={cn(
                                        "w-full text-[#434B57] dark:text-gray-400 hover:text-[#F3E6D5] hover:bg-[#6C665F] dark:hover:bg-gray-900 justify-start px-4 mb-[3px]",
                                        pathname === submodule.href && "bg-[#6C665F] dark:bg-gray-900 text-[#F3E6D5] dark:text-[#F3E6D5] font-semibold"
                                      )}
                                    >
                                      {submodule.label}
                                    </Button>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </TooltipTrigger>
                      {!expanded && (
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </li>
                );
              })}
            </TooltipProvider>
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 overflow-x-hidden">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full text-[#434B57] dark:text-gray-400 hover:text-[#F3E6D5] hover:bg-[#6C665F] dark:hover:bg-gray-900",
                        expanded ? "justify-start px-4" : "justify-center px-0"
                      )}
                    >
                      <User className="h-5 w-5 flex-shrink-0" />
                      {expanded && <span className="ml-2 truncate">Profile</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-[#434B57] hover:text-[#F3E6D5] hover:bg-[#6C665F]"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              {!expanded && (
                <TooltipContent side="right">
                  <p>Profile</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}