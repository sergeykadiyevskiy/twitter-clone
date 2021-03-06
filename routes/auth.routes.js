const router = require("express").Router();
const User = require("../models/User.model");
const Tweet = require("../models/Tweet.model");
var axios = require("axios").default;

//middleware
const { isLoggedIn, isLoggedOut } = require("../middleware/logged");

// bcrypt and salt password hash
const bcryptjs = require("bcryptjs");
const saltRounds = 10;

// SignUp, add to database, and encrypt password
router.get("/signup", isLoggedOut, (req, res) => {
  res.render("auth/signup");
});

router.post("/signup", isLoggedOut, (req, res, next) => {
  const { username, password, email } = req.body;
  if (!username || !email || !password) {
    res.render("auth/signup", {
      errorMessage:
        "All fields are mandatory. Please provide your username, email and password.",
    });
    return;
  }
  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res.status(500).render("auth/signup", {
      errorMessage:
        "Password needs to have at least 6 characters and must contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }
  bcryptjs
    .genSalt(saltRounds)
    .then((salt) => bcryptjs.hashSync(password, salt))
    .then((hashedPassword) => {
      return User.create({
        username,
        email,
        password: hashedPassword,
      });
    })
    .then((createdUser) => {
      console.log("new user was created", createdUser);

      // session
      console.log(req.session);
      req.session.currentUser = createdUser;

      console.log(req.session.currentUser);
      res.redirect("/userProfile");
    })
    .catch((err) => console.log("ERROR CREATING USER", err));
});

// Login Route
router.get("/login", isLoggedOut, (req, res, next) => {
  res.render("auth/login");
});

router.post("/login", isLoggedOut, (req, res, next) => {
  console.log("SESSION =====> ", req.session);
  const { email, password } = req.body;

  if (email === "" || password === "") {
    res.render("auth/login", {
      errorMessage: "Please enter both, email and password to login.",
    });
    return;
  }
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        res.render("auth/login", {
          errorMessage: "Email is not registered. Try with other email.",
        });
        return;
      } else if (bcryptjs.compareSync(password, user.password)) {
        req.session.currentUser = user;

        res.redirect("/userProfile");
      } else {
        res.render("auth/login", { errorMessage: "Incorrect password." });
      }
    })
    .catch((error) => next(error));
});

// User Profile
// router.get("/userProfile", isLoggedIn, (req, res) => {
//   res.render("user/user-profile", { userInSession: req.session.currentUser });
// });

router.get("/userProfile", isLoggedIn, (req, res, next) => {
  console.log("this is the user", req.session.currentUser._id);
  User.findById(req.session.currentUser._id)
    .then((currentUser) => {
      // res.render("user/user-profile", {userInSession: req.session.currentUser} )
      Tweet.find({ creatorId: req.session.currentUser._id })
        .then((foundTweets) => {
          console.log("Found all of the tweets", foundTweets);
          res.render("user/user-profile", {
            userInSession: req.session.currentUser,
            tweets: foundTweets,
          });
        })
        .catch((err) => {
          console.log("Something went wrong", err);
        });
    })
    .catch((err) => {
      console.log("Something went wrong", err);
    });
});

// View All User Tweets
router.get("/userProfile/:id", isLoggedIn, (req, res) => {
  const userId = req.params.id;
  User.findById(userId)
    .then((user) => {
    Tweet.find({creatorId: user._id})
    .populate("creatorId")
    .then((foundTweets)=>{
      res.render("user/users-tweets", { foundTweets: foundTweets, user: user});
    })
     
    })
    .catch((error) => next(error));
});

// Update user profile
router.get("/userProfile/:id/edit", isLoggedIn, (req, res) => {
  const userId = req.params.id;
  User.findById(userId)
    .then((user) => {
      console.log(user);
      res.render("user/edit-profile", { userInSession: user });
    })
    .catch((error) => next(error));
});

router.post("/userProfile/:id/edit", isLoggedIn, (req, res) => {
  const updatedUser = req.body;
  const userId = req.params.id;
  User.findByIdAndUpdate(userId, updatedUser)
    .then(() => {
      res.redirect("/userProfile");
    })
    .catch((error) => next(error));
});

// Delete User
router.post("/userProfile/:id/delete", isLoggedIn, (req, res) => {
  const updatedUser = req.body;
  const userId = req.params.id;
  User.findByIdAndDelete(userId, updatedUser)
    .then(() => {
      req.session.destroy((err) => {
        if (err) next(err);
        res.status(204).redirect("/auth/signup");
      });
    })
    .catch((error) => next(error));
});

// Logout and destroy session
router.post("/logout", isLoggedIn, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) next(err);
    res.redirect("/");
  });
});

//This pulls up the create tweet form
router.get("/create-tweet", isLoggedIn, (req, res, next) => {
  res.render("create-tweet");
});

//This saves a new tweet in the database
router.post("/create-tweet", isLoggedIn, (req, res, next) => {
  console.log("this is the session", req.session);
  Tweet.create({
    content: req.body.content,
    gif: req.body.gif,
    creatorId: req.session.currentUser._id,
  })
    .then((newTweet) => {
      console.log("A new tweet was created", newTweet);
      res.redirect("/all-tweets");
    })
    .catch((err) => {
      console.log("Something went wrong", err);
    });
});

//This pulls all tweets from a database
router.get("/all-tweets", isLoggedIn, (req, res) => {
  Tweet.find()
    .populate("creatorId")
    .then((allTweets) => {
      console.log("All tweets", allTweets);
      res.render("all-tweets", { tweets: allTweets });
    })
    .catch((err) => {
      console.log("Something went wrong", err);
    });
});

module.exports = router;
