const mongoose = require('mongoose');
const CronJob = require('cron').CronJob;
const webhoseio = require('webhoseio');
const config = require('../config');
const logger = require('../helper/logger');
const Post = require('../models/Post');

var jobTask_WebHose_Reader = {

    start: () => {

         
        new CronJob({
            cronTime: config.job_periode_WebHose,
            onTick: function () {
                try {
                    console.log("Get last timestamp: ", config.last_timestamp_WebHoseimestamp, " Next Job Runtime", this.nextDates());
                    jobTask_WebHose_Reader.run(config.last_timestamp_WebHose);

                } catch (error) {
                    logger.addLog("Cron Job", "WebHose-Job-Error", error);
                }
            },
            onComplete: function () {
                console.log("job bitti");
            },
            start: true,
            runOnInit: true,

        });

    },

    run: (timestamp) => {

        const client = webhoseio.config({ token: config.api_secret_key });

        let query = client.query('filterWebContent', {
            q: config.search_query,
            size: 100,
            ts: timestamp
        });



        query.then(output => {
            output['posts'].map(post => saveDatabase(post));

            console.log("Post", "WebHose-Read", "Success", output.totalResults, output.moreResultsAvailable, output.requestsLeft);
            logger.addLog("Post", "WebHose-Read", "Success", output.totalResults, output.moreResultsAvailable, output.requestsLeft);
            config.update_timestamp(new Date().getTime(),"jobTask_WebHose_Reader");
        });



        let saveDatabase = (item) => {

            try {

                item._id = new mongoose.Types.ObjectId();
                const post = new Post(item);
                const promise = post.save();
                promise.then((data) => {

                }).catch((err) => {

                    logger.addLog("Post", "Error Post Saved to Database", err);

                });
            } catch (error) {
                logger.addLog("Post", "Error saveDatabase function ", error);
            }
        };

    }
}

module.exports = jobTask_WebHose_Reader;

