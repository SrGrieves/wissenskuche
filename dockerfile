FROM node:8
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .
RUN ./node_modules/typescript/bin/tsc

CMD [ "node", "dist/app.js" ]