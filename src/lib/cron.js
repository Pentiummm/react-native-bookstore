import cron from "cron";
import https from "https";

const job = new cron.CronJob("*/14 * * * *", function () {
  https
    .get(process.env.API_URL, (res) => {
      if (res.statusCode === 200) {
        console.log("Cron Job: Server is alive");
      } else {
        console.log(
          `Cron Job: Server responded with status code ${res.statusCode}`
        );
      }
    })
    .on("error", (e) => {
      console.error(`Cron Job: Error checking server status - ${e.message}`);
    });
});

export default job;

// CRON JOB EXPLANATION:
// Cron jobs are scheduled tasks that run at specified intervals. In this code, we set up a cron job that runs every 14 minutes. The job sends an HTTP GET request to the server's API URL (defined in the environment variables) to check if the server is alive. If the server responds with a status code of 200, it logs that the server is alive; otherwise, it logs the received status code. If there's an error during the request, it logs the error message. This is useful for keeping the server awake on hosting platforms that may put inactive servers to sleep.
// we want to send 1 GET request every 14 minutes to keep the server awake on render.com

// How to define a "Schedule" for a cron job
// You define a schedule for a cron job using a cron expression, which is a string consisting of five or six fields separated by spaces. Each field represents a specific unit of time. The fields are as follows:

//! MINUE, HOUR, DAY OF MONTH, MONTH, DAY OF WEEK

//? EXAMPLE && EXPLANATION:
//* 14 * * * * - Every 14 minutes
//* * 2 * * - At every minute during the 2 AM hour
//* 0 0 * * 0 - At midnight on Sunday
//* 0 9 * * 1-5 - At 9:00 AM, Monday through Friday
//* */15 8-18 * * 1-5 - Every 15 minutes between 8 AM and 6 PM, Monday through Friday
//* 0 * * * * - Every hour
