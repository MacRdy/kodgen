# Kodgen

Kodgen is typescript based code generation library.

## Features

+ Supported Swagger/OpenAPI versions: 2.0, 3.0.x (3.1 soon)
+ <%= EJS %> templating

## CLI commands and options

`kodgen generate`

| Option             | Alias | Description                                                             |
|--------------------|-------|-------------------------------------------------------------------------|
| --config           |       | Configuration file with all other possible options (json, js)           |
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
| --hooksFile        |       | Hooks file. Overrides default generator functions (js)                  |

You can also use `kodgen generate -h`

## Templates

All templates are driven by [EJS](https://github.com/mde/ejs).

Most of the OpenAPI schema data is available in templates (incl. vendor extensions).

The generator will look for templates in the `templateDir` directory if this option is specified.
If there is no specific template in the user's folder, the default template will be used.
To skip a specific template when generating, use `skipTemplates` option.

You can also add any data (functions, constants, etc.) to each template by providing a `templateDataFile` as `.json` or `.js` file.

```javascript
// example_template_data_file.js

exports.fn = () => 'hello!';

module.exports.myConstant = 1;

// fn() and myConstant are now available in all templates!
```

## Hooks

Hook is a function within generator that can be overridden.
It is not available in the template, but can be predefined as being overridden in the generator code.
A custom implementation of these functions can be provided in the file specified by the `hooksFile` option.

```typescript
// Always check concrete hook usage in sources
// Example generator code
const fn = Hooks.getOrDefault('generateEntityName', toPascalCase);
const name = fn('my', 'name');

// Hook typings:
// AnyFn is a type of function to override
// The default function always comes first.
type HookFn = <T extends AnyFn>(defaultFn: T, ...args: any[]) => any;

// example_hook_file.js
// Just merge all strings instead of default implementation (toPascalCase)
module.exports = {
    generateEntityName: (defaultFn, ...strings) => strings.join(''),
};
```

## Built-in generators

### `ng-typescript`

Angular-Typescript generator. JSDoc included.

#### Available hooks

| Hook name              | Description                                                            |
|------------------------|------------------------------------------------------------------------|
| `generateEnumName`     | Generate enum name from multiple strings (defaults to pascal case)     |
| `generateModelName`    | Generate model name from multiple strings (defaults to pascal case)    |
| `generatePropertyName` | Generate property name from multiple strings (defaults to camel case)  |
| `generateServiceName`  | Generate service name from multiple strings (defaults to pascal case)  |
| `generateMethodName`   | Generate method name from multiple strings (defaults to camel case)    |
| `resolveSimpleType`    | Type-resolver implementation based on type and format from spec        |
