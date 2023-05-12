FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json /usr/src/app

RUN npm install

COPY . /usr/src/app

EXPOSE 3001

CMD [ "node", "index.js" ]