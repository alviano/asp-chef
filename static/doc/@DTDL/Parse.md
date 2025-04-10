The **@DTDL/Parse** operation rewrites the Digital Twin stored in `__base64__` and defined using DTDLv4 in terms of ASP facts.

The Digital Twin is expected to be Base64-encoded.
Facts are put in the same predicate, as a single Base64-encoded content.
You can use **Search Models** or other ingredients to process such facts (for example, to combine them with an ASP program).

Refer https://github.com/Azure/opendigitaltwins-dtdl/blob/master/DTDL/v4/DTDL.v4.md for details of DTDL.

§§§§

Let's consider the first example from the documentation:
```json
{
  "@context": "dtmi:dtdl:context;4",
  "@id": "dtmi:com:example:Thermostat;1",
  "@type": "Interface",
  "displayName": "Thermostat",
  "contents": [
    {
      "@type": "Telemetry",
      "name": "temp",
      "schema": "double"
    },
    {
      "@type": "Property",
      "name": "setPointTemp",
      "writable": true,
      "schema": "double"
    }
  ]
}
```

If we store the above content in an **Encode** ingredient, and after that we add a **@DTDL/Parse** ingredient, we obtain (a Base64-encoded fact encoding) the following facts:
```asp
interface("dtmi:com:example:Thermostat;1").
interface("dtmi:com:example:Thermostat;1", displayName, "Thermostat").
has_telemetry("dtmi:com:example:Thermostat;1", "temp", ("dtmi:com:example:Thermostat;1", "temp")).
telemetry(("dtmi:com:example:Thermostat;1", "temp")).
schema(("dtmi:com:example:Thermostat;1", "temp"), "double").
has_property("dtmi:com:example:Thermostat;1", "setPointTemp", ("dtmi:com:example:Thermostat;1", "setPointTemp")).
property(("dtmi:com:example:Thermostat;1", "setPointTemp")).
schema(("dtmi:com:example:Thermostat;1", "setPointTemp"), "double").
property(("dtmi:com:example:Thermostat;1", "setPointTemp"), writable).
```

Add a **Search Models** ingredient to effectively add the above atoms to the processed interpretation, and after that just play with other ingredients.
For example, a graphical representation can be obtained combining **Encode** and **@vis.js/Network** (using multi-stage expansion):
```asp
{
  data: {
    nodes: [
      {{= {{f"{ id: "${I}", label: "{{= Name : interface("${I}", displayName, Name) }}", group: "interface" }"}} : interface(I) }}
      {{= {{f"{ id: '${P}', label: "{{= S : schema(${P}, S) }}", group: "property" }"}} : property(P) }}
      {{= {{f"{ id: '${T}', label: "{{= S : schema(${T}, S) }}", group: "telemetry" }"}} : telemetry(T) }}
      {{= {{f"{ id: '${C}', label: "{{= S : command(${C}, request, S) }} => {{= S : command(${C}, response, S) }}", group: "command" }"}} : command(C) }}
      {{= {{f"{ id: '${C}', label: "{{= S : schema(${C}, S) }}", group: "component" }"}} : component(C) }}
      {{= {{f"{ id: '${R}', group: "relationship" }"}} : relationship(R) }}
    ],
    edges: [
      {{= {{f"{ from: '${I}', to: '${P}', label: '${Name}', arrows: 'to' }"}} : has_property(I,Name,P) }}
      {{= {{f"{ from: '${I}', to: '${T}', label: '${Name}', arrows: 'to' }"}} : has_telemetry(I,Name,T) }}
      {{= {{f"{ from: '${I}', to: '${C}', label: '${Name}', arrows: 'to' }"}} : has_command(I,Name,C) }}
      {{= {{f"{ from: '${I}', to: '${C}', label: '${Name}', arrows: 'to' }"}} : has_component(I,Name,C) }}
      {{= {{f"{ from: '${I}', to: '${R}', label: '${Name}', arrows: 'to' }"}} : has_relationship(I,Name,R) }}
    ],
  },
  options: {
    nodes: {
      shape: "dot",
      size: 20,
      font: {
        size: 16,
      },
      borderWidth: 2,
      shadow: true,
    },
    edges: {
      width: 2,
      shadow: true,
    },
    groups: {
      interface: {
        font: { size: 24 },
        size: 30,
        color: { background: lightgreen, border: green },
      },
      property: {
        color: { background: yellow, border: orange },
      },
      telemetry: {
        color: { background: pink, border: red },
      },
      command: {
        color: { background: violet, border: purple }
      },
      component: {
        color: { background: white, border: gray }
      },
      relationship: {
        color: { background: lightblue, border: blue }
      },
    },
  },
}
```

