FROM mhart/alpine-node:latest

ADD package.json /tmp/package.json
RUN apk add --update curl && rm -rf /var/cache/apk/*
RUN cd /tmp && npm install
RUN mkdir -p /opt/app && cp -a /tmp/node_modules /opt/app/

WORKDIR /opt/app
ADD . /opt/app

EXPOSE 3000
EXPOSE 5984

CMD ["npm", "start"]
