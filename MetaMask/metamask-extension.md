## Repo: MetaMask/metamask-extension

- Always start a task in 'deep planning mode'. Interact with the user by asking clarifying questions to gain absolute certainty of their expectations and goals before creating a plan. Only after the user answers the questions and confirms my understanding should I create the plan.

- PR created should include the provided jira ticket and gihub issue linked

- The project uses an `.nvmrc` file to define the required Node.js version. A reliable command sequence to set up the environment is `nvm install && nvm use && corepack enable && yarn install`.

- Before committing make sure that yarn lint:tsc does not return errors

- To run only specific tests, use the command `yarn jest <path_to_test_file> --coverage=false`. This is more efficient than running the full suite.

- To run tests with increased memory, prepend the test command with NODE_OPTIONS=--max-old-space-size=4096.

- The project uses yarn for dependency management and requires a specific version defined in package.json.

- To run the entire test suite, use yarn test. This command may fail due to memory limits or timeouts.

- The project is the MetaMask Extension

- The project uses Corepack to manage the yarn version. It needs to be enabled via corepack enable
