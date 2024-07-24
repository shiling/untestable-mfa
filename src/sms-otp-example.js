import { Builder, By, until, Key } from 'selenium-webdriver';

// Specify the URL of your running ChromeDriver instance
const chromeDriverUrl = 'http://localhost:9515';

// Create a new WebDriver instance and tell it to connect to the ChromeDriver
console.log("Starting browser");
let browser = new Builder()
    .forBrowser('chrome')
    .usingServer(`${chromeDriverUrl}`)
    .build();

	

//---------------------------------------
// Test data
//---------------------------------------

const TEST_WEBSITE = "https://airbnb.com";
const TEST_PHONE_COUNTRY_CODE = "1";
const TEST_PHONE_NUMBER = "4475740081"

//---------------------------------------
//
// Test start
//
//---------------------------------------

// -------------------------------------
// PART 1: Open website and start registration
// -------------------------------------

// console.log("Navigating to website: " + TEST_WEBSITE);
await browser.get(TEST_WEBSITE);

// click the profile button: //button[contains(@aria-label,'Main navigation menu')]
console.log("Clicking on profile button");
await click(By.xpath("//button[contains(@aria-label,'Main navigation menu')]"));

// click on login button: //button[contains(text(),'Log in')]
console.log("Clicking on login button");
await click(By.xpath("//a[contains(normalize-space(.),'Log in')]"));

// select country code: //select[@data-testid='login-signup-countrycode']
console.log("Selecting country code");
// await click(By.xpath("//select[@data-testid='login-signup-countrycode']"));
await selectOption(By.xpath("//option[contains(normalize-space(.),'United States')]"));

// sleep for 1 second
await sleep(1000);

// fill phone number 
console.log("Filling phone number: ", TEST_PHONE_NUMBER);
// press tab
await browser.actions().sendKeys(Key.TAB).perform();
// type phone number
await browser.actions().sendKeys(TEST_PHONE_NUMBER).perform();

// wait before pressing enter, because sometimes there's a check to validate the form
await sleep(3000);

// press enter
await browser.actions().sendKeys(Key.ENTER).perform();

// wait for "A verification code has been sent" to appear
console.log("Waiting for verification code message to appear");
await waitUntilTextIsVisible("Enter the code we've sent via SMS");

// -------------------------------------
// PART 2: Get the OTP code from SMS
// -------------------------------------

// sleep for 15 seconds
console.log("Waiting for 15 seconds for SMS to arrive");
await sleep(15000);

// import mailosaur
import { MAILOSAUR_API_KEY, MAILOSAUR_SERVER_ID } from '../config/mailosaur.config.js';
import MailosaurClient from 'mailosaur';

// setup mailosaur client
const mailosaur = new MailosaurClient(MAILOSAUR_API_KEY)

// retrieve sms
const sms = await mailosaur.messages.get(
	MAILOSAUR_SERVER_ID,
	{
	  sentTo: TEST_PHONE_COUNTRY_CODE + TEST_PHONE_NUMBER,
	},
	{
	  timeout: 20000, // wait up to 20 seconds for a message to arrive
	}
  );
  
console.log("Received SMS: " + sms.text.body);

// get the OTP code from the SMS, e.g. "Your Airbnb verification code is 123456"s
let otpRegex = /Your Airbnb verification code is (\d{6})/;
let otpMatch = sms.text.body.match(otpRegex);
let otp = ""
if(otpMatch){
	otp = otpMatch[1];
	console.log("OTP code: " + otp);
}else{
	console.log("Unable to find OTP code in SMS");
	exit();
}

// fill in otp code : // //input[@autocomplete='one-time-code']
console.log("Filling in OTP code");
// type the OTP code
await browser.actions().sendKeys(otp).perform();
// press enter
await browser.actions().sendKeys(Key.ENTER).perform();

// wait for welcome message
await sleep(3000)

// navigate to account page
// click the profile button: //button[contains(@aria-label,'Main navigation menu')]
console.log("Clicking on profile button");
await click(By.xpath("//button[contains(@aria-label,'Main navigation menu')]"));

// click on login button: //button[contains(text(),'Log in')]
console.log("Clicking on account button");
await click(By.xpath("//a[contains(normalize-space(.),'Account')]"));

// should see my name and email
console.log("Waiting for name and email to appear");
await waitUntilTextIsVisible("Mark Sim, remarkable.twain@gmail.com");


//---------------------------------------
// END
//---------------------------------------

// 15s sleep before closing the browser
await sleep(15000)

// close the browser
await exit();



//---------------------------------------
// Exit
//---------------------------------------
async function exit(){
	console.log("Exiting");
	if(browser){
		await browser.close();
	}
	process.exit();
}



//---------------------------------------
// Helper functions
//---------------------------------------

async function sleep(ms){
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function selectOption(optionSelector){
	try{
		// wait for element to appear, up to 15 seconds
		await browser.wait(until.elementLocated(optionSelector), 15000);
		// click the element
		await browser.findElement(optionSelector).click();
	}catch(e){
		console.log("Unable to click element: ", e);
	}
}

async function click(selector){
	try{
		// wait for element to appear, up to 15 seconds
		await browser.wait(until.elementLocated(selector), 15000);
		// wait for element to be visible, up to 5 seconds
		await browser.wait(until.elementIsVisible(browser.findElement(selector)), 5000);
		// click the element
		await browser.findElement(selector).click();
	}catch(e){
		console.log("Unable to click element: ", e);
	}
}

async function fill(selector, value){
	try{
		// wait for element to be located, up to 15 seconds
		await browser.wait(until.elementLocated(selector), 15000);
		// wait for element to be visible, up to 5 seconds
		await browser.wait(until.elementIsVisible(browser.findElement(selector)), 5000);
		// fill the element
		await browser.findElement(selector).sendKeys(value);
	}catch(e){
		console.log("Unable to fill element: ", e);
	}

}

async function waitForPageNavigationTo(url, timeout){
	if(!timeout){
		timeout = 30000;
	}
	try{
		// wait for the url to match the expected url, up to 30 seconds
		await browser.wait(until.urlContains(url), timeout);
		return true;
	}catch(e){
		console.log("Error waiting for page navigation: ", e);
		return false;
	}
}
	
async function waitUntilTextIsVisible(content, timeout){
	if(!timeout){
		timeout = 30000;
	}
	try{
		// get the text of the body element
		let found = false;
		let start = Date.now();
		while(!found && Date.now() - start < timeout){
			let text = await browser.findElement(By.xpath("//body")).getText();
			if(text.includes(content)){
				found = true;
			}else{
				await sleep(1000);
			}
		}
		return found;
	}catch(e){
		return false
	}
}
