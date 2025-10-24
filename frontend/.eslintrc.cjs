module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  plugins: ["react", "react-hooks", "jsx-a11y", "@typescript-eslint"],
  ignorePatterns: ["dist", "node_modules"],
  rules: {
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }
    ],
    "jsx-a11y/label-has-associated-control": "off",
    "react-hooks/exhaustive-deps": "warn"
  }
};
