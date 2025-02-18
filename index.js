const aws = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const mime = require('mime-types');

const spacesEndpoint = new aws.Endpoint(process.env.S3_ENDPOINT);
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

const s3PathFor = (fileName) => {
  let r = path.normalize(fileName)
  console.log({
    fileName,
    r,
    DROP_FILE_PREFIX: process.env.DROP_FILE_PREFIX,
    S3_PREFIX: process.env.S3_PREFIX
  })
  if (process.env.DROP_FILE_PREFIX && r.indexOf(process.env.DROP_FILE_PREFIX) == 0) {
    r = r.substring(process.env.DROP_FILE_PREFIX.length, r.length)
  }
  r = `${process.env.S3_PREFIX || ""}/${r}`
  console.log({
    r
  })
  return r;
}

const mimeTypeFor = (fileName) => {
  return mime.lookup(fileName)
}

const uploadFile = (fileName) => {
  if (fs.lstatSync(fileName).isDirectory()) {
    fs.readdirSync(fileName).forEach((file) => {
      uploadFile(`${fileName}/${file}`);
    });
  } else {
    const fileContent = fs.readFileSync(fileName);

    // Setting up S3 upload parameters
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: s3PathFor(fileName),
      Body: fileContent,
      ContentType: mimeTypeFor(fileName) || "application/octet-stream",
      CacheControl: "public, max-age=31536000, immutable",
    };
    const acl = process.env.S3_ACL;
    if (acl) {
      params.ACL = acl;
    }

    // Uploading files to the bucket
    s3.upload(params, function (err, data) {
      if (err) {
        throw err;
      }
      console.log(`File uploaded successful. ${data.Location}`);
    });
  }
};

uploadFile(process.env.FILE);
