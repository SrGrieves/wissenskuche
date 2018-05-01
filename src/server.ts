import Koa from 'koa';
import tileResourceRoutes from './routes/tile-resources';
import uuidRoutes from './routes/uuids';
import unitKnowledgeRoutes from './routes/unit-knowledge';
import bodyParser from 'koa-bodyparser';

function startServer(world: any): void {
  console.log('Starting web server');
  const app = new Koa();
  const PORT = process.env.PORT || 8080;

  app.use(async (ctx, next) => {
    ctx.world = world;
    await next();
  });
  app.use(bodyParser());

  app.use(tileResourceRoutes.routes());
  app.use(uuidRoutes.routes());
  app.use(unitKnowledgeRoutes.routes());

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
  });
}

export default startServer;