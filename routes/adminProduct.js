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
      if (req.files.image.mimetype.indexOf('jpeg')==-1 && req.files.image.mimetype.indexOf('jpg')==-1 && req.files.image.mimetype.indexOf('png')==-1 ) return false;
      return true; 
    })
  ] ,(req,res)=>{
  
    const errors = validationResult(req);

    if (!errors.isEmpty() && (errors.errors.length==1 && errors.errors[0].msg!='Cannot read property \'image\' of null')){
      console.log("ERROR HERE")
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
            image: req.files ? req.files.image.name : ''
          })

          product.save((err)=>{
            if (err) return console.log(err);
            console.log("HERE");
            //if the folder doesn't exist. then create the folder until end of path.
            fs.mkdirp(`public/product_images/${product._id}/gallery/thumbs`, (err)=>{
              if (err) return console.log(err)

              if (req.files && req.files.image.name){
                console.log("here");
                var myImg = req.files.image;
                console.log(myImg);
                //err
                myImg.mv(path.join(__dirname, `../public/product_images/${product._id}/${req.files.image.name}`), (err)=>{
                  if (err) return console.log(err);
                })
              }
            });

            req.flash('info', 'product added');
            res.redirect('/products');
          })
        }

      });

      
    } 
});

router.get('/edit-product/:id', (req,res)=>{
  var errors = req.session.errors;
  Category.find((err,cats)=>{
    
    Product.findById(req.params.id, (err, prod)=>{
      if(prod){
        var galleryPath = `public/product_images/${prod.id}/gallery`;
        var galleryFiles;
        fs.readdir(galleryPath,(err,files)=>{
          if (err) return console.log(err);
          galleryFiles = files;
          //create the edit_product.pug
          res.render('admin/edit_product', {
            errors: errors,
            id: req.params.id,
            title: prod.title,
            description: prod.description,
            categories: cats,
            category: prod.category,
            price: prod.price,
            image: prod.image,
            galleryFiles: galleryFiles
          });
        })
      }
      else{
        req.flash('error', err.toString());
        res.redirect('/products');
      }
    });
    
  })
})

router.put('/edit-product', [
  check('title').not().isEmpty(),
  check('description').not().isEmpty(),
  check('price').isDecimal(),
  check('image', 'Make sure your file is an image.  ').custom((value, {req})     => {
    if (req.files.image.mimetype.indexOf('jpeg')==-1 && req.files.image.mimetype.indexOf('jpg')==-1 && req.files.image.mimetype.indexOf('png')==-1 ) return false;
    return true; 
  })
  ] ,(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty() && (errors.errors.length==1 && errors.errors[0].msg!='Cannot read property \'image\' of null')){
      req.session.errors = errors.errors;
      console.log(errors);
      res.redirect('/products/edit-product/' + req.body.id)
    }
    else{
      let slug = req.body.title.replace(/\s+/g, '-').toLowerCase();
      let changedValue={ 
        $set: {
          title: req.body.title, 
          slug: slug, 
          description: req.body.description,
          price: parseFloat(req.body.price).toFixed(2),
          category: req.body.category,
          image: req.files ? req.files.image.name : ''
        }
      }
      Product.findOne({slug: slug, _id: {$ne : req.body.id} }, function(err, page){
        if (err) return console.log(err);
        if (page){
          req.flash('error', 'Product title exist. choose another')
          res.redirect(`/product/edit-product/${req.body.id}`)
        }
        else{
          Product.findById(req.body.id, (err, page)=>{
            if (err) return console.log(err);
            let imageName = page.image

            page.title = req.body.title
            page.slug = slug
            page.description = req.body.description
            page.price = parseFloat(req.body.price).toFixed(2),
            page.category = req.body.category
            page.image = req.files ? req.files.image.name : ''

            page.save((err)=>{
              if (err) {
                page.image = req.body.oldImage;
                return console.log(err);
              }
              //continue here
              if (req.body.oldImage){ //if there's old image, delete it, then save new.
                fs.remove(path.join(__dirname, `../public/product_images/${req.body.id}/${req.body.oldImage}`), (err)=> {
                  if (err) return console.log(err);
                  if (req.files && req.files.image.name){
                    var myImg = req.files.image;
                    myImg.mv(path.join(__dirname, `../public/product_images/${req.body.id}/${req.files.image.name}`), (err)=>{
                      if (err) return console.log(err);
                    })
                    
                  }     
                });
              }
              else{ //if there's no old image, don't delete, avoid bug, just save directly.
                if (req.files && req.files.image.name){
                  var myImg = req.files.image;
                  myImg.mv(path.join(__dirname, `../public/product_images/${req.body.id}/${req.files.image.name}`), (err)=>{
                    if (err) return console.log(err);
                  })
                  
                }
              }
              req.flash('info', 'Product edited.')
              res.redirect('/products/')
              
            })
          })
        }
      })
    }
});

//for post gallery images
router.post('/gallery-images/:id', (req,res)=>{
  var imageFiles = req.files.file;
  var regularPath = path.join(__dirname, `../public/product_images/${req.params.id}/gallery/${imageFiles.name}`);
  var thumbsPath = path.join(__dirname, `../public/product_images/${req.params.id}/gallery/thumbs/${imageFiles.name}`)
  imageFiles.mv(regularPath, (err)=>{
    if (err) return console.log(err);
    resizeImg(fs.readFileSync(regularPath), {width: 100, height: 100}).then((buff)=>{
      fs.writeFileSync(thumbsPath, buff)
    }) 
    res.send(200);
  })
})
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
