import morgan from "morgan";
import express from "express";
import bodyParser from "body-parser";
import Logger from "./lib/logger.js";

const app = express()
  .use(bodyParser.json())
  .use(morgan("dev"))
  .set("json spaces", 2);

app.use((err, req, res, next) => {
  if (err) {
    res.status(err.statusCode || err.status || 500).send(err.data || err.message || {});
  } else {
    next();
  }
});

const zip = process.cwd() + "/test_files/160x600.zip";
const { Builder, By, Key, until } = require("selenium-webdriver");

// Selenium driver
const driver = new Builder()
  .usingServer()
  .withCapabilities({
    browserName: "chrome"
  })
  .build();

async function start() {
  driver.get("http://studio.adform.com/browse-templates/");
  const fileInput = await driver.findElement(By.css("input[type=file]"));
  fileInput.sendKeys(zip);

  // Wait until Category select box to show up
  await driver.wait(until.elementLocated(By.css("[data-select-id='adf-select-2570']")), 5000);
  //  Click Category selectbox > Click Display
  await driver.findElement(By.css("[data-select-id='adf-select-2570']")).click();
  await driver.findElement(By.xpath("//*[@id='adf-select-2570']/li[1]")).click();

  // Click Format selectbox > Click Standard
  await driver.findElement(By.css("[data-select-id='adf-select-2573']")).click();
  await driver.findElement(By.xpath("//*[@id='adf-select-2573']/li[1]")).click();

  // Click Upload
  await driver.findElement(By.xpath("//div[@class='adf-BannerFormatSelect']/div[3]/button[1]")).click();

  // Wait until clicktag shows up & click
  await driver.wait(until.elementLocated(By.xpath("//*[contains(text(), 'Add clicktag')]")), 10000);
  const addClickTagButton = driver.findElement(By.xpath("//*[contains(text(), 'Add clicktag')]"));
  driver.executeScript("arguments[0].click();", addClickTagButton);

  // Get Add clicktag input field
  await driver.wait(until.elementLocated(By.css("[ng-model='clickTag.url']")), 5000);
  const clicktagInput = driver.findElement(By.css("[ng-model='clickTag.url']"));
  clicktagInput.sendKeys("https://www.google.se");

  // Click Save button
  await driver.findElement(By.css("#global-save-button")).click();

  // Wait until save button dissappears
  await driver.wait(until.elementLocated(By.css("#global-save-button")), 5000);
  const exportButton = driver.findElement(By.xpath("//*[contains(text(), 'Export')]"));
  driver.executeScript("arguments[0].click();", exportButton);


  Logger.log("I'm done so far.", "magenta");
  // driver.quit();
}

const server = app.listen(3000, () => {
  Logger.log(`[app] Running at port: ${server.address().port}`, "green");
  // Scrape logic
  start();
});

// CTRL + C hook
process.on("SIGINT", () => {
  Logger.log("\n[PROCESS ENDED]", "red");
  process.exit();
});
