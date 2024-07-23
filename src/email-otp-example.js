//---------------------------------------
// Imports
//---------------------------------------
import puppeteer from 'puppeteer-core';

//---------------------------------------
// Test data
//---------------------------------------

const VW_WIDTH = 1280;
const VW_HEIGHT = 800;

const TEST_WEBSITE = "https://www.hq.xyz/";
const TEST_EMAIL = "exist-remarkable-69@inboxkitten.com";
const TEST_EMAIL_USERNAME = TEST_EMAIL.split("@")[0];


//---------------------------------------
// Setup
//---------------------------------------

// start browser
console.log("Starting browser");
const browser = await puppeteer.launch({
	channel: "chrome",
	headless: false, // so that we can watch what is happening
});

// start new context - this is to ensure tests have a clean slate
console.log("Starting new context");
const context = await browser.createBrowserContext();

// open a new page
console.log("Opening new page");
const homePage = await context.newPage();

// set viewport
console.log("Setting viewport");
await homePage.setViewport({ width: VW_WIDTH, height: VW_HEIGHT });




//---------------------------------------
//
// Test start
//
//---------------------------------------

// -------------------------------------
// PART 1: Open website and start login
// -------------------------------------

// navigate to the website
console.log("Navigating to website: " + TEST_WEBSITE);
await homePage.goto(TEST_WEBSITE);

// before clicking the login button, listen to targetcreated event
// this event is fired when a new page is opened
const newPageOpened = new Promise(resolve => context.once('targetcreated', target => resolve(target.page())));

// click the login button
console.log("Clicking login button");
await click(homePage, xpath("//a[contains(text(),'Login')]"));

// wait for new tab to open
console.log("Waiting for new tab to open");
await newPageOpened;
let pages = await context.pages();
const loginPage = pages[pages.length - 1];

// set the viewport
console.log("Setting viewport");
await loginPage.setViewport({ width: VW_WIDTH, height: VW_HEIGHT });

// wait for login page to load completely
console.log("Waiting for login page to load");
await loginPage.waitForNetworkIdle();

// enter email to login
console.log("Entering email to login");
await fill(loginPage, xpath("//input[@name='email']"), TEST_EMAIL);

// press the enter key
loginPage.keyboard.press('Enter');

// wait for page to have content "Enter the code we just sent"
await waitForPageContent(loginPage, "Enter the code we just sent");



// -------------------------------------
// PART 2: Get OTP from email
// -------------------------------------

// open a new page
const EMAIL_INBOX_URL = `https://inboxkitten.com/inbox/${TEST_EMAIL_USERNAME}`;
console.log("Opening email inbox: " + EMAIL_INBOX_URL);
const emailPage = await context.newPage();
await emailPage.goto(EMAIL_INBOX_URL);

// set the viewport
console.log("Setting viewport");
await emailPage.setViewport({ width: VW_WIDTH, height: VW_HEIGHT });

// wait for 20s for email to arrive
console.log("Waiting for email to arrive");
await sleep(20000);

// find the first email that says "Welcome to headquarters"
console.log("Clicking email");
const emailSubject = "Welcome to Headquarters";
const emailSelector = xpath(`(//div[@class='row-subject' and contains(text(), '${emailSubject}')])[1]`);
await click(emailPage, emailSelector);
await emailPage.waitForNavigation();

// wait for email iframe to load
console.log("Waiting for email body to load in iframe");
const iframeSelector = xpath("//iframe[@id='message-content']");
const iframeContentSelector = xpath("//td[@id='bodyCell']");
const iframe = await waitForIframeReady(emailPage, iframeSelector, iframeContentSelector);

// read the email body
console.log("Extracting email body");
const emailBody = await iframe.evaluate(() => document.body.innerText);
console.log("Email body: ", emailBody);

// get the OTP from the email
console.log("Splicing OTP")
const otpRegex = /Your verification code is: (\d{6})/;
const matches = emailBody.match(otpRegex);
let otp = ""
if(matches){
	otp = matches[1];
	console.log("OTP: ", otp);
}else{
	console.log("OTP not found");
	exit()
}



// -------------------------------------
// PART 3: Complete login
// -------------------------------------

// switch back to login page
console.log("Switching back to login page");
await loginPage.bringToFront();

// enter OTP
console.log("Entering OTP");
await fill(loginPage, xpath("//input[@name='code']"), otp);

// press the enter key
console.log("Submitting OTP");
await loginPage.keyboard.press('Enter');

// validate that url ends with "/dashboard"
console.log("Validating URL");
const atDashboard = await waitForPageNavigationTo(loginPage, "/dashboard");
if(atDashboard){
	console.log("Login successful. I am at the dashboard.");
	await waitForPageContent(loginPage, "Hey Mark, what can we do today?");
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

function xpath(selector){
	return `::-p-xpath(${selector})`;
}

async function sleep(ms){
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function click(page, selector){
	try{
		let el = await page.waitForSelector(selector);
		el.click();
	}catch(e){
		console.log("Unable to click element: ", e);
	}
}

async function fill(page, selector, value){
	try{
		let el = await page.waitForSelector(selector);
		await el.type(value);
	}catch(e){
		console.log("Unable to fill element: ", e);
	}
}

async function waitForPageContent(page, content, timeout){

	if(!timeout){
		timeout = 30000;
	}
	
	try{
		console.log("waiting for page content: ", content)
		let found = false;
		let start = Date.now();
		while(!found && Date.now() - start < timeout){
			let text = await page.evaluate(() => document.body.innerText);
			if(text.includes(content)){
				console.log("found page content: ", found)
				found = true;
			}else{
				console.log("sleeping...")
				await sleep(1000);
			}
		}
		return found;
	}catch(e){
		console.log("Error waiting for page content: ", e);
		return false;
	}

}

async function waitForNewPageOpened(context){
	return new Promise(resolve => context.once('targetcreated', target => resolve(target.page())));
}

async function waitForIframeReady(page, iframeSelector, iframeContentSelector){
	try{
		let iframeElement = await page.waitForSelector(iframeSelector);
		let iframe = await iframeElement.contentFrame();
		let content = await iframe.waitForSelector(iframeContentSelector, {visible: true});
		return iframe
	}catch(e){
		console.log("Error waiting for iframe to load: ", e);
		return null;
	}
}

async function waitForPageNavigationTo(page, url, timeout){
	if(!timeout){
		timeout = 30000;
	}
	try{
		let start = Date.now();
		console.log("waiting for page navigation to: ", url)
		let match = false;
		while(!match && Date.now() - start < timeout){
			let currentUrl = await page.url();
			if(currentUrl.includes(url)){
				console.log("page navigation matched: ", currentUrl)
				match = true;
			}else{
				console.log("sleeping...")
				await sleep(1000);
			}
		}
		return match;
	}catch(e){
		console.log("Error waiting for page navigation: ", e);
		return false;
	}
}