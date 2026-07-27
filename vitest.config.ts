import path from "path";

export default {
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};

