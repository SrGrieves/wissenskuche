const eventstore = (require('eventstore') as any);
let es = eventstore();
es.init();

interface TileEvent {
  eventName: string;
  tile: string;
  material: string;
  amount: Number
}

interface TileEventStreamItem {
  streamId: string;
  aggregateId: string;
  aggregate: string;
  context: string;
  streamRevision: Number;
  commitId: string;
  commitSequence: Number;
  commitStamp: Date
  payload: TileEvent;
}

export async function saveTileEvents(tile: string, events: TileEvent[]) {
  return new Promise(function(resolve, reject) {
    es.getEventStream({ aggregateId: tile, aggregate: 'tile', context: 'universe'} , function(err: any, stream: any) {
      stream.addEvents(events);

      stream.commit(function(err: any, stream: any) {
        if(err) {
          reject(err);
        }
        else {
          console.log("Saved events: " + JSON.stringify(stream.eventsToDispatch)); 
          resolve();
        }
      });
    });
  });
}

export async function getTileEventHistory(tileId: string): Promise<TileEventStreamItem[]> {
  return new Promise<TileEventStreamItem[]>(function(resolve, reject) {
    es.getEventStream({ aggregateId: tileId, aggregate: 'tile', context: 'universe'}, function(err: any, stream: any) {
      if(err) {
          reject(err);
        }
        else {
          var history: TileEventStreamItem[] = stream.events; // the original event will be in events[i].payload
          // myAggregate.loadFromHistory(history);
          resolve(history);
      }
    });
  });
}