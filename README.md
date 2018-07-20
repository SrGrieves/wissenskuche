# wissenskuche
A resource and knowledge API for an educational (but very fun!) planetary development game.  This API is built to increment Joel Carrier's [gaea](https://bitbucket.org/carrier_engineering/gaea/src/master/) planet and unit APIs with resource, knowledge and ability tools for units.

## Basics

### Tiles Resource
http://wk.markcarrier.info:8080/tiles/SywbHeMZuePtM/resources

### Unit Knowledge
http://wk.markcarrier.info:8080/player/hwX6aOr7/units/Hk1xNGugwtf/brain/

Within unit knowledge you'll find links to learn new stuff, such as this one which contains details needed to send the learn command.

### Unit Abilities
http://wk.markcarrier.info:8080/player/hwX6aOr7/units/Hk1xNGugwtf/abilities

You'll find instructions to send the do command.

You have to use valid player id, unit ids and tile ids since this api calls the GAEA api for information.

## Data Persistence
The service stores resource, knowledge and ability events using [node event store](https://github.com/adrai/node-eventstore) and therefore supports multiple database (inmemory, mongodb, redis, tingodb, elasticsearch, azuretable, dynamodb).  Inmemory storage is used by default and is therefore not persisted across restarts.
