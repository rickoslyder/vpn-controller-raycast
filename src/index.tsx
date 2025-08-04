import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  getPreferenceValues,
  Color,
  Keyboard,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { useCachedPromise } from "@raycast/utils";
import { api } from "./api/client";
import { VPNNode } from "./api/types";
import { getCountryByCode, sortCountriesByFavorites, formatCountryDisplay } from "./utils/countries";
import { addRecentCountry } from "./utils/storage";
import { StatusBadge } from "./components/StatusBadge";

interface Preferences {
  favoriteCountries: string;
  refreshInterval: string;
}

export default function VPNControlCenter() {
  const preferences = getPreferenceValues<Preferences>();
  const favoriteCountries = preferences.favoriteCountries.split(",").map((c) => c.trim());
  const refreshInterval = parseInt(preferences.refreshInterval) * 1000;

  const [isLoading, setIsLoading] = useState(false);

  const {
    data: nodes = [],
    isLoading: nodesLoading,
    revalidate: revalidateNodes,
  } = useCachedPromise(
    async () => {
      return await api.listNodes();
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
    data: countries = [],
    isLoading: countriesLoading,
  } = useCachedPromise(
    async () => {
      const countryList = await api.getAvailableCountries();
      return sortCountriesByFavorites(countryList, favoriteCountries);
    },
    [],
    {
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load countries",
          message: error.message,
        });
      },
    }
  );

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      revalidateNodes();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, revalidateNodes]);

  const getNodeForCountry = (countryCode: string): VPNNode | undefined => {
    return nodes.find((node) => node.country === countryCode);
  };

  const handleStartNode = async (countryCode: string) => {
    setIsLoading(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Starting VPN for ${formatCountryDisplay(countryCode)}`,
    });

    try {
      await api.startNode(countryCode);
      await addRecentCountry(countryCode);
      toast.style = Toast.Style.Success;
      toast.title = "VPN Started";
      toast.message = `Successfully started VPN for ${formatCountryDisplay(countryCode)}`;
      revalidateNodes();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to start VPN";
      toast.message = error instanceof Error ? error.message : "Unknown error";
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopNode = async (node: VPNNode) => {
    setIsLoading(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Stopping VPN for ${formatCountryDisplay(node.country)}`,
    });

    try {
      await api.stopNode(node.id);
      toast.style = Toast.Style.Success;
      toast.title = "VPN Stopped";
      toast.message = `Successfully stopped VPN for ${formatCountryDisplay(node.country)}`;
      revalidateNodes();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to stop VPN";
      toast.message = error instanceof Error ? error.message : "Unknown error";
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartNode = async (node: VPNNode) => {
    setIsLoading(true);
    const toast = await showToast({
      style: Toast.Style.Animated,
      title: `Restarting VPN for ${formatCountryDisplay(node.country)}`,
    });

    try {
      await api.restartNode(node.id);
      toast.style = Toast.Style.Success;
      toast.title = "VPN Restarted";
      toast.message = `Successfully restarted VPN for ${formatCountryDisplay(node.country)}`;
      revalidateNodes();
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed to restart VPN";
      toast.message = error instanceof Error ? error.message : "Unknown error";
    } finally {
      setIsLoading(false);
    }
  };

  const loading = nodesLoading || countriesLoading || isLoading;

  return (
    <List isLoading={loading} searchBarPlaceholder="Search countries...">
      <List.Section title="Favorite Countries">
        {favoriteCountries
          .filter((fc) => countries.includes(fc))
          .map((countryCode) => {
            const country = getCountryByCode(countryCode);
            const node = getNodeForCountry(countryCode);

            return (
              <List.Item
                key={countryCode}
                icon={country?.flag || "🌍"}
                title={country?.name || countryCode.toUpperCase()}
                subtitle={node?.vpn_server || "No server selected"}
                accessories={[
                  node ? StatusBadge({ status: node.status }) : { text: "Inactive" },
                ]}
                actions={
                  <ActionPanel>
                    {node ? (
                      <>
                        {node.status === "running" && (
                          <>
                            <Action
                              title="Stop VPN"
                              icon={Icon.Stop}
                              onAction={() => handleStopNode(node)}
                              shortcut={{ modifiers: ["cmd"], key: "s" }}
                            />
                            <Action
                              title="Restart VPN"
                              icon={Icon.ArrowClockwise}
                              onAction={() => handleRestartNode(node)}
                              shortcut={{ modifiers: ["cmd"], key: "r" }}
                            />
                          </>
                        )}
                        {node.status === "stopped" && (
                          <Action
                            title="Start VPN"
                            icon={Icon.Play}
                            onAction={() => handleStartNode(countryCode)}
                            shortcut={{ modifiers: ["cmd"], key: "s" }}
                          />
                        )}
                      </>
                    ) : (
                      <Action
                        title="Start VPN"
                        icon={Icon.Play}
                        onAction={() => handleStartNode(countryCode)}
                        shortcut={{ modifiers: ["cmd"], key: "s" }}
                      />
                    )}
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      onAction={revalidateNodes}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
      </List.Section>

      <List.Section title="All Countries">
        {countries
          .filter((c) => !favoriteCountries.includes(c))
          .map((countryCode) => {
            const country = getCountryByCode(countryCode);
            const node = getNodeForCountry(countryCode);

            return (
              <List.Item
                key={countryCode}
                icon={country?.flag || "🌍"}
                title={country?.name || countryCode.toUpperCase()}
                subtitle={node?.vpn_server || ""}
                accessories={[
                  node ? StatusBadge({ status: node.status }) : { text: "Inactive" },
                ]}
                actions={
                  <ActionPanel>
                    {node ? (
                      <>
                        {node.status === "running" && (
                          <>
                            <Action
                              title="Stop VPN"
                              icon={Icon.Stop}
                              onAction={() => handleStopNode(node)}
                              shortcut={{ modifiers: ["cmd"], key: "s" }}
                            />
                            <Action
                              title="Restart VPN"
                              icon={Icon.ArrowClockwise}
                              onAction={() => handleRestartNode(node)}
                              shortcut={{ modifiers: ["cmd"], key: "r" }}
                            />
                          </>
                        )}
                        {node.status === "stopped" && (
                          <Action
                            title="Start VPN"
                            icon={Icon.Play}
                            onAction={() => handleStartNode(countryCode)}
                            shortcut={{ modifiers: ["cmd"], key: "s" }}
                          />
                        )}
                      </>
                    ) : (
                      <Action
                        title="Start VPN"
                        icon={Icon.Play}
                        onAction={() => handleStartNode(countryCode)}
                        shortcut={{ modifiers: ["cmd"], key: "s" }}
                      />
                    )}
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      onAction={revalidateNodes}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                    />
                  </ActionPanel>
                }
              />
            );
          })}
      </List.Section>
    </List>
  );
}