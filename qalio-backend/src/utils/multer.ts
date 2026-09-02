import multer from "multer";

const storage = multer.memoryStorage(); // we will use buffer, not file path
const upload = multer({ storage });

export default upload;
