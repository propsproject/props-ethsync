FROM node:8.16-slim AS multistage
WORKDIR /service
ADD .npmrc /service/.npmrc
ADD .npmrc .
ADD yarn.lock /service/yarn.lock
ADD package.json /service/package.json
RUN apt-get update && apt-get install -y git python make gcc g++
RUN yarn upgrade
RUN apt-get remove -y git python make gcc g++
ADD . /service
RUN rm /service/lib -rf

FROM node:8.16-slim
CMD npm run sync-latest
EXPOSE 3000
WORKDIR /service
COPY --from=multistage /service /service
