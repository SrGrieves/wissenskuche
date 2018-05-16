import Router from 'koa-router';
import Koa from 'koa';
const router = new Router();
import _ from 'lodash';
const FuzzyMatching = (require('fuzzy-matching') as any);
const fuzzyMatchMinDistance = 0.4;
import * as UnitEventRepo from '../repos/unit-event-repo';
import axios from 'axios';
import * as World from '../domain/world-entities';
import * as gaea from '../io/gaea';

router.get('/player/:playerId/units/:unitId/brain/', getUnitKnowledgeData);
router.get('/player/:playerId/knowledge/', getPlayerKnowledge);
router.get('/player/:playerId/units/:unitId/brain/learn/:knowledgeId', getKnowledgeLearning);

async function getUnitKnowledgeData(ctx: Koa.Context) {
  let unitKnowledge = await getUnitKnowledge(ctx.params.unitId, ctx.world);
  let unitKnowledgeIds = unitKnowledge.map(k => k.id);
  let attainableKnowledge = ctx.world.knowledge
    .filter(k => unitKnowledgeIds.indexOf(k.id) == -1)
    .map(k => { return mapKnowledgeRecordToAttainableKnowledgeViewRecord(k, ctx.params.playerId, ctx.params.unitId, ctx.world) });

  ctx.body = { 
    href: ctx.world.config.get('selfReferenceUrlPrefix') + '/player/' + ctx.params.playerId + '/units/' + ctx.params.unitId + '/brain/',
    acquiredKnowledge: unitKnowledge, 
    attainableKnowledge: attainableKnowledge 
  };
}

export async function getUnitKnowledge(unit:string, world: any) {
  let defaultKnowledge: any[] = world.knowledge
                                  .filter(k => { 
                                    return k.proofOfKnowledgeRequirements && 
                                           k.proofOfKnowledgeRequirements.numberOfProofsRequired == 0 })
                                  .map(mapKnowledgeRecordToAcquiredKnowledgeViewRecord);

  let defaultKnowledgeIds: string[] = defaultKnowledge.map(k => k.id);
  let acquiredKnowledgeIds = await getUnitAcquiredKnowledgeIds(unit, world);
  let acquiredKnowledge: any[] = world.knowledge.filter(k => acquiredKnowledgeIds.indexOf(k.id) != -1 && defaultKnowledgeIds.indexOf(k.id) == -1);
  let unitKnowledge = defaultKnowledge.concat(acquiredKnowledge.map(mapKnowledgeRecordToAcquiredKnowledgeViewRecord));
  
  return unitKnowledge;
}

async function getUnitAcquiredKnowledgeIds(unit:string, world: World.World): Promise<String[]> {
  let khistory = (await UnitEventRepo.getUnitEventHistory(unit)).filter(uh => uh.payload.eventName == "acquiredKnowledge");
  let knowledgeIds = khistory.map(kh => kh.payload.knowledge);

  return knowledgeIds;
}

async function getPlayerKnowledge(ctx: Koa.Context) {
  let gUrl1 = ctx.world.config.get('gaeaReferenceUrlPrefix') + '/player/' + ctx.params.playerId;
  let playerName = (await axios.get(gUrl1)).data.name;
  
  let gUrl2 = gUrl1 + '/units/';
  let allUnitsResponse = await axios.get(gUrl2);
  
  let playerUnitIds = allUnitsResponse.data.filter(u => u.player == playerName && u.type == "human").map(u => u.id);

  let playerUnitCombinedKnowledgeTasks = playerUnitIds.map(function(uid) { return getUnitKnowledge(uid, ctx.world) });
  let playerUnitCombinedKnowledgeArrays = await Promise.all(playerUnitCombinedKnowledgeTasks);
  let playerUnitCombinedKnowledge = _.uniqBy([].concat(...playerUnitCombinedKnowledgeArrays), k => k.id);

  ctx.body = { combinedKnowledge: playerUnitCombinedKnowledge };
}

