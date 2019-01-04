'use strict';

const express = require("express");
const morgan = require('morgan');
const mongoose = require("mongoose");


mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL } = require('./config');
const { BlogPost } = require("./models");

const app = express();
app.use(morgan('common'));
app.use(express.json());

app.get('/posts',(req, res) => {
    BlogPost
    .find()
    .then(posts => {
        res.json(posts.map(post => post.serialize()));
    })
    
    .catch(err => {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }); 
});

app.get('/posts/:id', (req, res) => {
    BlogPost
    // this is a convenience method Mongoose provides for searching
    // by the object _id property
    .findById(req.params.id)
    .then(Posts => res.json(Posts.serialize()))
    .catch(err => {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    });
})

app.post('/posts', (req, res) => {
    const requiredFields = ['title', 'author', 'content'];
    for (let i = 0; i < requiredFields.length; i++) {
        const field = requiredFields[i];
        if(!(field in req.body)) {
            const message = `missing  in request body`;
            console.error(message);
            return res.status(400).send(message);
        }
    }
    
    BlogPost.create({
        title: req.body.title,
        author:req.body.author,
        content: req.body.content
    })
    .then(blogPost => res.status(201).json(blogPost.serialize()))
    .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });
});

app.put('/posts/:id', (req, res) => {
    if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
     res.status(400).json({
      error: 'Request path id and request body id values must match'
    });
    }
    const updated = {};
    const updateableFields = ['title', 'author', 'content'];
    updateableFields.forEach(field => {
        if(field in req.body) {
            updated[field] = req.body[field];
        }
    });
    
    BlogPost
        .findByIdAndUpdate(req.params.id, {$set: updated}, {new: true})
        .then(updatedPost => res.status(204).end())
        .catch(err => res.status(500).json({message: 'something went wrong'}));
    
});


app.delete('/posts/:id', (req, res) => {
  BlogPost
    .findByIdAndRemove(req.params.id)
    .then(() => {
      console.log(`Deleted blog post with id \`${req.params.id}\``);
      res.status(204).end();
    });
});


app.use('*', function (req, res) {
  res.status(404).json({ message: 'Not Found' });
});


let server;

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect( databaseUrl, err => {
        if (err) {
          return reject(err);
        }
        server = app
          .listen(port, () => {
            console.log(`Your app is listening on port ${port}`);
            resolve();
          })
          .on("error", err => {
            mongoose.disconnect();
            reject(err);
          });
      }
    );
  });
}


function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}


if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = { app, runServer, closeServer };
