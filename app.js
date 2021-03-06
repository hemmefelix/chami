var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var validator = require("jsonschema").Validator;
var cron = require("./scheduling/cron.js");

// Load dev config if suitable.
try {
  let config = require("./config.json");
  for (var prop in config) {
    if (config.hasOwnProperty(prop)) {
      process.env[prop] = config[prop];
    }
  }
} catch (err) {
  console.error("No local config present.");
}

if (process.env.debug) {
  // Some debugging
  //var librisFolioDataMover = new (require('./librisfoliodatamover.js'))();
  //librisFolioDataMover.moveData(10939573);
  //librisFolioDataMover.moveData(null, '2018-11-13T12:00:00Z');
  //librisFolioDataMover.moveData();
  //var fetchScheduler = new (require('./scheduling/fetchscheduler.js'))();
  //fetchScheduler.getLatestFetchTimestamp();
}

cron.initialize(process.env.cronenabled || false);

var apiRouter = require("./routes/api");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api", apiRouter);

app.get("/bookmarklet.js", (req, res) => {
  let jsString = `
  if (location.host === "libris.kb.se") {
    if (/^\\/katalogisering\\/[\\w\\d]{15}/.test(location.pathname)) {
      if (
        document.getElementsByClassName("type")[0].childNodes[0].textContent ===
        "Instans"
      ) {
        let librisurl = \`https://\${location.host}\${location.pathname.replace(
          "/katalogisering",
          ""
        )}\`;
        location.href = \`${process.env.serverurl}/api/PostAndRedirect?id=\${librisurl}\`;
      } else {
        alert("Du står inte på en instans.");
      }
    } else {
      alert("Du är inte i katalogiseringsverktyget.");
    }
  } else {
    alert("Du besöker inte Libris!");
  }
  `;
  res.set("Content-Type", "application/javascript");
  res.send(jsString);
});

/**
 * Module dependencies.
 */

var debug = require("debug")("chami:server");
var http = require("http");

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || "3000");
app.set("port", port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}
