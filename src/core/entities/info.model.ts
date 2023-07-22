export class Contact {
	constructor(public name?: string, public url?: string, public email?: string) {}
}

export class License {
	constructor(public name: string, public identifier?: string, public url?: string) {}
}

export class Info {
	constructor(
		public title?: string,
		public version?: string,
		public summary?: string,
		public description?: string,
		public termsOfService?: string,
		public contact?: Contact,
		public license?: License,
	) {}
}
