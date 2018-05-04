const eventstore = (require('eventstore') as any);
let es = eventstore();
es.init();


export async function saveKnowledgeEvent(event: any) {
  return new Promise(function(resolve, reject) {
    es.getEventStream({ aggregateId: event.unit, aggregate: 'unit', context: 'knowledge'} , function(err: any, stream: any) {
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

export async function getKnowledgeEventHistory(unitId: string) {
  return new Promise(function(resolve, reject) {
    es.getEventStream({ aggregateId: unitId, aggregate: 'unit', context: 'knowledge'}, function(err: any, stream: any) {
      if(err) {
          reject(err);
        }
        else {
          var history = stream.events; // the original event will be in events[i].payload
          // myAggregate.loadFromHistory(history);
          resolve(history);
      }
    });
  });
}