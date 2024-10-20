import { mergeResolvers } from "@graphql-tools/merge";
import userResolver from "./user.resolver.js";
import addressResolver from "./address.resolver.js";
import cardResolver from "./card.resolver.js";

const mergedResolver = mergeResolvers([
  userResolver,
  addressResolver,
  cardResolver,
]);

export default mergedResolver;
