module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  settings: { react: { version: 'detect' } },
  env: { browser: true, es2021: true, node: true },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-restricted-syntax': [
      'error',
      {
        selector:
          'Program > :matches(ExpressionStatement,VariableDeclaration,FunctionDeclaration,ClassDeclaration) > :matches(BlockComment,LineComment)',
        message: 'Comments are not allowed.',
      },
    ],
    'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
    'id-length': ['error', { min: 2, exceptions: [] }],
    '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
  },
};
