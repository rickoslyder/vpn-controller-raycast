import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  Detail,
  getPreferenceValues,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { useCachedPromise } from "@raycast/utils";
import { api } from "./api/client";
import { VPNNode } from "./api/types";
import { formatCountryDisplay } from "./utils/countries";
import { StatusBadge } from "./components/StatusBadge";

interface Preferences {
  refreshInterval: string;
}

export default function ManageActiveNodes() {
  const preferences = getPreferenceValues<Preferences>();
  const refreshInterval = parseInt(preferences.refreshInterval) * 1000;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const {
    data: nodes = [],
    isLoading,
    revalidate,
  } = useCachedPromise(
    async () => {
      const allNodes = await api.listNodes();
      // Sort by status (running first) then by country
      return allNodes.sort((a, b) => {
        if (a.status === "running" && b.status !== "running") return -1;
        if (a.status !== "running" && b.status === "running") return 1;
        return a.country.localeCompare(b.country);
      });
    },
    [],
    {
      keepPreviousData: true,
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load nodes",
          message: error.message,
        });
      },
    }
  );

  const {
    data: nodeLogs,
    isLoading: logsLoading,
    revalidate: revalidateLogs,
  } = useCachedPromise(
    async () => {
      if (!selectedNodeId) return null;
      return await api.getNodeLogs(selectedNodeId, 50);
    },
    [selectedNodeId],
    {
      execute: !!selectedNodeId,
    }
  );

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      revalidate();
      if (selectedNodeId) {
        revalidateLogs();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, revalidate, revalidateLogs, selectedNodeId]);

  const handleStopNode = async (node: VPNNode) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Stopping ${formatCountryDisplay(node.country)}`,
    });

    try {
      await api.stopNode(node.id);
      toast.style = Toast.Style.Success;
      toast.title = "Node Stopped";
      revalidate();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to stop node";
      toast.message = error instanceof Error ? error.message : "Unknown error";
    }
  };

  const handleRestartNode = async (node: VPNNode) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Restarting ${formatCountryDisplay(node.country)}`,
    });

    try {
      await api.restartNode(node.id);
      toast.style = Toast.Style.Success;
      toast.title = "Node Restarted";
      revalidate();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to restart node";
      toast.message = error instanceof Error ? error.message : "Unknown error";
    }
  };

  const handleRunSpeedTest = async (nodeId: string) => {
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Running speed test...",
    });

    try {
      const result = await api.runSpeedTest(nodeId);
      toast.style = Toast.Style.Success;
      toast.title = "Speed Test Complete";
      toast.message = `↓ ${result.download_mbps.toFixed(1)} Mbps | ↑ ${result.upload_mbps.toFixed(1)} Mbps | ${result.latency_ms}ms`;
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Speed test failed";
      toast.message = error instanceof Error ? error.message : "Unknown error";
    }
  };

  const formatUptime = (startedAt?: string): string => {
    if (!startedAt) return "Unknown";
    const start = new Date(startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (selectedNodeId && nodeLogs) {
    return (
      <Detail
        isLoading={logsLoading}
        navigationTitle="Node Logs"
        markdown={`\`\`\`\n${nodeLogs.logs}\n\`\`\``}
        actions={
          <ActionPanel>
            <Action
              title="Back to Nodes"
              icon={Icon.ArrowLeft}
              onAction={() => setSelectedNodeId(null)}
            />
            <Action
              title="Refresh Logs"
              icon={Icon.ArrowClockwise}
              onAction={revalidateLogs}
              shortcut={{ modifiers: ["cmd"], key: "r" }}
            />
          </ActionPanel>
        }
      />
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search nodes...">
      <List.Section title={`Active Nodes (${nodes.filter(n => n.status === "running").length})`}>
        {nodes
          .filter((node) => node.status === "running")
          .map((node) => (
            <List.Item
              key={node.id}
              icon={formatCountryDisplay(node.country).split(" ")[0]}
              title={formatCountryDisplay(node.country)}
              subtitle={node.vpn_server || node.id}
              accessories={[
                ...(node.metrics
                  ? [
                      { text: `${node.metrics.cpu_percent.toFixed(1)}% CPU` },
                      { text: `${node.metrics.memory_mb}MB RAM` },
                      { text: `↓ ${formatBytes(node.metrics.network_rx)}` },
                      { text: `↑ ${formatBytes(node.metrics.network_tx)}` },
                    ]
                  : []),
                StatusBadge({ status: node.status }),
                { text: formatUptime(node.started_at) },
              ]}
              actions={
                <ActionPanel>
                  <Action
                    title="Stop Node"
                    icon={Icon.Stop}
                    onAction={() => handleStopNode(node)}
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                  />
                  <Action
                    title="Restart Node"
                    icon={Icon.ArrowClockwise}
                    onAction={() => handleRestartNode(node)}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                  <Action
                    title="View Logs"
                    icon={Icon.Terminal}
                    onAction={() => setSelectedNodeId(node.id)}
                    shortcut={{ modifiers: ["cmd"], key: "l" }}
                  />
                  <Action
                    title="Run Speed Test"
                    icon={Icon.Gauge}
                    onAction={() => handleRunSpeedTest(node.id)}
                    shortcut={{ modifiers: ["cmd"], key: "t" }}
                  />
                  <ActionPanel.Section>
                    <Action
                      title="Copy Node ID"
                      icon={Icon.Clipboard}
                      onAction={() => {
                        navigator.clipboard.writeText(node.id);
                        showToast({ style: Toast.Style.Success, title: "Node ID copied" });
                      }}
                    />
                    {node.tailscale_ip && (
                      <Action
                        title="Copy Tailscale IP"
                        icon={Icon.Clipboard}
                        onAction={() => {
                          navigator.clipboard.writeText(node.tailscale_ip!);
                          showToast({ style: Toast.Style.Success, title: "Tailscale IP copied" });
                        }}
                      />
                    )}
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
      </List.Section>

      <List.Section title={`Inactive Nodes (${nodes.filter(n => n.status !== "running").length})`}>
        {nodes
          .filter((node) => node.status !== "running")
          .map((node) => (
            <List.Item
              key={node.id}
              icon={formatCountryDisplay(node.country).split(" ")[0]}
              title={formatCountryDisplay(node.country)}
              subtitle={node.id}
              accessories={[StatusBadge({ status: node.status })]}
              actions={
                <ActionPanel>
                  <Action
                    title="Remove Node"
                    icon={Icon.Trash}
                    onAction={async () => {
                      await showToast({ style: Toast.Style.Success, title: "Node removed" });
                      revalidate();
                    }}
                  />
                </ActionPanel>
              }
            />
          ))}
      </List.Section>
    </List>
  );
}