FROM ghcr.io/ministryofjustice/hmpps-node:24-alpine AS builder

ARG BUILD_NUMBER
ARG GIT_REF

RUN apt-get update && \
        apt-get upgrade -y
RUN apt-get -y install g++ make python3 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN curl https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
        > /app/root.cert

COPY . .

RUN CYPRESS_INSTALL_BINARY=0 npm run setup && \
        npm run build && \
        export BUILD_NUMBER=${BUILD_NUMBER:-1_0_0} && \
        export GIT_REF=${GIT_REF:-dummy} && \
        npm run record-build-info

RUN npm prune --production

FROM ghcr.io/ministryofjustice/hmpps-node:24-alpine

ARG BUILD_NUMBER
ARG GIT_REF
ARG GIT_BRANCH

LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

# Cache breaking and ensure required build / git args defined
RUN test -n "$BUILD_NUMBER" || (echo "BUILD_NUMBER not set" && false)
RUN test -n "$GIT_REF" || (echo "GIT_REF not set" && false)
RUN test -n "$GIT_BRANCH" || (echo "GIT_BRANCH not set" && false)

# Define env variables for runtime health / info
ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV GIT_REF=${GIT_REF}
ENV GIT_BRANCH=${GIT_BRANCH}

RUN apt-get update && \
        apt-get upgrade -y && \
        apt-get autoremove -y && \
        rm -rf /var/lib/apt/lists/*

RUN addgroup --gid 2000 --system appgroup && \
        adduser --uid 2000 --system appuser --gid 2000

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

# Create app directory
RUN mkdir /app && chown appuser:appgroup /app
USER 2000
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup \
        /app/package.json \
        /app/package-lock.json \
        /app/dist \
        /app/root.cert \
        /app/build-info.json \
        ./

COPY --from=builder --chown=appuser:appgroup \
        /app/assets ./assets

COPY --from=builder --chown=appuser:appgroup \
        /app/node_modules ./node_modules

COPY --from=builder --chown=appuser:appgroup \
        /app/server/views ./server/views

ENV PORT=3000

EXPOSE 3000
USER 2000

CMD [ "npm", "start" ]