async function getKnowledgeLearning(ctx: Koa.Context) {
  let knowledge = ctx.world.knowledge.filter(k => k.id == ctx.params.knowledgeId)[0];
  let proof = _.sample(knowledge.proofOfKnowledgeRequirements.proofs);
  let world: World.World = ctx.world;
  let unit = ctx.params.unitId;
  let unitInfo = await gaea.getUnit(world, world.me.player, unit);
  if(unitInfo.type != "human") {
    let learnErr = new Error("Only humans can learn.");
    learnErr.name = "400";
    throw learnErr;
  }

  ctx.body = {
    "href": ctx.world.config.get('selfReferenceUrlPrefix') + "/player/" + ctx.params.playerId + "/units/" + ctx.params.unitId + "/brain/learn/" + knowledge.id,
    "knowledgeId": knowledge.id,
    "learnQueryId": proof.id,
    "type": proof.type,
    "query": proof.query,
    "answer": { 
      "href": ctx.world.config.get('selfReferenceUrlPrefix') + "/player/" + ctx.params.playerId + "/commands",
      "rel":["form"], 
      "method": "POST",
      "value": [
        { "name": "command", "value": "learn" },
        { "name": "unit", "value": ctx.params.unitId },
        { "name": "knowledge", "value": knowledge.id },
        { "name": "learnQuery", "value": proof.id },
        { "name": "learnQueryAnswer", "type": "string", "desc": "Provide your answer as a short essay.", "maxlength": 10000 }
      ]
    }
  }
}

export async function attemptToLearn(world: World.World, command: World.LearnCommand): Promise<void> {
  
  let knowledge = world.knowledge.filter(k => k.id == command.knowledge)[0];
  let learnQuery = knowledge.proofOfKnowledgeRequirements.proofs.filter(p => p.id == command.learnQuery)[0];

  if(!command.unit || !command.learnQueryAnswer || !knowledge || !learnQuery) {
    let learnErr = new Error("Invalid learn command. You must provide unit, knowledge, learnQuery and learnQueryAnswer.");
    learnErr.name = "400";
    throw learnErr;
  }

  let unitInfo = await gaea.getUnit(world, world.me.player, command.unit);
  if(unitInfo.type != "human") {
    let learnErr = new Error("Only humans can learn.");
    learnErr.name = "400";
    throw learnErr;
  }

  let answerWords: String[] = command.learnQueryAnswer.split(/[ ,]+/).filter(Boolean);
  let validAnswerWordGroups: [String[]] = learnQuery.responseValidation["required-words"];

  let matches = validAnswerWordGroups.map(validAnswerWords => { return checkIfWordGroupRequirementMatchesAnswer(answerWords, validAnswerWords)});

  let allMatch = (matches.filter(m => m == false).length == 0)

  if(allMatch) {
    await addKnowledgeToUnit(command.unit, command.knowledge, world);
  }
  else {
    let learnErr = new Error("That's not right.");
    learnErr.name = "422";
    throw learnErr;
  }
}

function mapKnowledgeRecordToAttainableKnowledgeViewRecord(k: any, player: string, unit: string, world: any) {
  return { "id": k.id, "type": k.type, "name": k.name, "learn": { href: world.config.get('selfReferenceUrlPrefix') + '/player/' + player + '/units/' + unit + '/brain/learn/' + k.id} };
}

function mapKnowledgeRecordToAcquiredKnowledgeViewRecord(k: any) {
  return { "id": k.id, "type": k.type, "name": k.name, "unitComments": k.personalDescription, guideReferences: k.subjectReferences };
}

function checkIfWordGroupRequirementMatchesAnswer(answerWords: String[], validAnswerWords: String[]): any {
  let fuzzymatching = new FuzzyMatching(validAnswerWords);
  let possibleMatches = answerWords.map(answerWord => {
    return fuzzymatching.get(answerWord) 
  });

  let validMatches = possibleMatches.filter(v => v.distance >= fuzzyMatchMinDistance);

  return (validMatches.length > 0);
}

async function addKnowledgeToUnit(unit: string, knowledge: string, world: any): Promise<void> {
  let unitEvent = { eventName: "acquiredKnowledge", unit: unit, knowledge: knowledge };
  UnitEventRepo.saveUnitEvent(unitEvent);
}

export async function findTotalAvailableMaterialOnTileFor(world: any, tile: string, materialQuery: string) {}


export default router;