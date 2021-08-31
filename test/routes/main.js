import Express, { Router } from 'express';

export const routePath = '/';

export function router(app = Router()) {
	app.get('*', (_, res) => res.send('test'));
}