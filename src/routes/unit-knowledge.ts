import Router from 'koa-router';
import Koa from 'koa';
const router = new Router();
import _ from 'lodash';
import AWS from 'aws-sdk';
import {ServiceConfigurationOptions} from 'aws-sdk/lib/service';
const FuzzyMatching = (require('fuzzy-matching') as any);
const fuzzyMatchMinDistance = 0.4;
const serviceConfigOptions: ServiceConfigurationOptions = { region: "us-west-2", endpoint: "http://localhost:8000" };

router.get('/player/:playerId/units/:unitId/knowledge/', getUnitKnowledgeData);
router.get('/player/:playerId/units/:unitId/learn/:knowledgeId', getKnowledgeQuestion);
router.post('/player/:playerId/units/:unitId/learn/:knowledgeId/answer/:proofId', processQuestionAnswer);

async function getUnitKnowledgeData(ctx: Koa.Context) {
  let unitKnowledge = await getUnitKnowledge(ctx.params.unitId, ctx.world.knowledge);
  let unitKnowledgeIds = unitKnowledge.map(k => k.id);
  let attainableKnowledge = ctx.world.knowledge
    .filter(k => unitKnowledgeIds.indexOf(k.id) == -1)
    .map(k => { return mapKnowledgeRecordToAttainableKnowledgeViewRecord(k, ctx.request.href) });

  ctx.body = { acquiredKnowledge: unitKnowledge, attainableKnowledge: attainableKnowledge };
}

export async function getUnitKnowledge(unit:string, knowledge: any) {
  let defaultKnowledge: any[] = knowledge
                                  .filter(k => { 
                                    return k.proofOfKnowledgeRequirements && 
                                           k.proofOfKnowledgeRequirements.numberOfProofsRequired == 0 })
                                  .map(mapKnowledgeRecordToAcquiredKnowledgeViewRecord);

  let defaultKnowledgeIds: string[] = defaultKnowledge.map(k => k.id);
  let acquiredKnowledgeIds = await getUnitAcquiredKnowledgeIds(unit);
  let acquiredKnowledge: any[] = knowledge.filter(k => acquiredKnowledgeIds.indexOf(k.id) != -1 && defaultKnowledgeIds.indexOf(k.id) == -1);
  let unitKnowledge = defaultKnowledge.concat(acquiredKnowledge.map(mapKnowledgeRecordToAcquiredKnowledgeViewRecord));
  
  return unitKnowledge;
}

async function getUnitAcquiredKnowledgeIds(unit:string): Promise<String[]> {
  let docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);

  let params = {
      TableName: "unit-knowledge",
      KeyConditionExpression: "#unit = :unit",
      ExpressionAttributeNames:{
          "#unit": "unit"
          },
      ExpressionAttributeValues: {
          ":unit":unit
          }
      };
  
  let data = await docClient.query(params).promise();
  //console.log("Fetched data:", JSON.stringify(data, null, 2));

  let knowledgeIds = [];
  if(data && data.Items)
    knowledgeIds = data.Items.map(i => i.knowledge);
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

  if(allMatch) {
    await addKnowledgeToUnit(ctx.params.unitId, ctx.params.knowledgeId);
    ctx.status = 200;
  }
  else {
    ctx.status = 422;
  }
  //ctx.body = ctx.request.body;
}

function mapKnowledgeRecordToAttainableKnowledgeViewRecord(k: any, baseURL: string) {
  return { "id": k.id, "type": k.type, "name": k.name, "learnURI": baseURL .replace('/knowledge','/learn/') + k.id };
}

function mapKnowledgeRecordToAcquiredKnowledgeViewRecord(k: any) {
  return { "id": k.id, "type": k.type, "name": k.name, "unitComments": k.personalDescription, guideReferences: k.subjectReferences };
}

function checkIfWordGroupRequirementMatchesAnswer(answerWords: String[], validAnswerWords: string[]): any {
  let fuzzymatching = new FuzzyMatching(validAnswerWords);
  let possibleMatches = answerWords.map(answerWord => {
    return fuzzymatching.get(answerWord) 
  });

  let validMatches = possibleMatches.filter(v => v.distance >= fuzzyMatchMinDistance);

  return (validMatches.length > 0);
}

async function addKnowledgeToUnit(unit: string, knowledge: string): Promise<void> {

  //let dynamodb = new AWS.DynamoDB(serviceConfigOptions);

  var docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);

  var params = {
    TableName : "unit-knowledge",
    Item:{
        "unit": unit,
        "knowledge": knowledge
    }
  };
  
  let data = await docClient.put(params).promise();
  console.log("Saved data:", JSON.stringify(data, null, 2));
}


export default router;