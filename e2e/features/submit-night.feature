Feature: Submitting a comedy night

  As a comedian or audience member
  I want to submit a comedy night for review
  So that it can be added to the listings

  Scenario: A visitor submits a night for review
    Given I am on the submit page
    When I fill in the night details
      | field   | value                                   |
      | name    | The E2E Open Mic                        |
      | about   | A test night submitted by Playwright    |
      | venue   | The Test Tavern                         |
      | address | 100 Camden High St, London NW1 0LU      |
    And I submit the night
    Then I see the submission confirmation
    And the submission sent to the backend has the name "The E2E Open Mic"
