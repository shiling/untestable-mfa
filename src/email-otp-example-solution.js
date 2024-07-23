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

const TEST_WEBSITE = "https://www.hq.xyz/";
const TEST_EMAIL = "exist-remarkable-69@inboxkitten.com";
const TEST_EMAIL_USERNAME = TEST_EMAIL.split("@")[0];



//---------------------------------------
//
// Test start
//
//---------------------------------------

// -------------------------------------
// PART 1: Open website and start login
// -------------------------------------

// go to website
console.log("Navigating to website: " + TEST_WEBSITE);
await browser.get(TEST_WEBSITE);

// click login button : //a[contains(text(),'Login')]
console.log("Clicking login button");
await click(By.xpath("//a[contains(text(),'Login')]"));

// switch to second tab
let tabs = await browser.getAllWindowHandles();
await browser.switchTo().window(tabs[1]);

// fill email : //input[@name='email']
console.log("Filling email: ", TEST_EMAIL);
await fill(By.xpath("//input[@name='email']"), TEST_EMAIL);

// press the enter key
await browser.actions().sendKeys(Key.ENTER).perform();

// wait for page to have the content "Enter the code we just sent"
await waitUntilTextIsVisible("Enter the code we just sent");

// -------------------------------------
// PART 2: Get OTP from email
// -------------------------------------

// open a new tab
console.log("Opening new tab");
await browser.executeScript("window.open()");

// switch to the new tab
tabs = await browser.getAllWindowHandles();
await browser.switchTo().window(tabs[2]);

// open the email inbox
const EMAIL_INBOX_URL = `https://inboxkitten.com/inbox/${TEST_EMAIL_USERNAME}`;
console.log("Opening email inbox: " + EMAIL_INBOX_URL);
await browser.get(EMAIL_INBOX_URL);

// sleep for 20s, to allow email to arrive
console.log("Waiting for email to arrive");
await sleep(20000);

// find the first email that says "Welcome to headquarters"
console.log("Opening latest 'Welcome to headquarters' email");
let emailSubject = "Welcome to Headquarters";
let emailSelector = `(//div[@class='row-subject' and contains(text(), '${emailSubject}')])[1]`
await click(By.xpath(emailSelector));

// wait for iframe element to appear : //iframe[@id='message-content']
console.log("Waiting for email body iframe to appear");
let iframeElement = await waitForElementVisible(By.xpath("//iframe[@id='message-content']"));
console.log("iframeElement: ", iframeElement);

// switch into the iframe
console.log("Switching to email body iframe");
await browser.switchTo().frame(iframeElement);

// wait for the text "Your verification code is" to appear
console.log("Waiting for email body to load");
await waitUntilTextIsVisible("Your verification code is");

// get the email body
console.log("Getting email body");
const emailBody = await browser.findElement(By.xpath("//body")).getText();
console.log("Email body: ", emailBody);

// extract the OTP from the email body
console.log("Extracting OTP");
let otpRegex = /Your verification code is: (\d+)/;
let matches = emailBody.match(otpRegex);
let otp = "";
if(matches){
	otp = matches[1];
	console.log("OTP: ", otp);
}else{
	console.log("OTP not found");
	exit();
}

// -------------------------------------
// PART 3: Complete login
// -------------------------------------

// switch to the second tab
console.log("Switching back to login tab");
tabs = await browser.getAllWindowHandles();
await browser.switchTo().window(tabs[1]);

// enter OTP
console.log("Filling OTP: ", otp);
await fill(By.xpath("//input[@name='code']"), otp);

// press the enter key
await browser.actions().sendKeys(Key.ENTER).perform();

// validate url ends with "/dashboard"
const atDashboard = await waitForPageNavigationTo("/dashboard");
if(atDashboard){
	console.log("Login successful. I am at the dashboard.");
	await waitUntilTextIsVisible("Hey Mark, what can we do today?");
}else{
	console.log("Login failed. I am not at the dashboard!");
}






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

async function waitForElementVisible(selector){
	try{
		// wait for element to be located, up to 15 seconds
		// console.debug("locating element: ", selector);
		await browser.wait(until.elementLocated(selector), 15000);
		// wait for element to be visible, up to 5 seconds
		// console.debug("waiting for element to be visible: ", selector);
		await browser.wait(until.elementIsVisible(browser.findElement(selector)), 5000);
		// return the element
		return await browser.findElement(selector);
	}catch(e){
		console.log("Unable to find element: ", e);
	}
}

async function click(selector){
	try{
		// wait for element to appear, up to 15 seconds
		// console.debug("locating element: ", selector);
		await browser.wait(until.elementLocated(selector), 15000);
		// wait for element to be visible, up to 5 seconds
		// console.debug("waiting for element to be visible: ", selector);
		await browser.wait(until.elementIsVisible(browser.findElement(selector)), 5000);
		// click the element
		// console.debug("clicking element: ", selector);
		await browser.findElement(selector).click();
	}catch(e){
		console.log("Unable to click element: ", e);
	}
}

async function fill(selector, value){
	try{
		// wait for element to be located, up to 15 seconds
		// console.debug("locating element: ", selector);
		await browser.wait(until.elementLocated(selector), 15000);
		// wait for element to be visible, up to 5 seconds
		// console.debug("waiting for element to be visible: ", selector);
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
