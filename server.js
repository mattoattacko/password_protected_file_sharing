require("dotenv").config()
const multer = require("multer")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const File = require("./models/File")


const express = require('express');
const app = express(); //call express as a function and store it as the app variable. This will allow us to take all the different server code we need to set up routing

app.use(express.urlencoded({ extended: true }))


// we initialize the multer library where all the file uploads will go inside a folder called Uploads. So we get an 'upload' function (which is a piece of middleware)
const upload = multer({ dest: "uploads" }) 


mongoose.connect(process.env.DATABASE_URL)

app.set("view engine", "ejs")

app.get("/", (req, res) => {
  res.render("index")
})

// before we handle our request, we want to upload a single file (with the name 'file') and multer takes care of all the logic for us to upload that file. 
app.post("/upload", upload.single("file"), async (req, res) => {
  const fileData = {
    path: req.file.path,
    originalName: req.file.originalname,
  }
  if (req.body.password != null && req.body.password !== "") {
    fileData.password = await bcrypt.hash(req.body.password, 10)
  }

  const file = await File.create(fileData)

  res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}` })
})

app.route("/file/:id").get(handleDownload).post(handleDownload)

async function handleDownload(req, res) {
  const file = await File.findById(req.params.id)

  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password")
      return
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("password", { error: true })
      return
    }
  }

  file.downloadCount++
  await file.save()
  console.log(file.downloadCount)

  res.download(file.path, file.originalName)
}

app.listen(process.env.PORT)