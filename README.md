# Kodgen

Kodgen is typescript based code generation library, which parses OpenAPI definitions into models and services.

## Features

+ Supported Swagger/OpenAPI versions: 2.0, 3.0.x, 3.1
+ JSON/YAML spec format
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

Hook is a function within generator that can be overridden.
It is not available in the template, but can be predefined as being overridden in the generator code.
A custom implementation of these functions can be provided in the file specified by the `hooksFile` option.

```typescript
// Always check concrete hook usage in sources
// Example generator code
const fn = Hooks.getOrDefault<TsGenGenerateName>('generateModelName', toPascalCase);
const name = fn('my', 'name');

// Hook typings
// - AnyFn is a type of function to override
// - The default function always comes first
type HookFn<T extends AnyFn> = (defaultFn: T, ...args: any[]) => any;

// example_hook_file.js
// Just merge all strings instead of default implementation (toPascalCase)
module.exports = {
    generateEntityName: (defaultFn, ...strings) => strings.join(''),
};
```

Kodgen exports the types so you can manually compile a `.js` file from TypeScript.

```typescript
// example_hook_file.ts
import { HookFn, TsGenGenerateName } from 'kodgen';

export const generateModelName: HookFn<TsGenGenerateName> =
	(_: TsGenGenerateName, ...strings: string[]) => strings.join('');
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

| Hook name              | Description                                                            |
|------------------------|------------------------------------------------------------------------|
| [`generateEnumName`](src/generators/typescript/typescript-generator-naming.service.ts#L102)     | Generate enum name from multiple strings (defaults to pascal case)     |
| [`generateModelName`](src/generators/typescript/typescript-generator-naming.service.ts#L108)    | Generate model name from multiple strings (defaults to pascal case)    |
| [`generatePropertyName`](src/generators/typescript/typescript-generator-naming.service.ts#L114) | Generate property name from multiple strings (defaults to camel case)  |
| [`generateServiceName`](src/generators/typescript/typescript-generator-naming.service.ts#L96)  | Generate service name from multiple strings (defaults to pascal case)  |
| [`generateMethodName`](src/generators/typescript/typescript-generator-naming.service.ts#L120)   | Generate method name from multiple strings (defaults to camel case)    |
| [`resolveSimpleType`](src/generators/typescript/entities/typescript-generator-model.service.ts#L196)    | Type-resolver implementation based on type and format from spec        |
