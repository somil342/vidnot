const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
const app = express();

//db config
const db= require('./config/db');



//destructuring (bringing as a variable)
//const {ensureAuthenticated}= require('./helpers/auth');
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        console.log("chvhcbshbhsbs");
        return next();
    }
    req.flash('error_msg', 'Not Autherized');
    res.redirect('/users/login');
}
// debug......console.log(ensureAuthenticated);
// config passport 
require('./config/passport')(passport);

//load ideas model
require('./models/Idea');
const Idea = mongoose.model('ideas');


//load users model
require('./models/User');
const User = mongoose.model('users');


mongoose.Promise = global.Promise;
//connect mongoose
mongoose.connect(db.mongoURI)
    //,{useMongoClient: true}
    .then(() => {
        console.log('mongodb connected..')
    })
    .catch((err) => { console.log(err) });


//hbs middlware
app.engine('handlebars', exphbs({
    defaultLayout: 'main'
}))
app.set('view engine', 'handlebars');

//body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//static folder
app.use(express.static(path.join(__dirname, 'public')));

//middle ware method override
app.use(methodOverride('_method'));

//express-middlewre
app.use(session({
    secret: 'my dog',
    resave: true,
    saveUninitialized: true
}));

// passport middleware
app.use(passport.initialize());
app.use(passport.session());


//flash middlware
app.use(flash());


//global var
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error'); // for passport
    res.locals.user = req.user || null;
    next(); // calling next piece of midlwre
})



//index pag
const title = "Welcome"
app.get('/', (req, res) => {
    res.render('index', { title: title });
});
//about route
app.get('/about', (req, res) => {
    res.render('about', { title: "About" })
})



// idea index page
app.get('/ideas', ensureAuthenticated, (req, res) => {
    Idea.find({user: req.user.id})
        .sort({ date: 'desc' })
        .then(ideas => {
            res.render('ideas/index', {
                ideas: ideas
            });
        })
})


//add idea form
app.get('/ideas/add', ensureAuthenticated, (req, res) => {
    res.render('ideas/add');
})


//edit idea form
app.get('/ideas/edit/:id', ensureAuthenticated, (req, res) => {
    // console.log(req.params.id);
    Idea.findOne({
        _id: req.params.id
    })
        .then(idea => {
            if(idea.user!=req.user.id){
                req.flash('error_msg','Not Autharized');
                res.redirect('/ideas');
            }
            else{
                res.render('ideas/edit',{
                    idea:idea
                })
            }
            res.render('ideas/edit', {
                idea: idea
            })
        })
        .catch(() => { res.send(err) })
});



//Process form
app.post('/ideas', ensureAuthenticated, (req, res) => {
    let errors = [];
    if (!req.body.title) {
        errors.push({ text: "title toh daal dete" });
    }
    if (!req.body.details) {
        errors.push({ text: "details missing" });
    }

    if (errors.length > 0) {
        res.render('/ideas/add', {
            errors: errors,
            title: req.body.title,
            details: req.body.details
        })
    }
    else {
        const newUser = {
            title: req.body.title,
            details: req.body.details,
            user: req.user.id
        }
        new Idea(newUser)
            .save()
            .then(idea => {
                req.flash('success_msg', 'Task added');
                res.redirect('/ideas');
            })
    }
});

//edit form process
app.put('/ideas/:id', ensureAuthenticated, (req, res) => {
    Idea.findOne({
        _id: req.params.id
    })
        .then(idea => {
            //update
            idea.title = req.body.title;
            idea.details = req.body.details;

            idea.save()
                .then(idea => {
                    req.flash('success_msg', 'Task Updated');
                    res.redirect('/ideas');
                })
        })
})

//delete idea
app.delete('/ideas/:id', ensureAuthenticated, (req, res) => {
    Idea.remove({
        _id: req.params.id
    })
        .then(() => {
            req.flash('success_msg', 'Task deleted');
            res.redirect('/ideas');
        })
});



//user login
app.get('/users/login', (req, res) => {
    res.render('users/login');
})


//login post
app.post('/users/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/ideas',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);   // this is to  fire off immediatley failureRedirect
})


//user register
app.get('/users/register', (req, res) => {
    res.render('users/register');
})

//register post
app.post('/users/register', (req, res) => {
    let errors = [];
    if (req.body.password != req.body.password2) {
        errors.push({ text: 'Password do not match!' });
    }
    if (req.body.password.length < 4) {
        errors.push({ text: 'Password must be at least 4 characters' });
    }

    if (errors.length > 0) {
        res.render('users/register', {
            errors: errors,
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            password2: req.body.password2

        });
    } else {
        // same id checking
        User.findOne({ email: req.body.email })
            .then(user => {
                if (user) {
                    req.flash('error_msg', 'Email already registered');
                    res.redirect('/users/login');
                }
                // different ids           
                else {

                    const newUser = new User({
                        name: req.body.name,
                        email: req.body.email,
                        password: req.body.password
                    });
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err;
                            newUser.password = hash;
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now registerd and can login');
                                    res.redirect('/users/login');
                                })
                                .catch(err => {
                                    console.log(err);
                                    return;
                                })
                        });
                    })
                }
            })

    }
})


//logout user
app.get('/users/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are logout');
    res.redirect('/users/login');
})


const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`server started on ${port}`)
});

