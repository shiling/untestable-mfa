# UnTESTable! MFA logins...

This project shows you working examples of how to solve MFA logins that involve email OTPs and time-based OTPs.

## Running the examples

1. Run `npm install` to install dependencies

2. Start Selenium or Chromedriver, and update the `chromeDriverUrl` in the scripts accordingly.

3. Run `node src/email-otp-example-solution.js` to run the Email OTP example.

4. Run `node src/totp-example-solution.js` to run the time-based OTP example.

5. Run `node src/sms-otp-example.js` to run the SMS OTP example. Note that you'll need to have an Mailosaur account and configure your API key and server ID in the config file mailosaur.config.js