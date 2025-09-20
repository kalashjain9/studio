import { Dashboard } from "@/components/dashboard";
import { Sidebar, SidebarProvider, SidebarInset, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { BotMessageSquare, LayoutDashboard, Settings } from 'lucide-react';
import Link from "next/link";

export default function Home() {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <BotMessageSquare className="h-8 w-8 flex-shrink-0 text-sidebar-foreground" />
            <h1 className="text-xl font-semibold text-sidebar-foreground font-headline group-data-[collapsible=icon]:hidden">SREnetic</h1>
          </div>
        </SidebarHeader>
        <SidebarMenu className="flex-grow">
          <SidebarMenuItem>
            <Link href="/">
              <SidebarMenuButton isActive tooltip="Dashboard">
                <LayoutDashboard />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/configuration">
              <SidebarMenuButton tooltip="Configuration">
                <Settings />
                <span className="group-data-[collapsible=icon]:hidden">Configuration</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center gap-4 p-4 border-b bg-background sticky top-0 z-10">
          <SidebarTrigger className="md:hidden" />
          <h2 className="text-2xl font-bold">Autonomous SRE Incident Response</h2>
        </header>
        <main className="p-4 md:p-8">
          <Dashboard />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
