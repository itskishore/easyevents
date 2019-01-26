const express = require('express');
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const app = express();

const Event = require('./models/event');
const User = require('./models/user');

app.use(bodyParser.json());

app.use('/graphql',
	graphqlHTTP({
		schema: buildSchema(`
			type Event {
				_id: ID!
				title: String!
				description: String!
				price: Float!
				date: String!
				creator: String
			}

			type User {
				_id: ID!
				email: String!
				password: String
			}

			input EventInput {
				title: String!
				description: String!
				price: Float!
				date: String!
				creator: String
			}

			input UserInput {
				email: String!
				password: String!
			}

			type RootQuery {
				events: [Event!]!
				users: [User]!
			}

			type RootMutation {
				createEvent(inputEvent: EventInput): Event
				createUser(inputUser: UserInput): User
			}

			schema {
				query: RootQuery
				mutation: RootMutation
			}
		`),
		rootValue: {
			events: () => {
				return Event.find()
					.then(events => {
						return events.map(event => {
							return { ...event._doc, _id: event._doc._id.toString() };
						});
					})
					.catch(err => {
						throw err;
					});
			},
			createEvent: args => {
				let createdEvent;
				const event = new Event({
					title: args.inputEvent.title,
					description: args.inputEvent.description,
					price: args.inputEvent.price,
					date: new Date(args.inputEvent.date),
					creator: '5c4c7ebccb70617ae9fbb3a3'
				});
				return event.save()
					.then(result => {
						createdEvent = { ...result._doc, _id: result.id };
						return User.findById('5c4c7ebccb70617ae9fbb3a3');
					})
					.then(user => {
						if (!user) {
							throw new Error('User not found');
							// TODO: Write logic to rollback  create event 
							// operation if user doesn't exist (since transaction is available
							// with mongo v4)
						}
						user.createdEvents.push(event);
						return user.save();
					})
					.then(result => {
						return createdEvent;
					})
					.catch(err => {
						throw err;
					});
			},
			createUser: args => {
				return User.findOne({email: args.inputUser.email})
					.then(user => {
						if (user) {
							throw new Error('User already exists!');
						}
						return bcrypt.hash(args.inputUser.password, 12)
					})
					.then(hashedPassword => {
						const user = new User({
							email: args.inputUser.email,
							password: hashedPassword
						});
						return user.save();
					})
					.then(user => {
						return { ...user._doc, password: null, _id: user.id };
					})
					.catch(err => {
						throw err;
					});
			}
		},
		graphiql: true
	})
);

mongoose
	.connect(
		`mongodb+srv://${process.env.MONGO_USER}:${
		process.env.MONGO_PASSWORD
		}@cluster0-2aoer.mongodb.net/${process.env.MONGO_DB}?retryWrites=true`
	)
	.then((result) => {
		app.listen(3000);
		console.log('Mongoose connected and app listens on 3000');
	}).catch(error => {
		console.error('Error in Mongoose connection ', error);
	});