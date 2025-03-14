/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  importOrder: [
    "^(react/(.*)$)|^(react$)",
    "^(next/(.*)$)|^(next$)",
    "",
    "<THIRD_PARTY_MODULES>",
    "^(~/types$)|^(~/server/models$)",
    "",
    "^(~/server/(.*)$)|^(~/server$)",
    "^~/lib/(.*)$",
    "^~/hooks/(.*)$",
    "",
    "^~/components/ui/(.*)$",
    "^~/components/(.*)$",
    "^~/styles/(.*)$",
    "",
    "^~/app/(.*)$",
    "",
    "^[./]",
  ],
  // importOrderSeparation: false,
  // importOrderSortSpecifiers: true,
  // importOrderBuiltinModulesToTop: true,
  // importOrderParserPlugins: ["typescript", "jsx"],
  // importOrderMergeDuplicateImports: true,
  // importOrderCombineTypeAndValueImports: true,
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
};
