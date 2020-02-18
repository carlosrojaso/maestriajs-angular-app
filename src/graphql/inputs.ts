import gql from 'graphql-tag';

export const CreateTodoInput = gql`input CreateTodoInput {
	id: ID
	name: String!
	description: String
}`;
