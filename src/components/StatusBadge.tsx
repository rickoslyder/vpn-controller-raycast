import { Color, Icon } from "@raycast/api";

interface StatusBadgeProps {
  status: "running" | "stopped" | "error" | "starting" | "stopping";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    running: { icon: Icon.CheckCircle, tintColor: Color.Green, text: "Running" },
    stopped: { icon: Icon.XMarkCircle, tintColor: Color.SecondaryText, text: "Stopped" },
    error: { icon: Icon.ExclamationMark, tintColor: Color.Red, text: "Error" },
    starting: { icon: Icon.ArrowClockwise, tintColor: Color.Blue, text: "Starting" },
    stopping: { icon: Icon.ArrowClockwise, tintColor: Color.Orange, text: "Stopping" },
  };

  const { icon, tintColor, text } = config[status] || config.error;

  return {
    icon: { source: icon, tintColor },
    text,
    tooltip: `Status: ${text}`,
  };
}