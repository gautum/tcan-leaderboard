const Fortnite = require("fortnite-api");
const Credentials = require("../fortnite-api-config");
const Errors = require("../fortnite-api-errors");
const fs = require("fs");
const HashMap = require("hashmap");
let playerCache = require("./players.json");

let modeChoices = ["solo",
                    "duo",
                    "squad"];
let statChoices = ["wins",
                    "kd",
                    "win%",
                    "matches",
                    "kills",
                    "timePlayed",
                    "killsPerMatch",
                    "killsPerMin"];

let fortniteAPI = new Fortnite([Credentials.emailAddress,
                                Credentials.password,
                                Credentials.clientLauncherToken,
                                Credentials.fortniteClientToken]);

let statCache = new HashMap();

function getPlayerData(player, platform) {
    console.log("__GET PLAYER DATA__");
    let isValidPlayer = fortniteAPI.login()
        .then(() => {
            let innerBoolean = fortniteAPI.checkPlayer(player, platform)
                .then((data) => {
                    return true;
                })
                .catch((err) => {
                    console.log(err);
                    return false;
                });
            return innerBoolean;
        });
    console.log("isValidPlayer? -> " + isValidPlayer);
    return isValidPlayer;
}

module.exports = {
    main: function(bot, msg) {
        console.log('__INIT FORTNITE API__');
        let start = Date.now();
        let stop, diff;

        let args = msg.content.split(" ");
        console.log(args);
        let directive = args[0];
        switch(directive) {
            case "link":
                this.link(bot, msg, args);
                break;
            case "reload":
                this.reload(bot, msg);
                break;
            case "stats":
                 this.stats(bot, msg, args);
                 break
            case "help":
                this.help(bot, msg);
                break;
            default:
                msg.channel.send("Not sure what you want me to do.");
                break;   
        }
    },
    link: function(bot, msg, args) {
        let discordUsername = msg.author.username;
        let player = args[1];
        let platform = args[2];
        console.log(player, platform);

        let isUnlinked = !(discordUsername in playerCache);

        if (isUnlinked) {
            let isValidPlayer = getPlayerData(player, platform);
            console.log(isValidPlayer)
            if (isValidPlayer) {
                playerCache[discordUsername] = {
                    "epicId": `${player}`,
                    "platform": `${platform}`
                };
                console.log(JSON.stringify(playerCache, null, 2))
                console.log("--> WRITING TO PLAYER CACHE . . .");
                fs.writeFile("C:\\Users\\thbarnes\\Desktop\\tcan-leaderboard\\commands\\players.json", JSON.stringify(playerCache, null, 2), (err) => {
                    if (err) throw err;
                    console.log('--> WRITE COMPLETE!');
                });
            }
            else {
                msg.channel.send("Player is invalid.");
            }
        }
        else {
            msg.channel.send("You are already linked to an Epic Games Account.");
        }
    },
    stats: function(bot, msg, args) {
        let discordUsername = msg.author.username;
        let isLinked = discordUsername in playerCache;
        let mode = args[1];
        let stat = args[2];
        
        if (isLinked) {
            let player = playerCache[discordUsername].epicId;
            let platform = playerCache[discordUsername].platform;

            fortniteAPI.login()
                .then(() => {
                    fortniteAPI.getStatsBR(`${player}`, `${platform}`)
                    .then((res) => {
                        console.log("--> UPDATING STAT CACHE FOR "+discordUsername);
                        let modeChoices = ["solo",
                                           "duo",
                                           "squad"];
                        let statChoices = ["wins",
                                           "kd",
                                           "win%",
                                           "matches",
                                           "kills",
                                           "timePlayed",
                                           "killsPerMatch",
                                           "killsPerMin"];
                        let playerStats = {
                            "solo": {
                                "wins": 0,
                                "kd": 0,
                                "win%": 0,
                                "matches": 0,
                                "kills": 0,
                                "timePlayed": '',
                                "killsPerMatch": 0,
                                "killsPerMin": 0 },
                            "duo": {
                                "wins": 0,
                                "kd": 0,
                                "win%": 0,
                                "matches": 0,
                                "kills": 0,
                                "timePlayed": '',
                                "killsPerMatch": 0,
                                "killsPerMin": 0 },
                            "squad": {
                                "wins": 0,
                                "kd": 0,
                                "win%": 0,
                                "matches": 0,
                                "kills": 0,
                                "timePlayed": '',
                                "killsPerMatch": 0,
                                "killsPerMin": 0 }
                        };
                        console.log(JSON.stringify(res, null, 2));
                        console.log(JSON.stringify(playerCache, null, 2));
                        for (let m=0, len=modeChoices.length; m<len; m++) {
                            for (let s=0, leng=statChoices.length; s<leng; s++) {
                                playerStats[modeChoices[m]][statChoices[s]] = res["group"][modeChoices[m]][statChoices[s]];
                            }
                        }
                        console.log(JSON.stringify(playerStats, null, 2));
                        statCache.set(discordUsername, playerStats);
                        msg.channel.send(`\`\`\`${JSON.stringify(playerStats, null, 2)}\`\`\``);
                        msg.channel.send(statCache.get(discordUsername)[mode][stat]);
                        // console.log(res);
                    })
                    .catch((err) => {
                        // msg.channel.send(err);
                        console.log(err);
                        switch (err) {
                            case Errors.STATS_WrongSyntaxError:
                                msg.channel.send("Incorrect usage of **stats**, proper syntax is ```!fortnite stats <playerName> <platform>```");
                                break;
                            case Errors.STATS_UserNotFoundError:
                                msg.channel.send("User not found on this platform.");
                                break;
                            default:
                                msg.channel.send("Something went wrong.");
                        }
                    });
                });
        }
        else {
            msg.channel.send("You must **link** your Epic Games Account before using this command.  Type ```!fortnite link <username> <platform>```.");
        }
    },
    help: function(bot, msg) {
        msg.channel.send("Fortnite API Commands")
    }
};