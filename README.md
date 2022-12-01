# Kodgen

Kodgen is typescript based code generation library.

## Features

+ Supported OpenAPI versions: 3.0.x (2.x and 3.1 soon)
+ <%= EJS %>
+ Templatez yt cvju() customization
+ Custom generators (soon)

## CLI commands and options

`generate`

| Option             | Alias | Description                                                             |
|--------------------|-------|-------------------------------------------------------------------------|
| --config           |       | Config file with all other possible arguments (json)                    |
| --generator        | -g    | Generator name                                                          |
| --input            | -i    | Input spec (http, https, file path)                                     |
| --insecure         |       | Insecure HTTPS connection                                               |
| --output           | -o    | Output path                                                             |
| --clean            |       | Clean output path before generation                                     |
| --templateDir      | -t    | Custom template directory (overrides default templates)                 |
| --templateDataFile |       | Additional template data file. Provided to all ejs templates (json, js) |
| --skipTemplates    |       | Skip specific templates when generating                                 |
| --includePaths     |       | Include specific url patterns (regex strings)                           |
| --excludePaths     |       | Exclude specific url patterns (regex strings)                           |
| --hooksFile        |       | Hooks file. Overrides default generator functions                       |

You can also use `generate -h`

## Hooks

Hook is a function within generator that can be overridden.
It is not available in the template, but can be predefined as being overridden in the generator code.
The implementation of these functions can be written in the `hooksFile` (option above).

```typescript
// Always check concrete hook using in sources
// Example generator code
const fn = Hooks.getOrDefault('generateEntityName', toPascalCase);
const name = fn('my', 'name');

// Hook typings:
// AnyFn is a type of function to override
// Default function always comes first.
type HookFn = <T extends AnyFn>(defaultFn: T, ...args: any[]) => any;

// Example hook file
// Just merge all strings instead of default implementation (toPascalCase)
module.exports = {
	generateEntityName: (defaultFn, strings) => strings.join(''),
};
```

## Built-in generators

### `ng-typescript`

Angular-Typescript generator.

#### Available generator hooks

| Hook name              | Description                                                            |
|------------------------|------------------------------------------------------------------------|
| `generateEntityName`   | Generate entity name from multiple strings (defaults to pascal case)   |
| `generatePropertyName` | Generate property name from multiple strings (defaults to camel case)  |
| `generateMethodName`   | Generate method name from multiple strings (defaults to camel case)    |
| `resolveType`          | Default resolve type implementation based on type and format from spec |
