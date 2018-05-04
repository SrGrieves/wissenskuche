import Router from 'koa-router';
import Koa from 'koa';
const router = new Router();
import _ from 'lodash';
import AWS from 'aws-sdk';
import * as UnitKnowledge from './unit-knowledge';
import * as TileResources from './tile-resources';

router.get('/player/:playerId/units/:unitId/abilities/', getUnitAbilityData);


async function getUnitAbilityData(ctx: Koa.Context) {

  ctx.body = { 
        abilities: ctx.world.abilities.map(mapAbilityToAcquiredAbilityView)
      };
}

function mapAbilityToAcquiredAbilityView(ability: any) {
  return { id: ability.id, name: ability.name }
}

export async function attemptToDo(world: any, command: any): Promise<void> {


  if(!command.ability || !command.unit) {
    let abilityErr = new Error("Invalid command.  You must provide the unit and the ability.");
    abilityErr.name = "400";
    throw abilityErr;
  }

  let ability = world.abilities.filter(k => k.id == command.ability)[0];
  let unitKnowledge = await UnitKnowledge.getUnitKnowledge(command.unit, world);
  let unitTile = 'y';
  let tileResources = await TileResources.getResourcesForTile(unitTile, world);
  
  if(!ability || !unitKnowledge || !tileResources) {
    let abilityErr = new Error("Invalid ability or unit.");
    abilityErr.name = "400";
    throw abilityErr;
  }

  let unitKnowledgeIds = unitKnowledge.map(k => k.id);
  let unitHasAllRequiredKnowledge = ability.requiredKnowledge
                                      .map(rk => unitKnowledgeIds.indexOf(rk) != -1)
                                      .every(c => c == true);
  
  let tileResourceIds = tileResources.map(r => r.id);
  let tileHasAllRequiredResources = ability.requiredMaterials
                                      .map(rr => tileResourceIds.indexOf(rr) != -1)
                                      .every(c => c == true);

  if(unitHasAllRequiredKnowledge && tileHasAllRequiredResources) {

  } else {
    let msg = "You can't. ";
    if(!unitHasAllRequiredKnowledge)
      msg = msg + "You're not smart enough. ";
    if(!tileHasAllRequiredResources)
      msg = msg + " Some stuff is missing. Missing: " + JSON.stringify(ability.requiredMaterials.map(rk => tileResourceIds.indexOf(rk) != -1));

    let abilityErr = new Error(msg);
    abilityErr.name = "422";
    throw abilityErr;
  }                                  
}




export default router;