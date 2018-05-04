import Koa from 'koa';
import TileResourceRoutes from './routes/tile-resources';
import UuidRoutes from './routes/uuids';
import UnitKnowledgeRoutes from './routes/unit-knowledge';
import UnitAbilityRoutes from './routes/unit-ability';
import PlayerCommandsRoutes from './routes/player-commands';
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

  app.use(TileResourceRoutes.routes());
  app.use(UuidRoutes.routes());
  app.use(UnitKnowledgeRoutes.routes());
  app.use(UnitAbilityRoutes.routes());
  app.use(PlayerCommandsRoutes.routes());

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
  });
}

export default startServer;