import Router from 'koa-router';
import Koa from 'koa';
const router = new Router();
import _ from 'lodash';
const FuzzyMatching = (require('fuzzy-matching') as any);
const fuzzyMatchMinDistance = 0.4;
import * as UnitEventRepo from '../repos/unit-event-repo';

router.get('/player/:playerId/units/:unitId/knowledge/', getUnitKnowledgeData);
router.get('/player/:playerId/units/:unitId/learn/:knowledgeId', getKnowledgeQuestion);

async function getUnitKnowledgeData(ctx: Koa.Context) {
  let unitKnowledge = await getUnitKnowledge(ctx.params.unitId, ctx.world);
  let unitKnowledgeIds = unitKnowledge.map(k => k.id);
  let attainableKnowledge = ctx.world.knowledge
    .filter(k => unitKnowledgeIds.indexOf(k.id) == -1)
    .map(k => { return mapKnowledgeRecordToAttainableKnowledgeViewRecord(k, ctx.request.href) });

  ctx.body = { acquiredKnowledge: unitKnowledge, attainableKnowledge: attainableKnowledge };
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

async function getUnitAcquiredKnowledgeIds(unit:string, world: any): Promise<String[]> {
  let khistory = (await UnitEventRepo.getUnitEventHistory(unit)).filter(uh => uh.payload.eventName == "acquiredKnowledge");
  let knowledgeIds = khistory.map(kh => kh.payload.knowledge);

  return knowledgeIds;
}

async function getKnowledgeQuestion(ctx: Koa.Context) {
  let knowledge = ctx.world.knowledge.filter(k => k.id == ctx.params.knowledgeId)[0];
  let proof = _.sample(knowledge.proofOfKnowledgeRequirements.proofs);
  ctx.body = {
    "query-id": proof.id,
    "type": proof.type,
    "query": proof.query,
    "answerPostURI": ctx.request.href + "/answer/" + proof.id
  }
}

export async function attemptToLearn(world: any, command: any): Promise<void> {
  
  let knowledge = world.knowledge.filter(k => k.id == command.knowledge)[0];
  let knowledgeQuery = knowledge.proofOfKnowledgeRequirements.proofs.filter(p => p.id == command.knowledgeQuery)[0];
  
  if(!command.knowledgeQueryAnswer || !knowledge || !knowledgeQuery) {
    let learnErr = new Error("Invalid learn command. You must provide knowledge, knowledgeQuery and knowledgeQueryAnswer.");
    learnErr.name = "400";
    throw learnErr;
  }

  let answerWords: String[] = command.knowledgeQueryAnswer.split(/[ ,]+/).filter(Boolean);
  let validAnswerWordGroups: [String[]] = knowledgeQuery.responseValidation["required-words"];

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

function mapKnowledgeRecordToAttainableKnowledgeViewRecord(k: any, baseURL: string) {
  return { "id": k.id, "type": k.type, "name": k.name, "learnURI": baseURL .replace('/knowledge','/learn/') + k.id };
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