if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}

const express = require('express')
const app = express()
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const bodyParser = require('body-parser');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const api = require("./api");
const User = require('./models/user');
const { isLoggedIn, isVerified } = require('./utils/middlewares');

const userRouter = require("./routes/user");

async function main() {
    await mongoose.connect("mongodb://127.0.0.1:27017/mutualFund");
}

main()
    .then(() => {
        console.log("connected to database");
    })
    .catch((err) => {
        console.log(err);
    });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: "mongodb://127.0.0.1:27017/mutualFund",
    crypto: {
        secret: "slkdeidd6513egbwkshgqwidg"
    },
    touchAfter: 7 * 24 * 60 * 60 * 1000
});

store.on("error", () => {
    console.log("error in mongo session store", err)
});

const sessionOPtions = {
    store,
    secret: "slkdeidd6513egbwkshgqwidg",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true
    }
};

app.use(session(sessionOPtions));
app.use(cookieParser());
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.cookie('user', JSON.stringify(req.user));
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.get("/", isLoggedIn, isVerified, (req, res, next) => {
    res.render("home.ejs")
});

app.use("/api", api);
app.use("/users", userRouter);

app.listen(process.env.PORT || 8080, () => {
    console.log("listening to post 8080");
});