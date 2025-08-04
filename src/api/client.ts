import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import fetch from "node-fetch";
import { VPNNode, DashboardStats, ProxyInfo, LoadBalancerStrategy, SpeedTestResult, APIError } from "./types";

interface Preferences {
  apiUrl: string;
  apiUsername: string;
  apiPassword: string;
}

class VPNControllerAPI {
  private apiUrl: string;
  private authHeader: string;

  constructor() {
    const preferences = getPreferenceValues<Preferences>();
    this.apiUrl = preferences.apiUrl.replace(/\/$/, ""); // Remove trailing slash
    const credentials = Buffer.from(`${preferences.apiUsername}:${preferences.apiPassword}`).toString("base64");
    this.authHeader = `Basic ${credentials}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: this.authHeader,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        try {
          const errorJson = JSON.parse(errorText) as APIError;
          errorMessage = errorJson.detail || errorText;
        } catch {
          errorMessage = errorText || response.statusText;
        }

        throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "API Request Failed",
          message: error.message,
        });
        throw error;
      }
      throw new Error("Unknown error occurred");
    }
  }

  // Node Management
  async listNodes(): Promise<VPNNode[]> {
    return this.request<VPNNode[]>("/api/nodes");
  }

  async startNode(countryCode: string, server?: string): Promise<VPNNode> {
    const body = server ? { server } : undefined;
    return this.request<VPNNode>(`/api/nodes/${countryCode}/start`, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async stopNode(nodeId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/nodes/${nodeId}/stop`, {
      method: "DELETE",
    });
  }

  async restartNode(nodeId: string): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/nodes/${nodeId}/restart`, {
      method: "POST",
    });
  }

  async getNodeDetails(nodeId: string): Promise<VPNNode> {
    return this.request<VPNNode>(`/api/nodes/${nodeId}`);
  }

  async getNodeLogs(nodeId: string, lines = 100): Promise<{ logs: string; lines: number }> {
    return this.request<{ logs: string; lines: number }>(`/api/nodes/${nodeId}/logs?lines=${lines}`);
  }

  // Dashboard & Stats
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>("/api/stats");
  }

  async getAvailableCountries(): Promise<string[]> {
    return this.request<string[]>("/api/countries");
  }

  // Configuration
  async getCountryServers(countryCode: string): Promise<string[]> {
    return this.request<string[]>(`/api/config/servers/${countryCode}`);
  }

  async getAllServers(): Promise<Record<string, string[]>> {
    return this.request<Record<string, string[]>>("/api/config/servers");
  }

  // Load Balancer
  async getBestNode(countryCode: string): Promise<VPNNode | null> {
    return this.request<VPNNode | null>(`/api/load-balancer/best-node/${countryCode}`);
  }

  async getLoadBalancerStrategy(): Promise<LoadBalancerStrategy> {
    return this.request<LoadBalancerStrategy>("/api/load-balancer/strategy");
  }

  async setLoadBalancerStrategy(strategy: LoadBalancerStrategy["strategy"]): Promise<LoadBalancerStrategy> {
    return this.request<LoadBalancerStrategy>("/api/load-balancer/strategy", {
      method: "POST",
      body: JSON.stringify({ strategy }),
    });
  }

  // Speed Test
  async runSpeedTest(nodeId: string): Promise<SpeedTestResult> {
    return this.request<SpeedTestResult>(`/api/speed-test/${nodeId}`, {
      method: "POST",
    });
  }

  async getSpeedTestResults(nodeId?: string): Promise<SpeedTestResult[]> {
    const endpoint = nodeId ? `/api/speed-test/results/${nodeId}` : "/api/speed-test/results";
    return this.request<SpeedTestResult[]>(endpoint);
  }

  // Proxy Information
  async getProxyUrls(): Promise<ProxyInfo[]> {
    const nodes = await this.listNodes();
    const countries = await this.getAvailableCountries();
    
    return countries.map(country => {
      const node = nodes.find(n => n.country === country && n.status === "running");
      const basePort = 8128; // Starting port for HTTP proxy
      const countryIndex = ["us", "de", "jp", "ie"].indexOf(country);
      const httpPort = countryIndex >= 0 ? basePort + countryIndex : basePort;
      const socksPort = 1080 + (countryIndex >= 0 ? countryIndex : 0);

      return {
        country,
        http_proxy: `http://proxy-${country}.rbnk.uk:${httpPort}`,
        https_proxy: `http://proxy-${country}.rbnk.uk:${httpPort}`,
        socks5_proxy: `socks5://proxy-${country}.rbnk.uk:${socksPort}`,
        node_id: node?.id,
        status: node ? "active" : "inactive",
      };
    });
  }
}

// Export singleton instance
export const api = new VPNControllerAPI();