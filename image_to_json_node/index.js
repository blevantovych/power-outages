const Jimp = require("jimp");
const fs = require("fs");
const util = require("util");
const puppeteer = require("puppeteer");
const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;

app.use(cors());

app.get("/", async (req, res) => {
    const outages = await getOutages();
    res.send(outages);
});

async function run() {
    await getOutages();
}

async function getOutages() {
    const outages = [];
    const imageUrl = await getOutagesImageUrl();
    const readImage = util.promisify(Jimp.read);

    const image = await readImage(imageUrl);
    const width = image.getWidth();
    const height = image.getHeight();

    const cellWidth = width / 25; // assuming the break down is per hour. 1 column is for group name
    const cellHeight = height / 8;
    // const groupYpoint = 200; // 2.2 group
    // const groupYpoints = [85, 125, 160, 200, 240, 270]; // 2.2 group
    const groupYpoints = Array.from({ length: 6 }).map((h, i) =>
        Math.round((2 + i) * cellHeight + cellHeight / 3)
    ); // 2.2 group
    console.log({ groupYpoints });
    const firstCellLeftX = cellWidth;
    const dataCellsTotal = 24;

    for (const groupYpoint of groupYpoints) {
        const row = [];
        let currentX = Math.round(firstCellLeftX + cellWidth / 2);

        for (let i = 0; i < dataCellsTotal; i++) {
            const rgba = Jimp.intToRGBA(
                image.getPixelColor(currentX, groupYpoint)
            ); // returns the colour of that pixel e.g. 0xFFFFFFFF
            row.push({
                from: i,
                to: i + 1,
                power: isOn(rgba),
                rgba: `${rgba.r}, ${rgba.g}, ${rgba.b}`,
            });
            currentX += cellWidth;
        }
        outages.push(row);
    }
    // console.log(outages);
    return outages;
}

/**
 * Return all pixels from an image
 * @param {Jimp} image - Jimp image
 * @return {Array} all pixels
 */
function getMatrix(image) {
    const result = [];
    const width = image.getWidth();
    const height = image.getHeight();
    let rows = 0;
    let blackPixels = 0;
    const pixelColors = {};
    for (let i = 0; i < width; i++) {
        const row = [];
        // result.push(row);
        for (let j = 0; j < height; j++) {
            const pixelColor = image.getPixelColor(i, j);
            const rgba = Jimp.intToRGBA(pixelColor);
            if (rgba.r === 0 && rgba.g === 0 && rgba.b === 0) {
                blackPixels++;
            }
            pixelColors[pixelColor] = pixelColors[pixelColor]
                ? pixelColors[pixelColor] + 1
                : 1;

            // row.push(rgba);
        }
        // if (
        //     row.filter(
        //         (pixel) =>
        //             Math.floor(pixel.r / 10) === 0 &&
        //             Math.floor(pixel.g / 10) === 0 &&
        //             Math.floor(pixel.b / 10) === 0
        //     ).length >
        //     height - 10
        // ) {
        //     rows++;
        // }
    }
    // console.log("black rows: ", rows);
    // console.log("black pixels: ", blackPixels);
    console.log("pixelColors: ", Object.keys(pixelColors).length);
    Object.keys(pixelColors).forEach((color) => {
        if (pixelColors[color] > 100) {
            console.log(color, ": ", Jimp.intToRGBA(+color));
        }
    });
    // fs.writeFileSync("./pixels.json", JSON.stringify(result));
}

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

async function getOutagesImageUrl() {
    // const browser = await puppeteer.launch();
    //
    // const page = await browser.newPage();
    //
    // await page.goto("https://poweron.loe.lviv.ua", {
    //     waitUntil: "networkidle2",
    // });
    //
    // console.log(page);
    // const imageUrl = await page.evaluate(() => {
    //     // there are usually two images on the page - grab the first one - it should be the latest
    //     return document.querySelector("img[src^=https]")?.src;
    // });
    //
    // // Don't forget to close the browser instance to clean up the memory
    // await browser.close();
    //
    // return imageUrl;
    // return "saturday_power_outages.png";
    // return "tuesday.png";
    return "monday.jpeg";
}

function isOn(rgba) {
    if (rgba.r > 160 && rgba.r < 200) {
        return true;
    }
    return false;
}

run();
