Feature: Signing in
  As a returning visitor
  I want to sign in
  So that I can save and review nights

  @critical
  Scenario: Requesting a sign-in code by email
    Given I am on the sign-in page
    When I request a code for "comic@example.com"
    Then I should be asked to enter the 6-digit code

  @critical
  Scenario: Completing sign-in with a valid code
    Given I requested a code for "comic@example.com"
    When I enter the valid code
    Then I should land on my nights

  @regression
  Scenario: Choosing a different email resets the flow
    Given I requested a code for "comic@example.com"
    When I choose to use a different email
    Then I should be asked for my email again
