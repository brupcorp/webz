const { urlencoded, json, Router } = require('express');
const express = require('express');
const { createServer } = require('http');
const { join, resolve, extname } = require('path');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
const serveFavicon = require('serve-favicon');
const chalk = require('chalk');

module.exports = function webz({ routeFolder, favicon, notFoundHTML }) {

	if (!routeFolder) throw new Error('a folder containing routes is nessecary!');

	const app = express();
	const server = createServer(app);
	const io = new Server(server, { allowEIO3: true });

	const routes = resolve(routeFolder);

	const log = (...x) => console.log(chalk.green(`[webz]:`), ...x);

	log(chalk.blueBright(chalk`welcome to {bold webz} v1.4!`));

	// middlewares

	app.use(require('morgan')('dev'));
	favicon && app.use(serveFavicon(resolve(favicon)));
	app.use(cookieParser());
	app.use(urlencoded({ extended: true }));
	app.use(json());

	const files = require('fs').readdirSync(routes);

	let activeRoutes = [];

	const moduleLoader = require("esm")(module);

	for (const file of files) {
		if (extname(file) !== '.js') continue;

		const route = moduleLoader(join(routes, file));

		if (route.disabled) continue;

		if (!route.router || !route.routePath) {
			log('file', chalk.redBright(file), chalk.red('is not a valid route file! skipping.'));
			continue;
		}

		if (activeRoutes.includes(route.routePath)) {
			log('file', chalk.redBright(file), chalk.red('tried to register route that already exists:'), route.routePath, 'skipping...');
			continue;
		} else activeRoutes.push(route.routePath);

		const newRouter = Router();
		route.router(newRouter);

		app.use(route.routePath, newRouter);

		log('file', file, 'registered router for', route.routePath)
		if (route.socketio) {
			io.of(route.routePath).on('connection', route.socketio);
			log('file', file, 'registered socketio for namespace', route.routePath);
		}
	}

	if (notFoundHTML)
		app.get('*', (_, res) => res.status(404).sendFile(resolve(notFoundHTML)));
	else
		app.get('*', (_, res) => res.status(404).send('<b>404 Not Found!</b>'));

	return { app, io, server };

}