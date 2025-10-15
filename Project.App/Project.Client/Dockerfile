FROM node:24-alpine AS builder

# set working directory
WORKDIR /src

# install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# copy frontend code
COPY . . 

# build
RUN npm run build

FROM node:24-alpine AS runner

# set working directory
WORKDIR /app

# copy built files from builder
COPY --from=builder /src/.next ./.next
# copy static files
COPY --from=builder /src/public ./public 

# install dependencies (without dev deps)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# run! (on node server)
CMD ["npm", "run", "start"]
