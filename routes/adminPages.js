const express = require('express')
const {check, validationResult} = require('express-validator')
const router = express.Router();

//get page model for collection in mongodb
const Page = require('../models/page');


router.get('/', (req,res)=>{
  Page.find({}).sort({sorting: 1}).exec((err, docs)=>{
    res.render('admin/pages',{
      pages: docs
    })
  })
})

router.get('/add-page', (req,res)=>{
  var titlePage = "";
  var slug = "";
  var content = "";
  res.render('admin/add_page', {
    titlePage: titlePage,
    slug: slug,
    content: content
  })
})

router.post('/add-page', [
    check('title').not().isEmpty(),
    check('content').not().isEmpty()
  ] ,(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()){
      res.render('admin/add_page', {
        errors: errors.errors,
        title: req.body.title,
        slug: req.body.slug,
        content: req.body.content
      });
    }
    else{
      //if slug empty, take title.
      req.body.slug = req.body.slug.replace(/\s+/g, '-').toLowerCase() || req.body.title.replace(/\s+/g, '-').toLowerCase();
      Page.findOne({slug: req.body.slug}, (err, row)=>{
        if(page){
          req.flash('error', 'Page slug exist, choose another');
          res.render('admin/add_page', {
            titlePage: req.body.title,
            slug: req.body.slug,
            content: req.body.content
          });
        }
        else{
          var page =  new Page({
            title: req.body.title,
            slug: req.body.slug,
            content: req.body.content,
            sorting: 100
          })

          page.save((err)=>{
            if (err) return console.log(err);
            req.flash('info', 'Page added');
            res.redirect('/admin/');
            console.log("Done");
          })
        }

      });

      
    } 
});

router.post('/reorder-page', (req,res)=>{
  var ids = req.body['id[]'];
  var cnt = 0;
  ids.forEach((value)=>{
    Page.findById(value, (err,doc)=>{
      doc.sorting = cnt++;
      doc.save();
    })
  })
});

router.get('/edit-page/:slug', (req,res)=>{
  Page.findOne({slug: req.params.slug}, (err, row)=>{
    if(row){
      res.render('admin/edit_page', {
        titlePage: row.title,
        slug: req.params.slug,
        content: row.content
      });
    }
    else{
      req.flash('error', 'Page slug exist, choose another');
      res.redirect('/admin/');
    }
  });
})

router.post('/edit-page', [
    check('title').not().isEmpty(),
    check('content').not().isEmpty()
  ] ,(req,res)=>{
    console.log("HERE");  
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()){
      res.render(`admin/edit_page`, {
        errors: errors.errors,
        titlePage: req.body.title,
        slug: req.body.title.replace(/\s+/g, '-').toLowerCase(),
        content: req.body.content
      });
    }
    else{
      
      Page.updateOne({ slug: req.body.slug}, { $set: {title: req.body.title, content: req.body.content, slug: req.body.title.replace(/\s+/g, '-').toLowerCase()}}, (err,raw)=>{
        if (err) throw err;
        req.flash("info", "Page edited.");
        res.redirect('/admin/');
      });
    }
});

router.delete('/delete-page/:id', (req,res)=> {
  console.log("Entered");
  console.log(req.params.id);
  Page.deleteOne({_id: req.params.id}, (err)=>{
    if (err){
      req.flash("error", "Can't delete the page.");
      res.redirect('/admin/');
    }
    else{
      req.flash("info", "Page deleted.");
      res.redirect("/admin/");
    }
  })
})
//Exports
module.exports = router;
