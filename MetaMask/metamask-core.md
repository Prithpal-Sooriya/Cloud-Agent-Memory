## Repo: MetaMask/metamask-core

- This is a monorepo that contains many packages.
- Run `nvm use && yarn install` in root to setup project
- Run `build:clean` to run type checking during build
- Once the PR is made, update the related files changelog to the file changes. Add the correct PR link to the changelog. Changelog users are developers consuming the package.
- For ESLint cleanup PRs (adding return types, renaming identifiers, fixing lint violations) that don't change implementation behavior, **do not add changelog entries**. Changelogs are for changes that impact consumers of the package.
