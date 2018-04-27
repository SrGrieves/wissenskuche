import Koa from 'koa';
import resourceRoutes from './tile-resources';

function startServer(world: any): void {
  console.log('Starting web server');
  const app = new Koa();
  const PORT = process.env.PORT || 8080;

  app.use(async (ctx, next) => {
    ctx.world = world;
    await next();
  });

  app.use(resourceRoutes.routes());

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
  });
}

export default startServer;