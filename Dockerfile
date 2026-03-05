FROM ghcr.io/ministryofjustice/hmpps-node:24-alpine as base

ARG BUILD_NUMBER
ARG GIT_REF
ARG GIT_BRANCH

# Cache breaking and ensure required build / git args defined
RUN test -n "$BUILD_NUMBER" || (echo "BUILD_NUMBER not set" && false)
RUN test -n "$GIT_REF" || (echo "GIT_REF not set" && false)
RUN test -n "$GIT_BRANCH" || (echo "GIT_BRANCH not set" && false)

# Define env variables for runtime health / info
ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV GIT_REF=${GIT_REF}
ENV GIT_BRANCH=${GIT_BRANCH}

# Stage: build assets
FROM base AS build

RUN apk update && \
        apk upgrade
RUN apk add --no-cache \
      g++ \
      make \
      python3 \
      curl

WORKDIR /app

RUN curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
        > /app/root.cert

COPY package*.json .allowed-scripts.mjs ./
RUN NPM_CONFIG_AUDIT=false NPM_CONFIG_FUND=false npm run setup
ENV NODE_ENV='production'

COPY . .
RUN npm run build

RUN npm prune --no-audit --no-fund --omit=dev


RUN npm prune --production

FROM base

COPY --from=build --chown=appuser:appgroup \
        /app/package.json \
        /app/package-lock.json \
        /app/root.cert \
        ./

COPY --from=build --chown=appuser:appgroup \
        /app/assets ./assets

COPY --from=build --chown=appuser:appgroup \
        /app/node_modules ./node_modules

COPY --from=build --chown=appuser:appgroup \
        /app/server/views ./server/views

ENV PORT=3000

EXPOSE 3000
USER 2000

CMD [ "npm", "start" ]
