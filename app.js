const express= require("express");
const bodyParser =require("body-parser");
const mongoose=require("mongoose");
const _ =require("lodash");

const app=express();


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-1:Test123@cluster0-l5aal.mongodb.net/todolistDB",{ useNewUrlParser:true} , {useFindAndModify: true });

const itemSchema={
    name:String
};

const Item= mongoose.model("Item", itemSchema);

const item1=new Item({
    name:"Welcome!"
});

const item2= new Item({
    name: "Add item to your bucketlist"
});

const defaultItems=[ item1, item2];

const listSchema={
    name:String,
    items:[itemSchema]
};
const List=mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({}, function (err, foundItem) {
            if (foundItem.length === 0) {

                Item.insertMany(defaultItems, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Successfully items added to DB.");
                    }
                });
                res.redirect("/");
            } else {
                res.render("list", {listTitle: "Today", newListItems: foundItem});
            }
    });

});

app.get("/:customList", function(req, res){
   const customList=_.capitalize(req.params.customList);
    
    List.findOne({name: customList}, function(err,foundList){
        if(!err){
            if(!foundList){
               //Create list
                 const list=new List({
                    name:customList,
                    items:defaultItems
                 });
                list.save();
                res.redirect("/"+customList);
            }else{
                //show existing
                res.render("list" ,  {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
    
  
});

app.post("/" ,function(req, res){
    const itemName=req.body.newItem;
    const listName=req.body.list;
    
    const item=new Item({
        name: itemName
    });
    
    if(listName==="Today"){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName},function(err,foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    };
   
});

app.post("/delete", function(req, res){
   const checkedItem=req.body.checkbox; 
   const listName= req.body.listName;
    
    if(listName==="Today"){ 
    Item.findByIdAndRemove(checkedItem, function(err){
        if(!err){
            console.log("Successfully deleted an item.");
            res.redirect("/");
        }
    });
    }
    else{
        List.findOneAndUpdate({name: listName}, {$pull: {items:{_id: checkedItem}}}, function(err , foundList){
           if(!err){
               res.redirect("/"+listName);
           } 
        });
    }
});


app.get ("/about" , function(req, res){
    res.render("about");
});

app.listen(3000 , function(){
    console.log("Server running on 3000 port!");
});