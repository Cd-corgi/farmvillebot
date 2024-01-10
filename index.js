const { Client, Collection, REST, Routes, Partials } = require('discord.js');
const client = new Client({ partials: [Partials.GuildMember, Partials.User], intents: [130815], });
const { botID, token, mailPass, mailUser } = require('./src/config/config.json');
const mailer = require('nodemailer')
const fs = require('fs'); const ee = require('events'); var events = new ee();
const http = require('http')
require('./src/utils/mongoose')();
console.clear()
const transporter = mailer.createTransport({ service: 'gmail', host: 'setp.gmail.com', port: 587, secure: false, auth: { user: mailUser, pass: mailPass }, })
client.mailing = transporter; client.commands = new Collection(); client.players = new Collection(); client.searchBy = new Collection();
process.on('unhandledRejection', error => { console.error("\x1b[41m", `[UNHANDLED ALARM] ${error}`, "\x1b[0m"); console.log(error); client.mailing.sendMail({ from: `"Bot Team" <b9005873@gmail.com>`, to: `creep3rcor7@gmail.com`, subject: `Unhandled Alarm from ${client.user.username}!`, html: `<p>${error}</p>` }) }); 
client.on('shardError', error => { console.error(`[SHARD ALARM] ${error}`); console.log(error); client.mailing.sendMail({ from: `"Bot Team" <b9005873@gmail.com>`, to: `creep3rcor7@gmail.com`, subject: `Shard Alarm from ${client.user.username}!`, html: `<p>${error}</p>` }) });
fs.readdir("./src/events/", (err, files) => { if (err) console.error; files.forEach(file => { if (!file.endsWith(".js")) return; let eName = file.split(".")[0]; const events = require(`./src/events/${file}`); client.on(eName, events.bind(null, client)); console.log(`[BOT] ${eName} Loaded!`); }) });
fs.readdirSync("./src/commands").forEach(category => { const comm = fs.readdirSync(`./src/commands/${category}`).filter(f => f.endsWith(".js")); for (const command of comm) { let commandFile = require(`./src/commands/${category}/${command}`); client.commands.set(commandFile.data.name, commandFile); } });
loadSlash(token, botID); loadPlayers(client);
client.login(token).catch(err => { console.log(err) });
function loadSlash(tk, bid) { var cmds = []; fs.readdirSync("./src/commands").forEach(category => { const comm = fs.readdirSync(`./src/commands/${category}`).filter(f => f.endsWith(".js")); for (const command of comm) { let commandFile = require(`./src/commands/${category}/${command}`); cmds.push(commandFile.data.toJSON()) } }); const rest = new REST({ version: "10" }).setToken(tk); Slash(); async function Slash() { try { rest.put(Routes.applicationCommands(bid), { body: cmds }); console.log("Commands Loaded") } catch (error) { console.log(error) } } }
function loadPlayers(client) { fs.readdir("./src/events/getPlayerList", (err, files) => { if (err) console.error; files.forEach((f) => { if (!f.endsWith(".js")) return; let onceName = f.split(".")[0]; const ev = require(`./src/events/getPlayerList/${f}`); events.once(onceName, ev.bind(null, client)); console.log(`[ONCE] ${onceName} Loaded`); events.emit(onceName) }) }) }