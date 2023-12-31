import { write } from 'bun';
import { existsSync, mkdir, mkdirSync, readdirSync, rmdirSync } from 'fs-extra';
import { parse } from 'react-docgen-typescript';

const components = readdirSync('./lib/components');

// Empty the docs directory
rmdirSync('./docs', { recursive: true });
mkdirSync('./docs');

let doc = '';
let comps = '';
let hooks = '';

// Get all components
components.forEach((component) => {
	const filename = `./lib/components/${component}/${component}.tsx`;

	if (existsSync(filename)) {
		const source = parse(filename);
		const output = docgenToMd(source);
		comps += output[0];
		hooks += output[1];
	}
});

doc += `# Components\n\n${comps}\n\n# Hooks\n\n${hooks}`;
await write(`./docs/DOCS.md`, doc);

function docgenToMd(ast: any) {
	let doc = ['', ''];

	console.error(ast);
	ast.forEach((node: any) => {
		if (node.displayName.startsWith('use')) {
			// Hook
			doc[1] += `## [${node.displayName}](../${node.filePath})\n\n${node.description}\n\n`;
			Object.keys(node.tags).forEach((tag: string) => {
				doc[1] += `**${tag}**: ${node.tags[tag]}\n\n`;
			});
			doc[1] += `\n\n`;
		} else {
			// Component
			doc[0] += `## [${node.displayName}](../${node.filePath})\n\n${node.description}\n\n`;
			Object.keys(node.tags).forEach((tag: string) => {
				doc[0] += `**${tag}**: ${node.tags[tag]}\n\n`;
			});
			doc[0] += `\n\n`;


			if (Object.keys(node.props).length > 0) {
				doc[0] += `### Props\n\n` +
				`| Name | Type | Default | Description |\n` +
				`| ---- | ---- | ------- | ----------- |\n` +
				Object.keys(node.props).map((propName: string) => {
					const prop = node.props[propName];
					return `| ${propName} | ${prop.type.name} | ${prop.defaultValue?.value || ''} | ${prop.description.replaceAll('\n','<br/>')} |`;
				}).join('\n') +
				`\n\n`;	
			}
		}
	});

	return doc;
}
