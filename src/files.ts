import path from 'path';

import { copySync, readdirSync } from "fs-extra";
import { getTheme, getThemeDestination, writePluginFile, writeThemeFile } from "./asterism";
import chalk from 'chalk';
import { blockGutenbergOnClient, generateAllowBlocks, generateOmitBlocks } from './addons/block-control';
import { getThemeBlocks } from './blocks';
import { generateDestyles } from './addons/destyle';
import { buildPluginPhp, generatePostTypes } from './plugin';
import { loadStylesPhp } from './styles';
import { buildJsPhp } from './scripts';

const { log, error } = console;

/**
 * Copies theme files, as well as handles special cases.
 */
export async function copyThemeFiles() {
	try {
		const files = readdirSync('./theme');

		files.forEach((file) => {
			const sourcePath = path.resolve(`./theme/${file}`);
			const destinationPath = `${getThemeDestination()}/${file}`;

			// We generate functions.php during block build, so this needs to be skipped
			if (file === 'functions.php') return;
			
			copySync(sourcePath, destinationPath);
			log(chalk.gray(`Copied file: ${file}`));
		});

		log(chalk.bold('Theme files successfully copied.'));
	} catch (err) {
		console.error(err);
	}
}

/**
 * Copies theme assets.
 */
export async function copyThemeAssets() {
	try {
		const files = readdirSync('./assets');

		files.forEach((file) => {
			const sourcePath = path.resolve(`./assets/${file}`);
			const destinationPath = `${getThemeDestination('/assets')}/${file}`;			

			copySync(sourcePath, destinationPath);
			log(chalk.gray(`Copied file: ${file}`));
		});

		log(chalk.bold('Theme files successfully copied.'));
	} catch (err) {
		console.error(err);
	}
}


export async function buildFunctionsPhp() {
	const theme = getTheme();
	var functionsPhp = buildBlocksPhp();

	if (theme.allow) {
		functionsPhp += `\n\n${generateAllowBlocks([...theme.allow, ...getThemeBlocks()])}`;
	}

	if (theme.exclude) {
		functionsPhp += `\n\n${generateOmitBlocks([...theme.exclude])}`;
	}

	if (theme.advanced?.noGutenbergFrontend) {
		functionsPhp += `\n\n${blockGutenbergOnClient()}`;
	}

	if (theme.noStyle) {
		functionsPhp += `\n\n${generateDestyles(theme.noStyle)}`;
	}

	if (theme.styles) {
		functionsPhp += `\n\n${loadStylesPhp(theme.styles)}`;
	}

	functionsPhp += buildJsPhp();

	if (theme.isBlockOnly) {
		functionsPhp = '<?php\n' + functionsPhp;
		log(chalk.gray(`Generated file: blocks.php`));
		log(chalk.bold('blocks.php successfully generated.'));
		return writeThemeFile('blocks.php', functionsPhp);
	} else {
		functionsPhp = await Bun.file('./theme/functions.php').text() + functionsPhp;
		log(chalk.gray(`Generated file: functions.php`));
		log(chalk.bold('functions.php successfully generated.'));
		return writeThemeFile('functions.php', functionsPhp);
	}
}

export async function buildPlugin() {
	const theme = getTheme();
	var pluginPhp = '<?php\n' + buildPluginPhp();

	if (theme.postTypes) {
		log(chalk.gray('Building companion plugin. This is an experimental feature.'));

		if (theme.postTypes) {
			try {
				pluginPhp += `\n\n${generatePostTypes(theme.postTypes, theme.textDomain)}`;
			} catch (E) {
				throw Error('Failed to generate post types.');
			}

			log(chalk.bold('Plugin successfully built.'));
			return writePluginFile(`${theme.themeFolder}.php`, pluginPhp);
		}
	} else {
		log(chalk.bold('No plugin content detected. Skipping plugin build.'));
	}
}

function buildBlocksPhp(): string {
	var functionsPhp = "\nadd_action('init', function() {";
	try {
		const folders = readdirSync('./blocks', { withFileTypes: true })
			.filter(file => file.isDirectory())
			.map(folder => folder.name);

		folders.forEach((folder) => {
			functionsPhp += `\n  register_block_type(__DIR__  . '/blocks/${folder}/block.json');`
		});

		functionsPhp += '\n});';
	} catch (err) {
		error(chalk.bold('Failed to build: ', err));
	}
	return functionsPhp;
}

