const cardTypeDef = `#graphql

type Card {
    id: ID!
    street: [String]!
    userId: String
    number: Int
    startDate: String
    endDate: String
}

type Query {
    card(action: String!, id: ID): CardResponse

}


type Mutation {
    cardMutation(action: String!, newCard: NewCardInput, id: ID, updateCardInput: UpdateCardInput): CardMutationResponse!

}

type CardResponse {
    card: [Card]
    success: Boolean
    message: String
}


input NewCardInput {
    street: [String]!
    userId: String
    number: Int
    startDate: String
    endDate: String

}

input UpdateCardInput {
    street: [String]
    userId: String
    number: Int
    startDate: String
    endDate: String
}

type CardMutationResponse {
    success: Boolean
    message: String
    card: Card
}
`;

export default cardTypeDef;
