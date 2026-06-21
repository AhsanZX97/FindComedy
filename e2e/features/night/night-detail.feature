Feature: Viewing a comedy night

  Background:
    Given a night exists:
      | name    | The Featured Mic           |
      | venue   | The Camden Head            |
      | address | 100 Camden High St, London |
      | type    | open-mic                   |
      | bringer | no                         |

  @smoke @critical
  Scenario: Opening a night from the listings
    Given I am browsing nights
    When I open the night "The Featured Mic"
    Then I should see its venue "The Camden Head"
    And I should see how to attend

  @critical
  Scenario: A bringer night is clearly flagged
    Given the night "The Featured Mic" requires a bringer
    When I view "The Featured Mic"
    Then I should see that a bringer is required

  @critical
  Scenario: A non-bringer night is flagged as such
    When I view "The Featured Mic"
    Then I should see that no bringer is required

  @critical
  Scenario: Stale listings are flagged to the visitor
    Given the night "The Featured Mic" was last verified over a year ago
    When I view "The Featured Mic"
    Then I should see a freshness warning

  @regression
  Scenario: A night that is no longer running is marked
    Given the night "The Featured Mic" is no longer running
    When I view "The Featured Mic"
    Then I should see that it is no longer running

  @critical
  Scenario: Getting directions to the venue
    When I view "The Featured Mic"
    Then I should be offered directions to the venue

  @regression
  Scenario: Visiting a night that does not exist
    When I open a night that does not exist
    Then I should be returned to the browse page
