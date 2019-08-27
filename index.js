const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const {check, validationResult} = require('express-validator');
const config = require('./config/database');
const methodOverride = require('method-override')
const flash = require('connect-flash');
const fileUpload = require('express-fileupload')
const app = express();

//connect to db
mongoose.connect('mongodb://localhost/cmscart', { useNewUrlParser: true}, (error)=>{
  if (error) console.log('Db error: ' + error);
  else console.log('MongoDB Connected');
}); 

//setting up  middleware

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.set('view engine', 'pug');
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));


//session & validator middleware
app.use(session({
  secret: 'owenizedd',
  resave: false,
  saveUninitialized: true,
  cookie: {secure: false }
}))
app.use(fileUpload());
app.use(flash());
app.use((req, res, next) => {
  
  res.locals.errs = req.flash("error");
  res.locals.infos = req.flash("info");
  next();
});

app.use('/', require('./routes/pages'));
app.use('/admin', require('./routes/adminPages'))
app.use('/categories', require('./routes/adminCategory'))
app.use('/products', require('./routes/adminProduct'))
//start server
const port = 3000;
app.listen(port, ()=>{
  console.log(`Server runs at port number: ${port}`);
})