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

const initialLogs = `[2024-07-23 03:14:00] INFO: User login successful for user 'test'.
[2024-07-23 03:14:15] INFO: API call to /api/data processed in 50ms.
[2024-07-23 03:14:30] INFO: API call to /api/data processed in 55ms.
[2024-07-23 03:14:45] INFO: API call to /api/data processed in 52ms.
[2024-07-23 03:15:00] ERROR: OutOfMemoryError: Java heap space.
[2024-07-23 03:15:01] CRITICAL: Pod 'my-app-pod-1' is restarting.
[2024-07-23 03:15:05] ERROR: OutOfMemoryError: Java heap space.
[2024-07-23 03:15:06] CRITICAL: Pod 'my-app-pod-1' is restarting.
[2024-07-23 03:15:10] WARN: Liveness probe failed for pod 'my-app-pod-1'.
[2024-07-23 03:15:12] ERROR: OutOfMemoryError: Java heap space.
[2024-07-23 03:15:13] CRITICAL: Pod 'my-app-pod-1' is restarting.`;

const initialMetrics = `cpu_usage{pod="my-app-pod-1"}: 0.8
memory_usage{pod="my-app-pod-1"}: 95%
network_traffic{pod="my-app-pod-1"}: 1.2MB/s
latency{pod="my-app-pod-1"}: 500ms`;

const incidentReport = "A memory leak was detected in the production environment following the last deployment. Pods are crashing and restarting repeatedly with 'OutOfMemoryError' errors.";

export function Dashboard() {
  const [logs, setLogs] = useState(initialLogs);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [steps, setSteps] = useState<Step[]>([]);
  const [overallStatus, setOverallStatus] = useState<'idle' | 'in-progress' | 'resolved' | 'error'>('idle');
  const endOfStepsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfStepsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  const handleReset = () => {
    setSteps([]);
    setOverallStatus('idle');
    setLogs(initialLogs);
    setMetrics(initialMetrics);
  };

  const handleSimulateIncident = () => {
    startTransition(async () => {
      setOverallStatus('in-progress');
      let currentSteps: Step[] = [];

      try {
        // Step 1: Sentinel
        currentSteps = [{ agent: 'Sentinel', title: 'Analyzing logs and metrics for anomalies...', content: '', status: 'in-progress' }];
        setSteps([...currentSteps]);
        
        const anomalyResult = await runDetectAnomaly({ logs, metrics });
        
        if (!anomalyResult.isAnomaly) {
          currentSteps[0] = { ...currentSteps[0], status: 'completed', title: 'No anomalies detected. Systems are stable.', content: <p className="text-sm text-muted-foreground">Sentinel continues to monitor the system.</p> };
          setSteps([...currentSteps]);
          setOverallStatus('resolved');
          toast({ title: "System Check Complete", description: "No anomalies were found." });
          return;
        }

        currentSteps[0] = { ...currentSteps[0], status: 'completed', title: 'Anomaly Detected!', content: <pre className="font-code text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">{incidentReport}</pre> };
        setSteps([...currentSteps]);

        // Step 2: First Responder
        currentSteps = [...currentSteps, { agent: 'First Responder', title: 'Diagnosing the root cause...', content: '', status: 'in-progress' }];
        setSteps([...currentSteps]);

        const diagnosisResult = await runFirstResponderIncidentDiagnosis({ incidentReport });
        if (!diagnosisResult || !diagnosisResult.diagnosisReport) throw new Error('First Responder failed to provide a diagnosis.');
        
        currentSteps[1] = { ...currentSteps[1], status: 'completed', title: 'Root Cause Analysis Complete', content: <pre className="font-code text-sm p-2 bg-muted rounded-md whitespace-pre-wrap">{diagnosisResult.diagnosisReport}</pre>};
        setSteps([...currentSteps]);
        
        // Step 3: Commander
        currentSteps = [...currentSteps, { agent: 'Commander', title: 'Formulating a remediation plan...', content: '', status: 'in-progress' }];
        setSteps([...currentSteps]);
        
        const planResult = await runCommanderRemediationPlanning({ diagnosticReport: diagnosisResult.diagnosisReport });
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
          incidentDetection: incidentReport,
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
