const readline = require('readline');
const color = require("colors");
const WebSocketClient = require("websocket").client;
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const [,, panelUrl, panelApiKey, serverUUID] = process.argv;

if (!panelUrl || !panelApiKey || !serverUUID) {
  console.error(`Usage: Pterodactyl.exe <panelUrl> <panelApiKey> <serverUUID>`);
  process.exit(1);
}

axios.defaults.baseURL = panelUrl; 

const prod = async () => {
  try {
    const response = await axios.get(`/api/client/servers/${serverUUID}/websocket`, {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${panelApiKey}`
      }
    });

    const body = response.data;
    const token = body.data.token;
    const socket = body.data.socket;
    const client = new WebSocketClient();

    client.on("connectFailed", function (error) {
      console.log("Connect Error: " + error.toString());
    });

    client.on("connect", async function (connection) {
      await connection.sendUTF(`{"event":"auth","args":["${token}"]}`);

      setTimeout(() => { connection.sendUTF(`{"event":"send logs","args":[null]}`) }, 1000);

      connection.on("error", function (error) {
        console.log("Connection Error: " + error.toString());
      });

      connection.on("message", function (message) {
        if (message.type != "utf8") return;
        const isUserInput = message.utf8Data.startsWith('{"event":"send command"');
        if (!isUserInput) {
          if (message.utf8Data.startsWith(`{"event":"stats"`)) return;
          if (message.utf8Data.startsWith(`{"event":"install output"`)) {
            return console.log(color.blue(`[Pterodactyl Daemon]: ${JSON.parse(message.utf8Data).args.toString()}`));
          }
          if (message.utf8Data.startsWith(`{"event":"console output"`)) {
            return console.log(JSON.parse(message.utf8Data).args.toString());
          }
          if (message.utf8Data.startsWith(`{"event":"token expiring"`)) {
            connection.close();
            prod();
            return;
          }
          if (message.utf8Data.startsWith(`{"event":"status"`)) {
            return console.log(color.yellow(`Server marked as ${JSON.parse(message.utf8Data).args.toString()}`));
          }
          console.log(color.red(message));
        }

      });

      rl.on('line', function (line) {
        if (line === 'close') {
          connection.close();
          process.exit(0);
        }

        if (line.startsWith('power')) {
          return connection.sendUTF(`{"event":"set state","args":["${line.split(/ +/)[1]}"]}`);
        }

        connection.sendUTF(`{"event":"send command","args":["${line}"]}`);
      });
    });

    client.connect(`${socket}`, null, null, { Origin: panelUrl });
  } catch (error) {
    console.error("Error fetching token and socket URL:", error);
  }
};

prod();
