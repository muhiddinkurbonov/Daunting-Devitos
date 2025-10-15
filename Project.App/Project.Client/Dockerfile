FROM node:24-alpine AS builder

# set working directory
WORKDIR /usr/src/app

# install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# copy frontend code
COPY . . 

# build
RUN npm run build

FROM node:24-alpine AS runner

# set working directory
WORKDIR /usr/src/app

# copy built files from builder (hopefully)
COPY --from=builder /usr/src/app/.next ./.next

# install dependencies (without dev deps)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# run! (on node server)
CMD ["npm", "run", "start"]
