Feature: Submitting a comedy night
  As a comedian or audience member
  I want to submit a comedy night for review
  So that it can be added to the listings

  @smoke @critical
  Scenario: A visitor submits a night for review
    Given I am on the submit page
    When I fill in the night details:
      | field   | value                                |
      | name    | The E2E Open Mic                     |
      | about   | A test night submitted by Playwright |
      | venue   | The Test Tavern                      |
      | address | 100 Camden High St, London NW1 0LU   |
    And I submit the night
    Then I see the submission confirmation
    And the submission received by the team is named "The E2E Open Mic"

  @regression
  Scenario: The form rejects an empty submission
    Given I am on the submit page
    When I submit the night without filling required details
    Then I should be told which details are required
    And no submission is sent to the team

  @regression
  Scenario: A venue outside London is rejected
    Given I am on the submit page
    And the venue address resolves outside London
    When I fill in the night details:
      | field   | value                   |
      | name    | The Manchester Mic      |
      | about   | A night up north        |
      | venue   | The Northern Tavern     |
      | address | 1 Deansgate, Manchester |
    And I submit the night
    Then I should be told the night must be in London
