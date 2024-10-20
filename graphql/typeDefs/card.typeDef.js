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
    getCard(input: CardFilter): [Card]!
}

input CardFilter {
    id: ID
}

type Mutation {
    createCard(newCard: NewCardInput!): Card
}

input NewCardInput {
    street: [String]!
    userId: String
    number: Int
    startDate: String
    endDate: String
}
`;

export default cardTypeDef;
