"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bot,
  Key,
  FileText,
  FlaskConical,
  Plus,
  Check,
  X,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Edit,
  AlertCircle,
  ChevronRight,
  Settings,
  Zap,
} from "lucide-react";
import {
  useProviders,
  useCreateProvider,
  useDeleteProvider,
  useTestProvider,
  usePrompts,
  useCreateVersion,
  useTestPrompt,
  useExperiments,
  useStartExperiment,
  useStopExperiment,
  type LLMProvider,
  type Prompt,
  type Experiment,
  type ProviderCreateInput,
  type VersionCreateInput,
  type PromptTestResult,
} from "@/hooks/useAdminPrompts";

// Provider Card Component
function ProviderCard({
  provider,
  onTest,
  onDelete,
  testing,
}: {
  provider: LLMProvider;
  onTest: () => void;
  onDelete: () => void;
  testing: boolean;
}) {
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "success": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className={!provider.isActive ? "opacity-60" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Bot className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{provider.displayName}</CardTitle>
              <CardDescription className="text-sm">{provider.name}</CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(provider.testStatus)}>
            {provider.testStatus || "untested"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Key className="h-4 w-4" />
            <span className="font-mono">{provider.apiKeyMasked}</span>
          </div>
          <div className="text-sm">
            <span className="text-slate-500">Model:</span> {provider.defaultModel || "Not set"}
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onTest} disabled={testing}>
              {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Test
            </Button>
            <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Providers Tab
function ProvidersTab() {
  const { providers, loading, error, refetch } = useProviders();
  const { createProvider, loading: creating } = useCreateProvider();
  const { testProvider, loading: testing } = useTestProvider();
  const { deleteProvider } = useDeleteProvider();
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProvider, setNewProvider] = useState<ProviderCreateInput>({
    name: "anthropic", displayName: "", apiKey: "",
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleTest = async (id: string) => {
    setTestingId(id);
    const result = await testProvider(id);
    if (result) setTestResult(result);
    setTestingId(null);
    refetch();
  };

  const handleCreate = async () => {
    const result = await createProvider(newProvider);
    if (result) {
      setShowAddDialog(false);
      setNewProvider({ name: "anthropic", displayName: "", apiKey: "" });
      refetch();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this provider?")) {
      await deleteProvider(id);
      refetch();
    }
  };

  if (loading) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40" />)}</div>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">Configure LLM providers and API keys.</p>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Provider</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add LLM Provider</DialogTitle>
              <DialogDescription>Configure a new LLM provider.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={newProvider.name} onValueChange={(v) => setNewProvider({...newProvider, name: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                    <SelectItem value="gemini">Google (Gemini)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input placeholder="e.g., Anthropic Claude" value={newProvider.displayName} onChange={(e) => setNewProvider({...newProvider, displayName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" placeholder="sk-..." value={newProvider.apiKey} onChange={(e) => setNewProvider({...newProvider, apiKey: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={creating || !newProvider.apiKey}>{creating ? "Creating..." : "Add"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          {testResult.success ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
          <AlertDescription>{testResult.success ? testResult.message || "Success!" : testResult.error}</AlertDescription>
        </Alert>
      )}
      {providers.length === 0 ? (
        <Card className="p-8 text-center">
          <Bot className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No Providers</h3>
          <p className="text-sm text-slate-500">Add an LLM provider to enable AI features.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} onTest={() => handleTest(p.id)} onDelete={() => handleDelete(p.id)} testing={testingId === p.id && testing} />
          ))}
        </div>
      )}
    </div>
  );
}

// Prompt Card
function PromptCard({ prompt, onClick }: { prompt: Prompt; onClick: () => void }) {
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "ANALYSIS": return "bg-blue-100 text-blue-800";
      case "MAPPING": return "bg-purple-100 text-purple-800";
      case "FORECASTING": return "bg-amber-100 text-amber-800";
      default: return "bg-green-100 text-green-800";
    }
  };

  return (
    <Card className="cursor-pointer hover:border-slate-400" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg"><FileText className="h-5 w-5 text-slate-600" /></div>
            <div>
              <CardTitle className="text-lg">{prompt.name}</CardTitle>
              <CardDescription className="font-mono">{prompt.slug}</CardDescription>
            </div>
          </div>
          <Badge className={getCategoryColor(prompt.category)}>{prompt.category}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600 line-clamp-2 mb-3">{prompt.description}</p>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Settings className="h-3 w-3" />{prompt.model}</span>
          <span className="flex items-center gap-1"><Zap className="h-3 w-3" />{prompt.maxTokens} tokens</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <span className="text-xs text-slate-400">{prompt.versions?.length || 0} versions</span>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </CardContent>
    </Card>
  );
}

