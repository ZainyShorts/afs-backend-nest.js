import * as path from 'path';
import * as fs from 'fs'

export function ensureUploadsFolder() {
    const uploadsPath = path.join(process.cwd(), 'uploads'); // Ensure it's in the project root
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
    }
  }


