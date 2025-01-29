'use client';
import { usePathname } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import  ModeToggle  from "./ModeToggle";

export default function Header() {
  const pathname = usePathname();

  // Don't render the header on print pages
  if (pathname.startsWith('/donations/print/') || pathname.startsWith('/reports/address/print') || pathname.startsWith('/donors/print') || pathname.startsWith('/forgot-password') || pathname.startsWith('/settings/staffs/print') ) {
    return null;
  }

  if(pathname === "/") {
    return null;
  }

  const breadcrumbs = pathname.split('/').filter(Boolean);

  return (
    <header className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex justify-between items-center">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={index}>
              <BreadcrumbSeparator />
              {index === breadcrumbs.length - 1 ? (
                <BreadcrumbPage>{crumb.charAt(0).toUpperCase() + crumb.slice(1)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={`/${breadcrumbs.slice(0, index + 1).join('/')}`}>
                  {crumb.charAt(0).toUpperCase() + crumb.slice(1)}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {/* <ModeToggle /> */}
    </header>
  );
}