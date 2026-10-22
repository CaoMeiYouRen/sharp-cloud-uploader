# 自建镜像 caomeiyouren/alpine-nodejs 依赖 Alpine 仓库的 nodejs 包，
# Alpine 尚未提供 24.22.1 时重建也无法修复 CVE-2026-111497。
# 临时改用官方镜像钉住已修复版本；待自建镜像发布 24.22.1 后再切回。
# 网络受限时可用 --build-arg NODE_IMAGE=public.ecr.aws/docker/library/node:24.22.1-alpine
ARG NODE_IMAGE=node:24.22.1-alpine

FROM ${NODE_IMAGE} AS nodejs

# 构建期校验，防止基础镜像回退到未修复版本
COPY scripts/check-node-version.mjs /tmp/check-node-version.mjs
RUN node /tmp/check-node-version.mjs

RUN npm install -g pnpm@11

# RUN npm config set registry https://registry.npmmirror.com && \
#     pnpm config set registry https://registry.npmmirror.com &&

FROM ${NODE_IMAGE} AS runtime

# 阶段一：构建阶段
FROM nodejs AS builder

WORKDIR /app

COPY package.json .npmrc pnpm-lock.yaml pnpm-workspace.yaml /app/

RUN pnpm i --frozen-lockfile

COPY . /app

RUN pnpm run build

# 阶段二：缩小阶段
FROM nodejs AS docker-minifier

WORKDIR /app

RUN pnpm add @vercel/nft@0.24.4 fs-extra@11.2.0 --save-prod

COPY --from=builder /app /app

RUN export PROJECT_ROOT=/app/ && \
    node /app/scripts/minify-docker.cjs && \
    rm -rf /app/node_modules /app/scripts && \
    mv /app/app-minimal/node_modules /app/ && \
    rm -rf /app/app-minimal

# 阶段三：生产阶段
FROM runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=docker-minifier /app /app

EXPOSE 3000

CMD ["node", "dist/index.mjs"]
