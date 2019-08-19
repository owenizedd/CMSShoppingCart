const express = require('express')
const {check, validationResult, body, files} = require('express-validator')
const fs = require('fs-extra')
const path = require('path')
const resizeImg = require('resize-img')

const router = express.Router();

//get product model for collection in mongodb
const Product = require('../models/product');

const Category = require('../models/category');
router.get('/', (req,res)=>{
  
  Product.find((err,docs)=>{
    res.render('admin/products', {
      products: docs,    
    })
  })
})

router.get('/add-product', (req,res)=>{
  Category.find((err,docs)=>{
    res.render('admin/add_product',{
      categories: docs
    })
  })
})

router.post('/add-product', [
    check('title').not().isEmpty(),
    check('description').not().isEmpty(),
    check('price').isDecimal(),
    check('image', 'Make sure your file is an image.  ').custom((value, {req})     => {
      if (!req.files.image) return true;
      if (req.files.image.mimetype.indexOf('jpeg')==-1 && req.files.image.mimetype.indexOf('jpg')==-1 && req.files.image.mimetype.indexOf('png')==-1 ) return false;
      return true; 
    })
  ] ,(req,res)=>{
  
    const errors = validationResult(req);
    if (!errors.isEmpty()){
      Category.find((err,docs)=>{
        res.render('admin/add_product', {
          errors: errors.errors,
          title: req.body.title,
          description: req.body.description,
          price: req.body.price,
          categories: docs
        });
      })
    }
    else{
      slug = req.body.title.replace(/\s+/g, '-').toLowerCase();

      Product.findOne({slug: slug}, (err, doc)=>{
        if(doc){
          // Category.find((err,docs)=>{
          //   res.render('admin/add_product', {
          //     errors: [{msg: 'product already exists.'}],
          //     title: req.body.title,
          //     description: req.body.description,
          //     price: req.body.price,
          //     categories: docs
          //   });
          // })
          req.flash('error', 'Product already exists.');
          res.redirect('/products/');
        }
        else{
          var product =  new Product({
            title: req.body.title,
            slug: req.body.title.replace(/\s+/g, '-').toLowerCase(),
            category: req.body.category,
            description: req.body.description,
            price: parseFloat(req.body.price).toFixed(2),
            image: req.files.image.name
          })

          product.save((err)=>{
            if (err) return console.log(err);
            console.log("HERE");
            fs.mkdirp(`public/product_images/${product._id}/gallery/thumbs`, (err)=>{
              return console.log(err)
            });
            
            if (req.files.image.name){
              console.log("here");
              var myImg = req.files.image;
              //err
              myImg.mv(path.join(__dirname,`/public/product_images/${product._id}/${req.files.image.name}`), (err)=>{
                if (err) return console.log(err);
              })
            }

            req.flash('info', 'product added');
            res.redirect('/products');
          })
        }

      });

      
    } 
});

router.get('/edit-product/:slug', (req,res)=>{
  Product.findOne({slug: req.params.slug}, (err, row)=>{
    if(row){
      res.render('admin/edit_product', {
        product: row.title,
        slug: req.params.slug
      });
    }
    else{
      req.flash('error', 'product does not exist, choose another');
      res.redirect('/products');
    }
  });
})

router.put('/edit-product', [
    check('title').not().isEmpty(),
  ] ,(req,res)=>{
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()){
      res.render(`admin/edit_product`, {
        errors: errors.errors,
        product: req.body.title,
        slug: req.body.title.replace(/\s+/g, '-').toLowerCase()
      });
    }
    else{
      Product.updateOne({ slug: req.body.slug}, { $set: {title: req.body.title, slug: req.body.title.replace(/\s+/g, '-').toLowerCase() } }, (err,raw)=>{
        if (err) throw err;
        req.flash("info", "product edited.");
        res.redirect('/products/');
      });
    }
});

router.delete('/delete-product/:id', (req,res)=> {
  console.log("Entered");
  console.log(req.params.id);
  Product.deleteOne({_id: req.params.id}, (err)=>{
    if (err){
      req.flash("error", "Can't delete the Product.");
      res.redirect('/products/');
    }
    else{
      req.flash("info", "product deleted.");
      res.redirect("/products/");
    }
  })
})
//Exports
module.exports = router;
