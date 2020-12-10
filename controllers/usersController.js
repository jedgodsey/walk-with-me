const express = require('express');
const router = express.Router();
const db = require('../models');

//-------------------------------------- Helper Functions

const helpers = require('../models/helpers.js')

//-------------------------------------------- ROUTES

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error', 'You must sign in first');
    res.redirect('/login');
}

function isCurrentUser(req, res, next) {
    db.User.findById(req.params.user, (err, foundUser) => {
        if(err) return console.log(err);
        if(req.user._id.equals(foundUser._id)){
            next()
        } else {
            req.flash('error', 'You can only edit/delete your own profile');
            res.redirect(`/users/${req.user._id}`)
        }
    })
}

// all routes assume '/users'
router.get('/', isLoggedIn, (req, res) => {
    db.User.find({}, (err, allUsers) => {
        if(err) return console.log(err);
        res.render('users/index', {
            allUsers: allUsers
        })
    })
})

// render page with just user info
router.get('/:user/', isLoggedIn, (req, res) => {
    db.User.findById(req.params.user, (err, foundUser) => {
        if(err) return console.log(err);
        db.Dog.find({}, (err, allDogs) => {
            err ? console.log(err) : res.render('users/show', {
                user: foundUser,
                allDogs: allDogs,
            })
        })
        
    })
})

// render dashboard upon logging in
router.get('/:user/dashboard', isLoggedIn, isCurrentUser, (req,res) => {
    db.Dog.find({schedule: {$in: `${req.params.user}`}}, (err, foundDogs) => {
        if (err) return console.log(err);
        res.render('users/dashboard', {
            dogs: foundDogs,
            userId: req.params.user,
            helpers: helpers,
            user: req.user
        })
    })
})

// render page to edit or delete account
router.get('/:user/edit', isLoggedIn, isCurrentUser, (req, res) => {
    db.User.findById(req.params.user, (err, foundUser) => {
        if(err) return console.log(err);
        db.Dog.find({}, (err, allDogs) => {
            err ? console.log(err) : res.render('users/edit', {
                user: foundUser,
                allDogs: allDogs,
            })
        })
    })
})

// update account info in database
router.put('/:user', isLoggedIn, isCurrentUser, (req, res) => {
    if(req.body.userImg === ''){
        req.body.userImg = '/images/default-user.png'
    };
    db.User.findByIdAndUpdate(req.params.user,
        req.body,
        {new: true},
        (err, updated) => {
            if(err) return console.log(err);
            req.flash('success', 'Your account was updated successfully');
            res.redirect(`${updated._id}`)
        }
    )
})

// delete account from database
router.delete('/:user', isLoggedIn, isCurrentUser, (req, res) => {
    db.User.findByIdAndDelete(req.params.user, (err, deleted) => {
        if(err) return console.log(err);
        req.flash('error', 'Account successfully deleted, feel free to create a new one');
        res.redirect('/login');
    })
})

module.exports = router
