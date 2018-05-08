import Router from 'koa-router';
import Koa from 'koa';
const router = new Router();
import _ from 'lodash';
import AWS from 'aws-sdk';
import * as UnitKnowledge from './unit-knowledge';
import * as TileResources from './tile-resources';
import * as UnitEventRepo from '../repos/unit-event-repo';
import * as TileEventRepo from '../repos/tile-event-repo';

router.get('/player/:playerId/units/:unitId/abilities/', getUnitAbilityData);


async function getUnitAbilityData(ctx: Koa.Context) {

  ctx.body = { 
        self: { 
          href: ctx.world.config.get('selfReferenceUrlPrefix') + "/player/" + ctx.params.playerId + "/units/" + ctx.params.unitId + "/abilities",
          rel: [ "collection"]
        },
        unit: ctx.params.unitId,
        value: (await getUnitAbilities(ctx.world, ctx.params.unitId))
                    .map(a => mapAbilityToAcquiredAbilityView(ctx.world, ctx.params.playerId, ctx.params.unitId, a))
      };
}

async function getUnitAbilities(world: any, unit: string): Promise<any[]> {
  let unitKnowledge = await UnitKnowledge.getUnitKnowledge(unit, world);
  let unitKnowledgeIds = unitKnowledge.map(k => k.id);
  let unitAbilities = world.abilities.filter(a => unitHasAllKnowledgeForAbility(unitKnowledgeIds, a));
  return unitAbilities;
}

function unitHasAllKnowledgeForAbility(unitKnowledgeIds: any, ability: any): boolean {
  console.log('Checking if unit has all knowledge for ability ' + ability.name);
  console.log(JSON.stringify(ability.requiredKnowledge) + ' vs ' + JSON.stringify(unitKnowledgeIds));
  let missingKnowledge = ability.requiredKnowledge.filter(rk => unitKnowledgeIds.indexOf(rk) == -1);
  console.log('Missing knowledge = ' + JSON.stringify(missingKnowledge));
  return missingKnowledge.length == 0;
}

function mapAbilityToAcquiredAbilityView(world: any, player: string, unit: string, ability: any) {
  return { 

    id: ability.id, 
    name: ability.name,
    description: ability.description,
    consumes: ability.consumes,
    do: { 
      "href": world.config.get('selfReferenceUrlPrefix') + "/player/" + player + "/commands",
      "rel":["form"], 
      "method": "POST",
      "value": [
        { "name": "command", "value": "do" },
        { "name": "unit", "value": unit },
        { "name": "ability", "value": ability.id },
        
      ]
    }
    }
  }
}


export async function attemptToDo(world: any, command: any): Promise<string> {


  if(!command.ability || !command.unit) {
    let abilityErr = new Error("Invalid command.  You must provide the unit and the ability.");
    abilityErr.name = "400";
    throw abilityErr;
  }

  let ability = world.abilities.filter(k => k.id == command.ability)[0];
  let unitKnowledge = await UnitKnowledge.getUnitKnowledge(command.unit, world);
  let unitTile = 'y';
  let tileResources = await TileResources.getResourcesForTile(unitTile, world, false);
  
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
                                      .map((req: any) => {return tileHasRequiredMaterial(tileResources, req)})
                                      .every(c => c == true);

  if(unitHasAllRequiredKnowledge && tileHasAllRequiredResources) {
    let abilitySuccess = Math.random() <= ability.probabilityOfSuccess;
    let unitEvent = createAbilityEvent(command.unit, ability.id, abilitySuccess);
    UnitEventRepo.saveUnitEvent(unitEvent);

    if(abilitySuccess) {
      let tileEvents = ability.produces.map(
        function(consumption: any) { 
          return createTileResourceChangeEvent(unitTile, consumption.material, consumption.amount)
        });

      if(tileEvents.length)
        TileEventRepo.saveTileEvents(unitTile, tileEvents);
      return ability.successMessage
    } else {
      let abilityErr = new Error(ability.failureMessage);
      abilityErr.name = "422";
      throw abilityErr;
    }

  } else {
    let msg = "You can't. ";
    if(!unitHasAllRequiredKnowledge)
      msg = msg + "You're not smart enough. ";
    if(!tileHasAllRequiredResources)
      msg = msg + "Some stuff is missing. Missing: " + JSON.stringify(ability.requiredMaterials.map(rk => tileResourceIds.indexOf(rk) != -1));

    let abilityErr = new Error(msg);
    abilityErr.name = "422";
    throw abilityErr;
  }                                  
}

function createAbilityEvent(unit: string, ability: string, success: Boolean) {
  return { eventName: "attemptedAbility", unit: unit, ability: ability, abilitySucceeded: success };
}

function createTileResourceChangeEvent(tile: string, material: string, amount: Number) {
  return { eventName: "resourceChanged", tile: tile, material: material, amount: amount }
}

function tileHasRequiredMaterial(tileResources: any, materialRequirement: any) {
  let totalAvailable: Number;
  let foundSome: Boolean;
  //console.log("Looking for " + materialRequirement.consumptionAmount + " of " + materialRequirement.material + " in " + JSON.stringify(tileResources));
  if(materialRequirement.material.indexOf('#') == 0) {
    let matches = tileResources.filter(r => r.qualifiesAs.indexOf(materialRequirement.material) != -1);
    foundSome = matches.length != 0;
    totalAvailable = matches.map(m => m.amount).reduce(add)
  } else {
    let matches = tileResources.filter(r => r.id == materialRequirement.material);
    foundSome = matches.length != 0;
    totalAvailable = matches.map(m => m.amount).reduce(add)
  }

  //console.log("Found some = " + foundSome + ".  Total = " + totalAvailable);

  return foundSome && (totalAvailable >= materialRequirement.consumptionAmount);
}

const add = (a: Number, b: Number): Number => a + b



export default router;