const express = require('express');
const router = express.Router();
const TherapistApplication = require('../models/TherapistApplication');

router.get('/therapists', async (req, res) => {
    try {
        const { q, gender, minCost, maxCost, page = 1, limit = 10, sort } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const pipeline = [
            {
              $search: {
                index: 'therapist_search',
                compound: {
                  should: [
                    {
                      text: {
                        query: q,
                        path: ['specialization', 'languages', 'location.city', 'location.country']
                      }
                    }
                  ],
                  minimumShouldMatch: 1
                }
              }
            },
            {
              $match: {
                ...(gender && { gender }),
                ...(minCost && maxCost && {
                  sessionCost: { $gte: parseInt(minCost), $lte: parseInt(maxCost) }
                })
              }
            },
            ...(sort === 'asc' || sort === 'desc'
              ? [{ $sort: { sessionCost: sort === 'asc' ? 1 : -1 } }]
              : []),
            { $skip: skip },
            { $limit: parseInt(limit) }
          ];

        const results = await TherapistApplication.aggregate(pipeline);

        res.status(200).json({
            page: parseInt(page),
            limit: parseInt(limit),
            count: results.length,
            results,
        });
    } catch (error) {
        console.error("Search Error: ", error);
        res.status(500).json({ message: 'Search Failed!' });
    }
});

module.exports = router;