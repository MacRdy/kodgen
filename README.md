# Kodgen

Kodgen is typescript based code generation library, which parses OpenAPI definitions into models and services.

## Features

+ Supported Swagger/OpenAPI versions: 2.0, 3.0.x, 3.1
+ JSON/YAML spec format
+ External definitions
+ <%= EJS %> templating

## CLI commands and options

### `kodgen generate` - run generation process

| Option                  | Alias | Description                                                             |
|-------------------------|-------|-------------------------------------------------------------------------|
| `--config`              |       | Configuration file with all other possible options (json, js)           |
| `--generator`           | `-g`  | Generator name                                                          |
| `--generatorConfigFile` |       | Generator configuration file (json, js)                                 |
| `--input`               | `-i`  | Input spec (http, https, file path -- json, yaml)                       |
| `--insecure`            |       | Insecure HTTPS connection                                               |
| `--skipValidation`      |       | Skip spec validation process                                            |
| `--output`              | `-o`  | Output path                                                             |
| `--clean`               |       | Clean output path before generation                                     |
| `--templateDir`         | `-t`  | Custom template directory (overrides default templates)                 |
| `--templateDataFile`    |       | Additional template data file. Provided to all ejs templates (json, js) |
| `--skipTemplates`       |       | Skip specific templates when generating                                 |
| `--includePaths`        |       | Include specific url patterns (regex strings)                           |
| `--excludePaths`        |       | Exclude specific url patterns (regex strings)                           |
| `--hooksFile`           |       | Hooks file. Overrides default generator functions (js)                  |
| `--verbose`             |       | Detailed information about the process                                  |

Any options specified on the command line always override the corresponding options from the `--config`.

### `kodgen validate` - run spec validation process only

| Option             | Alias | Description                                                             |
|--------------------|-------|-------------------------------------------------------------------------|
| `--config`         |       | Configuration file with all other possible options (json, js)           |
| `--input`          | `-i`  | Input spec (http, https, file path -- json, yaml)                       |
| `--insecure`       |       | Insecure HTTPS connection                                               |

Any options specified on the command line always override the corresponding options from the `--config`.

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

Hook is a function within Kodgen library that can be overridden.
A custom implementation of these functions can be provided in the file specified by the `hooksFile` option.

```typescript
// Library code example
type GenerateModelName = (name: string) => string;

const fn = Hooks.getOrDefault<GenerateModelName>(
    'generateModelName',        // hook name
    name => toPascalCase(name), // default implementation
);

const name = fn('getOrderResponse'); // -> GetOrderResponse

// Hook type
// - T is a type of function to override
// - The default function always comes first
type HookFn<T extends AnyFn = AnyFn> = (defaultFn: T, ...args: Parameters<T>) => ReturnType<T>;

// example_hook_file.js
// Add 'I' prefix in addition to default implementation
module.exports = {
    generateModelName: (defaultFn, name) => {
        const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
        return defaultFn(`I${capitalizedName}`);
    },
};

// Now the function call will result in 'IGetOrderResponse'
```

Kodgen exports the types so you can manually compile a `.js` file from TypeScript.

```typescript
// example_hook_file.ts (based on ng-typescript generator hook)
import { HookFn, TsGenGenerateModelName } from 'kodgen';

// For example, rename all models to Model, Model1, Model2...
export const generateModelName: HookFn<TsGenGenerateModelName> =
    (_: TsGenGenerateModelName, name: string, modifier?: number, type?: string) =>
        `Model${modifier ?? ''}`;
```

## Built-in generators

### `ng-typescript`

Angular-Typescript generator. JSDoc included.

#### Configuration object ([schema](assets/generators/ng-typescript-config-schema.json))

| Property                | Default | Description                                                                                                                   |
|-------------------------|---------|-------------------------------------------------------------------------------------------------------------------------------|
| `index`                 | `true`  | Create an index file with all exported entities                                                                               |
| `inlinePathParameters`  | `true`  | Inline path parameters mode. PathParameters property types appear in imports, but not the PathParameters models themselves    |
| `inlineQueryParameters` | `false` | Inline query parameters mode. QueryParameters property types appear in imports, but not the QueryParameters models themselves |
| `readonly`              | `true`  | Readonly model properties                                                                                                     |

#### Available hooks

| Hook name               | Type                         | Description                                                                      |
|-------------------------|------------------------------|----------------------------------------------------------------------------------|
| `generateEnumName`      | `TsGenGenerateEnumName`      | Generate enum name (defaults to pascal case)                                     |
| `generateModelName`     | `TsGenGenerateModelName`     | Generate model name (defaults to pascal case)                                    |
| `generatePropertyName`  | `TsGenGeneratePropertyName`  | Generate property name (complex query param models only, defaults to camel case) |
| `generateServiceName`   | `TsGenGenerateServiceName`   | Generate service name (defaults to pascal case)                                  |
| `generateOperationName` | `TsGenGenerateOperationName` | Generate operation name (defaults to camel case)                                 |
| `resolveSimpleType`     | `TsGenResolveSimpleType`     | Simple type resolver (schema type to TypeScript type converter)                  |
