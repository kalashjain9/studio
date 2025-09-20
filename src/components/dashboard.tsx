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
import { Loader2, Sparkles, AlertTriangle, PartyPopper, RotateCcw, Code, ListChecks, ShieldAlert, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CommanderRemediationPlanningOutput } from '@/ai/flows/commander-remediation-planning';

type Step = {
  agent: AgentName;
  title: string;
  content: React.ReactNode;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
};

const scenarios = [
  {
    type: 'Infinite Loop',
    incidentReport: "The application is unresponsive, and CPU usage is at 100%. This is likely due to an infinite loop in a client-side component.",
    sampleCode: `import { useEffect, useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // BUG: This effect runs on every render, causing an infinite loop.
    setCount(count + 1);
  });

  return <div>Count: {count}</div>;
}`,
    solution: `import { useEffect, useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // FIX: Added an empty dependency array to run the effect only once.
    setCount(count + 1);
  }, []);

  return <div>Count: {count}</div>;
}`,
    generateLogs: () => `[${new Date().toISOString()}] [ERROR] Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.`,
    generateMetrics: () => `cpu_usage{component="MyComponent"}: ${Math.floor(Math.random() * 10) + 90}%\nmemory_usage{component="MyComponent"}: ${Math.floor(Math.random() * 20) + 40}%\ncomponent_render_rate{component="MyComponent"}: ${Math.floor(Math.random() * 500) + 800}/s`,
  },
  {
    type: 'Incorrect State Update',
    incidentReport: "A feature that's supposed to add items to a list is overwriting the list instead. Users report that they can only ever have one item in their cart.",
    sampleCode: `import { useState } from 'react';

function ShoppingCart() {
  const [items, setItems] = useState([]);

  const addItem = (item) => {
    // BUG: This is overwriting the array instead of appending to it.
    setItems([item]);
  };

  return (
    <div>
      <Button onClick={() => addItem('Apple')}>Add Apple</Button>
      <ul>
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
}`,
    solution: `import { useState } from 'react';

function ShoppingCart() {
  const [items, setItems] = useState([]);

  const addItem = (item) => {
    // FIX: Use a function update to correctly append the new item.
    setItems(prevItems => [...prevItems, item]);
  };

  return (
    <div>
      <Button onClick={() => addItem('Apple')}>Add Apple</Button>
      <ul>
        {items.map((item, index) => <li key={index}>{item}</li>)}
      </ul>
    </div>
  );
}`,
    generateLogs: () => `[${new Date().toISOString()}] [INFO] User action: addItem. Payload: 'Apple'. State changed.
[${new Date(new Date().getTime() + 1000).toISOString()}] [INFO] User action: addItem. Payload: 'Banana'. State changed.
[${new Date(new Date().getTime() + 1100).toISOString()}] [WARN] Previous state was overwritten. Cart had 1 item(s), now has 1 item(s). Potential state management issue detected.`,
    generateMetrics: () => `state_size{component="ShoppingCart"}: 1\nactions_dispatched{action="addItem"}: ${Math.floor(Math.random() * 5) + 2}\nstate_resets{component="ShoppingCart"}: ${Math.floor(Math.random() * 5) + 1}`,
  },
    {
    type: 'API Data Fetching Error',
    incidentReport: "The user profile page is failing to load data. The API call is not being handled correctly, causing a crash when the component tries to render null data.",
    sampleCode: `import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]);

  // BUG: The component will crash if 'user' is null on the first render.
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`,
    solution: `import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch');
        }
        return res.json();
      })
      .then(data => setUser(data))
      .catch(err => setError(err.message));
  }, [userId]);

  if (error) return <div>Error: {error}</div>;
  // FIX: Add a loading state to prevent accessing null properties.
  if (!user) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`,
    generateLogs: () => `[${new Date().toISOString()}] [ERROR] TypeError: Cannot read properties of null (reading 'name') at UserProfile.
[${new Date(new Date().getTime() - 100).toISOString()}] [INFO] Component 'UserProfile' rendering with props: {userId: '123'}.
[${new Date(new Date().getTime() + 50).toISOString()}] [ERROR] Unhandled Promise Rejection: API call to '/api/users/123' failed.`,
    generateMetrics: () => `api_error_rate{endpoint="/api/users/:id"}: 100%\ncomponent_crash_rate{component="UserProfile"}: 100%\nresponse_time{endpoint="/api/users/:id"}: ${Math.floor(Math.random() * 100) + 50}ms`,
  },
];


