import Router from 'koa-router';
import Koa from 'koa';
const router = new Router();
import _ from 'lodash';
const FuzzyMatching = (require('fuzzy-matching') as any);
const fuzzyMatchMinDistance = 0.4;

router.get('/player/:playerId/units/:unitId/knowledge/', getUnitKnowledge);
router.get('/player/:playerId/units/:unitId/learn/:knowledgeId', getKnowledgeQuestion);
router.post('/player/:playerId/units/:unitId/learn/:knowledgeId/answer/:proofId', processQuestionAnswer);

async function getUnitKnowledge(ctx: Koa.Context) {
  let unitKnowledge = ctx.world.knowledge
    .filter(k => { 
      return k.proofOfKnowledgeRequirements && k.proofOfKnowledgeRequirements.numberOfProofsRequired == 0 })
    .map(mapKnowledgeRecordToAcquiredKnowledgeViewRecord);

  let unitKnowledgeIds = unitKnowledge.map(k => k.id);
  let attainableKnowledge = ctx.world.knowledge
    .filter(k => unitKnowledgeIds.indexOf(k.id) == -1)
    .map(k => { return mapKnowledgeRecordToAttainableKnowledgeViewRecord(k, ctx.request.href) });

  ctx.body = { acquiredKnowledge: unitKnowledge, attainableKnowledge: attainableKnowledge };
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

async function processQuestionAnswer(ctx: Koa.Context) {
  let answer = ctx.request.body.answer;
  let knowledge = ctx.world.knowledge.filter(k => k.id == ctx.params.knowledgeId)[0];
  let question = knowledge.proofOfKnowledgeRequirements.proofs.filter(p => p.id == ctx.params.proofId)[0];
  if(!answer || !knowledge || !question) {
    ctx.status = 400;
    return;
  }

  let answerWords: String[] = answer.split(/[ ,]+/).filter(Boolean);
  let validAnswerWordGroups: [String[]] = question.responseValidation["required-words"];

  let matches = validAnswerWordGroups.map(validAnswerWords => { return checkIfWordGroupRequirementMatchesAnswer(answerWords, validAnswerWords)});

  let allMatch = (matches.filter(m => m == false).length == 0)

  if(allMatch)
    ctx.status = 200;
  else
    ctx.status = 422;

  //ctx.body = ctx.request.body;
}

function mapKnowledgeRecordToAttainableKnowledgeViewRecord(k: any, baseURL: string) {
  return { "id": k.id, "type": k.type, "name": k.name, "learnURI": baseURL .replace('/knowledge','/learn/') + k.id };
}

function mapKnowledgeRecordToAcquiredKnowledgeViewRecord(k: any) {
  return { "id": k.id, "type": k.type, "name": k.name, "comments": k.personalDescription };
}

function checkIfWordGroupRequirementMatchesAnswer(answerWords: String[], validAnswerWords: string[]): any {
  let fuzzymatching = new FuzzyMatching(validAnswerWords);
  let possibleMatches = answerWords.map(answerWord => {
    return fuzzymatching.get(answerWord) 
  });

  let validMatches = possibleMatches.filter(v => v.distance >= fuzzyMatchMinDistance);

  return (validMatches.length > 0);
}


export default router;