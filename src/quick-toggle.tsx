import { showToast, Toast, LaunchProps, closeMainWindow, popToRoot } from "@raycast/api";
import { api } from "./api/client";
import { getCountryByCode, formatCountryDisplay } from "./utils/countries";
import { addRecentCountry } from "./utils/storage";

interface Arguments {
  country: string;
}

export default async function QuickToggle(props: LaunchProps<{ arguments: Arguments }>) {
  const { country: countryInput } = props.arguments;
  const countryCode = countryInput.toLowerCase().trim();

  // Validate country code
  const country = getCountryByCode(countryCode);
  if (!country) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Invalid Country Code",
      message: `"${countryInput}" is not a valid country code. Use codes like: us, uk, de, jp`,
    });
    return;
  }

  // Close Raycast window immediately for better UX
  await closeMainWindow();
  await popToRoot();

  try {
    // Check if node exists and its status
    const nodes = await api.listNodes();
    const existingNode = nodes.find((n) => n.country === countryCode);

    if (existingNode && existingNode.status === "running") {
      // Node is running, stop it
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: `Stopping ${formatCountryDisplay(countryCode)}`,
      });

      try {
        await api.stopNode(existingNode.id);
        toast.style = Toast.Style.Success;
        toast.title = "VPN Stopped";
        toast.message = `${formatCountryDisplay(countryCode)} disconnected`;
      } catch (error) {
        toast.style = Toast.Style.Failure;
        toast.title = "Failed to stop VPN";
        toast.message = error instanceof Error ? error.message : "Unknown error";
      }
    } else {
      // Node is not running, start it
      const toast = await showToast({
        style: Toast.Style.Animated,
        title: `Starting ${formatCountryDisplay(countryCode)}`,
      });

      try {
        await api.startNode(countryCode);
        await addRecentCountry(countryCode);
        toast.style = Toast.Style.Success;
        toast.title = "VPN Started";
        toast.message = `Connected to ${formatCountryDisplay(countryCode)}`;
      } catch (error) {
        toast.style = Toast.Style.Failure;
        toast.title = "Failed to start VPN";
        toast.message = error instanceof Error ? error.message : "Unknown error";
      }
    }
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Connection Error",
      message: error instanceof Error ? error.message : "Failed to connect to VPN controller",
    });
  }
}