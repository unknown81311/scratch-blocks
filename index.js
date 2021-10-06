const { Client, Intents, MessageAttachment } = require("discord.js");
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
const config = require("./config.json");
const fs = require("fs");
const puppeteer = require("puppeteer");
const { JSDOM } = require("jsdom");//idk if it is needed 
const { window } = new JSDOM("");
const $ = require("jquery")(window);

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
    const prefix = config.prefix ? config.prefix : "!";
    let params;
    if (message.content.startsWith(prefix)) params = message.content.split(" ");

    if (message.author.id == message.guild.ownerId && message.content.startsWith(prefix + "config")) {
        if (params.length == 3) {
            if (params[1] == "prefix") {
                config.prefix = params[2];
                writetoconfig();//for other configs in the future if need be
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
                    ],
                },
            ],
        });
    }
    if (message.content === prefix + "help formatting") {
        message.reply("same as here: <https://en.scratch-wiki.info/wiki/Block_Plugin/Syntax>\njust withought the [scratchblocks]");
    }
    if (message.content === prefix + "ping") {
        message.reply("pong!");
    }
    if (message.content.startsWith(prefix + "make")) {
        console.log(params.slice(1).join(" "));
        const block = await getblockimage(params.slice(1).join(" "))
        if (!Buffer.isBuffer(block)){//added "error handling"
            message.reply('error :(')
            return
        };

        const attachment = new MessageAttachment(block, "exmaple.png");
        message.reply({ files: [attachment] });
    }
});
function writetoconfig() {
    fs.writeFile("./config.json", JSON.stringify(config), (err) => {
        if (err) throw err;
    });
}
async function getblockimage(code) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("https://scratchblocks.github.io/#?style=scratch3&script=" + encodeURI(code));
    const content = await page.$("#preview svg");
    await page.evaluate(() => (document.body.style.background = "transparent"));
    const imageBuffer = await content.screenshot({ omitBackground: true });
    await browser.close();
    return imageBuffer;
}
client.login(config.token);
