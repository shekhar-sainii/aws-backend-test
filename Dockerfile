FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=5000
ARG COMMIT_SHA=local-dev
ENV COMMIT_SHA=$COMMIT_SHA

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN chown -R node:node /app

USER node

EXPOSE 5000

CMD ["npm", "start"]