
'use client';

import { Sidebar, SidebarProvider, SidebarInset, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from "@/components/ui/sidebar";
import { BotMessageSquare, LayoutDashboard, Settings, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { agentIcons, AgentName } from "@/components/agent-icons";
import { Separator } from "@/components/ui/separator";

const agents: { name: AgentName, model: string }[] = [
  { name: "Sentinel", model: "googleai/gemini-1.5-flash-latest" },
  { name: "First Responder", model: "googleai/gemini-1.5-pro-latest" },
  { name: "Commander", model: "googleai/gemini-1.5-pro-latest" },
  { name: "Engineer", model: "googleai/gemini-1.5-flash-latest" },
  { name: "Communicator", model: "googleai/gemini-1.5-flash-latest" },
];

export default function ConfigurationPage() {
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast({
      title: "Settings Saved",
      description: "Your agent configurations have been updated.",
    });
  };

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
                <SidebarMenuButton tooltip="Dashboard">
                <LayoutDashboard />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
                </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
             <Link href="/configuration">
                <SidebarMenuButton isActive tooltip="Configuration">
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
          <h2 className="text-2xl font-bold">Configuration</h2>
        </header>
        <main className="p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Agent Configuration</CardTitle>
                    <CardDescription>
                        Manage your application settings and agent configurations here.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <form onSubmit={handleSubmit} className="space-y-8">
                        {agents.map((agent, index) => {
                            const AgentIcon = agentIcons[agent.name];
                            return (
                                <div key={agent.name}>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <AgentIcon className="h-8 w-8 text-foreground" />
                                            <div>
                                                <h3 className="text-lg font-semibold">{agent.name}</h3>
                                                <p className="text-sm text-muted-foreground">Configure the {agent.name} agent.</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                            <Label htmlFor={`${agent.name}-model`}>LLM Model</Label>
                                            <Select defaultValue={agent.model}>
                                                <SelectTrigger id={`${agent.name}-model`}>
                                                    <SelectValue placeholder="Select a model" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro</SelectItem>
                                                    <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    {index < agents.length - 1 && <Separator className="my-8" />}
                                </div>
                            )
                        })}
                        <div className="flex justify-end">
                            <Button type="submit">
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                   </form>
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
