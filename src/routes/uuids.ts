import Router from 'koa-router';
const router = new Router();
const short = (require("short-uuid") as any);
const translator = short();

router.get('/uuids/', async (ctx) => {
  ctx.body = { "short-uuids" : getSomeShortUUIDs(10) }
})

function getSomeShortUUIDs(howManyUuids: Number): String[] {
  let uuids: String[] = [];

  for(let i = 0; i < howManyUuids; i++) {
    uuids.push(translator.new());
  }

  return uuids;
}


export default router;