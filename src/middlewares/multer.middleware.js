import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);

    // Print file => Assignment
  },
});

const upload = multer({
  storage,
});

export { upload };


// we will get the file path with the return  