import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: [
      ".next/**",
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "build/**",
      "out/**",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
];

export default config;
