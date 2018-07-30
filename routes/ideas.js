const express= require('express');
const router= express.Router();
const mongoose=require('mongoose');

//load ideas model
require('../models/Idea');
const Idea=mongoose.model('ideas');

// idea index page
router.get('/',(req,res)=>{
    Idea.find({})
    .sort({date:'desc'})
    .then(ideas=>{
        res.render('ideas/index',{
            ideas:ideas
        });
    })
})


//add idea form
router.get('/add',(req,res)=>{
    res.render('ideas/add');
})


//edit idea form
router.get('/edit/:id',(req,res)=>{
   // console.log(req.params.id);
    Idea.findOne({
        _id: req.params.id
    })
    .then(idea=>{
res.render('/edit',{
    idea:idea
})
    })
    .catch(()=>{res.send(err)})
    });



//Process form
router.post('/',(req,res)=>{
let errors=[];
if(!req.body.title)
{
    errors.push({text:"title toh daal dete"});
}
if(!req.body.details){
    errors.push({text:"details missing"});
}

if(errors.length>0){
    res.render('/add',{
errors:errors,
title:req.body.title,
details:req.body.details
    })
}
else
{
    const newUser={
        title:req.body.title,
        details:req.body.details
    }
    new Idea(newUser)
    .save()
    .then(idea=>{
        req.flash('success_msg','Task added');
        res.redirect('/ideas');
    })
}
});

//edit form process
router.put('/:id',(req,res)=>{
    Idea.findOne({
        _id: req.params.id
    })
    .then(idea=>{
        //update
        idea.title=req.body.title;
        idea.details=req.body.details;

        idea.save()
        .then(idea=>{
            req.flash('success_msg','Task Updated');
            res.redirect('/ideas');
        })
    })
})

//delete idea
router.delete('/:id',(req,res)=>{
    Idea.remove({
        _id: req.params.id
    })
    .then(()=>{
        req.flash('success_msg','Task deleted');
        res.redirect('/ideas');
    })
});

module.exports=router;