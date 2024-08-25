# Kodgen

[![npm](https://img.shields.io/npm/v/kodgen)](https://www.npmjs.com/package/kodgen)
[![license](https://img.shields.io/github/license/MacRdy/kodgen)](LICENSE)

> Under development until 1.0.0. Be cautious of potential breaking changes, even in minor updates.

Kodgen is a TypeScript-based code generation library that parses OpenAPI definitions into models and services.

## Installation

```
npm install kodgen kodgen-cli --save-dev
```

where
+ `kodgen` is the main codegen library, and
+ [`kodgen-cli`](https://github.com/MacRdy/kodgen-cli) is a command-line interface for it.

## Features

+ Supported Swagger/OpenAPI versions: 2.0, 3.0.x, 3.1
+ JSON/YAML spec format
+ External definitions (via `$ref`)
+ <%= EJS %> templating
+ Custom generators

## Usage

### `kodgen generate` - run code generation

| Option                  | Alias | Description                                                             |
|-------------------------|-------|-------------------------------------------------------------------------|
| `--config`              |       | Configuration file with all other possible options (json, js)           |
| `--package`             | `-p`  | Generator package name                                                  |
| `--generator`           | `-g`  | Generator name                                                          |
| `--generatorConfigFile` |       | Generator configuration file (json, js)                                 |
| `--input`               | `-i`  | Input spec (http, https, file path -- json, yaml)                       |
| `--insecure`            |       | Insecure HTTPS connection                                               |
| `--skipValidation`      |       | Skip schema validation process                                          |
| `--output`              | `-o`  | Output path                                                             |
| `--clean`               |       | Clean the output path before generation                                 |
| `--templateDir`         | `-t`  | Custom template directory (overrides default templates)                 |
| `--templateDataFile`    |       | Additional template data file provided to all ejs templates (json, js)  |
| `--skipTemplates`       |       | Skip specific templates when generating                                 |
| `--includePaths`        |       | Include specific url patterns (regex strings)                           |
| `--excludePaths`        |       | Exclude specific url patterns (regex strings)                           |
| `--hooksFile`           |       | Hooks file. Overrides default generator functions (js)                  |
| `--baseUrl`             |       | Overrides default base url                                              |
| `--silent`              |       | Suppress all informational messages                                     |
| `--verbose`             |       | Detailed information about the process                                  |
| `--eol`                 |       | Generated file newlines (`CR`, `LF` or `CRLF`)                          |

[JSON Schema (generate command)](https://github.com/MacRdy/kodgen-cli/blob/main/assets/generate-command-schema.json)

**Note:** CLI arguments take precedence over the options in the configuration file.

### `kodgen validate` - run schema validation only

| Option             | Alias | Description                                                             |
|--------------------|-------|-------------------------------------------------------------------------|
| `--config`         |       | Configuration file with all other possible options (json, js)           |
| `--input`          | `-i`  | Input spec (http, https, file path -- json, yaml)                       |
| `--insecure`       |       | Insecure HTTPS connection                                               |
| `--silent`         |       | Suppress all informational messages                                     |

[JSON Schema (validate command)](https://github.com/MacRdy/kodgen-cli/blob/main/assets/validate-command-schema.json)

**Note:** CLI arguments take precedence over the options in the configuration file.

You can also use `--help` or `-h` on any command.

## Templates

All templates are driven by [EJS](https://github.com/mde/ejs).

Most of the OpenAPI definition data, including vendor extensions, is accessible within templates.

All templates can be overridden.
If you specify the `templateDir` option, the generator will look for templates in the specified directory.
If no template is found in the user's directory, the default template will be used.

Additionally, you can include arbitrary data, such as functions or constants, in each template by providing a `templateDataFile`, which can be either a JSON or JS file.
The data contained within this file will be accessible through the `d` key.

```javascript
// create an example_template_data_file.js and specify it in the templateDataFile option

module.exports = {
    fn: () => 'hello!',
    myConstant: 1,
};

// Now, in all templates, you have access to d.fn() and d.myConstant
```

## Hooks

A Hook is a function in the Kodgen library (or generator) that can be overridden.
You can provide a custom implementation for these functions in the file specified by the `hooksFile` option.

```typescript
// Example. Assume we are generating a name for a model
// The type of function is
type GenerateModelName = (name: string) => string;

// ...
const fn = Hooks.getOrDefault<GenerateModelName>(
    'generateModelName',        // hook name
    name => toPascalCase(name), // default implementation
);

// The Hooks service returned a default function or an overridden function
// (default in this case)
const name = fn('order'); // -> 'Order'

// Now the override. It's a generic hook type
// - T is a type of function to override
// - the default implementation always comes first argument
type HookFn<T extends Function> = (defaultFn: T, ...args: Parameters<T>) => ReturnType<T>;

// For instance, we may want to add an 'I' prefix in addition to the default implementation
// Create example_hook_file.js and specify it in the config (the hooksFile option)
module.exports = {
    generateModelName: (defaultFn, name) => `I${defaultFn(name)}`,
};

// Now the function call will produce 'IOrder', and all the models will be renamed accordingly
```

Kodgen exports the types, allowing you to manually compile a JavaScript file from TypeScript.

```typescript
// example_hook_file.ts (based on kodgen-typescript generators hook)
import { HookFn } from 'kodgen';
import { TsGenGenerateModelName } from 'kodgen-typescript';

// For example, rename all models to Model, Model1, Model2...
export const generateModelName: HookFn<TsGenGenerateModelName> =
    (_: TsGenGenerateModelName, name: string, modifier?: number, type?: string) =>
        `Model${modifier ?? ''}`;
```

## Generators

All generators are third-party packages. Like plugins.

### Available generators

| Package                | Generator          | Description                                            |
|------------------------|--------------------|--------------------------------------------------------|
| [`kodgen-typescript`](https://github.com/MacRdy/kodgen-typescript)    | `ng-typescript`    | Angular services generator                               |
|                        | `axios-typescript` | Axios-based generator                                  |
|                        | `fetch-typescript` | Native Fetch API generator                                 |

### Custom generators

Kodgen can transform OpenAPI definitions into any desired format.
It offers access to all parsed entities from the OpenAPI specification, allowing you to use it in your own generator.

While there are no clear instructions on how to interact with the API, you can look at how the [`kodgen-typescript`](https://github.com/MacRdy/kodgen-typescript) works from the inside.

## Examples

You can find basic generation examples in [this repository](https://github.com/MacRdy/kodgen-example).
