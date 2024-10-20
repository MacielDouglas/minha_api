const userTypeDef = `#graphql
type Comment {
    cardId: ID!       # ID do card associado
    text: String!     # Texto do comentário com limite de 250 caracteres
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
}

type Query {
    user(action: String!, id:ID, email:String, password: String): UserResponse
    # getUser(id: ID!): User
    # loginUser(email: String!, password: String!): LoginResponse!
    # logoutUser: LogoutResponse!
}

type Mutation {
    userMutation(action: String!, user: NewUserInput, id: ID, updateUserInput: UpdateUserInput): UserMutationResponse!
    # createUser(user: NewUserInput!): User
    # deleteUser(id: ID!): DeleteUserResponse
    # updateUser(id: ID!, updateUserInput: UpdateUserInput!): UpdateUserResponse!
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

# type DeleteUserResponse {
#     success: Boolean!
#     message: String!
# }

input UpdateUserInput {
    name: String
    profilePicture: String
}

# type UpdateUserResponse {
#     success: Boolean!
#     message: String
#     name: String
#     profilePicture: String
#     isAdmin: Boolean

# }

# type LoginResponse {
#     token: String!
#     id: ID!
#     name: String!
#     profilePicture: String!
#     isAdmin: Boolean!
#     group: String!
#     isSS: Boolean!
#     myCards: [String]
#     myTotalCards: [String]
#     comments: [Comment]
# }

# type LogoutResponse {
#     success: Boolean!
#     message: String!
# }

input NewUserInput {
    name: String!
    email: String!
    password: String!
    profilePicture: String!
    isAdmin: Boolean
    group: String
    isSS: Boolean
}


`;

export default userTypeDef;
