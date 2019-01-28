const bcrypt = require('bcryptjs');

const Event = require('../../models/event');
const User = require('../../models/user');

const populateUser = async userId => {
    try {
        const user = await User.findById(userId);
        return {
            ...user._doc,
            _id: user.id,
            createdEvents: populateEvents.bind(this, user._doc.createdEvents)
        };
    } catch (err) {
        throw err;
    }
};

const populateEvents = async eventIds => {
    try {
        const events = await Event.find({ _id: { $in: eventIds } });
        return events.map(event => {
            return {
                ...event._doc,
                _id: event.id,
                date: new Date(event._doc.date).toISOString(),
                creator: populateUser.bind(this, event._doc.creator)
            };
        });
    } catch (err) {
        throw err;
    }
};

module.exports = {
    events: async () => {
        try {
            const events = await Event.find({});
            return events.map(event => {
                return {
                    ...event._doc,
                    _id: event.id,
                    date: new Date(event._doc.date).toISOString(),
                    creator: populateUser.bind(this, event._doc.creator)
                };
            });
        } catch (err) {
            throw err;
        }
    },
    createEvent: async args => {
        const eventSchema = new Event({
            title: args.inputEvent.title,
            description: args.inputEvent.description,
            price: args.inputEvent.price,
            date: new Date(args.inputEvent.date),
            creator: '5c4c7ebccb70617ae9fbb3a3'
        });
        let createdEvent;
        try {
            const savedEvent = await eventSchema.save();
            createdEvent = {
                ...savedEvent._doc,
                _id: savedEvent.id,
                date: new Date(savedEvent._doc.date).toISOString(),
                creator: populateUser.bind(this, savedEvent._doc.creator)
            };
            const creator = await User.findById('5c4c7ebccb70617ae9fbb3a3');
            if (!creator) {
                throw new Error('User not found');
                // TODO: Write logic to rollback  create event 
                // operation if user doesn't exist
                // (since transaction is available with mongo v4)
            }
            creator.createdEvents.push(savedEvent);
            await creator.save();
            return createdEvent;
        } catch (err) {
            throw err;
        }
    },
    createUser: async args => {
        try {
            const user = await User.findOne({ email: args.inputUser.email });
            if (user) {
                throw new Error('User already exists!');
            }
            const hashedPassword = await bcrypt.hash(args.inputUser.password, 12);
            const userSchema = new User({
                email: args.inputUser.email,
                password: hashedPassword
            });
            const savedUser = await userSchema.save();
            return {
                ...savedUser._doc,
                password: null,
                _id: savedUser.id,
                createdEvents: populateEvents.bind(this, savedUser._doc.createdEvents)
            };
        } catch (err) {
            throw err;
        }
    },
};