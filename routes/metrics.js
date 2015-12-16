var express = require('express');
var router = express.Router();

var monk = require('monk');
var db = monk('localhost:27017/healthMonitoring');
var metrics = db.get('metrics');

function calculateLight (light) {
  var rawRange = 1024, // 3.3v
      logRange = 5.0; // 3.3v

  return  Math.pow(10, parseInt(light) * logRange / rawRange);
};

function calculateGas (ppm) {
  var  MQ135_SCALINGFACTOR = 116.6020682,
       MQ135_EXPONENT = -2.769034857,
       resvalue = 100;

  return resvalue * Math.exp ( Math.log(MQ135_SCALINGFACTOR/ppm) / MQ135_EXPONENT );
};


router

  .post('/', function(req, res, next) {
    //metrics.insert = (req.body);
    var rawRange = 1024; // 3.3v
    var logRange = 5.0; // 3.3v

    console.log(req.body);
    console.log(new Date(Date.now()).toISOString());

    metrics.insert({
      wet: req.body.wet,
      gas: calculateGas(req.body.gas),
      temp: req.body.temp,
      light: calculateLight(req.body.light),
      noise: req.body.noise,
//      positionId: req.body.positionId,
      positionId: Math.floor(Math.random()*10).toString(),
      time: Date.now()
    });

    res.json({
      "message": "Post was successful",
      "body": req.body
    });
  })

  .get('/', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
 
    var query = {},
        options = {
          limit : 100,
          sort: {time: -1}
        };
 
    if (req.query.positionId) {
      var positions =  req.query.positionId.split(',').length;
      if ( positions > 1 ) {
        options.limit = req.query.positionId.split(',').length;
        query.positionId = {
          $in: req.query.positionId.split(',')
        };
      } else {
        query.positionId = req.query.positionId;
      }
    }

    if (req.query.gtetime) {
      query.time = {
        $gte: parseInt(req.query.gtetime)
      }
    }

    if (req.query.lttime) {
      if (query.time) {
       query.time.$lt = parseInt(req.query.lttime);
      } else {
        query.time = {
          $lt: parseInt(req.query.lttime)
        }
      }
    }

    metrics.find(query, options, function(e, docs) {
      res.json({
        "message": "Get all metrics was successful",
        "query": req.query,
        "body": req.body,
        "result": docs
      });
    })
  });

module.exports = router;
