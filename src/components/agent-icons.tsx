import { Shield, FileSearch, Crown, Code, Megaphone, Bot } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export const agentIcons = {
  Sentinel: (props: LucideProps) => <Shield {...props} />,
  'First Responder': (props: LucideProps) => <FileSearch {...props} />,
  Commander: (props: LucideProps) => <Crown {...props} />,
  Engineer: (props: LucideProps) => <Code {...props} />,
  Communicator: (props: LucideProps) => <Megaphone {...props} />,
  System: (props: LucideProps) => <Bot {...props} />,
};

export type AgentName = keyof typeof agentIcons;
