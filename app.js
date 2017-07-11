var express = require("express"),
    app = express(),
    bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended: true}));
//app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

//app.get("/", function(req, res) {
//    res.send('GET request to the homepage')
//});

app.listen(process.env.PORT, function(){
    console.log("subproject has started");
});
