import { Extensions, SchemaEntity } from '../shared.model';

export class Property {
	constructor(
		public name: string,
		readonly def: SchemaEntity,
		readonly required: boolean = false,
		readonly nullable: boolean = false,
		readonly readonly: boolean = false,
		readonly writeonly: boolean = false,
		readonly deprecated: boolean = false,
		readonly description?: string,
		readonly extensions: Extensions = {},
	) {}
}
