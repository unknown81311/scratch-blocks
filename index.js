const { Client, Intents, MessageAttachment } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS] });
let config = require("./config.json");
const fs = require("fs");
const puppeteer = require("puppeteer");
const fetch = require('node-fetch');

const sleep = ms => new Promise( res => setTimeout(res, ms));
let coolDown = new Map();

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('use -help for command help!');
});
client.on("messageCreate", async (message) => {
    try{
        if (RegExp(/^https:\/\/scratch\.mit\.edu\/projects\/\d{9}|\/$/).test(message.content)) {
            // if (coolDown.has(message.author.id)) {
            //     if (coolDown.get(message.author.id) < (new Date().getTime() / 1000 - 30) * 1000) {
            //         coolDown.set(message.author.id, (new Date().getTime() / 1000 + 30) * 1000)
            //         console.log('1',coolDown);

                    await sendembed(message);
            //     } else {
            //         console.log('2',coolDown);
            //     }
            // } else {
            //     console.log('3',coolDown);
            //     coolDown.set(message.author.id, (new Date().getTime() / 1000 + 30) * 1000);
            //     await sendembed(message);
            // }
        }

        config=require("./config.json");
        const prefix = config.prefix ? config.prefix : "-";
        let params;
        if (message.content.startsWith(prefix)) params = message.content.split(" ");
    
        if (message.author.id == message.guild.ownerId && message.content.startsWith(prefix + "config")) {
            if (params.length == 3) {
                if (params[1] == "prefix") {
                    config.prefix = params[2];
                    writetoconfig();
                    message.reply("done!");
                }else if (params[1] == "style") {
                    config.style = params[2];
                    writetoconfig();
                    message.reply("done!");
                }
            }
        }
        if (message.content === prefix + "help") {
            message.reply({
                embeds: [
                    {
                        color: 65290,
                        type: "rich",
                        title: "help",
                        description: "here is what I got!",
                        fields: [
                            {
                                name: "help",
                                value: "shows this message!",
                                inline: true,
                            },
                            {
                                name: "config",
                                value: "configure this bot.",
                                inline: true,
                            },
                            {
                                name: "make",
                                value: "replies with scratch block(s) of the text you provide.",
                                inline: true,
                            },
                            {
                                name: "help formatting",
                                value: "shows a help message for formatting the make message.",
                                inline: true,
                            },
                            {
                                name: "a2a",
                                value: "shows a ask to ask message.",
                                inline: true,
                            },
                            {
                                name: "h2a",
                                value: "shows a how to ask message.",
                                inline: true,
                            },
                        ],
                    },
                ],
            });
        }
        if (message.content.startsWith(prefix + "help formatting")) {
            message.reply("same as here: <https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax>\njust withought the [scratchblocks]");
        }
        if (message.content.startsWith(prefix + "a2a")) {
            message.reply("https://images-ext-1.discordapp.net/external/lfeodonGv5QNPMUO0Nn6G2VlpwXbhqTz76uM0P2mM2A/%3Fwidth%3D813%26height%3D678/https/media.discordapp.net/attachments/425764369197170690/545810894710636555/ask-1.png");
        }
        if (message.content.startsWith(prefix + "h2a")) {
            message.reply({"embeds":[{'type':'rich','title':'How To Ask For Help','color':'46e1ec','fields':[{'name':'When Asking For Help, You Should Send:','value':'_ _- What your program should do \n - What your program currently does \n - All relevant code and files related to the issue \n - What you have tried \n**Feel free to post images or other files if you think they could be helpful**','inline':false}]}]});
        }
        if (message.content.startsWith(prefix + "make")) {
            const block = await getblockimage(params.slice(1).join(" "))
            const attachment = new MessageAttachment(block, "image.png");
                const newMessage = await message.reply({ files: [attachment] });
                newMessage.react('🗑️');

                const filter = (reaction, user) => {
                    return reaction.emoji.name === '🗑️' && user.id === message.author.id;
                };

                newMessage.awaitReactions({filter,max:1,time:60000,errors:['time']})
                    .then(collected => {
                        const reaction = collected.first();
                
                        if (reaction.emoji.name === '🗑️') {
                            newMessage.delete();
                        }
                    }).catch(e=>{newMessage.reactions.removeAll()});
        }
        if (message.content.startsWith(prefix+'eval') && message.author.id == '359174224809689089'){
            console.log(params.slice(1).join(" "))
            await eval(params.slice(1).join(" "))
        }
    }
    catch(err){
        const date_ob = new Date(),
        date = ("0" + date_ob.getDate()).slice(-2),
        hours = date_ob.getHours(),
        minutes = date_ob.getMinutes(),
        seconds = date_ob.getSeconds(),
        timestamp = `${date} ${hours}:${minutes}:${seconds}`;
        //console.error('got error at'+timestamp+'added to logs');
        console.error(err);
        fs.writeFile("./error.log", timestamp+'\n'+err+'\n\n', (err) => {
            if (err) throw err;
        });
    }
});
function writetoconfig() {
    fs.writeFile("./config.json", JSON.stringify(config), (err) => {
        if (err) throw err;
    });
}
async function getScratchProjectImage(site) {
    const 
        browser = await puppeteer.launch(),
        page = await browser.newPage();
    await page.goto(site);
    await sleep(1000);
    const 
        Name = await page.$eval(`.title>a`, el => el.innerText),
        id = site.match(/\d{9}$/)[0]
    await browser.close();

    const apijson = await fetch(`https://api.scratch.mit.edu/users/${Name}/projects/${id}`)
        .then(res => res.json()).then((json)=>{return json});
    return [
    {
      "title": apijson.title,
      "description": apijson.description,
      "url": site,
      "color": 16771840,
      "fields": [
        {
          "name": "[ see inside ]",
          "value": site+"/editor",
          "inline": true
        }
      ],
      "author": {
        "name": Name,
        "url": "https://scratch.mit.edu/users/"+Name,
        "icon_url": apijson.author.profile.images["90x90"]
      },
      "image": {
        "url": apijson.images["282x218"]
      }
    }
  ]
}

async function getblockimage(code) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://scratchblocks.github.io/#?style=${config.style?config.style:"scratch3"}`);
    await page.evaluate((code) => (codeMirror.setValue(code)),code);
    await sleep(1000);
    const content = await page.$("#preview svg");
    await page.evaluate(() => (document.body.style.background="transparent"));
    await page.evaluate(() => (document.getElementById('side').style.display='none'));
    const imageBuffer = await content.screenshot({ omitBackground: true });
    await browser.close();
    return imageBuffer;
}

async function sendembed(message) {
    const embed = await getScratchProjectImage(message.content.replace(/\/$/, ''));
    const newMessage = await message.reply({
        embeds: embed
    });
    newMessage.react('🗑️');
    newMessage.react('👍');
    newMessage.react('👎');
    
    const filter = (reaction, user) => {
        return reaction.emoji.name === '🗑️' && user.id === message.author.id;
    };
    
    newMessage.awaitReactions({
        filter,
        max: 1,
        time: 60000,
        errors: ['time']
    })
    .then(collected => {
        const reaction = collected.first();
    
        if (reaction.emoji.name === '🗑️') {
            newMessage.delete();
        }
    }).catch(e => {
        newMessage.reactions.removeAll()
    });
}
client.login(config.token);
