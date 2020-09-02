const express = require('express');
const issuesRouter = express.Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite')

issuesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Issue WHERE Issue.series_id = ${req.seriesId}`,
  (err, issues) => {
    if (err) {
      next(err)
    } else {
      res.status(200).json({ issues: issues })
    }
  })
})

issuesRouter.param('issueId', (req, res, next, issueId) => {
  db.get(`SELECT * FROM Issue WHERE Issue.id = ${issueId}`,
  (err, issue) => {
    if (err) {
      next(err);
    } else if (issue) {
      req.issue = issue;
      req.issueId = issueId;
      next();
    } else {
      res.sendStatus(404);
    }
  })
})

const validateBody = (req, res, next) => {
  req.name = req.body.issue.name;
  req.issueNumber = req.body.issue.issueNumber;
  req.publicationDate = req.body.issue.publicationDate;
  req.artistId = req.body.issue.artistId;
  db.get(`SELECT * FROM Artist WHERE Artist.id = ${req.artistId}`, (err, artist) => {
    if (err) {
      next(err);
    } else {
      if ( !req.name || !req.issueNumber || !req.publicationDate || !artist ) {
        return res.sendStatus(400);
      }
      next();
    }
  }) 
}

issuesRouter.post('/', validateBody, (req, res, next) => {
  db.run('INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)',
  {
    $name: req.name,
    $issueNumber: req.issueNumber,
    $publicationDate: req.publicationDate,
    $artistId: req.artistId,
    $seriesId: req.seriesId
  },
  function(err) {
    if (err) {
      next(err);
    }
    db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`,
    (err, issue) => {
      res.status(201).json({ issue: issue });
    })
  })
})

issuesRouter.put('/:issueId', validateBody, (req, res, next) => {
  db.run('UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, artist_id = $artistId, series_id = $seriesId WHERE Issue.id = $issueId',
  {
    $name: req.name,
    $issueNumber: req.issueNumber,
    $publicationDate: req.publicationDate,
    $artistId: req.artistId,
    $seriesId: req.seriesId,
    $issueId: req.issueId
  },
  function(err) {
    if (err) {
      next(err)
    }
    db.get(`SELECT * FROM Issue WHERE id = ${req.issueId}`, (err, issue) => {
      res.status(200).json({ issue: issue })
    })
  })
})

issuesRouter.delete('/:issueId', (req, res, next) => {
  db.run(`DELETE FROM Issue WHERE Issue.id = ${req.issueId}`,
  function(err) {
    if (err) {
      next(err);
    }
    res.sendStatus(204);
  })
})

module.exports = issuesRouter;