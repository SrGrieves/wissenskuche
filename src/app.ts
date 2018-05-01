process.env.AWS_PROFILE = 'mark';
import AWS from 'aws-sdk';
import {ServiceConfigurationOptions} from 'aws-sdk/lib/service';
import webserver from './server';

start();

async function start() {
  let world: any = {};
  world.physicalMaterials = await loadMaterialDataFromJSON();
  world.knowledge = await loadKnowledgeDataFromJSON();
  //if(false)
    await createDatabase(true);
  webserver(world);
  
}

async function loadMaterialDataFromJSON(): Promise<void> {
  var materialsJson = require('../world_data/material-data.json');
  return materialsJson;
}

async function loadKnowledgeDataFromJSON(): Promise<void> {
  var materialsJson = require('../world_data/knowledge-data.json');
  return materialsJson;
}

async function createDatabase(deleteExisting?: boolean): Promise<void> {

  let serviceConfigOptions : ServiceConfigurationOptions = {
    region: "us-west-2",
    endpoint: "http://localhost:8000"
  };

  let dynamodb = new AWS.DynamoDB(serviceConfigOptions);


  if(deleteExisting) {
    var deleteParams = {
      TableName : "unit-knowledge"
    };

    await dynamodb.deleteTable(deleteParams).promise();
  }

  var params = {
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
  
  let data = await dynamodb.createTable(params).promise();
  console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
}


