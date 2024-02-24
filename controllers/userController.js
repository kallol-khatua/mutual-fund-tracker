const User = require("../models/user");
const otpGenerator = require('generate-otp-by-size');
const mailSender = require("../utils/mail");

module.exports.renderSignup = (req, res, next) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try{
        let {username, email, password} = req.body;

        let otp = otpGenerator.generateOTP(4);

        // register a new user
        let newUser = new User({username, email, otp});
        const registeredUser = await User.register(newUser, password);

        // sending email to the email given by the user along with otp
        let name = process.env.EMAIL_USER_NAME;
        let user = process.env.EMAIL_USER;
        let pass = process.env.EMAIL_PASS;
        await mailSender(name, user, pass, email, otp);
        
        // auto login after successfull signup
        req.login(registeredUser, (err) => {
            if(err) {
                return next(err);
            }
            req.flash("success", "Signup successfull");
            res.cookie('user', JSON.stringify(req.user));
            return res.redirect("/users/otpVerification");
        })
    } catch (error) { 
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email === 1) {
            req.flash('error', 'Email address is already in use.');
            // console.log(error.code);
            // console.log(error.keyPattern);
            // console.log(error.keyPattern.email);
            // console.log("Email address is already in use.");
            return res.status(400).redirect("/users/signin");
        } else if(error.message == " A user with the given username is already registered"){
            // Handle username taken error
            // Handle other errors
            // console.log(error.message);
            req.flash("error", error.message);
            return res.status(400).redirect("/users/signup");  
        } else {
            // console.log(error.message);
            req.flash("error", error.message);
            return res.status(500).redirect("/users/signup");
        }
    }
};

module.exports.renderSignin = (req, res, next) => {
    res.render("users/signin.ejs");
};

module.exports.signin = (req, res, next) => {
    console.log(req.body);
    // res.render("users/signup.ejs");
    res.send(req.body)
};

module.exports.otpVerification = (req, res) => {
    res.render("users/otpVerification");
};

module.exports.verifyOtp = async (req, res) => {
    const otpArray = req.body.otp;
    const joinedString = otpArray.join('');
    const resultNumber = parseInt(joinedString, 10);

    let user = await User.findOne({_id: String(req.user._id)});

    // when user already verified return to the main page
    if(user.isVerified) {
        return res.redirect("/");
    }

    // if correct otp entered then update isVerified = true
    if(resultNumber == user.otp) {  
        user.isVerified = true;
        await user.save();
    } else {
        return res.redirect("/users/otpVerification");
    }

    res.redirect("/");
};