 // load .env data into process.env
require('dotenv').config();

// Web server config
const PORT       = process.env.PORT || 3001;
const ENV        = process.env.ENV || "development";
const express    = require("express");
const bodyParser = require("body-parser");
const sass       = require("node-sass-middleware");
const app        = express();
const morgan     = require('morgan');

// PG database client/connection setup
const { Pool } = require('pg');
const dbParams = require('./lib/db.js');
const db = new Pool(dbParams);
db.connect();

// Load the logger first so all (static) HTTP requests are logged to STDOUT
// 'dev' = Concise output colored by response status for development use.
//         The :status token will be colored red for server error codes, yellow for client error codes, cyan for redirection codes, and uncolored for all other codes.
app.use(morgan('dev'));

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));

// Separated Routes for each Resource
// Note: Feel free to replace the example routes below with your own
const usersRoutes = require("./routes/users");
const resourceRoutes = require("./routes/resources");
const singleResource = require("./routes/single_resource");
const authRoutes = require("./routes/auth");
const createResourceRoute = require("./routes/creating_resources");

// Mount all resource routes
// Note: Feel free to replace the example routes below with your own
app.use("/users", usersRoutes(db));
app.use("/resources", resourceRoutes(db));
app.use("/register", authRoutes(db));
app.use("/single_resource", singleResource(db));
app.use("/create", createResourceRoute(db));
// Note: mount other resources here, using the same pattern above


// Home page
// Warning: avoid creating more routes in this file!
// Separate them into separate routes files (see above).
  app.get("/", (req, res) => {
    res.render("homepage");
  });
  // app.get('/users/', (req, res) => {
  //   res.render('navbar_logged_out')
  // });

  app.get("users/login/:username" , (req, res) => {
    res.render("profile");
  });

  app.get("/register/", (req, res) => {
    res.render("registration");
  });

 app.get("/resources/:category", (req, res) => {
   res.render("results")
  });


  app.get("/resources/", (req, res) => {
    res.render("resource");
  });

  app.get('/create', (req, res) => {
    res.render('resource_new')
  });

///

const getSingleResource = function(resourceID) {
  let queryString = `
  SELECT resources.*, AVG(resource_reviews.rating) AS rating, COUNT(resource_reviews.liking) AS likes, resource_reviews.comment AS comments
  FROM resources
  FULL OUTER JOIN resource_reviews ON resource_id = resources.id
  WHERE resources.id = $1
  GROUP BY resources.id, comments;
  `
  return db
  .query(queryString, [resourceID])
  .then(res => {
    return res.rows
  })
  .catch((err) => console.error(err));
}

app.get("/category/:id", (req, res) => {
    let id = req.params.id;
    console.log(id)
    getSingleResource(id)
    .then (singleResource => {
      res.render('resource', {singleResource: singleResource[0]})
    })
    .catch((err) => (console.log("500")));
});

///

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
