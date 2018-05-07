const eventstore = (require('eventstore') as any);
let es = eventstore();
es.init();

interface UnitEvent {
  eventName: string;
  unit: string;
  knowledge?: string;
  ability?: string;
  abilitySucceeded?: Boolean
}

interface UnitEventStreamItem {
  streamId: string;
  aggregateId: string;
  aggregate: string;
  context: string;
  streamRevision: Number;
  commitId: string;
  commitSequence: Number;
  commitStamp: Date
  payload: UnitEvent;
}

export async function saveUnitEvent(event: UnitEvent) {
  return new Promise(function(resolve, reject) {
    es.getEventStream({ aggregateId: event.unit, aggregate: 'unit', context: 'universe'} , function(err: any, stream: any) {
      stream.addEvent(event);

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

export async function getUnitEventHistory(unitId: string): Promise<UnitEventStreamItem[]> {
  return new Promise<UnitEventStreamItem[]>(function(resolve, reject) {
    es.getEventStream({ aggregateId: unitId, aggregate: 'unit', context: 'universe'}, function(err: any, stream: any) {
      if(err) {
          reject(err);
        }
        else {
          var history: UnitEventStreamItem[] = stream.events; // the original event will be in events[i].payload
          // myAggregate.loadFromHistory(history);
          resolve(history);
      }
    });
  });
}