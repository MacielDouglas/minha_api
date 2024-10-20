import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@apollo/server/express4";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

import http from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
import mergedTypeDefs from "./graphql/typeDefs/index.js";
import mergeResolvers from "./graphql/resolvers/index.js";

dotenv.config();

const MONGODB_URI = process.env.MONGO_DB;
console.log("Conectando ao MongoDB....");

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Conectado ao MongoDB");
  })
  .catch((error) => {
    console.log("Erro de conexão com MongoDB: ", error.message);
  });

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql",
  });

  const schema = makeExecutableSchema({
    typeDefs: mergedTypeDefs,
    resolvers: mergeResolvers,
  });

  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    "/graphql",
    cors(),
    express.json(),
    expressMiddleware(server, {
      context: ({ req, res }) => ({ req, res }),
    })
  );

  const PORT = 8000;

  httpServer.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}/graphql`);
  });
};

start();
