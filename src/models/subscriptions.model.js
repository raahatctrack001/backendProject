import {Schema, model} from 'mongoose'

const subscriptionModel = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {timestamps: true});

export const Subscription = new model('Subscription', subscriptionModel);