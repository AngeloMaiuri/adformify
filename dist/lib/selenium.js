"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AdForm = exports.SeleniumRunner = exports.Task = undefined;

var _helpers = require("./helpers.js");

var _path = require("path");

var path = _interopRequireWildcard(_path);

var _seleniumWebdriver = require("selenium-webdriver");

require("chromedriver");

var _logger = require("./logger.js");

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const downloadPath = "/Users/Onur/Desktop";

const DEFAULT_TIMEOUT = 10000;

class Selenium {
  constructor() {
    // Browser capabilities
    this.capabilities = {
      browserName: "chrome",
      chromeOptions: {
        prefs: {
          download: { default_directory: downloadPath, directory_upgrade: true, extensions_to_open: "" }
          // args: ["--test-type", "--incognito"]     // Arguments to send chrome.app
          // args: ["--no-startup-window"]     // Arguments to send chrome.app
        } }
    };
    // Selenium Driver
    this.driver = new _seleniumWebdriver.Builder().usingServer().withCapabilities(this.capabilities).build();
  }

  // Functions
  findElement(_by) {
    var _this = this;

    return _asyncToGenerator(function* () {
      return yield _this.driver.findElement(_by);
    })();
  }

  waitForElement(_by, ms = DEFAULT_TIMEOUT) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      return yield _this2.driver.wait(_seleniumWebdriver.until.elementLocated(_by), ms);
    })();
  }

  waitForElementAndGet(_by, ms = DEFAULT_TIMEOUT) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      yield _this3.waitForElement(_by, ms);
      return yield _this3.findElement(_by);
    })();
  }

  waitForElementAndClick(_by, clickType = "native", ms = DEFAULT_TIMEOUT) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      const element = yield _this4.waitForElementAndGet(_by, ms);
      return clickType === "native" ? element.click() : _this4.clickWithScript(element);
    })();
  }

  findElementAndClick(_by, clickType = "native") {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      const element = yield _this5.driver.findElement(_by);
      return clickType === "native" ? element.click() : _this5.clickWithScript(element);
    })();
  }

  clickWithScript(element) {
    return this.driver.executeScript("arguments[0].click();", element);
  }

  quit() {
    this.driver.quit();
  }

  getFilePath(file) {
    return path.join(process.cwd(), file);
  }
}

class Task {
  constructor(_fileArray, _cta, _delay) {
    this.fileArray = _fileArray;
    this.lastItem = _fileArray[_fileArray.length - 1];
    this.id = (0, _helpers.uid)(2, "task_");
    this.CTA = _cta;
    this.delay = _delay;
    this.adFormList = [];
  }

  run() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      for (const filePath of _this6.fileArray) {
        const adForm = new AdForm(filePath, _this6.CTA, _this6.delay);
        _this6.adFormList.push(adForm);
        yield (0, _helpers.delay)(100);

        if (filePath === _this6.lastItem) {
          yield adForm.execute().then(function (driver) {
            return driver && driver.quit();
          });
        } else {
          adForm.execute().then(function (driver) {
            return driver && driver.quit();
          });
        }
        yield (0, _helpers.delay)(500);
      }
    })();
  }

  quitDrivers() {
    this.adFormList.forEach(driver => {
      driver.quit();
    });
  }
}

exports.Task = Task;
class SeleniumRunner {
  constructor(options) {
    this.fileArray = (0, _helpers.chunkArray)(options.fileList, options.parallelTasks);
    this.CTA = options.CTA;
    this.delay = options.delay;
    this.taskList = [];
    this.isRunning = false;
  }

  init() {
    this.isRunning = true;
    this.fileArray.forEach(fileList => {
      this.taskList.push(new Task(fileList, this.CTA, this.delay));
    });
  }

