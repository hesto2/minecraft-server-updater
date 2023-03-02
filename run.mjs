import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import decompress from "decompress";
import request from "superagent";
import reflect from "@alumna/reflect";

const outputFilename = `server-${new Date().getTime()}.zip`;
const BROWSER_PAGE = "https://www.minecraft.net/en-us/download/server/bedrock";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const locationToCopyTo = process.argv[2];

const run = async () => {
  if(!locationToCopyTo){
    throw new Error("Argument is required for output path: node runthisfile /path/to/your/server");
  }
  const html = await getHTML();
  const downloadUrl = extractDownloadURL(html);
  const zipLocation = `${__dirname}/${outputFilename}`;
  try {
    await downloadZip(downloadUrl, zipLocation);
    await extractZip(zipLocation);
    await copyFiles(zipLocation.replace(".zip", ""), locationToCopyTo);
  } finally {
    await cleanup(zipLocation);
  }
};

const cleanup = async (zipLocation) => {
  fs.unlinkSync(zipLocation);
  fs.rmSync(zipLocation.replace(".zip", ""), { recursive: true, force: true });
};

const copyFiles = async (sourcePath, targetPath) => {
  const { res, err } = await reflect({
    src: sourcePath,
    dest: targetPath,
    delete: false,
    exclude: ["server.properties"],
  });
};

const extractZip = async (zipLocation) => {
  console.log("Beginning extraction");
  await decompress(zipLocation, zipLocation.replace(".zip", ""));
  console.log("Extraction complete");
};

const downloadZip = async (url, targetPath) => {
  return new Promise(async (resolve, reject) => {
    request
      .get(url)
      .on("error", reject)
      .pipe(fs.createWriteStream(targetPath))
      .on("finish", () => {
        console.log("Download complete");
        resolve();
      });
  });
};

const extractDownloadURL = (html) => {
  const regex = /https:\/\/minecraft.azureedge\.net\/bin-win\/.*\.zip/gm; // bin-win can be replaced with bin-linux for linux servers
  let m;
  let downloadURL;

  while ((m = regex.exec(html)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    m.forEach((match, groupIndex) => {
      downloadURL = match;
    });
  }

  if (!downloadURL) {
    throw new Error(
      `Unable to find matching download url at ${BROWSER_PAGE} using regex: ${regex}`
    );
  }

  return downloadURL;
};

const getHTML = async () => {
  const res = await fetch(BROWSER_PAGE);
  const html = await res.text();
  return html;
};

run();
