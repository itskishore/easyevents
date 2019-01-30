const express = require('express');
const bodyParser = require('body-parser');
const graphqlHTTP = require('express-graphql');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/easyevents', {useNewUrlParser: true});
const easyEDb = mongoose.connection;

const app = express();

const graphQlSchema = require('./graphql/schema/index');
const rgraphQlResolvers = require('./graphql/resolvers/index');

app.use(bodyParser.json());

app.use('/graphql',
	graphqlHTTP({
		schema: graphQlSchema,
		rootValue: rgraphQlResolvers,
		// To enable the UI for our endpoint that graphQL provides.
		// Only in development env
		graphiql: true
	})
);
easyEDb.on('error', console.error.bind(console, 'connection error:'));
easyEDb.once('open', () => {
	app.listen(3000);
	console.log('Mongoose connected and app listens on 3000');
});

// MongoDB Atlas cluster connection
/* mongoose
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
	}); */