  execute() {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      _this7.init();
      for (const task of _this7.taskList) {
        if (_this7.isRunning) {
          _logger2.default.log(`[SeleniumRunner]: Running task: ${_logger2.default.color(task.id, "white")}`, "yellow");
          yield task.run();
        } else {
          return;
        }
      }
      _logger2.default.log("[SeleniumRunner]: All tasks completed!", "green");
      _this7.isRunning = false;
    })();
  }

  quitDrivers() {
    this.isRunning = false;
    this.taskList.forEach(task => task.quitDrivers());
  }
}

exports.SeleniumRunner = SeleniumRunner;
class AdForm extends Selenium {
  constructor(_filePath, _cta, _delay) {
    super();
    this.uploadURL = "http://studio.adform.com/browse-templates/";
    this.id = (0, _helpers.uid)();
    this.filePath = _filePath;
    this.CTA = _cta;
    this.delay = 250 + _delay;
    this.miniDelay = 150 + this.delay / 5;
    this.downloadDelay = 3000;
  }

  execute() {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      const _file = _this8.filePath;
      _logger2.default.log(`[AdForm]: Uploading file: ${_file.substring(_file.lastIndexOf("/") + 1)}`, "cyan");
      try {
        // Browser logic
        _this8.driver.get(_this8.uploadURL);
        const fileInput = yield _this8.waitForElementAndGet(_seleniumWebdriver.By.css("input[type=file]"));
        fileInput.sendKeys(_this8.getFilePath(_file));
        yield (0, _helpers.delay)(_this8.delay);

        //  Click Category selectbox > Click Display
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath("//*[@ng-model='tempAsset.category']"));
        yield (0, _helpers.delay)(_this8.miniDelay);
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath("//*[@data-title='Display' and @data-value='format.category']"));
        yield (0, _helpers.delay)(_this8.miniDelay);

        // Click Format selectbox > Click Standard
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath("//*[@ng-model='tempAsset.format']"));
        yield (0, _helpers.delay)(_this8.miniDelay);
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath("//*[@data-title='Standard' and @data-value='format']"));
        yield (0, _helpers.delay)(_this8.miniDelay);

        // Click Upload
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath("//*[@ng-controller='BannerFormatSelectController as vm']//button[contains(text(), 'Upload')]"));
        yield (0, _helpers.delay)(_this8.delay);

        // Wait until Adformify modal shows up
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath("//*[@ng-click='toggleClicktag()']"), "script");
        yield (0, _helpers.delay)(_this8.miniDelay);

        // Choose new clicktag
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath("//*[@ng-model='settings.clicktag']"));
        yield (0, _helpers.delay)(_this8.miniDelay);
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath(`//*[@data-title="New" and @data-value="'New'"]`));
        yield (0, _helpers.delay)(_this8.miniDelay);

        // insert clicktag name
        const clicktagName = yield _this8.waitForElementAndGet(_seleniumWebdriver.By.xpath("//*[@ng-model='settings.clicktag.name']"));
        yield clicktagName.sendKeys('clickTAG');

        // insert clicktag url
        const clicktagUrl = yield _this8.waitForElementAndGet(_seleniumWebdriver.By.xpath("//*[@ng-model='settings.clicktag.url']"));
        yield clicktagUrl.sendKeys(_this8.CTA);

        // click proceed
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath("//*[@ng-click='save()' and text()='Proceed']"), "script");
        yield (0, _helpers.delay)(5000);

        // Download the banner
        yield _this8.waitForElementAndClick(_seleniumWebdriver.By.xpath("//*[@ng-click='downloadBanner()' and contains(text(), 'Export')]"), "script");
        yield (0, _helpers.delay)(_this8.downloadDelay);

        _logger2.default.log(`[AdForm]: Done: ${_file.substring(_file.lastIndexOf("/") + 1)}`, "green");
        return _this8.driver;
        /* END */
      } catch (error) {
        _logger2.default.log(`[AdForm]: Error during upload of ${_file.substring(_file.lastIndexOf("/") + 1)}\n`, "red");
        _logger2.default.log(`${error}`, "red");
        _logger2.default.log("------------------------------------------------------------------------------", "red");
        _this8.quit();
      }
    })();
  }
}
exports.AdForm = AdForm;