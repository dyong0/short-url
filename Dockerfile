FROM node:9-alpine

COPY package.json /short_url/
RUN chown -R node:node /short_url

USER node

WORKDIR /short_url

RUN yarn install