import Router from 'koa-router';
import Koa from 'koa';
const router = new Router();
import _ from 'lodash';
import * as UnitKnowledge from './unit-knowledge';
import * as TileResources from './tile-resources';
import * as UnitAbilities from './unit-ability';
import * as World from '../domain/world-entities'

router.post('/player/:playerId/commands', processCommand);

async function processCommand(ctx: Koa.Context) {
  let command:World.Command = ctx.request.body;

  if(command.command == "learn")
    await processKnowledgeCommand(ctx);
  else if(command.command == "do") 
    await processAbilityCommand(ctx);
  else
    ctx.status = 400;

}

async function processKnowledgeCommand(ctx: Koa.Context) {
  let command:World.Command = ctx.request.body;
  
  try {
    await UnitKnowledge.attemptToLearn(ctx.world, command);
    ctx.status = 200;
    ctx.body = "You are correct. Knowledge acquired."
  } catch (learnErr) {    
    if(learnErr.name && !isNaN(parseInt(learnErr.name))) {
      ctx.status = parseInt(learnErr.name);
      ctx.body = learnErr.message;
    } else {
      throw learnErr;
    }
  }
}

async function processAbilityCommand(ctx: Koa.Context) {
  let command:World.Command = ctx.request.body;

  try {
    let successMsg = await UnitAbilities.attemptToDo(ctx.world, command);
    ctx.status = 200;
    ctx.body = successMsg;
  }
  catch (abilityErr) {
    if(abilityErr.name && !isNaN(parseInt(abilityErr.name))) {
      ctx.status = parseInt(abilityErr.name);
      ctx.body = abilityErr.message;
    } else {
      throw abilityErr;
    }
  }
}


export default router;