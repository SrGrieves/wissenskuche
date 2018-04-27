process.env.AWS_PROFILE = 'mark';
import AWS from 'aws-sdk';
import {ServiceConfigurationOptions} from 'aws-sdk/lib/service';
import webserver from './server';

start();

async function start() {
  let world: any = {};
  world.materials = await loadMaterialDataFromJSON();
  webserver(world);
  
  //await loadDataIntoDynamo();
}

async function loadMaterialDataFromJSON: Promise<void> {
  var materialsJson = require('../world_data/materialsdata.json');
  return materialsJson;
}

async function loadDataIntoDynamo(): Promise<void> {
  //let s3 = new AWS.S3();
  //let buckets = await s3.listBuckets().promise();
  //console.log(JSON.stringify(buckets.Buckets, null, ' '));

  let serviceConfigOptions : ServiceConfigurationOptions = {
    region: "us-west-2",
    endpoint: "http://localhost:8000"
  };

  let dynamodb = new AWS.DynamoDB(serviceConfigOptions);

  var params = {
    TableName : "Jopkes",
    KeySchema: [       
      { AttributeName: "year", KeyType: "HASH"},  //Partition key
      { AttributeName: "title", KeyType: "RANGE" }  //Sort key
    ],
    AttributeDefinitions: [       
      { AttributeName: "year", AttributeType: "N" },
      { AttributeName: "title", AttributeType: "S" }
    ],
    ProvisionedThroughput: {       
      ReadCapacityUnits: 10, 
      WriteCapacityUnits: 10
    }
  };

  
  let data = await dynamodb.createTable(params).promise();
  console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
}


