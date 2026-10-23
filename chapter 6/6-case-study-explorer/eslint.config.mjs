import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser: tseslint.parser },
  },
  // rules-of-hooks, exhaustive-deps, and the compiler-powered rules
  // (purity, refs, immutability, static-components, set-state-in-effect,
  // preserve-manual-memoization, incompatible-library, ...)
  reactHooks.configs.flat["recommended-latest"],
];
