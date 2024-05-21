## Development server

Install Nx Globally `npm install --global nx@latest`.

Clone the Project `git clone <remote url>`.

Install Dependencies using `npm ci`.

Run the gateway and other microservice applications using `npx nx run <applicationName>:serve`.

Alternatively for Terminal , You can add `Nx Console` VS Code Extension to start the project using ui.

## Add Other microservices

Run `nx generate @nrwl/nest:application <applicationName>` to create a new application(microservice) in your app. Add these flags to remove adding any e2e or test cases with it `--unitTestRunner none --e2eTestRunner none`

## Shared Libs Usage in All Microservices

Add files or folder in `libs/shared/src` folder and import those files or folder in index file of that folder.

Add your new folders path in the `tsconfig.base.json` to be accessed as that path across all applications of that project.

## Further help

Visit the [Nx Documentation](https://nx.dev) to learn more.
