import _ from 'lodash';
import axios from 'axios';
import * as World from '../domain/world-entities';

export async function getTile(world: World.World, tile: string): Promise<World.Tile> {
  let tileUrl = world.config.get('gaeaReferenceUrlPrefix') + '/tile/' + tile;
  let tileResponse = await axios.get(tileUrl);
  return tileResponse.data as World.Tile;
}

export async function getUnit(world: World.World, player: string, unit: string): Promise<World.Unit> {
  //http://g.carrier.engineering/player/hwX6aOr7/units/BkC4f_gwKM
  let unitUrl = world.config.get('gaeaReferenceUrlPrefix') + '/player/' + player + '/units/' + unit;
  let unitResponse = await axios.get(unitUrl);
  return unitResponse.data as World.Unit;
}