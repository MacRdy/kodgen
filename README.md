# Kodgen

[![npm](https://img.shields.io/npm/v/kodgen)](https://www.npmjs.com/package/kodgen)
[![license](https://img.shields.io/github/license/MacRdy/kodgen)](blob/main/LICENSE)
 
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

[JSON Schema (validate command)](https://github.com/MacRdy/kodgen-cli/blob/main/assets/validate-command-schema.json)

**Note:** CLI arguments take precedence over the options in the configuration file.

You can also use `--help` or `-h` on any command.

## Templates

All templates are driven by [EJS](https://github.com/mde/ejs).

Most of the OpenAPI definition data is available in templates (incl. vendor extensions).

If the `templateDir` option is set, the generator will look for template in that directory.
If no template is found in the user's directory, the default template will be used.
To skip a specific template when generating, use the `skipTemplates` option.

You can also add data (functions, constants, etc.) to each template by providing a `templateDataFile`, which can be a JSON or JS file.

```javascript
// example_template_data_file.js

exports.fn = () => 'hello!';

module.exports.myConstant = 1;

// fn() and myConstant are now available in all templates!
```

## Hooks

The Hook is a function within the Kodgen library (or generator) that can be overridden.
A custom implementation of these functions can be provided in the file specified by the `hooksFile` option.

```typescript
// Generator code example
type GenerateModelName = (name: string) => string;

const fn = Hooks.getOrDefault<GenerateModelName>(
    'generateModelName',        // hook name
    name => toPascalCase(name), // default implementation
);

const name = fn('order'); // -> 'Order'

// Common hook type
// - T is a type of function to override
// - The default implementation always comes first argument
type HookFn<T extends AnyFn = AnyFn> = (defaultFn: T, ...args: Parameters<T>) => ReturnType<T>;

// For example, we want to add 'I' prefix in addition to default implementation
// Create example_hook_file.js and specify it in the config (the hooksFile option)
module.exports = {
    generateModelName: (defaultFn, name) => {
        return `I${defaultFn(name)}`;
    },
};

// Now the function call will result in 'IOrder'
```

The Kodgen exports the types, so you can manually compile a JS file from TypeScript.

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
|                        | `axios-typescript` | Axios based generator                                  |
|                        | `fetch-typescript` | Native fetch generator                                 |

### Custom generators

The Kodgen can transform OpenAPI definitions into any form.
Kodgen provides all the parsed entities from the OpenAPI specification and exports APIs to generate files, so you can use it in your own generator.

While there are no clear instructions on how to interact with the API, you can look at how the [`kodgen-typescript`](https://github.com/MacRdy/kodgen-typescript) works from the inside.

## Examples

You can find basic API generation examples in [this repository](https://github.com/MacRdy/kodgen-example).
