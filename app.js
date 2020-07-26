//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-tapas:itstapas@699@mycluster1.ktqwu.mongodb.net/todoListDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});

// item schema
const itemSchema={
  name: String
};

const item=mongoose.model("Item",itemSchema);

//default Items
const item1=new item({
  name: "Welcome to your Todolist !"
})
const item2=new item({
  name: "Hit the + button to add a new item"
})
const item3=new item({
  name: "<-- Hit this to delete an item"
})
const defaultItems=[item1,item2,item3];

//get request for our default todo list
app.get("/", function(req, res) {

  item.find({},function(err,foundItems){

      if(foundItems.length==0)
      {
        item.insertMany(defaultItems, function(err){
          if(err)
            console.log(err);
          else
            console.log("Successfully saved defaultItems to DB");
        })

        res.redirect("/");
      }
      else
      {
        res.render("list",{listTitle:"Today",newListItems:foundItems});
      }
  })
});

// list schema
const listSchema={
  name: String,
  items: [itemSchema]
}
const List= mongoose.model("List",listSchema);

// get request for custom list
app.get("/:customListName", function(req,res){
  const customListName=_.capitalize(req.params.customListName);

  //check if that custom List exist in List collection
  List.findOne({name: customListName}, function(err,foundList){
    if(!err){
      if(!foundList) // if list is not found
      {
        //Create a new list document and insert it with default items
        const list=new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
      else // if a document is already present with that customListName
      {
        res.render("list",{listTitle:foundList.name, newListItems: foundList.items});
      }
    }
    })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName= req.body.list;

  // Item to be inserted in the list
  const newItem = new item({
    name: itemName
  });

  //check in which list item has to be inserted
  if(listName==="Today"){
    newItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name: listName}, function(err,foundList){  //find the document
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});

// post request to delete a todo item
app.post("/delete",function(req,res){
  const checkedItemId= req.body.checkBox;
  const listName= req.body.listName;

  if(listName ==="Today")
  {
    item.findByIdAndRemove(checkedItemId,function(err){
      if(!err){
        console.log("Successfully deleted the item");
        res.redirect("/");
      }
    })
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err,foundList){
      if(!err)
        res.redirect("/"+listName);
    });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});


let port= process.env.PORT;
if(port== null || port=="")
  port=3000;
app.listen(port, function() {
  console.log("Server has started Successfully");
});
