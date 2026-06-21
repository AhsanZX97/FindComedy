Feature: Filtering comedy nights
  As someone looking for a comedy night
  I want to narrow the listings
  So that I only see nights that suit me

  Background:
    Given the listings include:
      | name            | type     | day | level       | bringer | area        |
      | Camden Open Mic | open-mic | Mon | new         | no      | Camden      |
      | Soho Showcase   | showcase | Fri | experienced | yes     | Westminster |
      | Hackney Pro     | pro      | Fri | pro         | no      | Hackney     |
    And I am browsing nights

  @smoke @critical
  Scenario: Search narrows the list by name
    When I search for "Camden"
    Then I should see "Camden Open Mic"
    And I should not see "Soho Showcase"

  @critical
  Scenario: Filtering by day shows only that day's nights
    When I filter to "Friday" nights
    Then I should see "Soho Showcase"
    And I should see "Hackney Pro"
    And I should not see "Camden Open Mic"

  @critical
  Scenario: Filtering by type
    When I filter to "Open Mic" nights
    Then I should see "Camden Open Mic"
    And I should not see "Hackney Pro"

  @critical
  Scenario: Hiding nights that require a bringer
    When I hide nights that require a bringer
    Then I should see "Camden Open Mic"
    And I should not see "Soho Showcase"

  @critical
  Scenario: Filtering by area
    When I filter to the "Hackney" area
    Then I should see "Hackney Pro"
    And I should not see "Camden Open Mic"

  @critical
  Scenario: Clearing all filters restores the full list
    Given I have filtered to "Open Mic" nights
    When I clear all filters
    Then I should see 3 nights

  @regression
  Scenario: No nights match the chosen filters
    When I search for "Brighton"
    Then I should see a message that no nights match my filters
