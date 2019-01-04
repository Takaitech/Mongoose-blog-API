'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const commentSchema = mongoose.Schema({ content: 'string' });

const blogPostSchema = mongoose.Schema({
    title: {type: String, required: true},
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'author' },
    content: {type: String},
    comments: [commentSchema],
    created: {type: Date, default: Date.now}
});

const authorSchema = mongoose.Schema({
  firstName: 'string',
  lastName: 'string',
  userName: {
    type: 'string',
    unique: true
  }
});


blogPostSchema.virtual("authorName").get(function() {
  return `${this.author.firstName} ${this.author.lastName}`.trim();
});

blogPostSchema.pre('find', function(next) {
  this.populate('author');
  next();
});

blogPostSchema.pre('findOne', function(next) {
  this.populate('author');
    
  next();
});


blogPostSchema.methods.serialize = function() {
  return {
      id: this._id,
      title: this.title,
      author: this.authorName,
      content: this.content,
      created:  this.created,
      comments: this.comments
  };
};

const Author = mongoose.model('author', authorSchema);
const BlogPost = mongoose.model('blogpost', blogPostSchema);


module.exports = { Author, BlogPost };
