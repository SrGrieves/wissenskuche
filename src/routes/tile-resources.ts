import Router from 'koa-router';
const router = new Router();
const Ziggurat = (require("../../ziggurat") as any);
const short = (require("short-uuid") as any);
const translator = short();
import _ from 'lodash';
import * as UnitKnowledge from './unit-knowledge';

router.get('/tiles/:tileId/resources', async (ctx) => {
  let tileMaterials = await getResourcesForTile(ctx.params.tileId, ctx.world);
  ctx.body = { tileId: ctx.params.tileId, availableMaterials: tileMaterials };
})

export async function getResourcesForTile(tileId: string, world: any): Promise<any> {

  let unitsOnTile = ["x","y","z"];
  let unitsOnTileKnowledgeArrays: any[] = await Promise.all(unitsOnTile.map(async u => await UnitKnowledge.getUnitKnowledge(u, world)));
  let unitsOnTileKnowledge = _.uniqBy([].concat(...unitsOnTileKnowledgeArrays), k => k.id);
  
  //console.log('Units on tile ' + tileId + ' have combined knowledge ' + JSON.stringify(unitsOnTileKnowledge));

  let tileMaterials = world.physicalMaterials
                        .map(function(material: any) { 
                            return getMaterialForTile(material, tileId, unitsOnTileKnowledge)
                          })
                        .filter(m => m != null)
                        .filter(m => m.amount && m.amount > 0);

  return tileMaterials;
}

function getMaterialForTile(materialDef: any, tileId: string, unitsOnTileKnowledge: any[]) {
  const z = new Ziggurat(stringToDigits(materialDef.id + tileId));
  let randomFromNormal = z.getNextGaussian();
  let altitude = 1; //should fetch this from Joel's api
  let matchedAltitudePresenceProb = materialDef.naturalPresenceProbability
                                      .filter(npp => { 
                                        return altitude >= npp.minAltitude && altitude <= npp.maxAltitude 
                                      });
  let amount: any;
  if(matchedAltitudePresenceProb.length)
    amount = (randomFromNormal * matchedAltitudePresenceProb[0].stdDev) + matchedAltitudePresenceProb[0].mean;
  else
    amount = null;
 
  let unitsOnTileKnowledgeIds = unitsOnTileKnowledge.map(k => k.id);
  //console.log("Units have knowledge " + JSON.stringify(unitsOnTileKnowledgeIds));
  let isDetected = materialDef.requiredKnowledgeForDetection
                      .filter(k => unitsOnTileKnowledgeIds.indexOf(k) == -1)
                      .length == 0;
  //console.log('To recognize ' + materialDef.commonName + ' you need ' + JSON.stringify(materialDef.requiredKnowledgeForDetection) + ': ' + isDetected);
  
  let isRecognized = materialDef.requiredKnowledgeForRecognition
                      .filter(k => unitsOnTileKnowledgeIds.indexOf(k) == -1)
                      .length == 0;
  //console.log('To recognize ' + materialDef.specificName + ' you need ' + JSON.stringify(materialDef.requiredKnowledgeForRecognition) + ': ' + isRecognized);

  let material: any;
  if(isRecognized)
    material = { id: materialDef.id, name: materialDef.specificName, amount: amount, measureUnit: materialDef.unitOfMeasurement, description: materialDef.description, qualifiesAs: materialDef.qualifiesAs }
  else if(isDetected)
    material = { id: materialDef.id, name: materialDef.commonName, amount: amount, measureUnit: materialDef.unitOfMeasurement, qualifiesAs: materialDef.qualifiesAs }
  else
    material = { id: materialDef.id, amount: amount }
  
  return material
}

function stringToDigits(input: string) {
    return input.split('').map(c => c.charCodeAt(0)).reduce((a, b) => a + b, 0);
}

export default router;