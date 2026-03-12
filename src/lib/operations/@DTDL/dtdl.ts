import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {Utils} from "$lib/utils";

export class DTDL {
	public static escapeString(str: string) {
		return str.replace(/"/g, '\\"');
	};

	private static mapLocalizableStringProperty(id: string, name: string, value: string, res: string[]) {
		const the_value = typeof value === 'string' ? value : value["en"];  // we only support English
		res.push(`${name}(${id}, "${DTDL.escapeString(the_value)}").`);
	}

	private static schemaId(schema: any, ownerId?: string, name?: string) {
		if (typeof schema === 'string') {
			return `"${schema}"`;
		}
		if (schema['@id']) {
			return schema['@id'];
		}
		return `(${ownerId}, ${name})`;
	}

	private static mapMetadata(obj: any, id: string, res: string[]) {
		if (obj.comment) {
			res.push(`comment(${id}, "${DTDL.escapeString(obj['comment'])}").`);
		}
		if (obj.description) {
			this.mapLocalizableStringProperty(id, 'description', obj['description'], res);
		}
		if (obj.displayName) {
			this.mapLocalizableStringProperty(id, 'displayName', obj['displayName'], res);
		}
	}

	private static processSchema(id: string, schema: any, res: string[]) {
		if (typeof schema === 'string') {
			return;
		}

		switch (schema['@type']) {
			case 'Array':
				const elemSchemaId = this.schemaId(schema.elementSchema, id, 'element');
				res.push(`array(${id}, ${elemSchemaId}).`);
				this.mapMetadata(schema, id, res);
				DTDL.processSchema(elemSchemaId, schema.elementSchema, res);
				break;

			case 'Enum':
				const valueSchemaId = this.schemaId(schema.valueSchema, id, 'value');
				res.push(`enum(${id}, ${valueSchemaId}).`);
				this.mapMetadata(schema, id, res);
				DTDL.processSchema(valueSchemaId, schema.valueSchema, res);

				if (schema.enumValues?.length) {
					schema.enumValues.forEach((value) => {
						const enumVal =
							typeof value.enumValue === 'string'
								? `"${DTDL.escapeString(value.enumValue)}"`
								: value.enumValue;

						res.push(`enum_value(${id}, "${value.name}", ${enumVal}).`);
					});
				}
				break;

			case 'Map':
				// const mapKeySchemaId = this.schemaId(schema.mapKey.schema, id, 'key')   // must be string, let's skip it
				const mapValueSchemaId = this.schemaId(schema.mapValue.schema, id, 'value')
				// res.push(`map(${id}, ${mapKeySchemaId}, ${mapValueSchemaId}).`);
				res.push(`map(${id}, ${mapValueSchemaId}).`);
				this.mapMetadata(schema, id, res);
				// DTDL.processSchema(mapKeySchemaId, schema.mapKey.schema, res);   // must be string
				DTDL.processSchema(mapValueSchemaId, schema.mapValue.schema, res);
				break;

			case 'Object':
				res.push(`object(${id}).`);
				this.mapMetadata(schema, id, res);

				if (schema.fields?.length) {
					schema.fields.forEach((field) => {
						const fieldSchemaId = this.schemaId(field.schema, id, field.name);
						res.push(`has_field(${id}, "${field.name}", ${fieldSchemaId}).`);
						this.mapMetadata(schema, id, res);
						DTDL.processSchema(fieldSchemaId, field.schema, res);
					});
				}
				break;
		}
	};

	private static processProperty(ownerId: string, property: any, res: string[]) {
		const schemaId = this.schemaId(property.schema, ownerId, property.name);
		const id = `(${ownerId}, "${property.name}")`;
		res.push(`has_property(${ownerId}, "${property.name}", ${id}).`);
		res.push(`property(${id}).`);
		res.push(`schema(${id}, ${schemaId}).`);

		if (property['@id']) {
			res.push(`id(${id}, "${property['@id']}").`);
		}

		this.mapMetadata(property, id, res);

		if (property.writable) {
			res.push(`writable(${id}).`);
		}

		DTDL.processSchema(schemaId, property.schema, res);
	};

	private static processTelemetry(ownerId: string, telemetry: any, res: string[]) {
		const schemaId = this.schemaId(telemetry.schema, ownerId, telemetry.name);
		const id = `(${ownerId}, "${telemetry.name}")`;
		res.push(`has_telemetry(${ownerId}, "${telemetry.name}", ${id}).`);
		res.push(`telemetry(${id}).`);
		res.push(`schema(${id}, ${schemaId}).`);
		this.mapMetadata(telemetry, id, res);

		DTDL.processSchema(schemaId, telemetry.schema, res);
	};

	private static processRelationship(ownerId: string, relationship: any, res: string[]) {
		const id = `(${ownerId}, "${relationship.name}")`;
		res.push(`has_relationship(${ownerId}, "${relationship.name}", ${id}).`);
		res.push(`relationship(${id}).`);
		this.mapMetadata(relationship, id, res);

		if (relationship.minMultiplicity !== undefined) {
			res.push(`minMultiplicity(${id}, ${relationship.minMultiplicity}).`);
		}

		if (relationship.maxMultiplicity !== undefined) {
			res.push(`maxMultiplicity(${id}, ${relationship.maxMultiplicity}).`);
		}

		if (relationship.target) {
			res.push(`target(${id}, "${relationship.target}").`);
		}

		if (relationship.writable) {
			res.push(`writable(${id}).`);
		}

		if (relationship.properties?.length) {
			relationship.properties.forEach((prop) => {
				this.processProperty(id, prop, res);
			});
		}
	};

	private static processCommand(ownerId: string, command: any, res: string[]) {
		const id = `(${ownerId}, "${command.name}")`;
		res.push(`has_command(${ownerId}, "${command.name}", ${id}).`);
		res.push(`command(${id}).`);
		this.mapMetadata(command, id, res);

		if (command.request) {
			const reqSchemaId = this.schemaId(command.request.schema, ownerId, command.request.name);
			res.push(`command_request(${id}, ${reqSchemaId}).`);

			if (command.request.nullable) {
				res.push(`nullable_command_request(${id}).`);
			}

			DTDL.processSchema(reqSchemaId, command.request.schema, res);
		}

		if (command.response) {
			const respSchemaId = this.schemaId(command.response.schema, ownerId, command.response.name);
			res.push(`command_response(${id}, ${respSchemaId}).`);

			if (command.response.nullable) {
				res.push(`nullable_command_response(${id}).`);
			}
			DTDL.processSchema(respSchemaId, command.response.schema, res);
		}
	};

	private static processComponent(ownerId: string, component: any, res: string[]) {
		const id = `(${ownerId}, "${component.name}")`;
		const schemaId = this.schemaId(component.schema, id, component.name);
		res.push(`has_component(${ownerId}, "${component.name}", ${id}).`);
		res.push(`component(${id}).`);
		res.push(`schema(${id}, ${schemaId}).`);
		this.mapMetadata(component, id, res);

		this.processSchema(schemaId, component.schema, res);
	};

	private static processInterface(iface: any, res: string[]) {
		if (iface['@type'] !== 'Interface') {
			throw new Error(`Expecting @type Interface, got ${iface['@type']} instead.`);
		}

		const id = `"${iface['@id']}"`;
		res.push(`interface(${id}).`);
		this.mapMetadata(iface, id, res);

		if (iface.contents?.length) {
			iface.contents.forEach((content) => {
				switch (content['@type']) {
					case 'Property':
						DTDL.processProperty(id, content, res);
						break;
					case 'Telemetry':
						DTDL.processTelemetry(id, content, res);
						break;
					case 'Relationship':
						DTDL.processRelationship(id, content, res);
						break;
					case 'Command':
						DTDL.processCommand(id, content, res);
						break;
					case 'Component':
						DTDL.processComponent(id, content, res);
						break;
					default:
						throw new Error(`Unknown content of @type ${content['@type']}.`);
				}
			});
		}

		if (iface.extends) {
			const extendsList = Array.isArray(iface.extends) ? iface.extends : [iface.extends];
			extendsList.forEach((ext) => {
				res.push(`extends(${id}, "${ext}").`);
			});
		}

		if (iface.schemas?.length) {
			iface.schemas.forEach((schema) => this.processSchema(null, schema, res));
		}
	};

	private static async validateDtdl(dtdlDocument: object) {
		const ajv: any = new Ajv({ allErrors: true });
		addFormats(ajv);

		const dtdlSchema = await fetch('/schema/dtdl.v4.schema.min.json').then(response => response.json());
		const validator: any = ajv.compile(dtdlSchema);

		if (Array.isArray(dtdlDocument)) {
			for (const iface of dtdlDocument) {
				if (!validator(iface)) {
					break;
				}
			}
		} else {
			validator(dtdlDocument);
		}

		if (validator.errors) {
			throw new Error(JSON.stringify(validator.errors))
		}
	};

	public static async parser(dtdlInput: string, prefix: string) {
		const dtdl = Utils.parse_relaxed_json(dtdlInput);
		await DTDL.validateDtdl(dtdl);

		const res = [];

		if (Array.isArray(dtdl)) {
			dtdl.forEach((iface) => DTDL.processInterface(iface, res));
		} else {
			DTDL.processInterface(dtdl, res);
		}

		return res.map(fact => `${prefix}${fact}`).join('\n');
	};
}
