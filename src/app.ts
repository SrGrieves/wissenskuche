process.env.AWS_PROFILE = 'mark';
import AWS from 'aws-sdk';
import {ServiceConfigurationOptions} from 'aws-sdk/lib/service';
import webserver from './server';
const serviceConfigOptions : ServiceConfigurationOptions = {
    region: "us-west-2",
    endpoint: "http://localhost:8000"
  };

start();

async function start() {
  let world: any = {};
  world.physicalMaterials = await loadMaterialDataFromJSON();
  world.knowledge = await loadKnowledgeDataFromJSON();
  world.abilities = await loadAbilityDataFromJSON();
  world.config = { dynamo: serviceConfigOptions, clearDb: true };
  //if(false)
    await createDatabase(world.config );
  webserver(world);
  
}

async function loadMaterialDataFromJSON(): Promise<void> {
  var materialsJson = require('../world_data/material-data.json');
  return materialsJson;
}

async function loadKnowledgeDataFromJSON(): Promise<void> {
  var knowledgeJson = require('../world_data/knowledge-data.json');
  return knowledgeJson;
}

async function loadAbilityDataFromJSON(): Promise<void> {
  var abilityJson = require('../world_data/ability-data.json');
  return abilityJson;
}

async function createDatabase(config: any): Promise<void> {

  let dynamodb = new AWS.DynamoDB(config.dynamo);


  if(config.clearDb) {
    await dynamodb.deleteTable({ TableName : "unit-knowledge"}).promise();
    await dynamodb.deleteTable({ TableName : "unit-ability"}).promise();
  }

  var unitKnowledgeParams = {
    TableName : "unit-knowledge",
    KeySchema: [       
      { AttributeName: "unit", KeyType: "HASH"}  //Partition key
      //,{ AttributeName: "title", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
      { AttributeName: "unit", AttributeType: "S" }      
    ],
    ProvisionedThroughput: {       
      ReadCapacityUnits: 10, 
      WriteCapacityUnits: 10
    }
  };
  
  let unitKnowledgeTableData = await dynamodb.createTable(unitKnowledgeParams).promise();
  console.log("Created unit knowledge table.");

  var unitAbilityParams = {
    TableName : "unit-ability",
    KeySchema: [       
      { AttributeName: "unit", KeyType: "HASH"}  //Partition key
      //,{ AttributeName: "title", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
      { AttributeName: "unit", AttributeType: "S" }      
    ],
    ProvisionedThroughput: {       
      ReadCapacityUnits: 10, 
      WriteCapacityUnits: 10
    }
  };
  
  let unitAbilitData = await dynamodb.createTable(unitAbilityParams).promise();
  console.log("Created unit ability table.");
}


