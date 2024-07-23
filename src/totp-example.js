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

const TEST_WEBSITE = "https://featherless.ai/";
const TEST_EMAIL = "remarkable.twain@gmail.com";
const TEST_PASSWORD = "9Yg0uxYZxUC3";
const TEST_TOTP_SECRET = "adnf rji2 ho22 5ugv kh6k cpyc brlf dzs4".replace(/ /g, "");



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

// click login button : //a[contains(text(),'Log in')]
console.log("Clicking login button");
await click(By.xpath("//a[contains(text(),'Log in')]"));

// wait for page navigation to /login
console.log("Waiting for page navigation to /login");
await waitForPageNavigationTo("/login")

// click continue with google : //a[contains(normalize-space(.),'Continue with Google')]
console.log("Clicking continue with google");
await click(By.xpath("//a[contains(normalize-space(.),'Continue with Google')]"));
// await browser.findElement(By.xpath("//a[contains(normalize-space(.),'Continue with Google')]")).click();

// wait for page navigation to accounts.google.com
console.log("Waiting for page navigation to accounts.google.com");
await waitForPageNavigationTo("accounts.google.com")

// fill email : //input[contains(@aria-label, 'Email')]
console.log("Filling email: ", TEST_EMAIL);
await fill(By.xpath("//input[contains(@aria-label, 'Email')]"), TEST_EMAIL);

// press enter key
await browser.actions().sendKeys(Key.ENTER).perform();

// wait until "enter your password" is visible
console.log("Waiting for 'Enter your password' to be visible");
await waitUntilTextIsVisible("Enter your password")

// fill password : //input[contains(@aria-label, 'Password')]
console.log("Filling password...");
await fill(By.xpath("//input[contains(@aria-label, 'Enter your password')]"), TEST_PASSWORD);

// press enter key
await browser.actions().sendKeys(Key.ENTER).perform();

// -------------------------------------
// PART 2: Generate TOPT and fill
// -------------------------------------

// step 1: import topt from topt-generator

// step 2: generate topt using secret key

// step 3: fill topt in the input field : //input[@id='totpPin']

// step 4: press enter key
// press enter key

// -------------------------------------
// PART 3: Validate
// -------------------------------------

// redirect to featherless.ai
await waitForPageNavigationTo("featherless.ai")

// user's email is seen on the page
let pass = await waitUntilTextIsVisible(TEST_EMAIL)
if(pass){
	console.log("Google login passed");
}else{
	console.log("Google login failed");
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
