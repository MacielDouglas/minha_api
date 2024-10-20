import { mergeTypeDefs } from "@graphql-tools/merge";
import userTypeDef from "./user.typeDef.js";
import addressTypeDef from "./address.typeDef.js";
import cardTypeDef from "./card.typeDef.js";

const mergedTypeDefs = mergeTypeDefs([
  userTypeDef,
  addressTypeDef,
  cardTypeDef,
]);

export default mergedTypeDefs;
