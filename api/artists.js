const express = require('express');
const artistsRouter = express.Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

artistsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Artist WHERE Artist.is_currently_employed = 1`,
  (err, artists) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ artists: artists })
    }
  })
})

artistsRouter.param('artistId', (req, res, next, artistId) => {
  db.get(`SELECT * FROM Artist WHERE Artist.id = ${artistId}`,
  (err, artist) => {
    if (err) {
      next(err)
    } else if (artist) {
      req.artist = artist;
      req.artistId = artistId;
      next();
    } else {
      res.sendStatus(404);
    }
  })
})

const validateBody = (req, res, next) => {
  req.name = req.body.artist.name;
  req.dateOfBirth = req.body.artist.dateOfBirth;
  req.biography = req.body.artist.biography;
  req.isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;

  if ( !req.name || !req.dateOfBirth || !req.biography ) {
    return res.sendStatus(400);
  }
  next();
}

artistsRouter.get('/:artistId', (req, res) => {
  res.status(200).json({ artist: req.artist })
})

artistsRouter.post('/', validateBody, (req, res, next) => {
  db.run('INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)',
  {
    $name: req.name,
    $dateOfBirth: req.dateOfBirth,
    $biography: req.biography,
    $isCurrentlyEmployed: req.isCurrentlyEmployed
  },
  function(err) {
    if (err) {
      next(err)
    }
    db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`, (err, artist) => {
      res.status(201).json({ artist: artist })
    });
  });
});

artistsRouter.put('/:artistId', validateBody, (req, res, next) => {
  db.run('UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE Artist.id = $artistId',
  {
    $name: req.name,
    $dateOfBirth: req.dateOfBirth,
    $biography: req.biography,
    $isCurrentlyEmployed: req.isCurrentlyEmployed,
    $artistId: req.artistId
  },
  function(err) {
    if (err) {
      next(err);
    }
    db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.artistId}`, (err, artist) => {
      res.status(200).json({ artist: artist })
    });
  })
})

artistsRouter.delete('/:artistId', (req, res, next) => {
  db.run('UPDATE Artist SET is_currently_employed = 0 WHERE Artist.id = $artistId',
  {
    $artistId: req.artistId
  },
  function(err) {
    if (err) {
      next(err);
    }
    db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.artistId}`, (err, artist) => {
      res.status(200).json({ artist: artist })
    });
  })
})

module.exports = artistsRouter;