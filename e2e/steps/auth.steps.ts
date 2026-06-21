import { Given, When, Then, expect } from '../support/fixtures'

Given('I am on the sign-in page', async ({ signInPage }) => {
  await signInPage.open()
})

When('I request a code for {string}', async ({ signInPage }, email: string) => {
  await signInPage.requestCode(email)
})

Given('I requested a code for {string}', async ({ signInPage }, email: string) => {
  await signInPage.open()
  await signInPage.requestCode(email)
})

When('I enter the valid code', async ({ signInPage }) => {
  await signInPage.enterValidCode()
})

When('I choose to use a different email', async ({ signInPage }) => {
  await signInPage.useDifferentEmail()
})

Then('I should be asked to enter the 6-digit code', async ({ signInPage }) => {
  await expect(signInPage.codePrompt()).toBeVisible()
})

Then('I should be asked for my email again', async ({ signInPage }) => {
  await expect(signInPage.emailPrompt()).toBeVisible()
})
