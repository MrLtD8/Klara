ARG BUILD_FROM
FROM node:18-alpine
WORKDIR /srv

RUN npm install express@4 imapflow@1 --save --prefix /srv

COPY server.js .
COPY app/build ./public

EXPOSE 3000
CMD ["node", "server.js"]
