const environment = process.env.NODE_ENV || 'development';
const configuration = require('../../knexfile')[environment];
const database = require('knex')(configuration);

const graphql = require('graphql')

// see documentation on what avalible
const { GraphQLObjectType,
        GraphQLID,
        GraphQLString,
        GraphQLInt,
        GraphQLList,
        GraphQLSchema } = graphql;

const PetType = new GraphQLObjectType({
  name: 'Pet',

  // need as function for relationships between other tables
  // fields that can be queried
  fields: () => ({
    id: {type: GraphQLID},
    name: {type: GraphQLString},
    animal_type: {type: GraphQLString},
    breed: {type: GraphQLString},
    age: {type: GraphQLInt},
    favorite_treat: {type: GraphQLString},
    owner: {
      type: OwnerType,
      // parent of the owner is pet
      resolve(parent, args){
        return database('pets')
        .join('owners', {'pets.owner_id': 'owners.id'})
        .where('owners.id', parent.owner_id)
        .first()
      }
    }
  })
})

const OwnerType = new GraphQLObjectType({
  name: "Owner",
  fields: () => ({
    id: {type: GraphQLID},
    name: {type: GraphQLString},
    age: {type: GraphQLInt},
    pets: {
      type: GraphQLList(PetType),
      resolve(parent, args){
        return database('owners')
        .join('pets', {'owners.id': 'pets.owner_id'})
        .where('pets.owner_id', parent.id)
      }
    }
  })
})

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    pet: {
      type: PetType,
      args: {id: {type: GraphQLID}},
      resolve(parent, args){
        return database('pets').where('id', args.id).first()
      }
    },
    pets: {
      type: new GraphQLList(PetType),
      resolve(parent, args){
        return database('pets').select()
      }
    },
    owner: {
      type: OwnerType,
      args: {id: {type: GraphQLID}},
      resolve(parent, args){
        return database('owners').where('id', args.id).first()
      }
    }
  }
})

module.exports = new GraphQLSchema({
  query: RootQuery
})
