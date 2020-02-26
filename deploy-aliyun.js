const fs = require('fs')
const path = require('path')
const OSS = require('ali-oss')
const config = require('./deployinfo-aliyun')

const client = new OSS(config);
const distPath = path.resolve(__dirname, config.directory);

async function clean() {
  console.log('[*] Getting file list');
  const fileList = await client.list();
  if (fileList.objects) {
    console.log('[*] Deleting old files');
    await client.deleteMulti(fileList.objects.map(x => x.name));
  }
}

async function upload(subpath = '') {
  const dir = await fs.promises.readdir(`${distPath}${subpath}`);
  for (i of dir) {
    const stat = await fs.promises.stat(path.resolve(`${distPath}${subpath}`, i));

    if (stat.isFile()) {
      const fileStream = fs.createReadStream(path.resolve(`${distPath}${subpath}`, i));
      console.log(`Uploading: ${subpath}/${i}`);
      await client.putStream(`${subpath}/${i}`, fileStream);
    } else if (stat.isDirectory()) {
      await upload(`${subpath}/${i}`);
    }
  }
}

async function deploy() {
  if (config.cleanOldFiles) {
    await clean();
  }
  await upload();
  console.log('[*] Done')
}

deploy();