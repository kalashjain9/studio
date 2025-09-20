'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  runDetectAnomaly,
  runFirstResponderIncidentDiagnosis,
  runCommanderRemediationPlanning,
  runEngineerCommandExecution,
  runCommunicatorIncidentReporting,
} from '@/app/actions';
import { agentIcons, AgentName } from './agent-icons';
import { Badge } from './ui/badge';
import { Loader2, Sparkles, AlertTriangle, PartyPopper, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = {
  agent: AgentName;
  title: string;
  content: React.ReactNode;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
};

const scenarios = [
  {
    type: 'Memory Leak',
    incidentReport: "A memory leak was detected in the production environment. Pods are crashing and restarting repeatedly with 'OutOfMemoryError' errors.",
    generateLogs: () => {
      const now = new Date();
      const randomMs = () => Math.floor(Math.random() * 50) + 50;
      const podName = `my-app-pod-${Math.floor(Math.random() * 3) + 1}`;
      return `[${now.toISOString()}] INFO: User login successful for user 'test'.
[${new Date(now.getTime() + 15000).toISOString()}] INFO: API call to /api/data processed in ${randomMs()}ms.
[${new Date(now.getTime() + 30000).toISOString()}] INFO: API call to /api/data processed in ${randomMs()}ms.
[${new Date(now.getTime() + 45000).toISOString()}] INFO: API call to /api/data processed in ${randomMs()}ms.
[${new Date(now.getTime() + 60000).toISOString()}] ERROR: OutOfMemoryError: Java heap space.
[${new Date(now.getTime() + 61000).toISOString()}] CRITICAL: Pod '${podName}' is restarting.
[${new Date(now.getTime() + 65000).toISOString()}] ERROR: OutOfMemoryError: Java heap space.
[${new Date(now.getTime() + 66000).toISOString()}] CRITICAL: Pod '${podName}' is restarting.
[${new Date(now.getTime() + 70000).toISOString()}] WARN: Liveness probe failed for pod '${podName}'.
[${new Date(now.getTime() + 72000).toISOString()}] ERROR: OutOfMemoryError: Java heap space.
[${new Date(now.getTime() + 73000).toISOString()}] CRITICAL: Pod '${podName}' is restarting.`;
    },
    generateMetrics: () => {
        const podName = `my-app-pod-${Math.floor(Math.random() * 3) + 1}`;
        const cpu = (Math.random() * (0.4 - 0.2) + 0.2).toFixed(1);
        const mem = Math.floor(Math.random() * 10) + 90;
        const traffic = (Math.random() * (2.5 - 1.0) + 1.0).toFixed(1);
        const lat = Math.floor(Math.random() * 100) + 150;
        return `cpu_usage{pod="${podName}"}: ${cpu}
memory_usage{pod="${podName}"}: ${mem}%
network_traffic{pod="${podName}"}: ${traffic}MB/s
latency{pod="${podName}"}: ${lat}ms`;
    },
  },
  {
    type: 'CPU Spike',
    incidentReport: "A sudden CPU spike is causing service degradation. The 'recommendation' service is experiencing high latency and timeouts.",
    generateLogs: () => {
        const now = new Date();
        const podName = `recommendation-service-pod-${Math.floor(Math.random() * 2) + 1}`;
        return `[${now.toISOString()}] INFO: Request to /recommendations received.
[${new Date(now.getTime() + 5000).toISOString()}] WARN: High CPU usage detected on ${podName}.
[${new Date(now.getTime() + 7000).toISOString()}] INFO: Request to /recommendations processed in 1200ms.
[${new Date(now.getTime() + 15000).toISOString()}] WARN: CPU throttling applied to ${podName}.
[${new Date(now.getTime() + 20000).toISOString()}] ERROR: Request to /recommendations timed out after 3000ms.
[${new Date(now.getTime() + 22000).toISOString()}] WARN: High CPU usage detected on ${podName}.
[${new Date(now.getTime() + 28000).toISOString()}] ERROR: Upstream service /users failed to respond.
[${new Date(now.getTime() + 35000).toISOString()}] INFO: Scaling up replicas for recommendation-service deployment.`;
    },
    generateMetrics: () => {
        const podName = `recommendation-service-pod-${Math.floor(Math.random() * 2) + 1}`;
        const cpu = (Math.random() * (0.95 - 0.85) + 0.85).toFixed(2);
        const mem = Math.floor(Math.random() * 15) + 50;
        const traffic = (Math.random() * (1.5 - 0.5) + 0.5).toFixed(1);
        const lat = Math.floor(Math.random() * 500) + 1500;
        return `cpu_usage{pod="${podName}"}: ${cpu}
memory_usage{pod="${podName}"}: ${mem}%
network_traffic{pod="${podName}"}: ${traffic}MB/s
latency{pod="${podName}"}: ${lat}ms`;
    },
  },
    {
    type: 'Latency Issue',
    incidentReport: "High database latency is causing slow API responses and a poor user experience. The 'orders' service is heavily impacted.",
    generateLogs: () => {
        const now = new Date();
        const podName = `orders-service-pod-${Math.floor(Math.random() * 4) + 1}`;
        return `[${now.toISOString()}] INFO: Processing new order #12345.
[${new Date(now.getTime() + 2000).toISOString()}] WARN: DB query took 800ms to execute.
[${new Date(now.getTime() + 5000).toISOString()}] INFO: API call to /api/orders processed in 1500ms.
[${new Date(now.getTime() + 12000).toISOString()}] WARN: Connection pool to database is reaching its limit.
[${new Date(now.getTime() + 18000).toISOString()}] ERROR: Failed to acquire database connection for pod ${podName}.
[${new Date(now.getTime() + 25000).toISOString()}] INFO: API call to /api/orders processed in 2500ms.
[${new Date(now.getTime() + 30000).toISOString()}] WARN: DB query took 1200ms to execute.
[${new Date(now.getTime() + 45000).toISOString()}] ERROR: Transaction rollback for order #12348 due to timeout.`;
    },
    generateMetrics: () => {
        const podName = `orders-service-pod-${Math.floor(Math.random() * 4) + 1}`;
        const cpu = (Math.random() * (0.5 - 0.3) + 0.3).toFixed(1);
        const mem = Math.floor(Math.random() * 10) + 60;
        const traffic = (Math.random() * (0.8 - 0.4) + 0.4).toFixed(1);
        const lat = Math.floor(Math.random() * 1000) + 2000;
        return `cpu_usage{pod="${podName}"}: ${cpu}
memory_usage{pod="${podName}"}: ${mem}%
network_traffic{pod="${podName}"}: ${traffic}MB/s
latency{pod="${podName}"}: ${lat}ms
db_query_latency{service="orders-db"}: 950ms`;
    },
  },
];


const getRandomScenario = () => {
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    return scenarios[randomIndex];
};

export function Dashboard() {
  const [currentScenario, setCurrentScenario] = useState(getRandomScenario());
  const [logs, setLogs] = useState(() => currentScenario.generateLogs());
  const [metrics, setMetrics] = useState(() => currentScenario.generateMetrics());
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [steps, setSteps] = useState<Step[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'in-progress' | 'resolved' | 'error'>('idle');
  const endOfStepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfStepsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  const handleReset = () => {
    const newScenario = getRandomScenario();
    setCurrentScenario(newScenario);
    setLogs(newScenario.generateLogs());
    setMetrics(newScenario.generateMetrics());
    setSteps([]);
    setOverallStatus('idle');
  };

  const handleSimulateIncident = () => {
    // Regenerate data on simulation start
    const newScenario = getRandomScenario();
    setCurrentScenario(newScenario);
    const newLogs = newScenario.generateLogs();
    const newMetrics = newScenario.generateMetrics();
    setLogs(newLogs);
    setMetrics(newMetrics);
    
    startTransition(async () => {
      setOverallStatus('in-progress');
      let currentSteps: Step[] = [];

      try {
        // Step 1: Sentinel
        currentSteps = [{ agent: 'Sentinel', title: 'Analyzing logs and metrics for anomalies...', content: '', status: 'in-progress' }];
        setSteps([...currentSteps]);
        
        const anomalyResult = await runDetectAnomaly({ logs: newLogs, metrics: newMetrics });
        
        if (!anomalyResult.isAnomaly) {
          currentSteps[0] = { ...currentSteps[0], status: 'completed', title: 'No anomalies detected. Systems are stable.', content: <p className="text-sm text-muted-foreground">Sentinel continues to monitor the system.</p> };
          setSteps([...currentSteps]);
          setOverallStatus('resolved');
          toast({ title: "System Check Complete", description: "No anomalies were found." });
          return;
        }

        currentSteps[0] = { ...currentSteps[0], status: 'completed', title: 'Anomaly Detected!', content: <pre className="font-code text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">{newScenario.incidentReport}</pre> };
        setSteps([...currentSteps]);

        // Step 2: First Responder
        currentSteps = [...currentSteps, { agent: 'First Responder', title: 'Diagnosing the root cause...', content: '', status: 'in-progress' }];
        setSteps([...currentSteps]);

        const diagnosisResult = await runFirstResponderIncidentDiagnosis({ incidentReport: newScenario.incidentReport });
        if (!diagnosisResult || !diagnosisResult.diagnosisReport) throw new Error('First Responder failed to provide a diagnosis.');
        
        currentSteps[1] = { ...currentSteps[1], status: 'completed', title: 'Root Cause Analysis Complete', content: <pre className="font-code text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">{diagnosisResult.diagnosisReport}</pre>};
        setSteps([...currentSteps]);
        
        // Step 3: Commander
        currentSteps = [...currentSteps, { agent: 'Commander', title: 'Formulating a remediation plan...', content: '', status: 'in-progress' }];
        setSteps([...currentSteps]);
        
        const planResult = await runCommanderRemediationPlanning({ 
          diagnosticReport: diagnosisResult.diagnosisReport,
          deploymentName: diagnosisResult.deploymentName,
          namespace: diagnosisResult.namespace,
        });
        if (!planResult || !planResult.remediationPlan) throw new Error('Commander failed to create a remediation plan.');

        currentSteps[2] = { ...currentSteps[2], status: 'completed', title: 'Remediation Plan Created', content: <pre className="font-code text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">{planResult.remediationPlan}</pre> };
        setSteps([...currentSteps]);
        
        // Step 4: Engineer
        currentSteps = [...currentSteps, { agent: 'Engineer', title: 'Executing the remediation plan...', content: '', status: 'in-progress' }];
        setSteps([...currentSteps]);
        
        const executionResult = await runEngineerCommandExecution({ remediationPlan: planResult.remediationPlan });
        if (!executionResult || !executionResult.executionResult) throw new Error('Engineer failed to execute the command.');

        currentSteps[3] = { ...currentSteps[3], status: 'completed', title: 'Execution Complete', content: <pre className="font-code text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">{executionResult.executionResult}</pre> };
        setSteps([...currentSteps]);

        // Step 5: Communicator
        currentSteps = [...currentSteps, { agent: 'Communicator', title: 'Generating incident summary report...', content: '', status: 'in-progress' }];
        setSteps([...currentSteps]);
        
        const reportResult = await runCommunicatorIncidentReporting({
          incidentDetection: newScenario.incidentReport,
          diagnosisReport: diagnosisResult.diagnosisReport,
          remediationSteps: executionResult.executionResult
        });
        if (!reportResult || !reportResult.summaryReport) throw new Error('Communicator failed to generate a report.');
        
        currentSteps[4] = { ...currentSteps[4], status: 'completed', title: 'Incident Report', content: <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reportResult.summaryReport}</p> };
        setSteps([...currentSteps]);
        
        setOverallStatus('resolved');
        toast({ title: "Incident Resolved", description: "The autonomous SRE team has resolved the incident." });

      } catch (error: any) {
        const errorMessage = error.message || "An unknown error occurred.";
        const lastStepIndex = currentSteps.length - 1;
        if (lastStepIndex >= 0) {
            currentSteps[lastStepIndex] = {...currentSteps[lastStepIndex], status: 'error', title: 'An error occurred', content: <p className="text-destructive">{errorMessage}</p>};
            setSteps([...currentSteps]);
        }
        setOverallStatus('error');
        toast({
          variant: "destructive",
          title: "An Error Occurred",
          description: errorMessage,
        });
      }
    });
  };
  
  const getStatusBadge = () => {
    switch (overallStatus) {
      case 'idle':
        return <Badge variant="secondary">Idle</Badge>;
      case 'in-progress':
        return <Badge className="bg-primary hover:bg-primary/90"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-success text-success-foreground hover:bg-success/90">Resolved</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
    }
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Sentinel Monitoring</CardTitle>
          <CardDescription>
            The Sentinel continuously analyzes logs and metrics. You can edit the data below to simulate different scenarios.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logs">Logs</Label>
              <Textarea id="logs" value={logs} onChange={(e) => setLogs(e.target.value)} rows={12} className="font-code text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="metrics">Metrics</Label>
              <Textarea id="metrics" value={metrics} onChange={(e) => setMetrics(e.target.value)} rows={12} className="font-code text-xs" />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
             <Button onClick={handleSimulateIncident} disabled={isPending || overallStatus === 'in-progress'}>
              {isPending || overallStatus === 'in-progress' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Simulate Incident
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isPending}>
              <RotateCcw className="mr-2 h-4 w-4"/>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Autonomous SRE Activity</CardTitle>
                    <CardDescription>Real-time incident response by the AI agent team.</CardDescription>
                </div>
                {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-8">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" aria-hidden="true" />
              {steps.map((step, index) => {
                const AgentIcon = agentIcons[step.agent];
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className={cn("flex-shrink-0 z-10 w-12 h-12 rounded-full bg-card border-2 flex items-center justify-center", 
                        step.status === 'in-progress' && 'border-primary',
                        step.status === 'completed' && 'border-success',
                        step.status === 'error' && 'border-destructive'
                    )}>
                      {step.status === 'in-progress' ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <AgentIcon className="h-6 w-6 text-foreground" />}
                    </div>
                    <div className="flex-grow pt-1.5">
                      <p className="font-semibold">{step.agent}</p>
                      <h3 className="font-medium text-foreground">{step.title}</h3>
                      <div className="mt-2 text-sm">{step.content}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={endOfStepsRef} />
            </div>

            {overallStatus === 'resolved' && steps.some(s => s.status === 'completed') && !steps.some(s => s.status !== 'completed') &&
                <div className="mt-8 text-center">
                    <PartyPopper className="mx-auto h-12 w-12 text-success"/>
                    <h3 className="mt-2 text-lg font-medium">Incident Successfully Resolved</h3>
                    <p className="text-muted-foreground">All systems are back to normal.</p>
                </div>
            }
             {overallStatus === 'error' &&
                <div className="mt-8 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>
                    <h3 className="mt-2 text-lg font-medium">Process Stopped Due to an Error</h3>
                    <p className="text-muted-foreground">Please review the logs and try again.</p>
                </div>
            }
          </CardContent>
        </Card>
      )}
    </div>
  );
}
