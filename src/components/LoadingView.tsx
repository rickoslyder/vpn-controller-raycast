import { List } from "@raycast/api";

interface LoadingViewProps {
  title?: string;
}

export function LoadingView({ title = "Loading..." }: LoadingViewProps) {
  return <List isLoading searchBarPlaceholder={title} />;
}