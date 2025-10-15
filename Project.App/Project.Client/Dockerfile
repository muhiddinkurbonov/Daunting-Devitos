FROM node:24-alpine AS build

# set working directory
WORKDIR /src

# install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# copy frontend code
COPY . . 

# build
RUN npm run build

FROM node:24-alpine AS run

# set working directory
WORKDIR /app

# copy built files from build
COPY --from=build /src/.next ./.next
# copy static files
COPY --from=build /src/public ./public 

# install dependencies (without dev deps)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# run! (on node server)
CMD ["npm", "run", "start"]