const getRandomScenario = () => {
    const randomIndex = Math.floor(Math.random() * scenarios.length);
    return scenarios[randomIndex];
};

const RemediationPlan = ({ plan }: { plan: CommanderRemediationPlanningOutput['remediationPlan'] }) => {
    return (
        <div className="space-y-4 text-sm">
            <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-destructive" />
                        Incident & Root Cause
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p><strong>Incident:</strong> {plan.incident}</p>
                    <p><strong>Root Cause:</strong> {plan.rootCause}</p>
                </CardContent>
            </Card>
             <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                       <ListChecks className="h-5 w-5 text-primary" />
                        Remediation Plan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-2"><strong>Solution:</strong> {plan.solution}</p>
                    <ol className="list-decimal list-inside space-y-1">
                        {plan.plan.map((step, index) => <li key={index}>{step}</li>)}
                    </ol>
                </CardContent>
            </Card>
             <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Undo2 className="h-5 w-5 text-muted-foreground" />
                        Rollback Plan
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{plan.rollbackPlan}</p>
                </CardContent>
            </Card>
        </div>
    );
};


export function Dashboard() {
  const [currentScenario, setCurrentScenario] = useState(() => getRandomScenario());
  const [logs, setLogs] = useState(() => currentScenario.generateLogs());
  const [metrics, setMetrics] = useState(() => currentScenario.generateMetrics());
  const [sampleCode, setSampleCode] = useState(() => currentScenario.sampleCode);
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
    setSampleCode(newScenario.sampleCode);
    setSteps([]);
    setOverallStatus('idle');
  };

  const handleSimulateIncident = () => {
    startTransition(async () => {
      handleReset(); // Get new data for the new simulation
      
      // We need to wait for the state to update before starting the simulation
      setTimeout(async () => {
        setOverallStatus('in-progress');
        let currentSteps: Step[] = [];
        const incidentReport = currentScenario.incidentReport;

        try {
          // Step 1: Sentinel
          currentSteps = [{ agent: 'Sentinel', title: 'Analyzing logs and metrics for anomalies...', content: '', status: 'in-progress' }];
          setSteps([...currentSteps]);
          
          const anomalyResult = await runDetectAnomaly({ logs: currentScenario.generateLogs(), metrics: currentScenario.generateMetrics() });
          
          if (!anomalyResult.isAnomaly) {
            currentSteps[0] = { ...currentSteps[0], status: 'completed', title: 'No anomalies detected. Systems are stable.', content: <p className="text-sm text-muted-foreground">Sentinel continues to monitor the system.</p> };
            setSteps([...currentSteps]);
            setOverallStatus('resolved');
            toast({ title: "System Check Complete", description: "No anomalies were found." });
            return;
          }

          currentSteps[0] = { ...currentSteps[0], status: 'completed', title: 'Anomaly Detected!', content: <pre className="font-code text-sm p-3 bg-muted/50 border rounded-md whitespace-pre-wrap">{incidentReport}</pre> };
          setSteps([...currentSteps]);

          // Step 2: First Responder
          currentSteps = [...currentSteps, { agent: 'First Responder', title: 'Diagnosing the root cause...', content: '', status: 'in-progress' }];
          setSteps([...currentSteps]);

          const diagnosisResult = await runFirstResponderIncidentDiagnosis({ incidentReport: incidentReport, sampleCode: currentScenario.sampleCode });
          if (!diagnosisResult || !diagnosisResult.diagnosisReport) throw new Error('First Responder failed to provide a diagnosis.');
          
          currentSteps[1] = { ...currentSteps[1], status: 'completed', title: 'Root Cause Analysis Complete', content: <pre className="font-code text-sm p-3 bg-muted/50 border rounded-md whitespace-pre-wrap">{diagnosisResult.diagnosisReport}</pre>};
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

          currentSteps[2] = { ...currentSteps[2], status: 'completed', title: 'Remediation Plan Created', content: <RemediationPlan plan={planResult.remediationPlan} /> };
          setSteps([...currentSteps]);
          
          // Step 4: Engineer
          currentSteps = [...currentSteps, { agent: 'Engineer', title: 'Generating the code fix...', content: '', status: 'in-progress' }];
          setSteps([...currentSteps]);
          
          const executionResult = await runEngineerCommandExecution({ 
            remediationPlan: `Incident: ${planResult.remediationPlan.incident}\nRoot Cause: ${planResult.remediationPlan.rootCause}\nSolution: ${planResult.remediationPlan.solution}`,
            codeToFix: sampleCode,
          });
          if (!executionResult || !executionResult.executionResult) throw new Error('Engineer failed to generate the fix.');

          const fixedCode = executionResult.executionResult;
          currentSteps[3] = { ...currentSteps[3], status: 'completed', title: 'Code Fix Generated', content: <pre className="font-code text-sm p-3 bg-muted/50 border rounded-md whitespace-pre-wrap">{fixedCode}</pre> };
          setSteps([...currentSteps]);
          setSampleCode(fixedCode); // Real-time update of the code

          // Step 5: Communicator
          currentSteps = [...currentSteps, { agent: 'Communicator', title: 'Generating incident summary report...', content: '', status: 'in-progress' }];
          setSteps([...currentSteps]);
          
          const reportResult = await runCommunicatorIncidentReporting({
            incidentDetection: incidentReport,
            diagnosisReport: diagnosisResult.diagnosisReport,
            remediationSteps: `The following code fix was generated:\n${fixedCode}`
          });
          if (!reportResult || !reportResult.summaryReport) throw new Error('Communicator failed to generate a report.');
          
          currentSteps[4] = { ...currentSteps[4], status: 'completed', title: 'Incident Report', content: <p className="text-sm text-muted-foreground whitespace-pre-wrap p-3 bg-muted/50 border rounded-md">{reportResult.summaryReport}</p> };
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
      }, 50); // Small delay to allow state to update
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
            Input your own code, logs, and metrics, or use the "Reset" button to generate a new random scenario. Then click &quot;Simulate Incident&quot; to start.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-8">
             <div className="space-y-2">
              <Label htmlFor="sample-code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Sample Code
              </Label>
               <Textarea
                id="sample-code"
                value={sampleCode}
                onChange={(e) => setSampleCode(e.target.value)}
                rows={14}
                className="font-code text-xs bg-muted/50"
              />
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="logs">Logs</Label>
                <Textarea 
                  id="logs" 
                  value={logs} 
                  onChange={(e) => setLogs(e.target.value)}
                  rows={6} 
                  className="font-code text-xs bg-muted/50" 
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="metrics">Metrics</Label>
                <Textarea 
                  id="metrics" 
                  value={metrics} 
                  onChange={(e) => setMetrics(e.target.value)}
                  rows={6} 
                  className="font-code text-xs bg-muted/50" 
                />
                </div>
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
            <div className="relative space-y-2">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border -translate-x-1/2" aria-hidden="true" />
              {steps.map((step, index) => {
                const AgentIcon = agentIcons[step.agent];
                return (
                  <div key={index} className="relative flex items-start gap-4">
                    <div className={cn("flex-shrink-0 z-10 w-12 h-12 rounded-full bg-background border-2 flex items-center justify-center", 
                        step.status === 'in-progress' && 'border-primary animate-pulse',
                        step.status === 'completed' && 'border-success',
                        step.status === 'error' && 'border-destructive'
                    )}>
                      {step.status === 'in-progress' ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <AgentIcon className="h-6 w-6 text-foreground" />}
                    </div>
                    <div className="flex-grow pt-1.5 w-full">
                       <p className="font-semibold text-sm text-muted-foreground">{step.agent}</p>
                       <Card className="mt-1">
                            <CardHeader className="p-4">
                               <CardTitle className="text-base">{step.title}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                {step.content}
                            </CardContent>
                        </Card>
                    </div>
                  </div>
                );
              })}
              <div ref={endOfStepsRef} />
            </div>

            {overallStatus === 'resolved' && steps.every(s => s.status === 'completed') &&
                <div className="mt-8 text-center p-6 bg-success/10 rounded-lg">
                    <PartyPopper className="mx-auto h-12 w-12 text-success"/>
                    <h3 className="mt-2 text-lg font-medium text-success-foreground">Incident Successfully Resolved</h3>
                    <p className="text-muted-foreground">All systems are back to normal.</p>
                </div>
            }
             {overallStatus === 'error' &&
                <div className="mt-8 text-center p-6 bg-destructive/10 rounded-lg">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive"/>
                    <h3 className="mt-2 text-lg font-medium text-destructive">Process Stopped Due to an Error</h3>
                    <p className="text-muted-foreground">Please review the logs and try again.</p>
                </div>
            }
          </CardContent>
        </Card>
      )}
    </div>
  );
}
