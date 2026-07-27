import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ preload }) => {
    if (preload) {
      return;
    }
    throw redirect({ to: "/dashboard" });
  },
});
