// import stylistic from "@stylistic/eslint-plugin";

// let x = 1;

// export default [
//   stylistic.configs.customize({
//     // the following options are the default values
//     indent: 2,
//     quotes: "double",
//     semi: true,
//     jsx: false,
//     // ...
//   }),
//   // ...your other config items
// ];

// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const CONFIG = tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    "rules": {
      "no-redeclare": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "args": "all",
          "argsIgnorePattern": "^_",
          "caughtErrors": "all",
          "caughtErrorsIgnorePattern": "^_",
          "destructuredArrayIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ]
    }
  }
);
export default CONFIG;
