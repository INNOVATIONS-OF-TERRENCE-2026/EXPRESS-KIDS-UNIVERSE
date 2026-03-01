/**
 * agentWorkflowEngine.ts — Multi-step AI agent workflow coordinator.
 *
 * Defines composable agent workflows for complex, multi-step creative
 * operations:
 *   - Full episode production (story → voice → images → video)
 *   - Batch regeneration (re-do all images for a story)
 *   - Series production (generate multiple episodes)
 *
 * Each workflow is decomposed into steps. The engine runs steps
 * sequentially, tracks state, and supports cancellation at step boundaries.
 */

export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface WorkflowStep {
  id: string;
  label: string;
  status: StepStatus;
  /** Progress within this step (0-100) */
  progress: number;
  /** Error message if failed */
  error?: string;
}

export type WorkflowStatus = "idle" | "running" | "completed" | "failed" | "cancelled";

export interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  /** Overall progress (0-100) */
  progress: number;
  createdAt: number;
  completedAt?: number;
}

type WorkflowListener = (workflow: Workflow) => void;

const workflows = new Map<string, Workflow>();
const listeners = new Map<string, Set<WorkflowListener>>();
const cancellations = new Set<string>();

function generateId(): string {
  return `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function notify(workflowId: string) {
  const wf = workflows.get(workflowId);
  if (!wf) return;
  listeners.get(workflowId)?.forEach((fn) => fn({ ...wf, steps: wf.steps.map((s) => ({ ...s })) }));
}

/** Subscribe to workflow updates */
export function subscribeWorkflow(workflowId: string, fn: WorkflowListener): () => void {
  if (!listeners.has(workflowId)) listeners.set(workflowId, new Set());
  listeners.get(workflowId)!.add(fn);
  return () => listeners.get(workflowId)?.delete(fn);
}

/** Cancel a running workflow */
export function cancelWorkflow(workflowId: string) {
  cancellations.add(workflowId);
}

/** Get a workflow by ID */
export function getWorkflow(id: string): Workflow | undefined {
  const wf = workflows.get(id);
  return wf ? { ...wf, steps: wf.steps.map((s) => ({ ...s })) } : undefined;
}

/** Get all workflows */
export function getAllWorkflows(): Workflow[] {
  return Array.from(workflows.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((wf) => ({ ...wf, steps: wf.steps.map((s) => ({ ...s })) }));
}

/**
 * A step executor function. Receives a progress callback for partial progress.
 * Return value is ignored — throw to signal failure.
 */
type StepExecutor = (onProgress: (pct: number) => void) => Promise<void>;

interface StepDef {
  id: string;
  label: string;
  execute: StepExecutor;
}

/**
 * Create and run a workflow from step definitions.
 *
 * Steps run sequentially. If a step fails and `continueOnError` is false
 * (default), the workflow is marked as failed.
 */
export async function runWorkflow(
  name: string,
  stepDefs: StepDef[],
  options?: { continueOnError?: boolean },
): Promise<Workflow> {
  const id = generateId();
  const steps: WorkflowStep[] = stepDefs.map((d) => ({
    id: d.id,
    label: d.label,
    status: "pending",
    progress: 0,
  }));

  const workflow: Workflow = {
    id,
    name,
    status: "running",
    steps,
    progress: 0,
    createdAt: Date.now(),
  };
  workflows.set(id, workflow);
  notify(id);

  const completedWeight = 100 / stepDefs.length;

  for (let i = 0; i < stepDefs.length; i++) {
    // Check for cancellation
    if (cancellations.has(id)) {
      workflow.status = "cancelled";
      for (let j = i; j < steps.length; j++) steps[j].status = "skipped";
      workflow.completedAt = Date.now();
      notify(id);
      cancellations.delete(id);
      return { ...workflow, steps: steps.map((s) => ({ ...s })) };
    }

    const step = steps[i];
    const def = stepDefs[i];
    step.status = "running";
    notify(id);

    try {
      await def.execute((pct) => {
        step.progress = Math.min(100, Math.max(0, pct));
        workflow.progress = Math.round(i * completedWeight + (pct / 100) * completedWeight);
        notify(id);
      });
      step.status = "completed";
      step.progress = 100;
    } catch (err: any) {
      step.status = "failed";
      step.error = err.message || "Step failed";
      if (!options?.continueOnError) {
        workflow.status = "failed";
        for (let j = i + 1; j < steps.length; j++) steps[j].status = "skipped";
        workflow.completedAt = Date.now();
        notify(id);
        return { ...workflow, steps: steps.map((s) => ({ ...s })) };
      }
    }
    workflow.progress = Math.round((i + 1) * completedWeight);
    notify(id);
  }

  workflow.status = "completed";
  workflow.progress = 100;
  workflow.completedAt = Date.now();
  notify(id);

  return { ...workflow, steps: steps.map((s) => ({ ...s })) };
}

/* ── Pre-built workflow templates ── */

/** Delay helper */
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Full Episode Production workflow.
 *
 * Simulates the complete pipeline: parse → voices → images → mix → render → encode.
 * In production, each step would call real services.
 */
export function createEpisodeProductionWorkflow(storyId: string): StepDef[] {
  return [
    {
      id: "parse",
      label: "Parse story structure",
      execute: async (onProgress) => {
        await delay(500);
        onProgress(50);
        await delay(500);
        onProgress(100);
      },
    },
    {
      id: "voices",
      label: "Generate character voices",
      execute: async (onProgress) => {
        for (let i = 0; i <= 100; i += 10) {
          await delay(300);
          onProgress(i);
        }
      },
    },
    {
      id: "images",
      label: "Generate scene images",
      execute: async (onProgress) => {
        for (let i = 0; i <= 100; i += 15) {
          await delay(500);
          onProgress(i);
        }
      },
    },
    {
      id: "mix",
      label: "Mix audio tracks",
      execute: async (onProgress) => {
        await delay(800);
        onProgress(50);
        await delay(800);
        onProgress(100);
      },
    },
    {
      id: "render",
      label: "Render video frames",
      execute: async (onProgress) => {
        for (let i = 0; i <= 100; i += 5) {
          await delay(200);
          onProgress(i);
        }
      },
    },
    {
      id: "encode",
      label: "Encode final video",
      execute: async (onProgress) => {
        for (let i = 0; i <= 100; i += 20) {
          await delay(400);
          onProgress(i);
        }
      },
    },
  ];
}

/**
 * Batch Image Regeneration workflow.
 */
export function createBatchRegenWorkflow(sceneCount: number): StepDef[] {
  const steps: StepDef[] = [];
  for (let i = 0; i < sceneCount; i++) {
    steps.push({
      id: `regen_${i}`,
      label: `Regenerate scene ${i + 1}`,
      execute: async (onProgress) => {
        await delay(1000);
        onProgress(50);
        await delay(1000);
        onProgress(100);
      },
    });
  }
  return steps;
}