Here is a larger example:
```json
[
	{
		"@id": "dtmi:agriculture:vineyard:VineyardProperty;1",
		"@type": "Interface",
		"@context": "dtmi:dtdl:context;4",
		"displayName": "Vineyard Property",
		"description": "Represents the entire wine property with multiple vineyard plots",
		"contents": [
			{
				"@type": "Property",
				"name": "name",
				"schema": "string",
				"description": "Name of the wine property",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "owner",
				"schema": "string",
				"description": "Owner of the wine business",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "totalArea",
				"schema": "double",
				"description": "Total area of the property in hectares",
				"writable": true,
				"unit": {
					"@type": "Unit",
					"symbol": "ha",
					"name": "hectare"
				},
				"semiotics": {
					"@type": "Semantic",
					"type": "area"
				}
			},
			{
				"@type": "Property",
				"name": "elevation",
				"schema": "double",
				"description": "Average elevation of the property",
				"writable": true,
				"unit": {
					"@type": "Unit",
					"symbol": "m",
					"name": "metre"
				},
				"semiotics": {
					"@type": "Semantic",
					"type": "height"
				}
			},
			{
				"@type": "Property",
				"name": "location",
				"schema": {
					"@type": "Object",
					"fields": [
						{
							"name": "latitude",
							"schema": "double"
						},
						{
							"name": "longitude",
							"schema": "double"
						}
					]
				},
				"description": "Geographic coordinates of the property",
				"writable": true
			},
			{
				"@type": "Relationship",
				"name": "hasVineyardPlots",
				"target": "dtmi:agriculture:vineyard:VineyardPlot;1",
				"maxMultiplicity": 100,
				"description": "Vineyard plots within the property",
				"writable": true
			},
			{
				"@type": "Relationship",
				"name": "hasWeatherStation",
				"target": "dtmi:agriculture:vineyard:WeatherStation;1",
				"maxMultiplicity": 1,
				"description": "Main weather station of the property",
				"writable": true
			},
			{
				"@type": "Relationship",
				"name": "hasWinery",
				"target": "dtmi:agriculture:vineyard:Winery;1",
				"maxMultiplicity": 1,
				"description": "Winery associated with the property",
				"writable": true
			}
		]
	},

	{
		"@id": "dtmi:agriculture:vineyard:PestTrap;1",
		"@type": "Interface",
		"@context": "dtmi:dtdl:context;4",
		"displayName": "Pest Trap",
		"description": "Represents a smart pest trap for monitoring insect activity",
		"contents": [
			{
				"@type": "Property",
				"name": "trapId",
				"schema": "string",
				"description": "Unique identifier of the trap",
				"writable": false
			},
			{
				"@type": "Property",
				"name": "targetPest",
				"schema": "string",
				"description": "Type of pest this trap is designed to catch",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "installationDate",
				"schema": "dateTime",
				"description": "Date when the trap was installed",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "batteryLevel",
				"schema": "double",
				"description": "Current battery level of the trap",
				"writable": false
			},
			{
				"@type": "Relationship",
				"name": "installedIn",
				"target": "dtmi:agriculture:vineyard:VineyardPlot;1",
				"maxMultiplicity": 1,
				"description": "Vineyard plot where the trap is installed",
				"writable": true
			},
			{
				"@type": "Telemetry",
				"name": "pestCount",
				"schema": "integer",
				"description": "Number of pests caught"
			},
			{
				"@type": "Telemetry",
				"name": "lastCaptureTime",
				"schema": "dateTime",
				"description": "Timestamp of the last pest capture"
			},
			{
				"@type": "Command",
				"name": "resetCount",
				"description": "Reset the pest count to zero"
			},
			{
				"@type": "Command",
				"name": "captureImage",
				"description": "Capture an image of the trap contents",
				"response": {
					"name": "result",
					"schema": {
						"@type": "Object",
						"fields": [
							{
								"name": "success",
								"schema": "boolean"
							},
							{
								"name": "imageId",
								"schema": "string"
							}
						]
					}
				}
			}
		]
	},

	{
		"@id": "dtmi:agriculture:vineyard:SoilMoistureSensor;1",
		"@type": "Interface",
		"@context": "dtmi:dtdl:context;4",
		"displayName": "Soil Moisture Sensor",
		"description": "Represents a smart soil moisture and nutrient sensor for vineyard monitoring",
		"contents": [
			{
				"@type": "Property",
				"name": "sensorId",
				"schema": "string",
				"description": "Unique identifier of the soil sensor",
				"writable": false
			},
			{
				"@type": "Property",
				"name": "installationDepth",
				"schema": "double",
				"description": "Depth at which the sensor is installed",
				"writable": true,
				"unit": {
					"@type": "Unit",
					"symbol": "cm",
					"name": "centimeter"
				}
			},
			{
				"@type": "Property",
				"name": "installationDate",
				"schema": "dateTime",
				"description": "Date when the sensor was installed",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "batteryLevel",
				"schema": "double",
				"description": "Current battery level of the sensor",
				"writable": false,
				"unit": {
					"@type": "Unit",
					"symbol": "%",
					"name": "percentage"
				}
			},
			{
				"@type": "Relationship",
				"name": "installedIn",
				"target": "dtmi:agriculture:vineyard:VineyardPlot;1",
				"maxMultiplicity": 1,
				"description": "Vineyard plot where the sensor is installed",
				"writable": true
			},
			{
				"@type": "Telemetry",
				"name": "soilMoisture",
				"schema": "double",
				"description": "Current soil moisture level",
				"unit": {
					"@type": "Unit",
					"symbol": "%",
					"name": "percentage"
				}
			},
			{
				"@type": "Telemetry",
				"name": "soilTemperature",
				"schema": "double",
				"description": "Current soil temperature",
				"unit": {
					"@type": "Unit",
					"symbol": "°C",
					"name": "celsius"
				}
			},
			{
				"@type": "Telemetry",
				"name": "nitrogenLevel",
				"schema": "double",
				"description": "Current nitrogen level in soil",
				"unit": {
					"@type": "Unit",
					"symbol": "ppm",
					"name": "parts per million"
				}
			},
			{
				"@type": "Telemetry",
				"name": "pHLevel",
				"schema": "double",
				"description": "Current pH level of soil"
			},
			{
				"@type": "Command",
				"name": "calibrate",
				"description": "Calibrate the soil moisture sensor"
			},
			{
				"@type": "Command",
				"name": "setSamplingRate",
				"description": "Set the frequency of readings",
				"request": {
					"name": "rate",
					"schema": "integer",
					"description": "Sampling rate in minutes"
				}
			}
		]
	},

	{
		"@id": "dtmi:agriculture:vineyard:IrrigationController;1",
		"@type": "Interface",
		"@context": "dtmi:dtdl:context;4",
		"displayName": "Irrigation Controller",
		"description": "Represents a smart irrigation system for vineyard plots",
		"contents": [
			{
				"@type": "Property",
				"name": "controllerId",
				"schema": "string",
				"description": "Unique identifier of the irrigation controller",
				"writable": false
			},
			{
				"@type": "Property",
				"name": "model",
				"schema": "string",
				"description": "Model of the irrigation controller",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "installationDate",
				"schema": "dateTime",
				"description": "Date when the controller was installed",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "waterSource",
				"schema": "string",
				"description": "Source of water for irrigation",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "operatingStatus",
				"schema": {
					"@type": "Enum",
					"valueSchema": "string",
					"enumValues": [
						{
							"name": "operational",
							"displayName": "Operational",
							"enumValue": "operational"
						},
						{
							"name": "maintenance",
							"displayName": "Under Maintenance",
							"enumValue": "maintenance"
						},
						{
							"name": "error",
							"displayName": "Error",
							"enumValue": "error"
						},
						{
							"name": "disabled",
							"displayName": "Disabled",
							"enumValue": "disabled"
						}
					]
				},
				"description": "Current operational status of the controller",
				"writable": true
			},
			{
				"@type": "Relationship",
				"name": "controlsPlot",
				"target": "dtmi:agriculture:vineyard:VineyardPlot;1",
				"maxMultiplicity": 10,
				"description": "Vineyard plots controlled by this irrigation system",
				"writable": true
			},
			{
				"@type": "Relationship",
				"name": "connectedSensors",
				"target": "dtmi:agriculture:vineyard:SoilMoistureSensor;1",
				"maxMultiplicity": 20,
				"description": "Soil moisture sensors connected to this controller",
				"writable": true
			},
			{
				"@type": "Telemetry",
				"name": "waterFlow",
				"schema": "double",
				"description": "Current water flow rate",
				"unit": {
					"@type": "Unit",
					"symbol": "L/min",
					"name": "liters per minute"
				}
			},
			{
				"@type": "Telemetry",
				"name": "totalWaterUsed",
				"schema": "double",
				"description": "Total water used in current cycle",
				"unit": {
					"@type": "Unit",
					"symbol": "L",
					"name": "liters"
				}
			},
			{
				"@type": "Telemetry",
				"name": "lastIrrigationTime",
				"schema": "dateTime",
				"description": "Time of last irrigation"
			},
			{
				"@type": "Command",
				"name": "startIrrigation",
				"description": "Start irrigation cycle",
				"request": {
					"name": "duration",
					"schema": "integer",
					"description": "Duration in minutes"
				}
			},
			{
				"@type": "Command",
				"name": "stopIrrigation",
				"description": "Stop the current irrigation cycle"
			},
			{
				"@type": "Command",
				"name": "scheduleIrrigation",
				"description": "Schedule a future irrigation",
				"request": {
					"name": "schedule",
					"schema": {
						"@type": "Object",
						"fields": [
							{
								"name": "startTime",
								"schema": "dateTime"
							},
							{
								"name": "duration",
								"schema": "integer"
							},
							{
								"name": "plotIds",
								"schema": {
									"@type": "Array",
									"elementSchema": "string"
								}
							}
						]
					}
				}
			}
		]
	},

	{
		"@id": "dtmi:agriculture:vineyard:GrapeMonitor;1",
		"@type": "Interface",
		"@context": "dtmi:dtdl:context;4",
		"displayName": "Grape Monitor",
		"description": "Advanced device for monitoring grape development and ripeness",
		"contents": [
			{
				"@type": "Property",
				"name": "monitorId",
				"schema": "string",
				"description": "Unique identifier of the grape monitor",
				"writable": false
			},
			{
				"@type": "Property",
				"name": "grapeVariety",
				"schema": "string",
				"description": "Variety of grapes being monitored",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "installationDate",
				"schema": "dateTime",
				"description": "Date when the monitor was installed",
				"writable": true
			},
			{
				"@type": "Property",
				"name": "batteryLevel",
				"schema": "double",
				"description": "Current battery level of the monitor",
				"writable": false,
				"unit": {
					"@type": "Unit",
					"symbol": "%",
					"name": "percentage"
				}
			},
			{
				"@type": "Property",
				"name": "cameraResolution",
				"schema": "string",
				"description": "Resolution of the integrated camera",
				"writable": true
			},
			{
				"@type": "Relationship",
				"name": "monitoringPlot",
				"target": "dtmi:agriculture:vineyard:VineyardPlot;1",
				"maxMultiplicity": 1,
				"description": "Vineyard plot being monitored",
				"writable": true
			},
			{
				"@type": "Telemetry",
				"name": "berrySize",
				"schema": "double",
				"description": "Average size of monitored grape berries",
				"unit": {
					"@type": "Unit",
					"symbol": "mm",
					"name": "millimeter"
				}
			},
			{
				"@type": "Telemetry",
				"name": "sugarContent",
				"schema": "double",
				"description": "Estimated sugar content (Brix)",
				"unit": {
					"@type": "Unit",
					"symbol": "°Bx",
					"name": "degrees Brix"
				}
			},
			{
				"@type": "Telemetry",
				"name": "acidity",
				"schema": "double",
				"description": "Estimated acidity level",
				"unit": {
					"@type": "Unit",
					"symbol": "g/L",
					"name": "grams per liter"
				}
			},
			{
				"@type": "Telemetry",
				"name": "colorIndex",
				"schema": "double",
				"description": "Color index of grape skin (maturity indicator)"
			},
			{
				"@type": "Telemetry",
				"name": "estimatedHarvestDate",
				"schema": "dateTime",
				"description": "AI-predicted optimal harvest date"
			},
			{
				"@type": "Command",
				"name": "captureImage",
				"description": "Capture image of grape clusters",
				"response": {
					"name": "result",
					"schema": {
						"@type": "Object",
						"fields": [
							{
								"name": "success",
								"schema": "boolean"
							},
							{
								"name": "imageId",
								"schema": "string"
							}
						]
					}
				}
			},
			{
				"@type": "Command",
				"name": "analyzeSamples",
				"description": "Run full analysis on grape samples"
			},
			{
				"@type": "Command",
				"name": "updateAIModel",
				"description": "Update the AI prediction model with latest data"
			}
		]
	}
]
```