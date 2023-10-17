import chalk from "chalk";

import { mkdirsSync } from "fs-extra";
import { getThemeDestination } from "./asterism";
import { buildFunctionsPhp } from "./files";
import { sync as resolveBin } from 'resolve-bin';

const { log, warn, error } = console;

function watchBlock(name: string) {
	const proc = Bun.spawn(
		[resolveBin('@wordpress/scripts', { executable: 'wp-scripts' }), 'start', '--hot', `--webpack-src-dir=blocks/${name}`, `--output-path=${getThemeDestination()}/blocks/${name}`],
	);
	process.on('SIGINT', (code) => {
		proc.kill();
		proc.kill();
		warn('Cleaned up processes');
		buildAllBlocks().then(() => {
			process.exit(0);
		});	
	});
	return proc.exited;
}

function watchAllBlocks() {
	const proc = Bun.spawn(
		[resolveBin('@wordpress/scripts', { executable: 'wp-scripts' }), 'start', '--hot', `--webpack-src-dir=blocks`, `--output-path=${getThemeDestination()}/blocks/`],
	);
	process.on('SIGINT', (code) => {
		proc.kill();
		proc.kill();
		warn('Cleaned up processes');
		buildAllBlocks().then(() => {
			process.exit(0);
		});	
	});
	return proc.exited;
}

function buildAllBlocks() {
	const proc = Bun.spawn(
		[resolveBin('@wordpress/scripts', { executable: 'wp-scripts' }), 'build', `--webpack-src-dir=blocks`, `--output-path=${getThemeDestination()}/blocks/`],
	);
	return proc.exited;
}

/**
 * Builds the blocks for the project and installs them into the theme, updating
 * the functions.php file as well
 */
export async function buildBlocks({ singleBlock, hot }: { singleBlock?: string, hot?: boolean } = {}) {
	// Ensure blocks directory exists
	mkdirsSync(`${getThemeDestination()}/blocks/`);

	if (hot) {
		log(chalk.bold('Block Hotloading Enabled -- make sure you have added:'));
		log(chalk.bold("  define('SCRIPT_DEBUG', true);"));
		log(chalk.bold('to your wordpress config, or your blocks will not load at all.'));
	}

	try {
		if (hot) {
			if (singleBlock) {
				await watchBlock(singleBlock);
			} else {
				await watchAllBlocks();
			}
		} else {
			await buildAllBlocks();
		}
	} catch (err) {
		error(chalk.bold('Failed to build: ', err));
	}

	await buildFunctionsPhp();
	log(chalk.bold('Blocks successfully build!'));
}