// Prompt Editor
function PromptEditor({ prompt, onClose, onSave }: { prompt: Prompt; onClose: () => void; onSave: () => void }) {
  const [content, setContent] = useState(prompt.activeVersion?.content || "");
  const [changeNote, setChangeNote] = useState("");
  const [testData, setTestData] = useState("{}");
  const [testResult, setTestResult] = useState<PromptTestResult | null>(null);
  const { createVersion, loading: saving } = useCreateVersion();
  const { testPrompt, loading: testing } = useTestPrompt();

  const handleSave = async () => {
    const input: VersionCreateInput = { content, changeNote: changeNote || undefined };
    const result = await createVersion(prompt.slug, input);
    if (result) onSave();
  };

  const handleTest = async () => {
    try {
      const sampleData = JSON.parse(testData);
      const result = await testPrompt(prompt.slug, { sampleData });
      setTestResult(result);
    } catch { setTestResult({ success: false, error: "Invalid JSON" }); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[90vw] max-w-6xl h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div><h2 className="text-xl font-semibold">{prompt.name}</h2><p className="text-sm text-slate-500">{prompt.slug}</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || content === prompt.activeVersion?.content}>{saving ? "Saving..." : "Save Version"}</Button>
          </div>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col border-r">
            <div className="p-3 border-b bg-slate-50"><Label className="text-xs text-slate-500">PROMPT</Label></div>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 font-mono text-sm p-4 resize-none border-0 rounded-none focus-visible:ring-0" />
            <div className="p-3 border-t"><Input placeholder="Change note" value={changeNote} onChange={(e) => setChangeNote(e.target.value)} /></div>
          </div>
          <div className="w-96 flex flex-col">
            <div className="p-3 border-b bg-slate-50"><Label className="text-xs text-slate-500">TEST</Label></div>
            <div className="p-4 space-y-4 flex-1 overflow-auto">
              <div className="space-y-2">
                <Label>Sample Data (JSON)</Label>
                <Textarea value={testData} onChange={(e) => setTestData(e.target.value)} className="font-mono text-xs h-32" />
              </div>
              <Button onClick={handleTest} disabled={testing} className="w-full">
                {testing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}Test
              </Button>
              {testResult && (
                <div className="space-y-2">
                  <Alert variant={testResult.success ? "default" : "destructive"}><AlertDescription>{testResult.success ? "Passed!" : testResult.error}</AlertDescription></Alert>
                  {testResult.metrics && <div className="text-xs bg-slate-50 p-2 rounded">{testResult.metrics.latencyMs}ms | {testResult.metrics.totalTokens} tokens</div>}
                  {testResult.response && <div className="text-xs bg-slate-50 p-2 rounded max-h-48 overflow-auto font-mono">{testResult.response}</div>}
                </div>
              )}
            </div>
            <div className="border-t p-3">
              <Label className="text-xs text-slate-500 mb-2 block">VERSIONS</Label>
              <div className="space-y-2 max-h-40 overflow-auto">
                {prompt.versions?.map((v) => (
                  <div key={v.id} className={`text-xs p-2 rounded cursor-pointer ${v.id === prompt.activeVersionId ? "bg-blue-50 border border-blue-200" : "bg-slate-50 hover:bg-slate-100"}`} onClick={() => setContent(v.content)}>
                    <div className="font-medium">v{v.version}</div><div className="text-slate-500">{v.changeNote || "No note"}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Prompts Tab
function PromptsTab() {
  const { prompts, loading, error, refetch } = usePrompts(undefined, true);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  if (loading) return <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-48" />)}</div>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Manage AI prompts. Click a prompt to edit.</p>
      {prompts.length === 0 ? (
        <Card className="p-8 text-center"><FileText className="h-12 w-12 mx-auto text-slate-300 mb-4" /><h3 className="text-lg font-medium mb-2">No Prompts</h3><p className="text-sm text-slate-500">Run seed script to initialize prompts.</p></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">{prompts.map((p) => <PromptCard key={p.id} prompt={p} onClick={() => setSelectedPrompt(p)} />)}</div>
      )}
      {selectedPrompt && <PromptEditor prompt={selectedPrompt} onClose={() => setSelectedPrompt(null)} onSave={() => { setSelectedPrompt(null); refetch(); }} />}
    </div>
  );
}

// Experiment Card
function ExperimentCard({ experiment, onStart, onStop }: { experiment: Experiment; onStart: () => void; onStop: () => void }) {
  const getStatusColor = (s: string) => {
    switch (s) { case "RUNNING": return "bg-green-100 text-green-800"; case "COMPLETED": return "bg-blue-100 text-blue-800"; default: return "bg-amber-100 text-amber-800"; }
  };
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div><CardTitle className="text-lg">{experiment.name}</CardTitle><CardDescription>{experiment.promptSlug}</CardDescription></div>
          <Badge className={getStatusColor(experiment.status)}>{experiment.status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-4 text-sm">
            <div><span className="text-slate-500">Control:</span> v{experiment.controlVersion}</div>
            <div><span className="text-slate-500">Treatment:</span> v{experiment.treatmentVersion}</div>
            <div><span className="text-slate-500">Split:</span> {Math.round((1-experiment.trafficSplit)*100)}%/{Math.round(experiment.trafficSplit*100)}%</div>
          </div>
          {experiment.status === "RUNNING" && (
            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded">
              <div><div className="text-xs text-slate-500">Control</div><div className="text-lg font-semibold">{experiment.controlInvocations}</div></div>
              <div><div className="text-xs text-slate-500">Treatment</div><div className="text-lg font-semibold">{experiment.treatmentInvocations}</div></div>
            </div>
          )}
          <div className="flex gap-2">
            {experiment.status === "DRAFT" && <Button size="sm" onClick={onStart}><Play className="h-4 w-4 mr-1" />Start</Button>}
            {experiment.status === "RUNNING" && <Button size="sm" variant="outline" onClick={onStop}><Square className="h-4 w-4 mr-1" />Stop</Button>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Experiments Tab
function ExperimentsTab() {
  const { experiments, loading, error, refetch } = useExperiments();
  const { startExperiment } = useStartExperiment();
  const { stopExperiment } = useStopExperiment();

  if (loading) return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-40" />)}</div>;
  if (error) return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">Run A/B tests on prompts.</p>
        <Button disabled><Plus className="h-4 w-4 mr-2" />New Experiment</Button>
      </div>
      {experiments.length === 0 ? (
        <Card className="p-8 text-center"><FlaskConical className="h-12 w-12 mx-auto text-slate-300 mb-4" /><h3 className="text-lg font-medium mb-2">No Experiments</h3></Card>
      ) : (
        <div className="space-y-4">{experiments.map((e) => <ExperimentCard key={e.id} experiment={e} onStart={async () => { await startExperiment(e.id); refetch(); }} onStop={async () => { await stopExperiment(e.id); refetch(); }} />)}</div>
      )}
    </div>
  );
}

// Main Page
export default function AdminPromptsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">AI Configuration</h1>
          <p className="text-slate-500 mt-1">Manage LLM providers, prompts, and A/B experiments</p>
        </div>
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="providers" className="flex items-center gap-2"><Bot className="h-4 w-4" />Providers</TabsTrigger>
            <TabsTrigger value="prompts" className="flex items-center gap-2"><FileText className="h-4 w-4" />Prompts</TabsTrigger>
            <TabsTrigger value="experiments" className="flex items-center gap-2"><FlaskConical className="h-4 w-4" />Experiments</TabsTrigger>
          </TabsList>
          <TabsContent value="providers"><ProvidersTab /></TabsContent>
          <TabsContent value="prompts"><PromptsTab /></TabsContent>
          <TabsContent value="experiments"><ExperimentsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
