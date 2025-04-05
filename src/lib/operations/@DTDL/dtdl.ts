import Ajv from 'ajv';
import addFormats from 'ajv-formats';


export class DTDL {
	public static load_example() {
		return {
			'@context': 'dtmi:dtdl:context;4',
			'@id': 'dtmi:com:example:Thermostat;1',
			'@type': 'Interface',
			displayName: 'Thermostat',
			contents: [
				{
					'@type': 'Telemetry',
					name: 'temp',
					schema: 'double'
				},
				{
					'@type': 'Property',
					name: 'setPointTemp',
					writable: true,
					schema: 'double'
				}
			]
		};
	}



	public static escapeString = (str: string) => {
		return str.replace(/"/g, '\\"');
	};

	public static processSchema = (schema: any) => {
		if (!schema['@type']) return '';

		const schemaId = schema['@id'] || `schema_${Math.random().toString(36).substring(2, 9)}`;
		let asp = '';

		switch (schema['@type']) {
			case 'Array':
				const elemSchema =
					typeof schema.elementSchema === 'string'
						? schema.elementSchema
						: schema.elementSchema['@id'] || 'complex_element';

				asp += `schema_array("${schemaId}", "${elemSchema}").\n`;

				if (schema.elementSchema && typeof schema.elementSchema !== 'string') {
					asp += DTDL.processSchema(schema.elementSchema);
				}
				break;

			case 'Enum':
				asp += `schema_enum("${schemaId}", "${schema.valueSchema}").\n`;

				if (schema.enumValues?.length) {
					schema.enumValues.forEach((value) => {
						const enumVal =
							typeof value.enumValue === 'string'
								? `"${DTDL.escapeString(value.enumValue)}"`
								: value.enumValue;

						asp += `enum_value("${schemaId}", "${value.name}", ${enumVal}).\n`;
					});
				}
				break;

			case 'Map':
				if (schema.mapKey && schema.mapValue) {
					const mapValueSchema =
						typeof schema.mapValue.schema === 'string'
							? schema.mapValue.schema
							: schema.mapValue.schema['@id'] || 'complex_value';

					asp +=
						`schema_map("${schemaId}", "${schema.mapKey.name}", "${schema.mapKey.schema}", ` +
						`"${schema.mapValue.name}", "${mapValueSchema}").\n`;

					if (schema.mapValue.schema && typeof schema.mapValue.schema !== 'string') {
						asp += DTDL.processSchema(schema.mapValue.schema);
					}
				}
				break;

			case 'Object':
				asp += `schema_object("${schemaId}").\n`;

				if (schema.fields?.length) {
					schema.fields.forEach((field) => {
						const fieldSchema =
							typeof field.schema === 'string'
								? field.schema
								: field.schema['@id'] || `complex_${field.name}`;

						asp += `object_field("${schemaId}", "${field.name}", "${fieldSchema}").\n`;

						if (field.schema && typeof field.schema !== 'string') {
							asp += DTDL.processSchema(field.schema);
						}
					});
				}
				break;
		}

		return asp;
	};

	public static processProperty = (interfaceId: string, property: any) => {
		const schema =
			typeof property.schema === 'string'
				? property.schema
				: property.schema['@id'] || `complex_${property.name}`;
		let asp = `property("${interfaceId}", "${property.name}", "${schema}").\n`;
		if (property['@id']) {
			asp += `property_id("${interfaceId}", "${property.name}", "${property['@id']}").\n`;
		}
		if (property.displayName) {
			const displayName =
				typeof property.displayName === 'string'
					? property.displayName
					: JSON.stringify(property.displayName);
			asp += `property_display_name("${interfaceId}", "${property.name}", ${displayName}).\n`;
		}

		if (property.description) {
			const description =
				typeof property.description === 'string'
					? property.description
					: JSON.stringify(property.description);
			asp += `property_description("${interfaceId}", "${property.name}", ${description}).\n`;
		}

		if (property.comment) {
			asp += `property_comment("${interfaceId}", "${property.name}", "${property.comment}").\n`;
		}

		if (property.writable) {
			asp += `property_writable("${interfaceId}", "${property.name}").\n`;
		}

		if (property.schema && typeof property.schema !== 'string') {
			asp += DTDL.processSchema(property.schema);
		}

		return asp;
	};

	public static processTelemetry = (interfaceId: string, telemetry: any) => {
		const schema =
			typeof telemetry.schema === 'string'
				? telemetry.schema
				: telemetry.schema['@id'] || `complex_${telemetry.name}`;

		let asp = `telemetry("${interfaceId}", "${telemetry.name}", "${schema}").\n`;

		if (telemetry.schema && typeof telemetry.schema !== 'string') {
			asp += DTDL.processSchema(telemetry.schema);
		}

		return asp;
	};

	public static processRelationship = (interfaceId: string, relationship: any) => {
		let asp = `relationship("${interfaceId}", "${relationship.name}", "${relationship.target}"`;
		asp += ').\n';

		if (relationship.minMultiplicity !== undefined) {
			asp += `minMultiplicity("${interfaceId}", "${relationship.name}", ${relationship.minMultiplicity}).\n`;
		}

		if (relationship.maxMultiplicity !== undefined) {
			asp += `maxMultiplicity("${interfaceId}", "${relationship.name}", ${relationship.maxMultiplicity}).\n`;
		}

		if (relationship.writable) {
			asp += `writable_relationship("${interfaceId}", "${relationship.name}").\n`;
		}

		if (relationship.properties?.length) {
			relationship.properties.forEach((prop) => {
				const propSchema =
					typeof prop.schema === 'string'
						? prop.schema
						: prop.schema['@id'] || `complex_${prop.name}`;

				asp += `relationship_property("${interfaceId}", "${relationship.name}", "${prop.name}", "${propSchema}").\n`;

				if (prop.writable) {
					asp += `writable_relationship_property("${interfaceId}", "${relationship.name}", "${prop.name}").\n`;
				}

				if (prop.schema && typeof prop.schema !== 'string') {
					asp += DTDL.processSchema(prop.schema);
				}
			});
		}

		return asp;
	};

	public static processCommand = (interfaceId: string, command: any) => {
		let asp = `command("${interfaceId}", "${command.name}").\n`;

		if (command.request) {
			const reqSchema =
				typeof command.request.schema === 'string'
					? command.request.schema
					: command.request.schema['@id'] || `complex_${command.request.name}`;

			asp += `command_request("${interfaceId}", "${command.name}", "${command.request.name}", "${reqSchema}").\n`;

			if (command.request.nullable) {
				asp += `command_request_nullable("${interfaceId}", "${command.name}").\n`;
			}

			if (command.request.schema && typeof command.request.schema !== 'string') {
				asp += DTDL.processSchema(command.request.schema);
			}
		}

		if (command.response) {
			const respSchema =
				typeof command.response.schema === 'string'
					? command.response.schema
					: command.response.schema['@id'] || `complex_${command.response.name}`;

			asp += `command_response("${interfaceId}", "${command.name}", "${command.response.name}", "${respSchema}").\n`;

			if (command.response.nullable) {
				asp += `command_response_nullable("${interfaceId}", "${command.name}").\n`;
			}

			if (command.response.schema && typeof command.response.schema !== 'string') {
				asp += DTDL.processSchema(command.response.schema);
			}
		}

		return asp;
	};

	public static processComponent = (interfaceId: string, component: any) => {
		return `component("${interfaceId}", "${component.name}", "${component.schema}").\n`;
	};

	public static processInterface = (iface: any) => {
		if (iface['@type'] !== 'Interface') return '';

		let asp = '';
		asp += `dtdl_interface("${iface['@id']}").\n`;

		if (iface.displayName) {
			const displayName =
				typeof iface.displayName === 'string'
					? iface.displayName
					: Object.values(iface.displayName)[0];
			asp += `displayName("${iface['@id']}", "${DTDL.escapeString(String(displayName))}").\n`;
		}

		if (iface.contents?.length) {
			asp += '';
			iface.contents.forEach((content) => {
				switch (content['@type']) {
					case 'Property':
						asp += DTDL.processProperty(iface['@id'], content);
						break;
					case 'Telemetry':
						asp += DTDL.processTelemetry(iface['@id'], content);
						break;
					case 'Relationship':
						asp += DTDL.processRelationship(iface['@id'], content);
						break;
					case 'Command':
						asp += DTDL.processCommand(iface['@id'], content);
						break;
					case 'Component':
						asp += DTDL.processComponent(iface['@id'], content);
						break;
				}
			});
		}

		if (iface.extends) {
			asp += '';
			const extendsList = Array.isArray(iface.extends) ? iface.extends : [iface.extends];
			extendsList.forEach((ext) => {
				asp += `extends("${iface['@id']}", "${ext}").\n`;
			});
		}

		if (iface.schemas?.length) {
			asp += '';
			iface.schemas.forEach((schema) => {
				asp += DTDL.processSchema(schema);
			});
		}

		return asp + '\n';
	};

	public static generateInferenceRules = () => {
		return `valid_twin(TwinId, InterfaceId) :- dtdl_interface(InterfaceId), twin_type(TwinId, InterfaceId), check_required_properties(TwinId, InterfaceId).
	  check_required_properties(TwinId, InterfaceId) :- property(InterfaceId, PropName, _), has_property(TwinId, PropName, _).
	  valid_relationship(SourceId, TargetId, RelName) :- relationship(InterfaceId, RelName, TargetInterfaceId), twin_type(SourceId, InterfaceId), twin_type(TargetId, TargetInterfaceId), has_relationship(SourceId, RelName, TargetId).
	  implements(TwinId, SuperInterfaceId) :- twin_type(TwinId, InterfaceId), extends(InterfaceId, SuperInterfaceId).
	  implements(TwinId, SuperInterfaceId) :- implements(TwinId, InterfaceId), extends(InterfaceId, SuperInterfaceId).`;
	};

	public static tryToCorrect = async (dtdlinvalid: any) => {
		const response = await fetch('/schema/dtdl.v4.schema.min.json');
		const dtdlSchema = await response.json();

		// TODOintegrate llm correction
		const llmClient = null; // createLLMClient('groq', 0);
		let a = await llmClient.invoke(
			'try to correct this dtdl definition ' +
				JSON.stringify(dtdlinvalid) +
				' based on the dtdl schema ' +
				dtdlSchema +
				' RETURN ONLY THE CORRECT AND VALID JSON. ONLY VALID JSON AND NO OTHER CHARS, need raw JSON (no backticks, no json tag)'
		);

		let b = JSON.parse(JSON.stringify(a[0].kwargs.content));

		console.log(b);
		return b;
	};

	public static validateDtdl = async (dtdlDocument: any, tryCorrect: any) => {
		const ajv: any = new Ajv({ allErrors: true });

		addFormats(ajv);

		const response = await fetch('/schema/dtdl.v4.schema.min.json');

		const dtdlSchema = await response.json();

		const validate: any = ajv.compile(dtdlSchema);

		if (typeof dtdlDocument === 'string') {
			dtdlDocument = JSON.parse(dtdlDocument);
		}

		let valid = false;

		if (Array.isArray(dtdlDocument)) {
			for (const iface of dtdlDocument) {
				if (!validate(iface)) {
					valid = false;
					break;
				} else {
					valid = true;
				}
			}
		} else {
			valid = validate(dtdlDocument);
		}


		if (!valid && tryCorrect) {
			//			let maxCorrectAttempt = 10;
			//			let k = 0;
			//			while (k < maxCorrectAttempt && !valid) {
			//				console.log('Tentativo ', k);
			//				valid = validate(dtdlDocument);
			//				if (!valid) {
			//					dtdlDocument = await DTDL.tryToCorrect(dtdlDocument);
			//				}
			//				k++;
			//			}
		}

		let errors = validate.errors;
		if (!validate.errors) {
			errors = [];
		}

		return { valid, errors };
	};

	public static areValidDTDLbyAzure = async (model: any) => {
		if (!model) {
			console.error('Invalid input: Model is undefined or null');
			return false;
		}

		const interfaces = Array.isArray(model) ? model : [model];

		if (interfaces.length === 0) {
			console.error('Invalid input: Empty model array');
			return false;
		}

		const interfaceMap = new Map<string, any>();

		for (const iface of interfaces) {
			if (!iface || typeof iface !== 'object' || !iface['@type']) {
				console.error('Invalid DTDL element: Missing @type property');
				return false;
			}

			const types = Array.isArray(iface['@type']) ? iface['@type'] : [iface['@type']];
			if (!types.includes('Interface')) {
				console.error(
					'Constraint violation: Top-level element is not an Interface',
					iface['@id'] || '[unnamed]'
				);
				return false;
			}

			if (iface['@id']) {
				interfaceMap.set(iface['@id'], iface);
			} else {
				console.error('Invalid Interface: Missing @id property');
				return false;
			}
		}

		for (const iface of interfaces) {
			if (!Array.isArray(iface.contents)) continue;

			if (
				iface.contents.some((element) => {
					if (!element || typeof element !== 'object' || !element['@type']) return false;
					const elementTypes = Array.isArray(element['@type'])
						? element['@type']
						: [element['@type']];
					return elementTypes.includes('Command');
				})
			) {
				console.error(
					'Constraint violation: Commands are not allowed in DTDL for Azure Digital Twins',
					iface['@id']
				);
				return false;
			}

			const components = iface.contents.filter((element) => {
				if (!element || typeof element !== 'object' || !element['@type']) return false;
				const elementTypes = Array.isArray(element['@type'])
					? element['@type']
					: [element['@type']];
				return elementTypes.includes('Component');
			});

			for (const component of components) {
				const schemaId = component.schema;
				if (typeof schemaId !== 'string') {
					console.error(
						'Constraint violation: Component schema must be a string reference to an interface ID',
						iface['@id']
					);
					return false;
				}

				const referencedInterface = interfaceMap.get(schemaId);
				if (!referencedInterface) {
					continue;
				}

				if (
					Array.isArray(referencedInterface.contents) &&
					referencedInterface.contents.some((element) => {
						if (!element || typeof element !== 'object' || !element['@type']) return false;
						const elementTypes = Array.isArray(element['@type'])
							? element['@type']
							: [element['@type']];
						return elementTypes.includes('Component');
					})
				) {
					console.error(
						'Constraint violation: Only one level of component nesting is allowed',
						iface['@id'],
						schemaId
					);
					return false;
				}
			}

			if (iface.extends) {
				const extendsList = Array.isArray(iface.extends) ? iface.extends : [iface.extends];
				for (const extendId of extendsList) {
					if (typeof extendId !== 'string') {
						console.error(
							'Constraint violation: Interfaces cannot be defined inline, must use ID references',
							iface['@id']
						);
						return false;
					}
				}
			}

			for (const component of components) {
				if (typeof component.schema !== 'string') {
					console.error(
						'Constraint violation: Interfaces cannot be defined inline, must use ID references',
						iface['@id']
					);
					return false;
				}
			}
		}

		return true;
	};

	public static parser = async (dtdlInput: any) => {
		try {
			const dtdl = typeof dtdlInput === 'string' ? JSON.parse(dtdlInput) : dtdlInput;
			const validationResult = await DTDL.validateDtdl(dtdl, false);

			if (!validationResult.valid) {
				return `INVALID ${JSON.stringify(validationResult.errors)}`;
			}

			let aspProgram = '';

			if (Array.isArray(dtdl)) {
				dtdl.forEach((iface) => (aspProgram += DTDL.processInterface(iface)));
			} else {
				aspProgram += DTDL.processInterface(dtdl);
			}

			aspProgram += DTDL.generateInferenceRules();
			return aspProgram;
		} catch (error) {
			return `% Error mapping DTDL to ASP: ${
				error instanceof Error ? error.message : String(error)
			}`;
		}
	};
}
