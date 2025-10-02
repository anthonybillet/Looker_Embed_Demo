# Use an official Node.js runtime as a parent image.
# Using 'slim' makes the container image smaller and more secure.
FROM node:18-slim

# Set the working directory inside the container.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json. The wildcard handles both files.
# This is done as a separate step to leverage Docker's layer caching.
# Dependencies will only be re-installed if package*.json changes.
COPY package*.json ./

# Install production dependencies.
RUN npm install --only=production

# Copy the rest of the application's source code from your local machine to the container.
COPY . .

# Cloud Run automatically provides the PORT environment variable.
# We default to 3000 if it's not set, but Cloud Run will manage this.
ENV PORT 3000

# Make the port available to the world outside this container.
EXPOSE 3000

# Define the command to run your app when the container starts.
CMD [ "node", "server.js" ]
