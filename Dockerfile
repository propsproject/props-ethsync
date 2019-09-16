FROM node:8.16-slim AS multistage
WORKDIR /service
RUN apt-get update && apt-get install -y git python make gcc g++
ADD . /service
ADD yarn.lock /service/yarn.lock
ADD package.json /service/package.json
RUN rm /service/node_modules -r
RUN yarn install
RUN npm run build
RUN rm /service/lib -rf
RUN rm /service/dist/settings/settings.development.* || true

FROM node:8.16-slim
CMD npm run sync-latest
EXPOSE 3000
WORKDIR /service
COPY --from=multistage /service /service
