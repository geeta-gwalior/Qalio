import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const cloudinaryMock = {
  uploader: {
    upload: async (fileOrDataUri: string, options: any) => {
      console.log("====== MOCKED CLOUDINARY UPLOAD ======");
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileId = crypto.randomBytes(8).toString('hex');
      let filename = `${fileId}.png`;
      let secure_url = `http://localhost:4000/uploads/${filename}`;

      try {
        if (fileOrDataUri.startsWith('data:')) {
          // It's a Data URI
          const matches = fileOrDataUri.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const buffer = Buffer.from(matches[2], 'base64');
            fs.writeFileSync(path.join(uploadDir, filename), buffer);
          }
        } else {
          // It's a file path
          fs.copyFileSync(fileOrDataUri, path.join(uploadDir, filename));
        }
      } catch (err) {
        console.error("Error saving mock file:", err);
      }

      return {
        secure_url,
        public_id: fileId
      };
    },
    destroy: async (public_id: string) => {
      console.log(`====== MOCKED CLOUDINARY DESTROY: ${public_id} ======`);
      return { result: "ok" };
    }
  }
};

export default cloudinaryMock;
