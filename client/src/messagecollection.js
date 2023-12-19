import Backbone from 'backbone';
import MessageModel from './messagemodel';

const MessageCollection = Backbone.Collection.extend({
  model: MessageModel,
});

export default MessageCollection;
