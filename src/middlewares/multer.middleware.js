import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Here")
    // cb(error , des)
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // cb => callback(error , fileName)
    cb(null, file.originalname);

    // Print file => Assignment
    
    console.log(file)
  },
});

const upload = multer({
  storage,
});

export { upload };


// we will get the file path with the return  