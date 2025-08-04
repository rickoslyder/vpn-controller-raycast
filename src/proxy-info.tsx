import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  Detail,
  Clipboard,
  getPreferenceValues,
} from "@raycast/api";
import { useState } from "react";
import { useCachedPromise } from "@raycast/utils";
import { api } from "./api/client";
import { formatCountryDisplay } from "./utils/countries";

interface Preferences {
  apiUrl: string;
}

export default function ProxyInfo() {
  const preferences = getPreferenceValues<Preferences>();
  const [showingDetails, setShowingDetails] = useState<string | null>(null);

  const {
    data: proxyList = [],
    isLoading,
    revalidate,
  } = useCachedPromise(
    async () => {
      return await api.getProxyUrls();
    },
    [],
    {
      keepPreviousData: true,
      onError: (error) => {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to load proxy information",
          message: error.message,
        });
      },
    }
  );

  const copyToClipboard = async (text: string, name: string) => {
    await Clipboard.copy(text);
    await showToast({
      style: Toast.Style.Success,
      title: "Copied to Clipboard",
      message: `${name} copied`,
    });
  };

  const generateProxyExamples = (country: string) => {
    const proxy = proxyList.find((p) => p.country === country);
    if (!proxy) return "";

    return `# Proxy URLs for ${formatCountryDisplay(country)}

## HTTP/HTTPS Proxy
- **URL**: \`${proxy.http_proxy}\`
- **No authentication required**

## SOCKS5 Proxy
- **URL**: \`${proxy.socks5_proxy}\`
- **No authentication required**

## Usage Examples

### cURL
\`\`\`bash
# HTTP proxy
curl -x ${proxy.http_proxy} https://httpbin.org/ip

# SOCKS5 proxy
curl --socks5 ${proxy.socks5_proxy.replace("socks5://", "")} https://httpbin.org/ip
\`\`\`

### Python
\`\`\`python
import requests

# HTTP proxy
proxies = {
    'http': '${proxy.http_proxy}',
    'https': '${proxy.http_proxy}'
}
response = requests.get('https://httpbin.org/ip', proxies=proxies)
print(response.json())

# SOCKS5 proxy (requires requests[socks])
proxies = {
    'http': '${proxy.socks5_proxy}',
    'https': '${proxy.socks5_proxy}'
}
response = requests.get('https://httpbin.org/ip', proxies=proxies)
\`\`\`

### Node.js
\`\`\`javascript
const axios = require('axios');

// HTTP proxy
const proxy = {
  protocol: 'http',
  host: '${proxy.http_proxy.split("//")[1].split(":")[0]}',
  port: ${proxy.http_proxy.split(":").pop()}
};

axios.get('https://httpbin.org/ip', { proxy })
  .then(response => console.log(response.data));
\`\`\`

### Browser Configuration
1. Go to Network Settings
2. Select "Manual proxy configuration"
3. HTTP Proxy: \`${proxy.http_proxy.split("//")[1].split(":")[0]}\`
4. Port: \`${proxy.http_proxy.split(":").pop()}\`
5. Check "Use this proxy server for all protocols"

## Testing the Proxy
You can test if the proxy is working by visiting:
- https://httpbin.org/ip - Shows your current IP
- https://whatismyipaddress.com - Detailed location info
- https://browserleaks.com - Comprehensive leak test
`;
  };

  if (showingDetails) {
    return (
      <Detail
        navigationTitle="Proxy Configuration"
        markdown={generateProxyExamples(showingDetails)}
        actions={
          <ActionPanel>
            <Action
              title="Back to List"
              icon={Icon.ArrowLeft}
              onAction={() => setShowingDetails(null)}
            />
            <Action
              title="Copy All Examples"
              icon={Icon.Clipboard}
              onAction={() => copyToClipboard(generateProxyExamples(showingDetails), "Examples")}
            />
          </ActionPanel>
        }
      />
    );
  }

  const activeProxies = proxyList.filter((p) => p.status === "active");
  const inactiveProxies = proxyList.filter((p) => p.status === "inactive");

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search proxy endpoints...">
      <List.Section title={`Active Proxies (${activeProxies.length})`}>
        {activeProxies.map((proxy) => (
          <List.Item
            key={proxy.country}
            icon={{ source: Icon.Globe, tintColor: "#00ff00" }}
            title={formatCountryDisplay(proxy.country)}
            subtitle={proxy.http_proxy}
            accessories={[
              { text: "HTTP", icon: Icon.Link },
              { text: "SOCKS5", icon: Icon.Link },
              { tag: { value: "Active", color: "#00ff00" } },
            ]}
            actions={
              <ActionPanel>
                <Action
                  title="View Configuration"
                  icon={Icon.Eye}
                  onAction={() => setShowingDetails(proxy.country)}
                />
                <ActionPanel.Section>
                  <Action
                    title="Copy HTTP Proxy URL"
                    icon={Icon.Clipboard}
                    onAction={() => copyToClipboard(proxy.http_proxy, "HTTP proxy URL")}
                    shortcut={{ modifiers: ["cmd"], key: "h" }}
                  />
                  <Action
                    title="Copy HTTPS Proxy URL"
                    icon={Icon.Clipboard}
                    onAction={() => copyToClipboard(proxy.https_proxy, "HTTPS proxy URL")}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "h" }}
                  />
                  <Action
                    title="Copy SOCKS5 Proxy URL"
                    icon={Icon.Clipboard}
                    onAction={() => copyToClipboard(proxy.socks5_proxy, "SOCKS5 proxy URL")}
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section>
                  <Action
                    title="Copy cURL Command"
                    icon={Icon.Terminal}
                    onAction={() =>
                      copyToClipboard(
                        `curl -x ${proxy.http_proxy} https://httpbin.org/ip`,
                        "cURL command"
                      )
                    }
                  />
                  <Action
                    title="Test Proxy"
                    icon={Icon.Globe}
                    onAction={() => {
                      const testUrl = `https://httpbin.org/ip`;
                      Clipboard.copy(`curl -x ${proxy.http_proxy} ${testUrl}`);
                      showToast({
                        style: Toast.Style.Success,
                        title: "Test command copied",
                        message: "Paste in terminal to test proxy",
                      });
                    }}
                  />
                </ActionPanel.Section>
                <Action
                  title="Refresh"
                  icon={Icon.ArrowClockwise}
                  onAction={revalidate}
                  shortcut={{ modifiers: ["cmd"], key: "r" }}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      <List.Section title={`Inactive Proxies (${inactiveProxies.length})`}>
        {inactiveProxies.map((proxy) => (
          <List.Item
            key={proxy.country}
            icon={{ source: Icon.Globe, tintColor: "#666666" }}
            title={formatCountryDisplay(proxy.country)}
            subtitle="Start VPN node to activate proxy"
            accessories={[{ tag: { value: "Inactive", color: "#666666" } }]}
            actions={
              <ActionPanel>
                <Action
                  title="Start VPN Node"
                  icon={Icon.Play}
                  onAction={async () => {
                    const toast = await showToast({
                      style: Toast.Style.Animated,
                      title: `Starting VPN for ${formatCountryDisplay(proxy.country)}`,
                    });
                    try {
                      await api.startNode(proxy.country);
                      toast.style = Toast.Style.Success;
                      toast.title = "VPN Started";
                      toast.message = "Proxy will be available shortly";
                      revalidate();
                    } catch (error) {
                      toast.style = Toast.Style.Failure;
                      toast.title = "Failed to start VPN";
                      toast.message = error instanceof Error ? error.message : "Unknown error";
                    }
                  }}
                />
                <Action
                  title="View Configuration"
                  icon={Icon.Eye}
                  onAction={() => setShowingDetails(proxy.country)}
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>

      <List.EmptyView
        title="No Proxy Information Available"
        description="Unable to load proxy endpoints. Check your API connection."
        actions={
          <ActionPanel>
            <Action title="Retry" icon={Icon.ArrowClockwise} onAction={revalidate} />
          </ActionPanel>
        }
      />
    </List>
  );
}