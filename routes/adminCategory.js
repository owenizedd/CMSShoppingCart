const express = require('express')
const {check, validationResult} = require('express-validator')
const router = express.Router();

//get category model for collection in mongodb
const Category = require('../models/category');


router.get('/', (req,res)=>{
  Category.find((err, docs)=>{
    if (err) return console.log(err);
    res.render('admin/categories', {
      categories: docs
    })
  })
})

router.get('/add-category', (req,res)=>{
  res.render('admin/add_category')
})

router.post('/add-category', [
    check('title').not().isEmpty(),
  ] ,(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()){
      res.render('admin/add_category', {
        errors: errors.errors,
        category: req.body.title
      });
    }
    else{
      Category.findOne({title: req.body.title}, (err, doc)=>{
        if(doc){
          res.render('admin/add_category', {
            errors: [{msg: 'Category already exists.'}],
            category: req.body.title
          });
        }
        else{
          var cat =  new Category({
            title: req.body.title,
            slug: req.body.title.replace(/\s+/g, '-').toLowerCase()
          })

          cat.save((err)=>{
            if (err) return console.log(err);
            console.log("HERE");
            req.flash('info', 'Category added');
            res.redirect('/categories');
          })
        }

      });

      
    } 
});

router.get('/edit-category/:slug', (req,res)=>{
  Category.findOne({slug: req.params.slug}, (err, row)=>{
    if(row){
      res.render('admin/edit_category', {
        category: row.title,
        slug: req.params.slug
      });
    }
    else{
      req.flash('danger', 'Category does not exist, choose another');
      res.redirect('/categories');
    }
  });
})

router.put('/edit-category', [
    check('title').not().isEmpty(),
  ] ,(req,res)=>{
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()){
      res.render(`admin/edit_category`, {
        errors: errors.errors,
        category: req.body.title,
        slug: req.body.title.replace(/\s+/g, '-').toLowerCase()
      });
    }
    else{
      Category.updateOne({ slug: req.body.slug}, { $set: {title: req.body.title, slug: req.body.title.replace(/\s+/g, '-').toLowerCase() } }, (err,raw)=>{
        if (err) throw err;
        req.flash("info", "Category edited.");
        res.redirect('/categories/');
      });
    }
});

router.delete('/delete-category/:id', (req,res)=> {
  console.log("Entered");
  console.log(req.params.id);
  Category.deleteOne({_id: req.params.id}, (err)=>{
    if (err){
      req.flash("error", "Can't delete the category.");
      res.redirect('/categories/');
    }
    else{
      req.flash("info", "Category deleted.");
      res.redirect("/categories/");
    }
  })
})
//Exports
module.exports = router;
