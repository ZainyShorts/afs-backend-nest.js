import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs'

export const uploadsPath = path.join(process.cwd(), 'uploads');

export const multerOptions = {
    storage: diskStorage({
      destination: (req, file, callback) => {
        if (!fs.existsSync(uploadsPath)) {
          fs.mkdirSync(uploadsPath, { recursive: true });
        }
        callback(null, uploadsPath);
      },
      filename: (req, file, callback) => {
        const ext = file.mimetype.split("/")[1];
        const uniqueSuffix = Date.now() + '-' + file.originalname + "." + ext;
        callback(null, uniqueSuffix);
      },
    }),
  };

  export const multerOptionsForXlxs = {
    storage: diskStorage({
      destination: (req, file, callback) => {
        if (!fs.existsSync(uploadsPath)) {
          fs.mkdirSync(uploadsPath, { recursive: true });
        }
        callback(null, uploadsPath);
      },
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + file.originalname;
        callback(null, uniqueSuffix);
      },
    }),
  };
  

export interface UploadedFileType {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    filename: string;
    path: string;
  }