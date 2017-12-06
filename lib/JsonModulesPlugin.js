/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
"use strict";

const JsonParser = require("./JsonParser");
const ConcatSource = require("webpack-sources").ConcatSource;

const stringifySafe = data => JSON.stringify(data); // TODO

class JsonModulesPlugin {
	apply(compiler) {
		compiler.hooks.compilation.tap("JsonModulesPlugin", (compilation, {
			normalModuleFactory
		}) => {
			normalModuleFactory.plugin("create-parser json", () => {
				return new JsonParser();
			});
			compilation.moduleTemplates.javascript.plugin("content", (moduleSource, module) => {
				if(module.type && module.type.startsWith("json")) {
					const source = new ConcatSource();
					const data = module.buildInfo.jsonData;
					const x = module.exportsArgument;
					const stringifiedData = stringifySafe(data);
					if(Array.isArray(module.providedExports)) {
						const defaultUsed = module.isUsed("default");
						if(defaultUsed)
							source.add(`var data = ${x}[${JSON.stringify(defaultUsed)}] = ${stringifiedData};\n`);
						for(const exportName of module.providedExports) {
							if(exportName === "default")
								continue;
							const used = module.isUsed(exportName);
							if(used) {
								if(defaultUsed)
									source.add(`${x}[${JSON.stringify(used)}] = data[${JSON.stringify(exportName)}];\n`);
								else
									source.add(`${x}[${JSON.stringify(used)}] = ${stringifySafe(data[exportName])};\n`);
							}
						}
					} else {
						const defaultUsed = module.isUsed("default");
						if(defaultUsed)
							source.add(`${x}[${JSON.stringify(defaultUsed)}] = ${stringifiedData};\n`);
					}
					return source;
				} else {
					return moduleSource;
				}
			});
		});
	}
}

module.exports = JsonModulesPlugin;
