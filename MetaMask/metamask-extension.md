## Repo: MetaMask/metamask-extension

- To set up the environment, run `nvm install && nvm use && corepack enable && yarn install`. The project uses `.nvmrc` for Node.js version and Corepack for Yarn version management.
- To run specific tests, use `yarn jest <path_to_test_file> --coverage=false`. For ram memory issues, prepend with `NODE_OPTIONS=--max-old-space-size=4096`. The full suite (`yarn test`) may hit memory limits/timeouts.
- Before committing, run `yarn lint:tsc` and ensure it passes with no errors.
