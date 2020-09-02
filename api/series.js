const express = require('express');
const seriesRouter = express.Router();
const sqlite3 = require('sqlite3');
const issuesRouter = require('./issues');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

seriesRouter.use('/:seriesId/issues', issuesRouter)

seriesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Series`,
  (err, series) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ series: series })
    }
  })
})

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
  db.get(`SELECT * FROM Series WHERE Series.id = ${seriesId}`,
  (err, series) => {
    if (err) {
      next(err)
    } else if (series) {
      req.series = series;
      req.seriesId = seriesId;
      next();
    } else {
      res.sendStatus(404);
    }
  })
})

const validateBody = (req, res, next) => {
  req.name = req.body.series.name;
  req.description = req.body.series.description;

  if ( !req.name || !req.description ) {
    return res.sendStatus(400);
  }
  next();
}

seriesRouter.get('/:seriesId', (req, res, next) => {
  res.status(200).json({ series: req.series });
})

seriesRouter.post('/', validateBody, (req, res, next) => {
  db.run('INSERT INTO Series (name, description) VALUES ($name, $description)',
  {
    $name: req.name,
    $description: req.description
  },
  function(err) {
    if (err) {
      next(err)
    }
    db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`, (err, series) => {
      res.status(201).json({ series: series })
    })
  })
})

seriesRouter.put('/:seriesId', validateBody, (req, res, next) => {
  db.run('UPDATE Series SET name = $name, description = $description WHERE id = $seriesId',
  {
    $name: req.name,
    $description: req.description,
    $seriesId: req.seriesId
  },
  function(err) {
    if (err) {
      next(err)
    }
    db.get(`SELECT * FROM Series WHERE id = ${req.seriesId}`, (err, series) => {
      res.status(200).json({ series: series })
    })
  })
})

module.exports = seriesRouter;