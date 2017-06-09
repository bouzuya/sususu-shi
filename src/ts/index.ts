/*
@XXX review YYY#ZZZ and assign

https://api.slack.com/tutorials/events-api-using-aws-lambda
*/

const https: any = require('https'),
      qs: any = require('querystring'),
      VERIFICATION_TOKEN = process.env.NODE_SLACK_VERIFICATION,
      ACCESS_TOKEN = process.env.NODE_SLACK_ACCESS,
      GITHUB_PASS = process.env.NODE_GITHUB_PASS,
      GITHUB_TEAM = process.env.NODE_GITHUB_TEAM;

var GitHubApi: any = require("github");
var github = new GitHubApi();

// Verify Url - https://api.slack.com/events/url_verification
function verify(data: any, callback: any) {
    if (data.token === VERIFICATION_TOKEN) callback(null, data.challenge);
    else callback("verification failed");   
}

// Post message to Slack - https://api.slack.com/methods/chat.postMessage
function slackProcess(event: any, callback: any) {
    // test the message for a match and not a bot
    if (!event.bot_id && /(aws|lambda)/ig.test(event.text)) {
        var text: string = `<@${event.user}> isn't AWS Lambda awesome?`;
        var message: any = { 
            token: ACCESS_TOKEN,
            channel: event.channel,
            text: text
        };

        var query: string = qs.stringify(message); // prepare the querystring
        https.get(`https://slack.com/api/chat.postMessage?${query}`);
    }

    callback(null);
}

// Hear @XXX review YYY#ZZZ and assign
function assignToIssue(event: any, callback: any) {
    var re: any = /^\s*[@]?([^:,\s]+)[:,]?\s*review\s+(?:([^\/]+)\/)?([^#]+)#(\d+)\s*$/i;
    if (!event.bot_id && re.test(event.text)) {
        var str: string = event.text;
        var found: string[] = str.match(re);
        /*
        @ossan review rally-app#1234
        found[1] -> ossan
        found[3] -> rally-app
        found[4] -> 1234
        */
        var tadasan: any = {
            owner: GITHUB_TEAM,
            repo: found[3],
            number: found[4],
            assignees: found[1] //現段階ではslack側でgithubの@アカウント名とする必要がある。のちに設定が必要
        }
        var text: string = "Assigned " + found[1] + " to " + GITHUB_TEAM + "/" + found[3] + " issue #" + found[4];
        var message: any = { 
            token: ACCESS_TOKEN,
            channel: event.channel,
            text: text
        };

        var query: string = qs.stringify(message); // prepare the querystring
        https.get(`https://slack.com/api/chat.postMessage?${query}`);

        github.authenticate({
            type: "basic",
            username: found[1], //のちにslackとgithubの紐付けが必要
            password: GITHUB_PASS
        });
        github.issues.addAssigneesToIssue(tadasan);
    }
    callback(null);
}


// Lambda handler
function handler(data:any, context: any, callback: any) {
    switch (data.type) {
        case "url_verification": verify(data, callback); break;
        case "event_callback":
            slackProcess(data.event, callback);
            assignToIssue(data.event, callback); 
            break;
        default: callback(null);
    }
};
export { handler };
