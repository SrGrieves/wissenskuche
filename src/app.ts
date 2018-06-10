import webserver from './server';
import config from 'config';
import * as WorldEntities from './domain/world-entities'


console.log('Starting wissenskuche with settings\n'+JSON.stringify(config,null," "));
start();

async function start() {
  let world: WorldEntities.World = {
    physicalMaterials: await loadMaterialDataFromJSON(),
    knowledge: await loadKnowledgeDataFromJSON(),
    abilities: await loadAbilityDataFromJSON(),
    config: config
  }
  world.me = config.get('me'); //Eventually this should come from some header or token or cookie
  webserver(world);
}

async function loadMaterialDataFromJSON(): Promise<WorldEntities.Material[]> {
  var materialsJson = require('../world_data/material-data.json');
  return materialsJson;
}

async function loadKnowledgeDataFromJSON(): Promise<any[]> {
  var knowledgeJson = require('../world_data/knowledge-data.json');
  return knowledgeJson;
}

async function loadAbilityDataFromJSON(): Promise<any[]> {
  var abilityJson = require('../world_data/ability-data.json');
  return abilityJson;
}

