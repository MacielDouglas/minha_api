const userTypeDef = `#graphql
type Comment {
    cardId: ID!  
    text: String!   
}

type User {
    id: ID!
    name: String!
    email: String!
    password: String!
    profilePicture: String!
    isAdmin: Boolean!
    group: String!
    isSS: Boolean!
    myCards: [String]
    myTotalCards: [String]
    comments: [Comment] 
    idToken: String
}

type Query {
    user(action: String!, id:ID, email:String, password: String, ): UserResponse
    firebaseConfig: EncryptedConfig
}

type Mutation {
    userMutation(action: String!, user: NewUserInput, id: ID, updateUserInput: UpdateUserInput, idToken: String): UserMutationResponse!
}

type UserResponse {
    user: User
    success: Boolean
    message: String
}

type UserMutationResponse {
    success: Boolean!
    message: String
    user: User
}

input UpdateUserInput {
    name: String
    profilePicture: String
}

input NewUserInput {
    name: String!
    email: String!
    password: String!
    profilePicture: String!
    isAdmin: Boolean
    group: String
    isSS: Boolean
}

type EncryptedConfig {
  encryptedData: String
}
`;

export default userTypeDef;
