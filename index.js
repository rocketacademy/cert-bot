/* code from:
 * https://www.javascriptjanuary.com/blog/building-a-slack-app-with-express-and-the-node-sdk
 */

/* =====================================
 * =====================================
 * =====================================
 * =====================================
 *    require and configure express
 * =====================================
 * =====================================
 * =====================================
 */
const CERT_URL=process.env.CERT_URL || 'https://certificates.rocketacademy.co';
//const CERT_URL=process.env.CERT_URL || ='https://rocketacademy.github.io/certificates'

const moment = require('moment');
const express = require('express')
const port = process.env.PORT || 3000
const app = express()
require('dotenv').config();

/* =====================================
 * =====================================
 * =====================================
 * =====================================
 *   require and configure slack
 * =====================================
 * =====================================
 * =====================================
 */

const { createEventAdapter } = require('@slack/events-api');
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET)

const { WebClient } = require('@slack/web-api');
const token = process.env.SLACKBOT_TOKEN
const webClient = new WebClient(token)

/* =====================================
 * =====================================
 * =====================================
 * =====================================
 *   configure express app
 * =====================================
 * =====================================
 * =====================================
 */


/* =====================================
 * =====================================
 * =====================================
 * =====================================
 *   slack events
 * =====================================
 * =====================================
 * =====================================
 */


app.use('/slack/events', slackEvents.expressMiddleware())

// SLACK_SIGNING_SECRET=<signing_secret> SLACK_BOT_TOKEN=<bot_user_oAuth_access_token> node app.js

slackEvents.on('app_mention', async (event) => {
  try {

    // TODO: condition to restrict users based on user ID array
    // event.user
    // if event.user not in array, don't do anything.

    // '<@U024AFLF4LW> <@UURCC8FEC>' - example user message text that mentions users
    const userIdStrs = event.text.match(/\<(.+?)\>/g);
    const userIds = userIdStrs.map(userIdStr =>
      userIdStr.substr(2,userIdStr.length-3)
    );

    const users = [];

    for( let i=0; i<userIds.length; i+=1){

      let userId = userIds[i];
      const response = await webClient.users.info({ user: userId });
      users.push( response.user );
    }

    const messageJsonBlock = createJsonBlock(users);
    const mentionResponseBlock = { ...messageJsonBlock, ...{channel: event.channel}, text: 'Congrats!'}
    const res = await webClient.chat.postMessage(mentionResponseBlock)

  } catch (e){
    console.error('caught an error!!');
    console.error(e);
  }
})
/* =====================================
 * =====================================
 * =====================================
 * =====================================
 *          listen
 * =====================================
 * =====================================
 * =====================================
 */

// Starts server
app.listen(port, function() {
  console.log('Bot is listening on port ' + port)
})

/* =====================================
 * =====================================
 * =====================================
 * =====================================
 *        helper functions
 * =====================================
 * =====================================
 * =====================================
 */

const createJsonBlock = (allUsers) => {
  const users = allUsers.filter( user => user.name != 'ra_cert_bot' );
  const blocks = users.map(createBlock);
  return {blocks};
};

const createBlock = (user) => {
  return {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": createMessage(user.real_name)
    }
  }
};

const createMessage = (name) => {
  return `<${createUrl(name)}|certificates.rocketacademy.co | ${name} | Congrats!!>`;
};

const createUrl = (name) => {
  // re-encode: console.log(Buffer.from(b64Encoded, 'base64').toString());
  let b64 = Buffer.from(name).toString('base64');
  let date = moment().format("Do MMMM YYYY"); // https://momentjs.com/docs/#/displaying/
  return `${CERT_URL}?name=${name}&date=${date}&hash=${b64}`;
};

/* =====================================
 * =====================================
 * =====================================
 * =====================================
 *        How to Make Messages
 *        https://app.slack.com/block-kit-builder/TNYFQH8G5
 * =====================================
 * =====================================
 * =====================================
 */
