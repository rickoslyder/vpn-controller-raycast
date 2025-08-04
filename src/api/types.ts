export interface VPNNode {
  id: string;
  country: string;
  status: "running" | "stopped" | "error" | "starting" | "stopping";
  vpn_server?: string;
  tailscale_hostname?: string;
  tailscale_ip?: string;
  started_at?: string;
  health_status?: "healthy" | "unhealthy" | "unknown";
  metrics?: NodeMetrics;
}

export interface NodeMetrics {
  cpu_percent: number;
  memory_percent: number;
  memory_mb: number;
  network_rx: number;
  network_tx: number;
  connected_clients: number;
  vpn_connected: boolean;
  last_health_check?: string;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  servers: string[];
}

export interface ProxyInfo {
  country: string;
  http_proxy: string;
  https_proxy: string;
  socks5_proxy: string;
  node_id?: string;
  status: "active" | "inactive";
}

export interface LoadBalancerStrategy {
  strategy: "round_robin" | "least_connections" | "weighted_latency" | "random" | "health_score";
}

export interface DashboardStats {
  total_nodes: number;
  active_nodes: number;
  total_traffic: number;
  connected_clients: number;
}

export interface SpeedTestResult {
  node_id: string;
  download_mbps: number;
  upload_mbps: number;
  latency_ms: number;
  tested_at: string;
}

export interface APIError {
  detail: string;
  status?: number;
}