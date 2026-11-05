import fs from 'fs';
import https from 'https';
import path from 'path';

// Using raw GitHub release links to pull files directly into WebContainer virtual storage
const assets = [
  {
    url: 'https://drive.google.com/file/d/1tth4YvAKucDFby1O9dz9YZ6iQtqK7kU6/view',
    dest: 'public/emulator/flycast.wasm'
  }
];

function downloadFile(url, dest) {
  const dir = path.dirname(dest);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const file = fs.createWriteStream(dest);
  
  // Follow GitHub redirects (302) smoothly down to the AWS/Objects delivery endpoint
  https.get(url, (response) => {
    if (response.statusCode === 302 || response.statusCode === 301) {
      downloadFile(response.headers.location, dest);
      return;
    }
    
    if (response.statusCode !== 200) {
      console.error(`Download failed for ${url}: Status ${response.statusCode}`);
      return;
    }

    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Successfully pulled compiled asset: ${dest}`);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error(`Network Error on ${url}: ${err.message}`);
  });
}

console.log("Pulling standalone Flycast assembly cores into WebContainer...");
assets.forEach(asset => downloadFile(asset.url, asset.dest));
