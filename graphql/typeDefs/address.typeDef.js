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
    address(action: String!, id: ID, input: FilterAddressInput): AddressResponse

}
input FilterAddressInput {
    street: String
    neighborhood: String
    city: String!
    confirmed: Boolean!
    active: Boolean!

}

type AddressResponse {
    address: [Address]
    success: Boolean
    message: String
}




type Mutation {
    addressMutation(action: String!, newAddress: NewAddressInput, id: ID, updateAddressInput: UpdateAddressInput): AddressMutationResponse!
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
input UpdateAddressInput {
    userId: String
    street: String
    number: String
    neighborhood: String
    city: String
    gps: String
    complement: String
    confirmed: Boolean
    active: Boolean
    visited: String
}

type AddressMutationResponse {
    success: Boolean
    message: String
    address: Address

}
`;

export default addressTypeDef;
