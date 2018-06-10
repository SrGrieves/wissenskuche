import _ from 'lodash';
import axios from 'axios';
import * as World from '../domain/world-entities';

export async function getTile(world: World.World, tile: string): Promise<World.Tile> {
  let tileUrl = world.config.get('gaeaReferenceUrlPrefix') + '/tile/' + tile;
  console.log('Getting tile from gaea: ' + tileUrl);
  let tileResponse = await axios.get(tileUrl);

  if(tileResponse.status != 200) {
    let msg = 'Failed to fetch tile: ' + tileResponse.status + ': ' + tileResponse.statusText;
    console.error(msg);
    throw new Error(msg);
  } 

  return tileResponse.data as World.Tile;
}

export async function getUnit(world: World.World, player: string, unit: string): Promise<World.Unit> {
  //http://g.carrier.engineering/player/hwX6aOr7/units/BkC4f_gwKM
  let unitUrl = world.config.get('gaeaReferenceUrlPrefix') + '/player/' + player + '/units/' + unit;

  console.log('Getting unit from gaea: ' + unitUrl);
  let unitResponse = await axios.get(unitUrl);

  if(unitResponse.status != 200) {
    let msg = 'Failed to fetch unit: ' + unitResponse.status + ': ' + unitResponse.statusText;
    console.error(msg);
    throw new Error(msg);
  } 

  return unitResponse.data as World.Unit;
}