import webserver from './server';

start();

async function start() {
  let world: any = {};
  world.physicalMaterials = await loadMaterialDataFromJSON();
  world.knowledge = await loadKnowledgeDataFromJSON();
  world.abilities = await loadAbilityDataFromJSON();
  world.config = {  };
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

