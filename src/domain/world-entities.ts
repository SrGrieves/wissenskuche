import config from 'config'

export interface World {
  physicalMaterials: Material[];
  knowledge: any[];
  abilities: any[];
  config: config.IConfig;
  me?: any;
}

export interface Command {
  unit: string;
  command: string;
}

export interface MoveCommand extends Command {
  fromTile: string;
  toTile: string;
}

export interface LearnCommand extends Command {
  knowledge: string;
  learnQuery: string;
  learnQueryAnswer: string;
}

export interface AbilityCommand extends Command {
  ability: string;
}

export interface Material {
  id: string;
  commonName: string;
  specificName: string;
  type: string;
  description: string;
  qualifiesAs: string[];
  applicableAttributes: string[];
  unitOfMeasurement: string;
  naturalPresenceProbability: NaturalPresenceProbability[];
  requiredKnowledgeForDetection: string[];
  requiredKnowledgeForRecognition: string[];
}

interface NaturalPresenceProbability {
  minAltitude: number;
  maxAltitude: number;
  mean: number;
  stdDev: number;
}

export interface Tile {
  type: string;
  elevation: number;
  id: string;
  neighbors: NeighboringTile[];
  occupants: TileOccupant[];
}

interface TileOccupant {
  id: string;
  type: string;
  tile: string;
  player: string;
}
interface NeighboringTile {
  tile: string;
  bearing: number;
}

export interface Unit {
  id: string;
  type: string;
  tile: string;
  player: string;
}