const addressTypeDef = `#graphql

type Address {
    id: ID!
    street: String!
    number: String!
    neighborhood: String
    city: String!
    gps: String!
    complement: String
    userId: String!
    confirmed: Boolean!
    active: Boolean!
    visited: String
}

type Query {
    getAddresses(input: AddressFilters): [Address]!
}

input AddressFilters {
    city: String
    neighborhood: String
    street: String
}

type Mutation {
    createAddress(newAddress: NewAddressInput!): Address

}

input NewAddressInput {
    userId: String!
    street: String!
    number: String!
    neighborhood: String
    city: String!
    gps: String
    complement: String
    confirmed: Boolean!
    active: Boolean!
    visited: String
}
`;

export default addressTypeDef;
