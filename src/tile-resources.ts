import Router from 'koa-router';
const router = new Router();
const Ziggurat = (require("../ziggurat") as any);
const short = (require("short-uuid") as any);
const translator = short();

router.get('/tiles/:tileid/resources', async (ctx) => {
  ctx.body = getResourcesForTile(ctx.params.tileid, ctx.world);
})

function getResourcesForTile(tileId: string, world: any): any {
  let tileMaterials = world.materials.map(function(material: any) { return getMaterialForTile(material, tileId)});
 
  return { tileId: tileId, availableMaterials: tileMaterials };
}

function getMaterialForTile(materialDef: any, tileId: string) {
  const z = new Ziggurat(stringToDigits(materialDef.id + tileId));
  let randomFromNormal = z.getNextGaussian();
  let amount = (randomFromNormal * materialDef.naturalPresenceProbability[0].stdDev) + materialDef.naturalPresenceProbability[0].mean;

  return { id: materialDef.id, amount: amount }
}

function stringToDigits(input: string) {
    return input.split('').map(c => c.charCodeAt(0)).reduce((a, b) => a + b, 0);
}

export default router;