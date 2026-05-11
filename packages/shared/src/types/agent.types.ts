export interface AgentHealth {
  id: string
  service: 'signal_engine' | 'claude_api' | 'broker_api' | 'scheduler'
  status: 'healthy' | 'degraded' | 'down'
  lastRun: string
  latencyMs: number
  errorCount: number
  message?: string
  createdAt: string
  updatedAt: string
}
