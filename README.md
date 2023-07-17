# Kodgen

Kodgen is typescript based code generation library, which parses OpenAPI definitions into models and services.

## Installation

```
npm install kodgen kodgen-cli --save-dev
```

where
+ `kodgen` is the main codegen library, and
+ [`kodgen-cli`](https://github.com/MacRdy/kodgen-cli) is a command line interface for it

## Features

+ Supported Swagger/OpenAPI versions: 2.0, 3.0.x, 3.1
+ JSON/YAML spec format
+ External definitions (via `$ref`)
+ <%= EJS %> templating
+ Custom generators

## Usage

### `kodgen generate` - run generation process

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
| `--clean`               |       | Clean output path before generation                                     |
| `--templateDir`         | `-t`  | Custom template directory (overrides default templates)                 |
| `--templateDataFile`    |       | Additional template data file. Provided to all ejs templates (json, js) |
| `--skipTemplates`       |       | Skip specific templates when generating                                 |
| `--includePaths`        |       | Include specific url patterns (regex strings)                           |
| `--excludePaths`        |       | Exclude specific url patterns (regex strings)                           |
| `--hooksFile`           |       | Hooks file. Overrides default generator functions (js)                  |
| `--verbose`             |       | Detailed information about the process                                  |
| `--eol`                 |       | Generated file newlines (`CR`, `LF` or `CRLF`)                          |

**Note:** CLI arguments take precedence over options configured in the configuration file.

### `kodgen validate` - run schema validation process only

| Option             | Alias | Description                                                             |
|--------------------|-------|-------------------------------------------------------------------------|
| `--config`         |       | Configuration file with all other possible options (json, js)           |
| `--input`          | `-i`  | Input spec (http, https, file path -- json, yaml)                       |
| `--insecure`       |       | Insecure HTTPS connection                                               |

**Note:** CLI arguments take precedence over options configured in the configuration file.

You can also use `--help` / `-h` on any command.

## Templates

All templates are driven by [EJS](https://github.com/mde/ejs).

Most of the OpenAPI definition data is available in templates (incl. vendor extensions).

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

Hook is a function within Kodgen library (or generator) that can be overridden.
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
// - The default function always comes first argument
type HookFn<T extends AnyFn = AnyFn> = (defaultFn: T, ...args: Parameters<T>) => ReturnType<T>;

// For example, we want to add 'I' prefix in addition to default implementation
// Create example_hook_file.js and specify it in the config (hooksFile option)
module.exports = {
    generateModelName: (defaultFn, name) => {
        return `I${defaultFn(name)}`;
    },
};

// Now the function call will result in 'IOrder'
```

Kodgen exports the types so you can manually compile a `.js` file from TypeScript.

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

All generators are provided in independent packages. Like plugins.

### Available generators

| Package                | Generator          | Description                                            |
|------------------------|--------------------|--------------------------------------------------------|
| [`kodgen-typescript`](https://github.com/MacRdy/kodgen-typescript)    | `ng-typescript`    | Angular generator                               |
|                        | `axios-typescript` | Axios based generator                                  |
|                        | `fetch-typescript` | Native fetch generator                                 |

### Custom generators

...
